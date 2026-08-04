# MindHive AI Feedback Service

Barebones FastAPI/Pydantic service used by Keystone's `generateAiFeedbackHelp` mutation.

## Environment

- `MINDHIVE_GRAPHQL_ENDPOINT`: Keystone GraphQL endpoint, for example `http://localhost:4444/api/graphql`.
- `AI_FEEDBACK_SERVICE_TOKEN`: optional shared token. If set here, Keystone must send the same value.
- `OPENAI_API_KEY`: optional and currently unused by the deterministic placeholder.
- `MODEL_NAME`: optional and reserved for future model-backed generation.

## Run Locally

```bash
cd pydantic
python -m venv .venv
source .venv/bin/activate
pip install -e .
set -a; [ -f .env ] && . ./.env; set +a
uvicorn agent_service.main:app --reload --port 8001
```

Keystone should set `AI_FEEDBACK_SERVICE_URL=http://localhost:8001`.
