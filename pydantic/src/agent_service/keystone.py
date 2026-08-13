from __future__ import annotations

import os
from typing import Any

import httpx

from .models import ProposalContext


PROPOSAL_CONTEXT_QUERY = """
query ProposalContext($id: ID!) {
  proposalBoard(where: { id: $id }) {
    id
    title
    description
    study {
      id
      title
      description
      shortDescription
    }
    usedInClass {
      id
      title
      description
    }
    sections {
      id
      title
      position
      cards {
        id
        title
        type
        description
        content
        comment
        position
      }
    }
  }
}
"""


def _headers() -> dict[str, str]:
    headers = {"content-type": "application/json"}
    token = os.getenv("AI_FEEDBACK_SERVICE_TOKEN")
    if token:
        headers["x-ai-feedback-service-token"] = token
    return headers


async def fetch_proposal_context(proposal_id: str) -> ProposalContext:
    endpoint = os.getenv("MINDHIVE_GRAPHQL_ENDPOINT")
    if not endpoint:
        return ProposalContext(
            id=proposal_id,
            context_fetch_error="MINDHIVE_GRAPHQL_ENDPOINT is not configured.",
        )

    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.post(
            endpoint,
            headers=_headers(),
            json={
                "query": PROPOSAL_CONTEXT_QUERY,
                "variables": {"id": proposal_id},
            },
        )
        response.raise_for_status()
        payload: dict[str, Any] = response.json()

    if payload.get("errors"):
        return ProposalContext(
            id=proposal_id,
            context_fetch_error=str(payload["errors"]),
        )

    proposal = payload.get("data", {}).get("proposalBoard")
    if not proposal:
        return ProposalContext(
            id=proposal_id,
            context_fetch_error="Proposal not found in Keystone.",
        )

    return ProposalContext.model_validate(proposal)
