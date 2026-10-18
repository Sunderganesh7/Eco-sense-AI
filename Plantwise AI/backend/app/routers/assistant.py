from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from app.schemas.compliance import AssistantChatRequest, AssistantChatResponse, DocumentDraftRequest, DocumentDraftResponse
from app.engine.assistant_engine import process_assistant_chat, draft_legal_document

router = APIRouter(prefix="/assistant", tags=["AI Legal & Plantation Assistant"])

@router.post("/chat", response_model=AssistantChatResponse)
def assistant_chat(req: AssistantChatRequest):
    return process_assistant_chat(
        message=req.message,
        land_type=req.land_type or "municipal_public",
        location_name=req.location_name or "Proposed Site",
        trees_count=req.trees_count or 50,
        user_role=req.user_role or "Citizen"
    )

@router.post("/draft-document", response_model=DocumentDraftResponse)
def assistant_draft_document(req: DocumentDraftRequest):
    return draft_legal_document(req.model_dump())
