# Vybe SDD Operating Procedure — version 0.1

Derived from the founder-provided *Spec-Driven Development with Claude Code & Git* manual (April 2026). This project adapts its source location from `/spec/` to **`.kiro/specs/`**, because Kiro is the primary development IDE and must be the canonical source of truth. Never maintain duplicated specs.

## Phases and hard gates
1. **Requirements**: numbered EARS requirements (`WHEN ... SHALL`, `WHERE ... SHALL`, etc.), Given/When/Then scenarios, nonfunctional requirements, out of scope. Draft only; no code.
2. **Approval of requirements** by human; record `Status: APPROVED`, `Approved by:` and `Approved on:`. Review for business value, testability, missing flows and privacy.
3. **Design**: architecture/modules/interfaces, data flow, error handling, threat model (assets, actors, trust boundaries, threats/controls), UX states, migration/rollback, affected files, explicit open decisions.
4. **Approval of design** by human; verify technical feasibility and alignment with approved requirements.
5. **Tasks**: small ordered T-NNN items, exact paths, dependencies, verifiable acceptance/tests.
6. **Approval of tasks** by human.
7. **Implementation** by Kiro in a topic branch. No broader changes. Tests/lint/typecheck and meaningful runtime verification. Claims of passes must be backed by command output.
8. **Independent Claude review** (read-only by default) for spec conformity, correctness and security. Document findings; fix under existing approved scope or amend spec if scope changes.
9. **PR** references spec and includes test evidence; human merge approval; never auto-push/merge/deploy.

## Branch / commit conventions
`feature/spec-001-project-foundation` and `feature/spec-002-event-discovery`.
`spec(001): draft foundation requirements`
`feat(001): implement foundation per approved spec`
`test(001): cover foundation acceptance criteria`
`fix(001): correct behavior per amended spec`

## Definition of Done
- Current approved spec matches implementation and is versioned with code.
- Acceptance criteria satisfied; error, loading and empty states tested as applicable.
- Typecheck/lint/tests pass; web and relevant mobile smoke testing documented.
- No leaked credentials; no unresolved high/critical risks or unauthorized data access.
- Claude review findings resolved or explicitly accepted with documented justification.
- PR human reviewed, traceable to spec and merged after checks.

## Anti-patterns
- One giant prompt to build the entire app.
- Quick Spec instead of governed requirements-first.
- Scaffolding, dependency installation and source code in DRAFT phase.
- Treating a terminal timeout as a green build.
- Mutating approved specs to justify arbitrary generated code.
- Specs duplicated across `.kiro/specs/` and `/spec/`.

## Operating mode
The founder is CEO: approves direction, major scope, release risk and budget. The ChatGPT lead recommends plans/reviews but cannot remotely control agents or approve on the founder's behalf. Kiro produces spec drafts and implementation only after gates. Claude Code is default read-only reviewer. The repo is the durable memory.
