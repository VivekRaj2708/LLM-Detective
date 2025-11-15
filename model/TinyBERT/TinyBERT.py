import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import json

# ---- PATHS ----
MODEL_DIR = "./TinyBERT"   # change this

# ---- LABEL MAPPING ----
id2label = {
    0: "human",
    1: "machine-polished",
    2: "llm",
    3: "machine-humanized"
}

# ---- LOAD TOKENIZER + MODEL ----
tokenizer = AutoTokenizer.from_pretrained("prajjwal1/bert-tiny")

model = AutoModelForSequenceClassification.from_pretrained(
    MODEL_DIR,
    local_files_only=True,        # loads weights from your folder
)

model.eval()    # inference mode
device = "cuda" if torch.cuda.is_available() else "cpu"
model.to(device)

# ---- PREDICT FUNCTION ----
def predict(text: str) -> int:
    try:
        inputs = tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
            padding=True,
            max_length=256
        ).to(device)

        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs.logits
            pred_id = torch.argmax(logits, dim=1).item()
            return pred_id
    except Exception as e:
        return 4


# ---- TEST ----
if __name__ == "__main__":
    sample_text = "This is a sample text written by a human."
    pred_label, probs = predict(sample_text)

    print("Text:", sample_text)
    print("Prediction:", pred_label)
    print("Probabilities:", probs)