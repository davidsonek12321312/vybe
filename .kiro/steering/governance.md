---
inclusion: always
---
# Mandatory Spec-Driven Development

Before any change, read `docs/SDD_WORKFLOW.md`, `AGENTS.md`, and the relevant canonical spec under `.kiro/specs/`.

For feature specs, use Kiro Feature Spec -> Requirements-First, **NOT Quick Spec**.

Phases: requirements.md DRAFT -> human approved -> design.md DRAFT -> human approved -> tasks.md DRAFT -> human approved -> implementation -> tests -> independent review -> PR. Generate only the current requested phase. Never auto-approve. Each requirement needs an ID and testable EARS SHALL text, with Given/When/Then acceptance criteria. Each task needs acceptance, dependencies, and affected files.

Stop before coding if approvals are missing. Record status and approver in each phase document. Implementation follows the approved design; changes start by revising specs.
