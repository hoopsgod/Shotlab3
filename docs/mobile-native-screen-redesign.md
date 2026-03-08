# Mobile-Native IA Redesign

## Goals
- Reduce cognitive load on small screens.
- Keep one primary action per screen.
- Move creation/editing into dedicated overlays (bottom sheets/modals).
- Push dense analytics into drill-down detail screens.
- Preserve all existing functionality while lowering visible complexity.

---

## 1) Strength screen (`sc` / `SCPanel`)

### Revised mobile IA
**Top level:**
1. **Today** (default)
   - Next session card
   - RSVP/status action
   - Quick personal stat chips (attendance streak, total this month)
2. **History**
   - Attendance list grouped by month
   - Session detail rows collapsed by default
3. **Insights**
   - Small summary tiles (rank, total attended, completion trend)
   - CTA: “Open full analytics”

**Progressive disclosure**
- Keep leaderboard and yearly attendance breakdown hidden behind:
  - `Open leaderboard` sheet
  - `View full trend` full-screen chart

### New flow structure
- **Primary flow:** Strength tab → Today → RSVP in-line.
- **Secondary flow:** Strength tab → `Log workout` FAB/button → bottom sheet form → save → return to Today with success toast.
- **Analytics flow:** Strength tab → Insights → `Open full analytics` → full-screen detail page.
- **Leaderboard flow:** Strength tab → Insights → `Leaderboard` bottom sheet.

### Component changes required
- Add segmented control: `Today | History | Insights` inside `SCPanel`.
- Move `newLog` form out of inline layout into `BottomSheetLogWorkout`.
- Extract heavy analytics into:
  - `StrengthAnalyticsScreen` (full-screen route/state)
  - `StrengthLeaderboardSheet`
- Convert session cards to compact list rows with tap-to-expand detail.
- Add sticky primary CTA: `Log workout`.

---

## 2) Challenges screen (`duels` / `DuelsPanel`)

### Revised mobile IA
**Top level:**
1. **Inbox**
   - Pending incoming challenges only
   - Primary actions: Accept/Submit score
2. **Active**
   - Outgoing/open challenges
   - Status only + quick reminder actions
3. **Results**
   - Completed challenges
   - Win/loss filters as chips (secondary)

**Progressive disclosure**
- Hide filters and advanced stats under `More filters` bottom sheet.
- Open duel result details in dedicated detail screen instead of expanded card.

### New flow structure
- **Respond flow:** Inbox → challenge card → `Submit score` modal sheet → confirmation state.
- **Create flow:** Active → `New challenge` FAB → multi-step sheet (opponent → drill → score).
- **Review flow:** Results → tap result → full-screen duel detail (history, scoring breakdown).

### Component changes required
- Replace current dense all-in-one list with segmented top tabs: `Inbox | Active | Results`.
- Introduce `ChallengeComposerSheet` for creation.
- Introduce `ChallengeResponseSheet` for score submission.
- Add `DuelDetailScreen` for final score + timeline.
- Collapse badge stack on cards to one status pill + optional secondary icon.

---

## 3) Profile screen (`profile` / `ProfilePage`)

### Revised mobile IA
**Top level:**
1. **Overview** (default)
   - Avatar/header
   - 3–4 key stats only
   - Current streak + primary badge
2. **Activity**
   - Recent workouts/events/challenges timeline
3. **Achievements**
   - Badges and milestones gallery
4. **Account**
   - Settings, preferences, reset password, delete account

**Progressive disclosure**
- Secondary stats hidden behind `View all stats`.
- Coach-only account metadata moved into Account subsection accordion.
- Long season profile details in expandable panels.

### New flow structure
- **Quick check flow:** Profile → Overview → tap a stat → metric detail screen.
- **History flow:** Profile → Activity → tap entry → contextual detail screen.
- **Settings flow:** Profile → Account → edit actions in modal/bottom sheet.

### Component changes required
- Add segmented control: `Overview | Activity | Achievements | Account`.
- Convert `StatRow` blocks to compact horizontal cards on Overview.
- Create `ProfileMetricDetailScreen` for deep charting/per-metric analytics.
- Move destructive/account actions into dedicated `AccountActionsSheet`.
- Add accordion component for coach metadata and secondary info.

---

## 4) Coach screen (`Coach`)

### Revised mobile IA
**Top level:**
1. **Home**
   - Team snapshot (attendance, pending approvals, today schedule)
   - Quick actions row
2. **Roster**
   - Player list + search
   - Tap player for player detail
3. **Content**
   - Drills/program management
4. **Calendar**
   - Events and S&C sessions
5. **Admin**
   - Team settings, branding, join code, account actions

**Progressive disclosure**
- Hide heavy management forms from main feed.
- Add + actions open dedicated create flows.
- Analytics/dashboard widgets open full-screen details.

### New flow structure
- **Coach daily flow:** Home → quick action (`Add event`, `Post drill`, `Message team`) via action sheet.
- **Creation flow:** Home/Content/Calendar → `+` → bottom-sheet picker → dedicated form screen.
- **Player management flow:** Roster → player detail → tabbed sub-sections (performance, attendance, notes).
- **Analytics flow:** Home KPI card → full-screen analytics with chart tabs.

### Component changes required
- Introduce coach-level tab scaffold: `Home | Roster | Content | Calendar | Admin`.
- Move inline forms (`new drill`, `new event`, `new S&C`) into:
  - `CreateDrillFlow`
  - `CreateEventFlow`
  - `CreateSessionFlow`
- Add `CoachQuickActionsSheet` triggered by floating `+` button.
- Add `CoachAnalyticsDetailScreen` for expanded charts.
- Replace long stacked sections with cards that deep-link into dedicated screens.

---

## Cross-screen implementation pattern
1. **Use segmented controls for local contexts** (inside a tab).
2. **Use bottom sheets for quick input** (single-task forms).
3. **Use full-screen detail for analytics** (charts/history/deep data).
4. **Use accordions/collapsible groups** for secondary info.
5. **Keep one primary CTA visible** per screen.

## Rollout order (recommended)
1. Strength + Challenges (highest density, quick wins).
2. Profile (shared segmented/disclosure patterns).
3. Coach (largest IA change; reuse patterns from earlier steps).

---

## Mobile haptics support note

- Shot logging haptics are implemented with the Vibration API (`navigator.vibrate`) and wrapped in feature detection.
- On iOS, Safari browser tabs do not expose vibration support, so taps will degrade silently with no haptic response.
- In iOS installed PWA context (Add to Home Screen), haptic behavior is supported by the app context and will be available there.
