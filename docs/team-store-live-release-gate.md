# Team Store live release gate

This branch adds an automated post-merge production probe for the Phase 1 Team Store. It verifies the focused contract tests and production build, then confirms that `shotlab3.pages.dev` serves the Team Store mount and required coach, player, and affiliate-disclosure markers.
