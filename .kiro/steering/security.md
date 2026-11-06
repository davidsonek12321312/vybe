---
inclusion: always
---
# Security, Privacy and Community Safety

During each design phase, include a lightweight threat model: assets, trust boundaries, misuse cases, mitigations and residual risks. Avoid secrets in git and logs. Restrict user data by least privilege. When integrating Supabase, require RLS policies and positive/negative authorization tests before production data exists.

Protect event participants: no public exposure of exact member location, contact details, or attendance without opt-in; accommodate underage protections for alcohol/nightlife; plan reporting, blocking, abuse response, host verification and spam prevention. Validate server-side any RSVP capacity and authorization.

Event legality: no public promise of beach bonfires or alcohol service until appropriate local permission/venue arrangements are verified. Do not assume rules are satisfied.
