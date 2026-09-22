"""
GreenPath AI — Chatbot Router
AI chatbot with Gemini API + conversation history persistence.
"""

import uuid
import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends
from backend.config import settings
from backend.database.schemas import (
    ChatRequest, ChatHistoryDocument, ChatMessage, UserDocument
)
from backend.services.chatbot_service import get_chatbot_response
from backend.routers.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chatbot", tags=["Chatbot"])


# ================================================================
# POST /chatbot/chat
# ================================================================
@router.post("/chat")
async def chat(
    body: ChatRequest,
    current_user: Optional[UserDocument] = None,
):
    """
    Send a message to the GreenPath AI assistant.
    Accepts an optional session_id to continue an existing conversation.
    """
    session_id = body.session_id or uuid.uuid4().hex

    # Load or create conversation session
    history_doc = await ChatHistoryDocument.find_one(
        ChatHistoryDocument.session_id == session_id
    )

    if not history_doc:
        history_doc = ChatHistoryDocument(
            user_id=str(current_user.id) if current_user else None,
            session_id=session_id,
        )
        await history_doc.insert()

    # Build message history for context
    history = [
        {"role": m.role, "content": m.content}
        for m in history_doc.messages[-10:]   # last 10 messages
    ]

    # Get AI response
    try:
        response_text = await get_chatbot_response(
            message=body.message,
            history=history,
            analysis_context=body.analysis_context,
            gemini_api_key=settings.GEMINI_API_KEY,
        )
    except Exception as e:
        logger.error(f"Chatbot error: {e}", exc_info=True)
        response_text = (
            "I'm experiencing a temporary issue. Please try again. "
            "You can ask me about AQI, trees, NDVI, or plantation recommendations."
        )

    # Persist messages
    history_doc.messages.append(
        ChatMessage(role="user", content=body.message)
    )
    history_doc.messages.append(
        ChatMessage(role="assistant", content=response_text)
    )
    history_doc.message_count = len(history_doc.messages)
    history_doc.updated_at = datetime.utcnow()
    await history_doc.save()

    return {
        "success": True,
        "session_id": session_id,
        "response": response_text,
        "message_count": history_doc.message_count,
    }


# ================================================================
# GET /chatbot/history/{session_id}
# ================================================================
@router.get("/history/{session_id}")
async def get_chat_history(session_id: str):
    """Get full conversation history for a session."""
    doc = await ChatHistoryDocument.find_one(
        ChatHistoryDocument.session_id == session_id
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Session not found.")

    return {
        "session_id": session_id,
        "message_count": doc.message_count,
        "messages": [
            {"role": m.role, "content": m.content, "timestamp": m.timestamp}
            for m in doc.messages
        ],
        "created_at": doc.created_at,
        "updated_at": doc.updated_at,
    }


# ================================================================
# DELETE /chatbot/history/{session_id}
# ================================================================
@router.delete("/history/{session_id}")
async def clear_chat(session_id: str):
    """Clear a chat session's message history."""
    doc = await ChatHistoryDocument.find_one(
        ChatHistoryDocument.session_id == session_id
    )
    if doc:
        doc.messages = []
        doc.message_count = 0
        doc.updated_at = datetime.utcnow()
        await doc.save()
    return {"success": True, "message": "Chat history cleared."}
