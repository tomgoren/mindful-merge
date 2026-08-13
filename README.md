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

For users allowed to manage auto-merge, GitHub may render a visible **Disable auto-merge** button in the pull request merge area while auto-merge is active. Mindful Merge uses that as a fast positive signal. Because reviews are normally submitted from the Files view, where GitHub does not mount the merge area, the extension also fetches and inspects the canonical Conversation page when **Approve** is selected. It uses the control when available; otherwise, it reconciles the ordered **enabled auto-merge** and **disabled auto-merge** timeline events and uses the latest event as the current state. This is a same-origin HTML request using the existing GitHub session, not a GitHub API call, and requires no token or additional permission.

The review UI is currently transitioning between implementations. The extension supports both semantic form contracts:

- Current React UI: `name="reviewEvent"` and `value="approve"`.
- Legacy UI: `name="pull_request_review[event]"` and `value="approve"`.

It listens for form changes, GitHub client-side navigation events, and DOM mutations while on a pull request. Updates are coalesced to one animation frame, and the warning has a unique ID to prevent duplicates. Navigating away from a PR stops DOM observation and removes the warning. Disabling auto-merge, closing the review UI, or selecting another review outcome also removes it.

The optional submit-button annotation is intentionally omitted. GitHub's current React UI owns and rerenders that button, so changing its contents would be substantially more fragile than adding an extension-owned warning.

## Limitations

- Detection depends on GitHub's English UI text **Disable auto-merge**. It will not detect the state when GitHub is displayed in another language.
- GitHub only exposes **Disable auto-merge** to repository writers and pull request authors. For other reviewers, detection depends on GitHub retaining both enable and disable events in chronological DOM order on the Conversation page.
- GitHub does not publish a stable DOM API. If it changes the auto-merge label or review form semantics, the selectors may need updating.
- The auto-merge control must be rendered in the Conversation page HTML for the current user. A GitHub UI experiment that omits or virtualizes it could prevent detection.
- GitHub Enterprise Server and custom GitHub domains are not included in the manifest.

Using the pull request API would provide a more authoritative, locale-independent signal, but would add API access and authentication concerns. Inspecting GitHub's existing HTML is the least invasive tradeoff for this convenience utility.

## Manual Test

1. Open a pull request that cannot merge yet and enable auto-merge.
2. Open **Review changes** (or **Submit review** in the newer Files view).
3. Select **Approve** and confirm the warning appears near the review choices.
4. Select **Comment** or **Request changes** and confirm the warning disappears immediately.
5. Select **Approve** again, disable auto-merge in the PR merge area, and confirm the warning disappears.
6. Re-enable auto-merge and confirm only one warning appears even after opening and closing the dialog repeatedly.
7. Navigate to another pull request without a full reload and confirm the warning reflects that PR's state.
8. Submit an approval and confirm the extension neither blocks nor delays it.

## Automated Test

Run the dependency-free DOM regression tests with:

```sh
node --test content.test.js
```

## Diagnostics

Add `?mindful_merge_debug=1` to a pull request URL and refresh the page. For example:

```text
https://github.com/OWNER/REPOSITORY/pull/NUMBER/changes?mindful_merge_debug=1
```

A fixed **Mindful Merge diagnostics** panel appears in the lower-right corner. Open the review dialog and select **Approve**, but do not submit the review. The panel reports:

- the loaded extension version and current path,
- how many review dialogs and Approve inputs were found,
- whether Approve is currently checked,
- the detected auto-merge state and its source,
- whether the warning was inserted.

If the panel does not appear at all, the content script was not injected. Confirm the extension version at `chrome://extensions`, reload the extension, and refresh the GitHub tab. The same diagnostic state is also exposed on the page's root element as `data-mindful-merge-debug`.

## License

Mindful Merge is available under the [MIT License](LICENSE).
