from fastapi import HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from motor.motor_asyncio import AsyncIOMotorCollection
from Auth.JWT import create_access_token

class EmailInput(BaseModel):
    email: EmailStr

async def login_route(payload: EmailInput, users_collection: AsyncIOMotorCollection):
    email = payload.email
    user = await users_collection.find_one({"email": email})

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Prepare user details (excluding sensitive fields)
    user_details = {
        "id": str(user["_id"]),
        "name": user.get("name"),
        "email": user["email"],
        "projects": user.get("projects", []),
    }

    # Create JWT Token
    access_token = create_access_token(data={"sub": user["email"], "id": str(user["_id"])})

    return JSONResponse(
        content={
            "token": access_token,
            "user": user_details
        }
    )
