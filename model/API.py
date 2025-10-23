from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import random
import uvicorn

app = FastAPI()

@app.post("/api/get")
async def get_random_number(request: Request):
    data = await request.json()
    chars = data.get("chars", "")

    # You can use 'chars' here if you want to influence randomness later
    result = random.randint(0, 4)

    return JSONResponse({"input": chars, "result": result})

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=3344)
