# CGen Agent Runtime (Python)

FastAPI bridge between GoFiber and local **LM Studio** (OpenAI-compatible API).

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Liveness |
| POST | `/v1/invoke` | Run a chat completion; returns `content` + token usage |

## Local run

```bash
cd agent
# Prefer 3.11/3.10 — system python3 may be 3.14+ without pydantic wheels for these pins.
python3.11 -m venv .venv   # or: python3.10 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 5591
```

Or use the monorepo `./run-local.sh`, which picks `python3.12`/`3.11`/`3.10` when available and starts this service on **:5591**.

## Environment

| Variable | Default | Notes |
|----------|---------|-------|
| `LM_STUDIO_BASE_URL` | `http://127.0.0.1:1234/v1` | Fallback if Go does not pass `base_url` |
| `LM_STUDIO_TIMEOUT_SEC` | `300` | Per-invoke timeout |
| `AGENT_PORT` | `5591` | When running `python main.py` |

## Invoke body (from GoFiber)

```json
{
  "model": "local-model",
  "system_prompt": "...",
  "messages": [{"role": "user", "content": "Assign: triage sprint"}],
  "base_url": "http://127.0.0.1:1234/v1",
  "api_key": "",
  "timeout_sec": 300,
  "agent_id": "...",
  "run_id": "run-default",
  "agent_run_id": "...",
  "wake_reason": "manual_assign"
}
```

Response: `{ "content", "prompt_tokens", "completion_tokens", "error" }`.

**Note:** LM Studio must be running locally with at least one model loaded. CI environments typically do not have LM Studio; health checks will report `ok: false` until a local server is available.
