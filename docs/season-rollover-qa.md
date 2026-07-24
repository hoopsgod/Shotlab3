# Season rollover QA matrix

| Area | Expected result |
|---|---|
| Authorization | Only active coach/assistant coach for team |
| Archive | Must exist and belong to team |
| Idempotency | Same transition returns same season |
| Active season | At most one per team |
| Returning roster | Only explicitly Returning eligible players |
| Statistics | All new-season values begin at zero |
| Templates | IDs copied as reusable structure only |
| Historical data | No mutation or reassignment |
| Client failure | No local success state before server success |
