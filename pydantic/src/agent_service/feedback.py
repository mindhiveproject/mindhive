from __future__ import annotations

from html import unescape
import re
from typing import Any

from .models import FeedbackHelpRequest, FeedbackHelpResponse, FeedbackResult, ProposalContext


TAG_RE = re.compile(r"<[^>]+>")


def _text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return TAG_RE.sub(" ", unescape(value)).strip()
    if isinstance(value, dict):
        return " ".join(_text(v) for v in value.values()).strip()
    if isinstance(value, list):
        return " ".join(_text(v) for v in value).strip()
    return str(value).strip()


def _proposal_summary(context: ProposalContext) -> str:
    pieces = [context.title or "", context.description or ""]
    for section in sorted(context.sections, key=lambda item: item.position or 0):
        pieces.append(section.title or "")
        for card in sorted(section.cards, key=lambda item: item.position or 0):
            pieces.extend([card.title or "", _text(card.description), _text(card.content)])
    summary = " ".join(piece for piece in pieces if piece).strip()
    return summary[:1200]


def build_feedback_help(
    request: FeedbackHelpRequest,
    proposal_context: ProposalContext,
) -> FeedbackHelpResponse:
    draft = request.current_text_content.strip()
    proposal_title = proposal_context.title or "this proposal"
    proposal_summary = _proposal_summary(proposal_context)

    if draft:
        opening = (
            f"Review the current note for {request.question_number} and make it more specific, "
            "kind, and actionable."
        )
        draft_guidance = (
            "Current draft has a starting point. Consider adding one concrete example from the "
            "proposal, one clear reason the issue matters, and one next step the student can take."
        )
    else:
        opening = (
            f"Start feedback for {request.question_number} by naming one strength or concern "
            f"from {proposal_title}."
        )
        draft_guidance = (
            "A useful first sentence can acknowledge what the student is trying to do, then ask "
            "for one clarification or suggest one manageable improvement."
        )

    context_line = (
        f"Proposal context considered: {proposal_summary[:360]}"
        if proposal_summary
        else "Proposal context was unavailable, so this is a general feedback scaffold."
    )

    if proposal_context.context_fetch_error:
        context_line = (
            f"{context_line} Context fetch note: {proposal_context.context_fetch_error}"
        )

    result_text = "\n\n".join(
        [
            opening,
            draft_guidance,
            context_line,
            "Suggested structure: praise or observation, evidence from the proposal, then one "
            "specific revision request.",
        ]
    )

    return FeedbackHelpResponse(
        status="complete",
        result=FeedbackResult(
            textDisplay=result_text,
            buttonsArray=[
                {
                    "text": "Use as a checklist",
                    "action": "checklist",
                }
            ],
        ),
        metadata={
            "model": "deterministic-placeholder",
            "context_card_count": sum(len(section.cards) for section in proposal_context.sections),
            "openai_configured": False,
        },
    )
