# Player first-result conversion

This release slice converts a connected player into an active ShotLab player through one bounded result.

## Decision contract

1. Urgent team commitments remain first.
2. A connected player with no training history receives one direct first-result task.
3. The task prefers the current coach-priority drill, then the first available At Home drill, then the first Program drill.
4. When no drill exists, the player is routed to shot logging.
5. The full daily target is not presented as the activation requirement.
6. After one saved result, normal coach-priority and daily-goal sequencing resumes.
7. Player Home confirms that the first training baseline is active.

## Compatibility

No authentication, schema, persistence, roster, Team Store, or coach workflow changes are part of this slice.