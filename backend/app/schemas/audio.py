from pydantic import BaseModel

class TranscriptionResult(BaseModel):
    text: str
