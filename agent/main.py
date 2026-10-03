"""CGen Python Agent — LM Studio OpenAI-compatible bridge.

GoFiber POSTs /v1/invoke; this service calls LM Studio /chat/completions
and returns final content + token usage (no streaming).

Phase 3: optional cwd-scoped file tools (list_dir / read_file / write_file).
Writes never escape allowed_cwd.
"""

from __future__ import annotations

import json
import os
import re
from pathlib import Path
from typing import Any

import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="CGen Agent Runtime", version="0.2.0")

DEFAULT_LM_BASE = os.getenv("LM_STUDIO_BASE_URL", "http://127.0.0.1:1234/v1")
DEFAULT_TIMEOUT = int(os.getenv("LM_STUDIO_TIMEOUT_SEC", "300"))

TOOL_RE = re.compile(
    r"<<<TOOL>>>\s*(\{.*?\})\s*<<<END_TOOL>>>",
    re.DOTALL | re.IGNORECASE,
)


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
    allowed_cwd: str = ""
    enable_file_tools: bool = False
    read_only_tools: bool = False
    max_tool_rounds: int = 10


class InvokeResponse(BaseModel):
    content: str = ""
    prompt_tokens: int = 0
    completion_tokens: int = 0
    error: str = ""
    tool_trace: list[dict[str, Any]] = Field(default_factory=list)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "cgen-agent"}


def _resolve_under_cwd(cwd: Path, rel: str) -> Path:
    """Resolve rel against cwd; raise ValueError if outside cwd."""
    if not rel or rel.strip() == "":
        rel = "."
    # Block absolute paths and parent escapes
    candidate = (cwd / rel).resolve()
    cwd_res = cwd.resolve()
    try:
        candidate.relative_to(cwd_res)
    except ValueError as exc:
        raise ValueError(f"path escapes allowed cwd: {rel}") from exc
    return candidate


def _run_tool(
    name: str,
    args: dict[str, Any],
    cwd: Path,
    read_only: bool,
) -> str:
    path = str(args.get("path") or ".")
    try:
        target = _resolve_under_cwd(cwd, path)
    except ValueError as exc:
        return f"ERROR: {exc}"

    if name == "list_dir":
        if not target.exists():
            return f"ERROR: not found: {path}"
        if not target.is_dir():
            return f"ERROR: not a directory: {path}"
        entries = sorted(target.iterdir(), key=lambda p: (not p.is_dir(), p.name.lower()))
        lines = []
        for e in entries[:200]:
            suffix = "/" if e.is_dir() else ""
            lines.append(e.name + suffix)
        return "\n".join(lines) if lines else "(empty)"

    if name == "read_file":
        if not target.exists() or not target.is_file():
            return f"ERROR: file not found: {path}"
        if target.stat().st_size > 400_000:
            return "ERROR: file too large (>400KB)"
        try:
            return target.read_text(encoding="utf-8", errors="replace")
        except OSError as exc:
            return f"ERROR: read failed: {exc}"

    if name == "write_file":
        if read_only:
            return "ERROR: write_file disabled on this wake (read-only tools)"
        content = args.get("content")
        if content is None:
            return "ERROR: write_file requires content"
        try:
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(str(content), encoding="utf-8")
        except OSError as exc:
            return f"ERROR: write failed: {exc}"
        return f"OK wrote {path} ({len(str(content))} bytes)"

    return f"ERROR: unknown tool {name}"


def _extract_tools(text: str) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for match in TOOL_RE.finditer(text or ""):
        raw = match.group(1)
        try:
            obj = json.loads(raw)
        except json.JSONDecodeError:
            out.append({"name": "invalid", "error": f"bad JSON: {raw[:200]}"})
            continue
        if isinstance(obj, dict) and obj.get("name"):
            out.append(obj)
    return out


