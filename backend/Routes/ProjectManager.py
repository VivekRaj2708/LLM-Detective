
import os
import tempfile
from typing import Dict
import zipfile
from fastapi import UploadFile, File, HTTPException, Form
from fastapi.responses import JSONResponse
from pyparsing import Any

from Routes.CONFIG import MAX_FILE_SIZE_BYTES
from Utils.File import calculate_directory_size


# New Project
async def NewProject(
    zip_file: UploadFile,
    project_name: str,
    current_user: Dict
):
    """
    Accepts a ZIP file and project name, extracts the file, and calculates 
    the total disk space used by the extracted contents.
    """
    print(current_user)
    if not zip_file.filename or not zip_file.filename.endswith(".zip"):
        raise HTTPException(
            status_code=400, detail="File must be a ZIP archive.")

    # Create a temporary directory to store the ZIP file and extracted contents
    with tempfile.TemporaryDirectory() as temp_dir:
        zip_path = os.path.join(temp_dir, zip_file.filename)
        extract_path = os.path.join(temp_dir, project_name)
        os.makedirs(extract_path, exist_ok=True)  # Directory for extraction

        try:
            content = await zip_file.read()
            if len(content) > MAX_FILE_SIZE_BYTES:
                raise HTTPException(
                    status_code=413, detail=f"File too large. Max size is {MAX_FILE_SIZE_BYTES / (1024 * 1024):.0f} MB.")

            with open(zip_path, "wb") as f:
                f.write(content)

            # 2. Extract the ZIP file
            with zipfile.ZipFile(zip_path, 'r') as zf:
                # Prevent Zip Slip vulnerability by checking paths (best practice)
                for member in zf.namelist():
                    if '..' in member or member.startswith('/') or member.startswith('\\'):
                        continue
                    zf.extract(member, extract_path)

            disk_space_bytes = calculate_directory_size(extract_path)
            disk_space_mb = disk_space_bytes / (1024 * 1024)

            return JSONResponse({
                "message": "Project uploaded, extracted, and analyzed successfully",
                "project_name": project_name,
                "extracted_path": extract_path,  # For reference
                "extracted_size_bytes": disk_space_bytes,
                "extracted_size_mb": f"{disk_space_mb:.2f} MB",
            })

        except zipfile.BadZipFile:
            raise HTTPException(
                status_code=400, detail="The uploaded file is not a valid ZIP file.")
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Internal server error during processing: {str(e)}")
