import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from torch.autograd import Function
from transformers import AutoTokenizer, AutoModel, get_linear_schedule_with_warmup
from tqdm.auto import tqdm
import json
import sys
import argparse

# --- Configuration & Hyperparameters ---
# Use a smaller transformer for laptop-friendly runs. DistilBERT is compact and fast.
MODEL_NAME = "prajjwal1/bert-tiny"
TRAIN_FILE = "train.jsonl"  # <-- Your training data file
VAL_FILE = "val.jsonl"      # <-- Your validation data file

# Model parameters
# We're now predicting the model (llama/mistral) -> 2 classes
NUM_MODEL_CLASSES = 2  # llama, mistral

# Map the dataset 'type' string values to integer class labels (these will be used as an input feature)
TYPE_TO_LABEL = {
    "hw_mp": 0,
    "hw": 1,
    "mw": 2,
    "mw_mp": 3,
}

# Map the 'model' field to target labels for prediction
MODEL_TO_LABEL = {
    "llama": 0,
    "mistral": 1,
}

# Training parameters
EPOCHS = 2
# Smaller batch size and max length for lower memory usage on laptops
BATCH_SIZE = 8
MAX_LENGTH = 256
# Use a slightly higher learning rate to compensate for smaller model / fewer steps
LEARNING_RATE = 3e-5
GRL_LAMBDA = 0.1  # Lambda for the Gradient Reversal Layer (kept for compatibility)


## ---------------------------------
## Step 1: Model Architecture (DANN-like)
## ---------------------------------
# This is the Gradient Reversal Layer (GRL) - kept for compatibility if you add domain adversarial parts later
class GradientReversalFunction(Function):
    @staticmethod
    def forward(ctx, x, lambda_):
        ctx.lambda_ = lambda_
        return x.view_as(x)

    @staticmethod
    def backward(ctx, grad_output):
        # Reverses the gradient and scales it by lambda
        return (grad_output.neg() * ctx.lambda_), None

class GradientReversalLayer(nn.Module):
    def __init__(self, lambda_):
        super(GradientReversalLayer, self).__init__()
        self.lambda_ = lambda_

    def forward(self, x):
        return GradientReversalFunction.apply(x, self.lambda_)


class DANN_Text_Detector(nn.Module):
    """
    Detector that uses a transformer backbone + a small embedding for the 'type' categorical
    input and predicts the 'model' (llama/mistral).
    """
    def __init__(self, num_model_classes, backbone_model, type_vocab_size, type_emb_dim=32):
        super(DANN_Text_Detector, self).__init__()

        # 1. Representation Extractor
        self.backbone = AutoModel.from_pretrained(backbone_model)
        hidden_size = self.backbone.config.hidden_size

        # 2. Small embedding for the 'type' categorical input
        self.type_embedding = nn.Embedding(num_embeddings=type_vocab_size, embedding_dim=type_emb_dim)

        # 3. Classifier: takes concatenated [CLS] + type_emb
        self.classifier = nn.Sequential(
            nn.Linear(hidden_size + type_emb_dim, 256),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(256, num_model_classes)
        )

    def forward(self, input_ids, attention_mask, type_labels):
        # Pass input through the backbone
        outputs = self.backbone(input_ids=input_ids, attention_mask=attention_mask)
        representation = outputs.last_hidden_state[:, 0, :]

        # Embed the type labels
        type_emb = self.type_embedding(type_labels)

        # Concatenate and classify
        joint = torch.cat([representation, type_emb], dim=1)
        logits = self.classifier(joint)
        return logits


## ---------------------------------
## Step 2: Data Loading (Dataset & Collate)
## ---------------------------------
class JsonlTextDataset(Dataset):
    """
    PyTorch Dataset for loading the .jsonl data.

        Assumes each line is a JSON object with keys:
        - 'output': The text string (used as model input)
        - 'type': The string label among {hw_mp, hw, mw, mw_mp} (used as an input categorical feature)
        - 'model': The string model name to predict (llama or mistral)
    """
    def __init__(self, file_path):
        self.texts = []
        # 'type' is an input categorical feature (mapped to int)
        self.type_labels = []
        # target: model label (llama/mistral)
        self.model_labels = []
        self._skipped_count = 0

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                for line_no, line in enumerate(f, start=1):
                    try:
                        data = json.loads(line)
                    except json.JSONDecodeError:
                        print(f"Skipping line {line_no}: invalid JSON.", file=sys.stderr)
                        self._skipped_count += 1
                        continue

                    # Check for the required 'output' (text), 'type' (input categorical) and 'model' (target)
                    if 'output' not in data or 'type' not in data or 'model' not in data:
                        print(f"Skipping line {line_no}: missing required keys. {data.get('id', '')}", file=sys.stderr)
                        self._skipped_count += 1
                        continue

                    # Map 'type' to an input categorical label
                    type_val = data['type']
                    if type_val not in TYPE_TO_LABEL:
                        print(f"Skipping line {line_no}: unknown type '{type_val}': {data.get('id', '')}", file=sys.stderr)
                        self._skipped_count += 1
                        continue
                    type_label = TYPE_TO_LABEL[type_val]

                    # Map 'model' to the target label
                    model_val = data['model']
                    if model_val not in MODEL_TO_LABEL:
                        print(f"Skipping line {line_no}: unknown model '{model_val}': {data.get('id', '')}", file=sys.stderr)
                        self._skipped_count += 1
                        continue
                    model_label = MODEL_TO_LABEL[model_val]

                    # All checks passed -> append
                    self.texts.append(data['output'])
                    self.type_labels.append(type_label)
                    self.model_labels.append(model_label)
                if self._skipped_count:
                    print(f"Finished loading {file_path}. Skipped {self._skipped_count} invalid lines.", file=sys.stderr)
        except FileNotFoundError:
            print(f"Error: Data file not found at {file_path}", file=sys.stderr)
            raise

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        return {
            'text': self.texts[idx],
            'type_label': self.type_labels[idx],
            'model_label': self.model_labels[idx]
        }


