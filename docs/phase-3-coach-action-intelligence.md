# Phase 3: Coach Action Intelligence

Phase 3 converts existing Coach dashboard signals into one tested decision model for the Players and Events workspaces.

## Player decisions

- empty roster: add the first player
- disengaged roster: open the attention queue
- healthy roster: recognize active players
- evidence: current-week activation, named follow-up queue, verified engagement leader

## Event decisions

- empty calendar: create the next event
- unresolved RSVPs: manage attendance for the affected event
- complete responses: open the ready event
- evidence: RSVP risk, response health, and calendar depth

## Guardrails

- no invented rankings, percentiles, or comparative claims
- no changes to persistence, authentication, permissions, scoring, or data schemas
- no action is rendered unless a real callback is available
- all derived decisions live in pure selector functions with boundary tests
