# Architecture review checklist

- [ ] One active season per team is intentional.
- [ ] Source archive FK prevents orphaned rollover history.
- [ ] RPC remains the only write path.
- [ ] RLS exposes only authorized team data.
- [ ] Returning membership identities map to account/profile IDs safely.
- [ ] Existing live tables remain untouched.
- [ ] Template IDs are resolved safely when mounted into production.
- [ ] CI and registered-coach smoke test pass.
