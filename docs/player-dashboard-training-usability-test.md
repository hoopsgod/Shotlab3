# Player Dashboard → Training Usability Test

## Purpose

Validate whether an active basketball player can independently understand ShotLab’s daily priority, reach the correct training activity, log the work, recognize that it saved, understand what changed, and return without losing context.

This is a human usability protocol. Playwright automation does not count as a participant and must not be reported as human validation.

## Participants

Recruit 5–7 active basketball players, preferably high-school or club players who regularly receive workout instructions from a coach.

Primary participants must not be developers, ShotLab implementers, or people already trained on this exact workflow. Record age/playing level and prior ShotLab exposure without collecting unnecessary personal information.

## Device and build

- Use a phone-sized viewport/device, with 390 × 844 as the primary reference.
- Use the immutable Cloudflare preview associated with the exact PR head being evaluated.
- Use a populated team fixture or test account where the participant has a real-looking coach priority and a deterministic training result to log.
- Do not coach the participant through navigation.
- Reset the fixture between participants so prior completions do not change the intended task.

## Scenario to read verbatim

“You open ShotLab before working out. Figure out what your coach wants you to work on today, start that work, record the result, and then show me whether the app says you completed what was expected.”

Do not add navigation instructions. If the participant asks what to tap, respond: “Use the app the way you normally would.”

## Observer rules

Start timing when the Player Dashboard is visible. Do not point, gesture at controls, name tabs, or explain ShotLab terminology. Record the participant’s first tap before providing any rescue instruction.

If the participant is completely blocked for 60 seconds, give one neutral rescue prompt: “What would you try next?” If still blocked after another 60 seconds, provide the smallest navigation hint needed and mark the task as help-required.

Stop the core task when the participant can show the observer a saved/completed state and explain what changed. Then ask the participant to return to where they would naturally continue in ShotLab.

## Measures

For each participant record:

| Measure | What to capture |
| --- | --- |
| First tap | Exact control or destination selected first |
| Priority identification | Correct / incorrect; participant’s own words |
| Priority rationale | Whether they understand why the activity is prioritized |
| Time to activity | Seconds from Dashboard visible to correct training control visible |
| Wrong turns | Count and brief description |
| Help required | None / neutral rescue / direct navigation hint |
| Logging success | Whether the existing result-entry control is used correctly |
| Save understanding | What evidence convinced the participant the result saved |
| Progress understanding | Exact change the participant believes occurred |
| Return success | Whether they return to the expected workspace/context independently |
| Confidence | 1–5 after task completion |
| Practical usefulness | 1–5 plus one sentence in participant’s words |

## Required observer prompts after the task

Ask only after the participant has attempted the workflow:

1. “What did ShotLab want you to do first?”
2. “Why did you think that was the priority?”
3. “How did you know your result was saved?”
4. “What changed after you logged it?”
5. “What would you do next?”
6. “Was there any point where the app sent you somewhere different from what the button promised?”

Do not convert vague answers into a pass. The participant must identify the actual priority, save evidence, and progress change.

## Pass gate

For the first five qualified players:

- at least 4 of 5 identify the correct priority without direct instruction;
- at least 4 of 5 reach the correct activity independently;
- at least 4 of 5 successfully complete/log the action;
- at least 4 of 5 correctly explain what progress changed;
- at least 4 of 5 return to the expected context;
- no identical navigation failure affects two or more participants.

Any repeated failure affecting two or more participants is a product blocker even if the aggregate completion percentage still clears 4 of 5.

## Failure classification

Classify observed failures before changing the UI:

- **Priority comprehension** — player cannot tell what matters today.
- **Action-label mismatch** — CTA wording promises a destination/action different from what opens.
- **Routing failure** — correct CTA does not reveal the usable control.
- **Logging comprehension** — player reaches training but cannot tell what to enter or submit.
- **Persistence trust** — player cannot tell whether work saved, or refresh disproves persistence.
- **Progress comprehension** — saved work does not produce an understandable state change.
- **Return/context loss** — player finishes work but lands somewhere unrelated or loses useful context.
- **Geometry/mobile containment** — clipped, shifted, horizontally movable, or obscured controls interfere with completion.

Fix repeated workflow failures before decorative polish.

## Session record template

| Participant | First tap | Correct priority | Independent route | Logged result | Save understood | Progress understood | Returned | Help | Time to activity | Wrong turns | Confidence | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P1 |  |  |  |  |  |  |  |  |  |  |  |  |
| P2 |  |  |  |  |  |  |  |  |  |  |  |  |
| P3 |  |  |  |  |  |  |  |  |  |  |  |  |
| P4 |  |  |  |  |  |  |  |  |  |  |  |  |
| P5 |  |  |  |  |  |  |  |  |  |  |  |  |
| P6 |  |  |  |  |  |  |  |  |  |  |  |  |
| P7 |  |  |  |  |  |  |  |  |  |  |  |  |

## Reporting language

Until five qualified players complete the protocol, report exactly:

**Real-player usability validation: prepared, not yet conducted.**

Do not substitute automated browser success, internal team review, screenshots, or developer walkthroughs for this status.
