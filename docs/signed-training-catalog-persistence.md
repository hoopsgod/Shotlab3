# Signed Training Catalog Persistence

## Goal

Coach-created At Home and Program drills must survive device changes and browser storage loss. Static ShotLab defaults remain versioned application code; only team customizations are stored remotely.

## Access model

- Registered players may read the custom catalog for their active team.
- Coaches and assistant coaches may replace the custom catalog only for teams they manage.
- Demo accounts remain local-only.
- Browser roles have no direct privileges on `public.training_drills`.
- Cloudflare Functions use `service_role` after verifying the signed or server-side session identity.

## Existing-work promotion

When a coach first loads after deployment:

1. ShotLab reads the signed remote catalog.
2. If the remote catalog is empty and the device has local custom drills, ShotLab uploads those custom rows once.
3. Static default drills are excluded from the upload.
4. After remote data exists, the signed catalog is authoritative across devices.

If the network is unavailable, local edits remain on the device and are eligible for promotion on a later authenticated load.

## Rollout

1. Apply `051_training_catalog_signed_api.sql`. This is backward-compatible because existing production code does not query the new table.
2. Deploy the `/v1/training-catalog` route and client service.
3. Verify an unsigned production request returns `401`.
4. Verify a registered coach can create a custom drill and a registered player on the same team can read it.
5. Confirm `anon` and `authenticated` retain no direct table privileges.
