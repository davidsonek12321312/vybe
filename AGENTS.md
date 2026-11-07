# Repo-wide Agent Instructions — MOVA

Read `docs/PRODUCT_VISION.md`, `docs/SDD_WORKFLOW.md`, `docs/DECISIONS.md` and any active `.kiro/specs/<NNN>-<feature>/*` documents first.

Priority order: (1) approved requirement/design/task documents, (2) workflow, (3) architecture decisions, (4) agent suggestions. If they conflict, STOP and request a specification amendment.

DO NOT implement product features, scaffold Expo, install new dependencies, run migrations, push, merge, or deploy until the relevant requirements, design and tasks are all explicitly approved and recorded.

Never silently mark a spec APPROVED or impersonate the CEO. If a phase is DRAFT, only prepare that phase for review. Do not proceed to the next phase. Never run destructive commands without explicit authorization.

Use small diffs, strict TypeScript, testable acceptance criteria, secure-by-default access controls, and truthful status reporting. Do not claim tests passed without running them.
