# Team Store Phase 1 operations

The Team Store remains a link-out commerce surface. ShotLab records only privacy-limited visit analytics and does not claim order or commission completion.

If the production smoke gate fails:

1. confirm Cloudflare Pages deployed the newest default-branch commit;
2. inspect the generated production `index.html` for `team-store-root`;
3. inspect generated JavaScript assets for Team Store UI markers;
4. do not proceed to affiliate conversion reporting until production activation is restored.
