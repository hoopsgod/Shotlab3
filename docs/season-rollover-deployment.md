# Deployment sequence

1. Merge only after CI and review.
2. Apply migration 034.
3. Confirm PostgREST schema reload.
4. Deploy Cloudflare Functions route `/v1/seasons`.
5. Enable the mounted coach wizard.
6. Run registered-coach smoke test.
7. Verify archives and leaderboards remain unchanged.
