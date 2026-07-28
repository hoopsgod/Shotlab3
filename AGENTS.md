# ShotLab Agent Instructions

## Pull request handoff

Pull-request creation and CI/deployment verification are separate phases. Do not block task completion by repeatedly polling pull-request status.

1. Before opening a pull request, search for an existing open pull request whose head branch matches the current branch. Update and reuse that pull request instead of creating a duplicate.
2. After pushing the final commit, create or update the pull request and capture its URL, number, head branch, and head SHA.
3. Make no more than two immediate status lookups. Do not enter an open-ended polling loop and do not wait for every external deployment or check to finish.
4. Once GitHub confirms that the pull request exists and points to the expected head SHA, treat the handoff as complete. Report checks as passed, failed, or pending based on the latest available snapshot.
5. If a status endpoint, deployment integration, or mergeability calculation remains pending or unavailable, return the pull-request link and the known verification results. Do not create extra commits merely to retrigger status calculations.
6. A pending or failed secondary integration must not hide a successful primary result. ShotLab's delivery target is Cloudflare Pages. Cloudflare Workers and Vercel preview statuses are informational unless the task explicitly targets them.
7. Never claim that pending checks passed. Clearly identify anything that still requires human review or a later status refresh.

## Final response requirements

End coding tasks with a concrete handoff containing:

- pull-request number and link;
- branch and head SHA;
- tests or builds actually completed;
- latest Cloudflare Pages status or preview link when available;
- any remaining pending, failed, or manual checks.

Do not end a task with only “Polling pull request status.”
