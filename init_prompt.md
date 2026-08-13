Build a small Chrome extension for GitHub that makes reviewers more aware when a pull request has auto-merge enabled.

Goal:
Add a lightweight UX warning only. Do not change GitHub's merge/review process, block actions, require extra confirmation, call external services, or introduce any backend.

Behavior:

* Run only on GitHub pull request pages.
* Detect whether auto-merge is currently enabled for the PR.
* When the "Review changes" dialog is open and the reviewer selects "Approve", show a clearly visible inline warning near the approval controls:
  `Auto-merge is enabled. Approving this PR may cause it to merge automatically once remaining requirements pass.`
* Prefer a compact warning/banner over a modal.
* Do not prevent or delay submission.
* If possible, also change or annotate the submit button while "Approve" is selected, e.g. `Submit review - auto-merge enabled`, but only if this can be done cleanly without making the extension fragile.
* Remove/hide the warning immediately if auto-merge is disabled or the reviewer switches away from "Approve".

Implementation constraints:

* Prefer DOM inspection over GitHub API calls. If GitHub already renders enough information on the page to determine whether auto-merge is enabled, use that.
* No GitHub token, OAuth flow, permissions beyond what is required to run on `https://github.com/*/*/pull/*`.
* Handle GitHub's client-side navigation and dynamic DOM updates. Use a MutationObserver or similarly lightweight approach rather than relying only on initial page load.
* Avoid brittle selectors tied to generated class names. Prefer semantic attributes, stable text, `aria-*`, `data-*`, form structure, or other resilient selectors.
* Keep the extension minimal and dependency-free if practical.
* Use Manifest V3.
* Scope all injected styles so they do not affect unrelated GitHub UI.
* Avoid duplicate warnings if the observer fires multiple times.
* Clean up correctly when navigating between PRs without a full page reload.

Deliverables:

* Complete extension source.
* `manifest.json`.
* Content script and CSS, with as few files as practical.
* A short README with:

  * what it does,
  * how to load it as an unpacked Chrome extension,
  * how auto-merge detection works,
  * known fragility/limitations,
  * quick manual test steps.

Before finalizing, inspect the current GitHub PR DOM and choose the simplest robust way to detect the auto-merge-enabled state. If there are multiple approaches, briefly explain the tradeoff and use the least invasive one.

Keep the implementation small and focused. This is a developer convenience utility, not a workflow-enforcement tool.

