# AI Agent Review Workflow

This repo now includes scripts that expose the app on `0.0.0.0` so AI/browser agents can load it and provide UI/UX feedback.

## 1) Start the app in agent-friendly mode

```bash
npm install
npm run dev:agent
```

This runs Vite on `http://0.0.0.0:4173` (strict port), which is easier to forward into browser automation tools.

If you want to review production output instead:

```bash
npm run build
npm run preview:agent
```

## 2) Give agents a review checklist

When asking an AI agent for feedback, include:

- The URL and routes to test (for example `/`, `/pages/player`).
- The target audience (players, coaches, etc.).
- What kind of feedback you want (visual hierarchy, onboarding clarity, conversion, accessibility, mobile responsiveness).
- Any brand constraints (colors, typography, must-keep components).

## 3) Suggested prompt template

```text
Review this web app as a product + UX critic.

Context:
- App: Shotlab offseason basketball development platform
- Audience: [players/coaches]
- Goal of this page: [goal]
- Non-negotiables: [brand or content constraints]

Please provide:
1) Top 5 usability issues (ranked by impact)
2) Accessibility issues (WCAG-minded, practical)
3) Visual hierarchy and copy recommendations
4) Mobile-specific risks
5) Quick wins (<1 day) and bigger improvements (>1 day)
```

## 4) Capture screenshots for asynchronous reviews

If the reviewing agent cannot browse interactively, provide screenshots of the key states:

- First load / hero
- Mid-page content
- Form entry and validation states
- Empty and error states
- Mobile viewport variants

