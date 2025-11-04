from ast import List
from pymongo.collection import Collection
from uuid import uuid4

async def get_or_create_user(email: str, users_collection: Collection) -> dict:
    """Fetch a user by email. If not found, create a new one."""
    user = await users_collection.find_one({"email": email})

    if user:
        return user

    # Create new user
    new_user = {
        "_id": str(uuid4()),
        "username": email.split("@")[0],  # default username from email
        "email": email,
        "storage": 0,
        "projects": []
    }

    await users_collection.insert_one(new_user)
    return new_user

async def get_all_user_projects(project_ids: List, project_collection: Collection) -> list:
    """Retrieve all projects associated with a user."""
    projects = []
    for project_id in project_ids:
        p = await project_collection.find_one({"_id": project_id})
        if not p:
            raise ValueError(f"Project with ID {project_id} not found")
        projects.append(p)
    return projects