def create_collate_fn(tokenizer, max_length):
    """
    Creates a collate function to batch data dynamically.
    This function is passed to the DataLoader.
    """
    def collate_fn(batch):
        texts = [item['text'] for item in batch]

        # Tokenize the batch of texts at once
        inputs = tokenizer(
            texts,
            padding=True,
            truncation=True,
            max_length=max_length,
            return_tensors="pt"
        )

        # Stack labels into tensors
        type_labels = torch.tensor([item['type_label'] for item in batch], dtype=torch.long)
        model_labels = torch.tensor([item['model_label'] for item in batch], dtype=torch.long)

        return {
            'input_ids': inputs['input_ids'],
            'attention_mask': inputs['attention_mask'],
            'type_labels': type_labels,
            'model_labels': model_labels
        }
    return collate_fn


## ---------------------------------
## Step 3: Training & Evaluation Functions
## ---------------------------------

def train_epoch(model, data_loader, model_criterion, optimizer, scheduler, device):
    model.train()

    total_model_loss = 0
    progress_bar = tqdm(data_loader, desc="Training", leave=False)

    for batch in progress_bar:
        # Move batch to device
        input_ids = batch['input_ids'].to(device)
        attention_mask = batch['attention_mask'].to(device)
        type_labels = batch['type_labels'].to(device)
        model_labels = batch['model_labels'].to(device)

        optimizer.zero_grad()

        # Forward pass
        logits = model(input_ids, attention_mask, type_labels)

        # Calculate loss for model prediction
        loss_model = model_criterion(logits, model_labels)

        # Total loss
        total_loss = loss_model

        # Backward pass
        total_loss.backward()

        # Clip gradients to prevent exploding gradients
        nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)

        optimizer.step()
        if scheduler is not None:
            scheduler.step()

        total_model_loss += loss_model.item()

        progress_bar.set_postfix({
            'model_loss': f"{loss_model.item():.3f}"
        })

    avg_model_loss = total_model_loss / len(data_loader)

    return avg_model_loss


def evaluate(model, data_loader, model_criterion, device):
    model.eval()

    total_model_loss = 0

    correct_model_preds = 0
    total_samples = 0

    with torch.no_grad():
        for batch in tqdm(data_loader, desc="Evaluating", leave=False):
            # Move batch to device
            input_ids = batch['input_ids'].to(device)
            attention_mask = batch['attention_mask'].to(device)
            type_labels = batch['type_labels'].to(device)
            model_labels = batch['model_labels'].to(device)

            # Forward pass
            logits = model(input_ids, attention_mask, type_labels)

            # Calculate losses
            loss_model = model_criterion(logits, model_labels)

            total_model_loss += loss_model.item()

            # Calculate model accuracy
            _, model_preds = torch.max(logits, dim=1)
            correct_model_preds += (model_preds == model_labels).sum().item()
            total_samples += model_labels.size(0)

    avg_model_loss = total_model_loss / len(data_loader)
    model_accuracy = correct_model_preds / total_samples if total_samples > 0 else 0.0

    return avg_model_loss, model_accuracy


## ---------------------------------
## Step 4: Main Training Execution
## ---------------------------------

