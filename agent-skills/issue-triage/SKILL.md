---
name: Issue Triage
slug: issue-triage
description: |
  Use when: stale/blocked/noisy inbox or shift-start board hygiene.
  Don't use when: already checked out on one named task.
recommendedForRoles:
  - project_manager
---

# Issue Triage

You are triaging open sprint work for this chat run.

For each touched item, emit exactly one verdict: `resume` | `wake-needed` | `reassign` | `unblock` | `escalate` | `close`.
Include one concrete next action. Prefer a concise summary table.
Do not @-mention other agents. If ambiguous, escalate to a human via a clear recommendation.
Triage keeps the board honest so FE/BE/QA wakes remain valid.
