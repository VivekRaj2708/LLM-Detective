from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.templating import Jinja2Templates
import uvicorn

import torch
from transformers import AutoTokenizer
from CONFIG import MODEL_NAME, MODEL_PATH
from LogisticRegression.LR import Load
import numpy as np
# from BERT.tinybert import DANN_Text_Detector, TYPE_TO_LABEL, NUM_MODEL_CLASSES

app = FastAPI()

# tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
# model = DANN_Text_Detector(
#     num_model_classes=NUM_MODEL_CLASSES,
#     backbone_model=MODEL_NAME,
#     type_vocab_size=len(TYPE_TO_LABEL),
#     type_emb_dim=32
# )

model, vectorizer, le_type, le_model = Load()

# checkpoint = torch.load(MODEL_PATH, map_location=torch.device("cpu"))
# model.load_state_dict(checkpoint['model_state_dict'])
# model.eval()

# ---- Optional: Enable CORS (for browser-based testing) ----
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

templates = Jinja2Templates(directory="Templates")


@app.post("/api/get")
async def get_random_number(request: Request):
    data = await request.json()
    chars = data.get("chars", "")
    type_label = data.get("type", "hw_mp")  # default

    # You can use 'chars' here if you want to influence randomness later
    # inputs = tokenizer(chars, return_tensors="pt", truncation=True, padding=True, max_length=128)
    # type_tensor = torch.tensor([TYPE_TO_LABEL[type_label]], dtype=torch.long)
    
    # with torch.no_grad():
    #         outputs = model(
    #             input_ids=inputs["input_ids"],
    #             attention_mask=inputs["attention_mask"],
    #             type_labels=type_tensor
    #         )
    #         logits = outputs  # already logits
    #         predicted_class = torch.argmax(logits, dim=1).item()

    new_text = ["chars"]
    new_type = [0]
    X_new_tfidf = vectorizer.transform(new_text)
    X_new = np.hstack([X_new_tfidf.toarray(), np.array(new_type).reshape(-1, 1)])
    prediction = model.predict(X_new)
    return JSONResponse({"input": chars, "result": prediction[0]})

@app.get("/", response_class=HTMLResponse)
async def ocr_test(request: Request):
    return templates.TemplateResponse("Test.html", {"request": request})

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=3344)
