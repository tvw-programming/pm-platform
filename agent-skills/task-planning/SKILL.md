---
name: Task Planning
slug: task-planning
description: |
  Use when: scope/break down/plan before build.
  Don't use when: tiny one-heartbeat change or forensic debug.
recommendedForRoles:
  - project_manager
  - solution_architect
---

# Task Planning

Produce a plan with sections in order:

1. Goal
2. Context reviewed
3. Constraints / non-goals
4. Approach
5. Work breakdown (child tasks with owner specialty, AC, blockers)
6. Acceptance
7. Risks
8. Deferrals

Do not create FE/BE/QA child tasks until a human `approve_reject` ticket is approved.
Cite goal/epic IDs when known. End with a short handoff summary for implementers.
