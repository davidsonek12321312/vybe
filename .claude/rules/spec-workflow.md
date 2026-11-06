---
paths:
  - "app/**/*"
  - "src/**/*"
  - "components/**/*"
  - "lib/**/*"
  - "supabase/**/*"
---
# Spec Workflow Guard

For any change to app/backend code, identify the applicable canonical `.kiro/specs/<NNN>-<feature>/` and verify requirements.md, design.md and tasks.md each say `Status: APPROVED` with an actual human approver and approval date. Otherwise STOP and request spec phase completion. Approved spec overrides suggestions in code. Do not auto-approve.
