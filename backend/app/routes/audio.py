from fastapi import APIRouter, UploadFile, File
from pydantic import BaseModel
from app.schemas.audio import TranscriptionResult
import whisper
import os

router = APIRouter()

whisper_model = whisper.load_model("base")

class TranscriptionResult(BaseModel):
    text: str

@router.post("/", response_model=TranscriptionResult)
async def transcribe_audio(file: UploadFile = File(...)):
    file_location = f"temp_{file.filename}"
    with open(file_location, "wb") as buffer:
        buffer.write(await file.read())

    result = whisper_model.transcribe(file_location)
    text = result["text"]

    os.remove(file_location)

    return {"text": text}
