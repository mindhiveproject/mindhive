from __future__ import annotations

import os

from fastapi import FastAPI, Header, HTTPException

from .feedback import build_feedback_help
from .keystone import fetch_proposal_context
from .models import FeedbackHelpRequest, FeedbackHelpResponse


app = FastAPI(title="MindHive AI Feedback Service", version="0.1.0")


def _verify_service_token(x_ai_feedback_service_token: str | None) -> None:
    expected = os.getenv("AI_FEEDBACK_SERVICE_TOKEN")
    if expected and x_ai_feedback_service_token != expected:
        raise HTTPException(status_code=401, detail="Invalid AI feedback service token.")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/feedback/help", response_model=FeedbackHelpResponse)
async def feedback_help(
    request: FeedbackHelpRequest,
    x_ai_feedback_service_token: str | None = Header(default=None),
) -> FeedbackHelpResponse:
    _verify_service_token(x_ai_feedback_service_token)
    proposal_context = await fetch_proposal_context(request.proposal_id)
    return build_feedback_help(request, proposal_context)
