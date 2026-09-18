---
name: ui-skills-root
description: Route UI work to the smallest useful UI-skills context via MCP (list_skills/get_skill); CLI fallback only.
license: MIT
metadata:
  author: ibelick
  version: "1.0.0"
---

# UI Skills Root

You are the routing layer for UI Skills.

Use it when an agent has a clear UI goal.

If the goal is unclear, ask one short question.

If the goal is clear, choose the right category, load the smallest useful skill context, then implement.

## Protocol

1. decide if the task is UI-related
2. if not, return `no skill needed`
3. identify the likely category
4. inspect that category with the **MCP tools** (`list_skills`, then `get_skill`)
5. select the smallest useful skill set
6. load only selected skill(s)
7. implement using that context

## MCP (preferred)

Tools: `list_skills`, `get_skill` — served at `https://www.ui-skills.com/mcp`.

## CLI (fallback — hangs on some Windows setups)

```bash
npx ui-skills start
npx ui-skills categories
npx ui-skills list --category <category>
npx ui-skills get <slug>
```

## Selection Rules

Prefer 1 skill.

Use 2 only when the task needs two clear angles.

Use 3 only for broad review, redesign, or multi-surface work.

Never use more than 3.

Route by topic, then stack, then specificity.

Prefer specific skills over broad skills.

Prefer framework-specific skills when the stack is obvious.

For quick cleanup, prefer the most specific craft, visual, or layout skill available.

If unsure, inspect categories and pick the safest narrow skill.