async def _chat_once(
    client: httpx.AsyncClient,
    url: str,
    headers: dict[str, str],
    model: str,
    messages: list[dict[str, str]],
) -> tuple[str, int, int, str]:
    payload: dict[str, Any] = {
        "messages": messages,
        "stream": False,
        "temperature": 0.3,
    }
    if model:
        payload["model"] = model
    try:
        resp = await client.post(url, json=payload, headers=headers)
    except httpx.RequestError as exc:
        return "", 0, 0, f"LM Studio unreachable at {url}: {exc}"

    if resp.status_code >= 300:
        return "", 0, 0, f"LM Studio status {resp.status_code}: {resp.text[:500]}"

    try:
        data = resp.json()
    except Exception as exc:  # noqa: BLE001
        return "", 0, 0, f"invalid LM Studio JSON: {exc}"

    content = ""
    choices = data.get("choices") or []
    if choices:
        msg = choices[0].get("message") or {}
        content = msg.get("content") or ""

    usage = data.get("usage") or {}
    return (
        content,
        int(usage.get("prompt_tokens") or 0),
        int(usage.get("completion_tokens") or 0),
        "",
    )


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

    if req.enable_file_tools:
        cwd_raw = (req.allowed_cwd or "").strip()
        if not cwd_raw:
            return InvokeResponse(error="enable_file_tools set but allowed_cwd is empty")
        cwd_path = Path(cwd_raw).expanduser()
        if not cwd_path.exists() or not cwd_path.is_dir():
            return InvokeResponse(
                error=(
                    f"coding folder not found: {cwd_raw}. "
                    "Set Settings → Agent Config → primary_cwd to an existing folder "
                    "(example: /Users/tejasvikaswaghulde/Documents/code/1 react/Alumni-web)."
                )
            )
    else:
        cwd_path = None

    headers = {"Content-Type": "application/json"}
    if req.api_key:
        headers["Authorization"] = f"Bearer {req.api_key}"
    url = f"{base}/chat/completions"

    prompt_tokens = 0
    completion_tokens = 0
    tool_trace: list[dict[str, Any]] = []
    max_rounds = req.max_tool_rounds if req.max_tool_rounds > 0 else 10

    async with httpx.AsyncClient(timeout=timeout) as client:
        for _round in range(max_rounds if req.enable_file_tools else 1):
            content, pt, ct, err = await _chat_once(
                client, url, headers, req.model, messages
            )
            prompt_tokens += pt
            completion_tokens += ct
            if err:
                return InvokeResponse(
                    error=err,
                    prompt_tokens=prompt_tokens,
                    completion_tokens=completion_tokens,
                    tool_trace=tool_trace,
                )

            if not req.enable_file_tools or cwd_path is None:
                return InvokeResponse(
                    content=content,
                    prompt_tokens=prompt_tokens,
                    completion_tokens=completion_tokens,
                )

            tools = _extract_tools(content)
            if not tools:
                # Strip any leftover markers just in case
                clean = TOOL_RE.sub("", content).strip()
                return InvokeResponse(
                    content=clean,
                    prompt_tokens=prompt_tokens,
                    completion_tokens=completion_tokens,
                    tool_trace=tool_trace,
                )

            results: list[str] = []
            for t in tools:
                name = str(t.get("name") or "")
                if name == "invalid":
                    results.append(t.get("error") or "invalid tool")
                    tool_trace.append({"tool": name, "error": t.get("error")})
                    continue
                result = _run_tool(name, t, cwd_path, req.read_only_tools)
                tool_trace.append({"tool": name, "path": t.get("path"), "result_preview": result[:300]})
                results.append(f"[{name} {t.get('path', '')}]\n{result}")

            messages.append({"role": "assistant", "content": content})
            messages.append(
                {
                    "role": "user",
                    "content": "Tool results:\n\n"
                    + "\n\n".join(results)
                    + "\n\nContinue. Call more tools if needed, or finish with your final message (no tool markers).",
                }
            )

    return InvokeResponse(
        content="(stopped: max tool rounds reached — summarize what you changed)",
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
        tool_trace=tool_trace,
        error="max tool rounds reached",
    )


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("AGENT_PORT", "5591"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
