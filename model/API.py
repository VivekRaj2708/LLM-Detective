from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import random
import torch
import uvicorn
from transformers import AutoTokenizer
from CONFIG import MODEL_NAME, MODEL_PATH
from BERT.tinybert import DANN_Text_Detector, TYPE_TO_LABEL, NUM_MODEL_CLASSES

app = FastAPI()

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = DANN_Text_Detector(
    num_model_classes=NUM_MODEL_CLASSES,
    backbone_model=MODEL_NAME,
    type_vocab_size=len(TYPE_TO_LABEL),
    type_emb_dim=32
)

checkpoint = torch.load(MODEL_PATH, map_location=torch.device("cpu"))
model.load_state_dict(checkpoint['model_state_dict'])
model.eval()

@app.post("/api/get")
async def get_random_number(request: Request):
    data = await request.json()
    chars = data.get("chars", "")

    # You can use 'chars' here if you want to influence randomness later
    inputs = tokenizer(chars, return_tensors="pt", truncation=True, padding=True, max_length=128)
    with torch.no_grad():
        outputs = model(inputs['input_ids'], attention_mask=inputs['attention_mask'], type_labels=inputs.get('type_labels'))
        logits = outputs.logits
        predicted_class = torch.argmax(logits, dim=1).item()

    return JSONResponse({"input": chars, "result": predicted_class})

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=3344)
