# Coach Dashboard → Player Workflow Usability Test

## Purpose

Validate one high-value mobile Coach journey with real coaches:

**Coach Dashboard → Players → individual player → understand recent training/progress → take one relevant coaching action → return to the roster with context preserved.**

This is a usability test, not a visual-rating exercise. Do not ask participants whether ShotLab "looks like a 9.5/10 app." Measure whether they can complete the workflow independently and explain why it is useful.

## Current product contract

The workflow under test should let a coach:

1. Start on Coach Dashboard / Mission Control.
2. Navigate to Players without assistance.
3. Find a specific player using the existing roster/search tools.
4. Open that player's intelligence view.
5. Identify at least one recent training/progress signal from the displayed evidence.
6. Take an existing coaching action, such as delivering the next assignment.
7. Close the player view and return to the same Players context without losing the active search/filter or roster position.

The automated regression `tests/e2e/coach-dashboard-player-workflow.spec.mjs` protects this minimum product contract at a 390 × 844 mobile viewport. Human testing is still required because automation cannot prove that the hierarchy is understandable or practically useful to a coach.

## Participant target

Recruit **5–7 active basketball coaches** who currently manage a roster, practices, player development, or training accountability. Prefer a mix of high-school, club/AAU, and assistant/head-coach experience.

Do not count developers, ShotLab contributors, or people who have already been trained on this exact workflow as primary usability participants.

## Test environment

- Use the exact Cloudflare preview for the PR/head being evaluated.
- Test primarily at a phone-sized viewport or on a real phone.
- Use a populated registered-Coach QA account or deterministic test team with at least two players.
- One target player should have recent training activity and one should have little/no recent activity so the roster requires interpretation rather than simple recognition.
- Reset search/filter and assignment state before each participant.
- Do not use a stale preview whose SHA does not match the candidate being evaluated.

## Participant task

Give the participant this scenario without navigation instructions:

> You have a few minutes before practice. One of your players, Ari, has logged recent training. Find Ari, tell me what the app says about the player's recent work, take one coaching action you think makes sense, and then return to the player list so you could continue reviewing the roster.

Do not tell the participant which menu, filter, row, drawer, or action to use.

## Facilitator rules

- Ask the participant to think aloud.
- Do not rescue the participant during the first attempt.
- If they ask what a label means, respond with: "What would you expect it to mean?"
- Only give a hint after recording the point at which independent completion failed.
- Record actual observed behavior, not what the participant says they would probably do later.

## Measures to record

For each participant capture:

| Measure | Record |
| --- | --- |
| First navigation choice | What they tap first from Coach Dashboard |
| Independent task completion | Yes / No |
| Time to open target player | Seconds |
| Time to complete full journey | Seconds |
| Backtracks / wrong turns | Count |
| Help required | None / minor hint / direct instruction |
| Recent-progress comprehension | What signal they describe in their own words |
| Coaching-action comprehension | What they believe the action will do |
| Context preservation | Search/filter/roster context preserved after return: Yes / No |
| Confidence | 1–5 after task |
| Practical value | Participant's explanation of when they would use this workflow |

Also record any moment where the coach pauses for more than roughly five seconds because the next action is unclear.

## Pass gate

Do not call the workflow validated unless the first five qualified coaches produce all of the following:

- At least **4 of 5** complete the full journey without direct instruction.
- At least **4 of 5** correctly explain one recent training/progress signal before taking action.
- At least **4 of 5** correctly understand what their coaching action will do.
- At least **4 of 5** return to the roster without losing the context they were using.
- No repeated navigation failure affects two or more participants at the same step.

If the workflow misses this gate, fix the repeated failure point before doing another decorative-polish pass.

## Failure classification

Classify every failure into one primary category:

- **Navigation:** participant cannot find Players or return to the roster.
- **Hierarchy:** participant reaches the player but cannot identify the important recent signal.
- **Language:** labels/actions are misunderstood.
- **Action confidence:** participant understands the data but is unsure what to do next.
- **State/context:** search, filter, selected player, or roster position is lost unexpectedly.
- **Reliability:** loading, persistence, runtime, or network behavior blocks the task.

Avoid treating every problem as a visual-design problem.

## Session evidence template

For each participant record:

```text
Participant ID:
Coach type / level:
Device:
Candidate SHA / preview:

First tap:
Opened Players independently: Y/N
Found Ari independently: Y/N
Recent signal described:
Coaching action taken:
Action understood correctly: Y/N
Returned to roster: Y/N
Search/filter context preserved: Y/N
Time to target player:
Total task time:
Backtracks:
Hints required:
Repeated confusion point:
Participant's practical-value explanation:
Notes:
```

## Current validation status

The protocol is prepared, but no real-coach session should be marked complete unless an actual qualified participant performs the task. Automated Playwright coverage is regression evidence only; it is not a substitute for usability evidence.