def main():
    Best_acc = 0.9
    parser = argparse.ArgumentParser(description="Train or resume training of the DANN text detector.")
    parser.add_argument("--train-file", default=TRAIN_FILE, help="Path to training .jsonl file")
    parser.add_argument("--val-file", default=VAL_FILE, help="Path to validation .jsonl file")
    parser.add_argument("--model-name", default=MODEL_NAME, help="HuggingFace model name")
    parser.add_argument("--epochs", type=int, default=EPOCHS, help="Number of training epochs")
    parser.add_argument("--batch-size", type=int, default=BATCH_SIZE, help="Training batch size")
    parser.add_argument("--max-length", type=int, default=MAX_LENGTH, help="Max tokenization length")
    parser.add_argument("--lr", type=float, default=LEARNING_RATE, help="Learning rate")
    parser.add_argument("--resume", type=str, default="dann_detector_final.pth", help="Path to checkpoint .pth to resume from")
    parser.add_argument("--save-path", type=str, default="dann_detector_final.pth", help="Path to save final checkpoint")
    args = parser.parse_args()

    print("Starting training pipeline...")

    # --- 1. Setup Device ---
    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    # --- 2. Load Tokenizer ---
    print(f"Loading tokenizer: {args.model_name}")
    tokenizer = AutoTokenizer.from_pretrained(args.model_name)

    # --- 3. Create Datasets and DataLoaders ---
    print(f"Loading training data from: {args.train_file}")
    train_dataset = JsonlTextDataset(args.train_file)

    print(f"Loading validation data from: {args.val_file}")
    val_dataset = JsonlTextDataset(args.val_file)

    collate_fn = create_collate_fn(tokenizer, MAX_LENGTH)

    train_loader = DataLoader(
        train_dataset,
        batch_size=args.batch_size,
        shuffle=True,
        collate_fn=collate_fn
    )

    val_loader = DataLoader(
        val_dataset,
        batch_size=args.batch_size,
        shuffle=False,
        collate_fn=collate_fn
    )

    print(f"Training batches: {len(train_loader)}, Validation batches: {len(val_loader)}")

    # --- 4. Initialize Model, Loss, Optimizer ---
    print("Initializing model...")
    model = DANN_Text_Detector(
        num_model_classes=NUM_MODEL_CLASSES,
        backbone_model=args.model_name,
        type_vocab_size=len(TYPE_TO_LABEL),
        type_emb_dim=32
    ).to(device)

    # Loss functions
    model_criterion = nn.CrossEntropyLoss()

    # Optimizer
    optimizer = optim.AdamW(model.parameters(), lr=args.lr)

    # Scheduler
    total_steps = len(train_loader) * args.epochs
    scheduler = get_linear_schedule_with_warmup(
        optimizer,
        num_warmup_steps=0,
        num_training_steps=total_steps
    ) if total_steps > 0 else None

    # Optionally resume from a checkpoint
    start_epoch = 0
    if args.resume:
        try:
            print(f"Loading checkpoint from: {args.resume}")
            checkpoint = torch.load(args.resume, map_location=device)

            # Prefer state_dict keys if saved as dict; support both full model.state_dict() and checkpoint dict
            if isinstance(checkpoint, dict) and 'model_state_dict' in checkpoint:
                model.load_state_dict(checkpoint['model_state_dict'])
                if 'optimizer_state_dict' in checkpoint and checkpoint['optimizer_state_dict'] is not None:
                    try:
                        optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
                    except Exception as e:
                        print(f"Warning: couldn't load optimizer state: {e}")
                if 'scheduler_state_dict' in checkpoint and checkpoint['scheduler_state_dict'] is not None and scheduler is not None:
                    try:
                        scheduler.load_state_dict(checkpoint['scheduler_state_dict'])
                    except Exception as e:
                        print(f"Warning: couldn't load scheduler state: {e}")
                start_epoch = checkpoint.get('epoch', 0) + 1
            else:
                # If it's a bare state_dict saved via torch.save(model.state_dict())
                model.load_state_dict(checkpoint)
                print("Loaded model state_dict from checkpoint (optimizer/scheduler not present).")

            print(f"Resumed from checkpoint. Starting at epoch {start_epoch + 1} (0-based {start_epoch}).")
        except FileNotFoundError:
            print(f"Checkpoint file not found: {args.resume}", file=sys.stderr)
            raise
        except Exception as e:
            print(f"Error loading checkpoint: {e}", file=sys.stderr)
            raise

    # --- 5. Training Loop ---
    print("--- Starting Training ---")
    for epoch in range(start_epoch, args.epochs):
        print(f"\nEpoch {epoch + 1}/{args.epochs}")

        train_model_loss = train_epoch(
            model, train_loader, model_criterion, optimizer, scheduler, device
        )

        print(f"Epoch {epoch + 1} Training Complete.")
        print(f"  Avg Model Loss: {train_model_loss:.4f}")

        val_model_loss, val_model_acc = evaluate(
            model, val_loader, model_criterion, device
        )

        print(f"Epoch {epoch + 1} Validation Complete.")
        print(f"  Val Model Loss: {val_model_loss:.4f}")
        print(f"  Val Model Accuracy: {val_model_acc:.4f}")

        # --- 6. Save Final Model ---
        if val_model_acc >= Best_acc:
            Best_acc = val_model_acc
            output_model_path = args.save_path
            print(f"\nTraining finished. Saving checkpoint to {output_model_path}")
            # Save comprehensive checkpoint so training can be resumed
            checkpoint = {
                'epoch': epoch,
                'model_state_dict': model.state_dict(),
                'optimizer_state_dict': optimizer.state_dict(),
                'scheduler_state_dict': scheduler.state_dict() if scheduler is not None else None,
            }
            torch.save(checkpoint, output_model_path)
            print("Done.")
        else:
            print(f"\nTraining finished. Validation accuracy {val_model_acc:.4f} did not reach threshold. Model not saved.")

if __name__ == "__main__":
    main()
