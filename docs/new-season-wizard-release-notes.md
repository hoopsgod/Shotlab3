# New Season Wizard release notes

This change introduces a safe, coach-only season rollover foundation built on immutable season archives.

Key properties:

- one active season per team;
- atomic creation through a database RPC;
- idempotent transition IDs;
- durable source archive requirement;
- returning-player membership boundary;
- removed, deleted, inactive, and coach rows excluded;
- historical scores, attendance, RSVPs, streaks, completed events, and completed S&C sessions never copied;
- optional reusable drill, event, and S&C template selections;
- server-side authorization and RLS;
- local active-season cache updates only after server success;
- mobile-first four-step wizard component.

Migration 034 must be applied before enabling the production wizard.
