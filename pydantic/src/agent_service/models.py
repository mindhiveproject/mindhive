from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class FeedbackHelpRequest(BaseModel):
    thread_id: str = Field(min_length=1)
    proposal_id: str = Field(min_length=1)
    question_number: str = Field(min_length=1)
    question_name: str = ""
    current_text_content: str = ""
    requesting_profile_id: str | None = None


class FeedbackButton(BaseModel):
    text: str
    action: str | None = None


class FeedbackResult(BaseModel):
    textDisplay: str
    buttonsArray: list[FeedbackButton] = Field(default_factory=list)


class FeedbackHelpResponse(BaseModel):
    status: str = "complete"
    result: FeedbackResult
    metadata: dict[str, Any] = Field(default_factory=dict)


class ProposalCardContext(BaseModel):
    model_config = ConfigDict(extra="allow")

    id: str | None = None
    title: str | None = None
    type: str | None = None
    description: str | None = None
    content: Any = None
    comment: Any = None
    position: int | None = None


class ProposalSectionContext(BaseModel):
    model_config = ConfigDict(extra="allow")

    id: str | None = None
    title: str | None = None
    position: int | None = None
    cards: list[ProposalCardContext] = Field(default_factory=list)


class ProposalContext(BaseModel):
    model_config = ConfigDict(extra="allow")

    id: str | None = None
    title: str | None = None
    description: str | None = None
    sections: list[ProposalSectionContext] = Field(default_factory=list)
    study: dict[str, Any] | None = None
    usedInClass: dict[str, Any] | None = None
    context_fetch_error: str | None = None
