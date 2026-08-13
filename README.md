# Mindful Merge

Mindful Merge is a small, dependency-free Chrome extension that warns reviewers when approving a GitHub pull request that has auto-merge enabled.

It adds this inline warning to the open review dialog when **Approve** is selected:

> Auto-merge is enabled. Approving this PR may cause it to merge automatically once remaining requirements pass.

The extension is informational only. It does not block, delay, or modify review submission or GitHub's merge process.

## Install

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this repository directory.

The extension requests no API, token, OAuth, storage, or backend access. Its content script is limited to `https://github.com/*/*/pull/*`.

## Detection

For users allowed to manage auto-merge, GitHub renders a visible **Disable auto-merge** button in the pull request merge area while auto-merge is active. Mindful Merge detects that exact reverse-action label in the existing page DOM. This is simpler and less invasive than calling GitHub's REST or GraphQL API, and it avoids requiring credentials.

The review UI is currently transitioning between implementations. The extension supports both semantic form contracts:

- Current React UI: `name="reviewEvent"` and `value="approve"`.
- Legacy UI: `name="pull_request_review[event]"` and `value="approve"`.

It listens for form changes, GitHub client-side navigation events, and DOM mutations while on a pull request. Updates are coalesced to one animation frame, and the warning has a unique ID to prevent duplicates. Navigating away from a PR stops DOM observation and removes the warning. Disabling auto-merge, closing the review UI, or selecting another review outcome also removes it.

The optional submit-button annotation is intentionally omitted. GitHub's current React UI owns and rerenders that button, so changing its contents would be substantially more fragile than adding an extension-owned warning.

## Limitations

- Detection depends on GitHub's English UI text **Disable auto-merge**. It will not detect the state when GitHub is displayed in another language.
- GitHub only exposes **Disable auto-merge** to repository writers and pull request authors. A reviewer who can approve but cannot manage auto-merge may not see a warning. GitHub's timeline entry for enabling auto-merge is not used as a fallback because it remains after auto-merge is disabled and is therefore not a reliable current-state signal.
- GitHub does not publish a stable DOM API. If it changes the auto-merge label or review form semantics, the selectors may need updating.
- The auto-merge control must be rendered in the page DOM. A GitHub UI experiment that omits or virtualizes it could prevent detection.
- GitHub Enterprise Server and custom GitHub domains are not included in the manifest.

Using the pull request API would provide a more authoritative, locale-independent signal, but would add network access and authentication concerns. DOM inspection is the least invasive tradeoff for this convenience utility.

## Manual Test

1. Open a pull request that cannot merge yet and enable auto-merge.
2. Open **Review changes** (or **Submit review** in the newer Files view).
3. Select **Approve** and confirm the warning appears near the review choices.
4. Select **Comment** or **Request changes** and confirm the warning disappears immediately.
5. Select **Approve** again, disable auto-merge in the PR merge area, and confirm the warning disappears.
6. Re-enable auto-merge and confirm only one warning appears even after opening and closing the dialog repeatedly.
7. Navigate to another pull request without a full reload and confirm the warning reflects that PR's state.
8. Submit an approval and confirm the extension neither blocks nor delays it.
