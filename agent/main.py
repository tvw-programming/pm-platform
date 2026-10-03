"""CGen Python Agent — LM Studio OpenAI-compatible bridge.

GoFiber POSTs /v1/invoke; this service calls LM Studio /chat/completions
and returns final content + token usage (no streaming).
"""

from __future__ import annotations

import os
from typing import Any

import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="CGen Agent Runtime", version="0.1.0")

DEFAULT_LM_BASE = os.getenv("LM_STUDIO_BASE_URL", "http://127.0.0.1:1234/v1")
DEFAULT_TIMEOUT = int(os.getenv("LM_STUDIO_TIMEOUT_SEC", "300"))


class ChatMessage(BaseModel):
    role: str
    content: str


class InvokeRequest(BaseModel):
    model: str = ""
    system_prompt: str = ""
    messages: list[ChatMessage] = Field(default_factory=list)
    base_url: str = ""
    api_key: str = ""
    timeout_sec: int = DEFAULT_TIMEOUT
    agent_id: str = ""
    run_id: str = ""
    agent_run_id: str = ""
    wake_reason: str = ""


class InvokeResponse(BaseModel):
    content: str = ""
    prompt_tokens: int = 0
    completion_tokens: int = 0
    error: str = ""


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "cgen-agent"}


@app.post("/v1/invoke", response_model=InvokeResponse)
async def invoke(req: InvokeRequest) -> InvokeResponse:
    base = (req.base_url or DEFAULT_LM_BASE).rstrip("/")
    timeout = req.timeout_sec if req.timeout_sec > 0 else DEFAULT_TIMEOUT

    messages: list[dict[str, str]] = []
    if req.system_prompt:
        messages.append({"role": "system", "content": req.system_prompt})
    for m in req.messages:
        messages.append({"role": m.role, "content": m.content})

    if not messages:
        raise HTTPException(status_code=400, detail="messages or system_prompt required")

    payload: dict[str, Any] = {
        "messages": messages,
        "stream": False,
        "temperature": 0.3,
    }
    if req.model:
        payload["model"] = req.model

    headers = {"Content-Type": "application/json"}
    if req.api_key:
        headers["Authorization"] = f"Bearer {req.api_key}"

    url = f"{base}/chat/completions"
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.post(url, json=payload, headers=headers)
    except httpx.RequestError as exc:
        return InvokeResponse(error=f"LM Studio unreachable at {url}: {exc}")

    if resp.status_code >= 300:
        return InvokeResponse(error=f"LM Studio status {resp.status_code}: {resp.text[:500]}")

    try:
        data = resp.json()
    except Exception as exc:  # noqa: BLE001
        return InvokeResponse(error=f"invalid LM Studio JSON: {exc}")

    content = ""
    choices = data.get("choices") or []
    if choices:
        msg = choices[0].get("message") or {}
        content = msg.get("content") or ""

    usage = data.get("usage") or {}
    return InvokeResponse(
        content=content,
        prompt_tokens=int(usage.get("prompt_tokens") or 0),
        completion_tokens=int(usage.get("completion_tokens") or 0),
    )


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("AGENT_PORT", "5591"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
