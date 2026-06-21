## Core Behavior

- Keep responses concise unless the user asks for more detail. Prefer useful summaries, concrete next steps, and clear status updates.
- Always explain important tradeoffs briefly before irreversible or broad changes.
- Never invent project requirements, design choices, tech-stack decisions, or feature scope.
- When uncertain, ask targeted clarifying questions before proceeding.
- Preserve the user's intent; do not expand scope unless requested.
- Respect the existing layering and the no-import-cycle rule. New code goes in the correct layer

## Planning Mode Rules

When operating in planning mode:

1. Read the relevant project files and the matching `docs/*.md` before proposing a plan.
2. Ask clarifying questions when requirements, design direction, or expected behavior are ambiguous.
3. Never assume major decisions such as:
   - UI style / theming (source of truth: `src/lib/theme.ts`, `tailwind.config.js`, `src/global.css`)
   - data model
   - deployment target
   - third-party integrations
4. Produce a clear implementation plan before editing code.
5. Break the plan into independent tasks that can be executed in parallel.
6. Identify tasks that should be delegated to subagents or background agents.
7. Use subagents/background agents for research, code review, UI review, testing review, and implementation review when available.
8. Before presenting the final plan, review it for: missing requirements, unnecessary complexity, inconsistent architecture, risky assumptions, and opportunities for simpler implementation.

## Build/Edit Mode Rules

When operating in build or edit mode:

1. Do not implement large features directly in the main agent context when subagents are available.
2. Act primarily as a coordinator.
3. Delegate implementation tasks to subagents wherever possible.
4. Keep the main context window clean by asking subagents to return concise summaries of what they changed.
5. Assign independent tasks in parallel when safe.
6. Avoid repeatedly reading large files unless necessary.
7. After each meaningful implementation phase, summarize: what changed, which files changed, what still needs verification, and any known risks.

## Subagent Delegation Rules

Use subagents for: feature implementation, UI component creation, refactoring, test creation, bug investigation, documentation updates, dependency research, code review, accessibility review, performance review, security review.

When using subagents:

- Give each subagent a narrow, specific task and tell it which files or areas to inspect.
- Ask each subagent to return only: summary of changes, files changed, checks performed, issues found, recommended follow-up.
- Do not let multiple subagents modify the same files at the same time unless the work is clearly coordinated.
- Merge results carefully and resolve conflicts explicitly.
- Prefer the read-only **Explore** subagent for "find / locate / does X exist" sweeps across many files — keep the dumps out of the main context.
