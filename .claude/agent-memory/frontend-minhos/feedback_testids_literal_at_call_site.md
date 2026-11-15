---
name: testids-literal-at-call-site
description: healthapp redesign: keep every data-testid as a literal string at its JSX call site; Back's testid diff is a grep against staging
metadata:
  type: feedback
---

Write `data-testid="x"` literally where the element is used. Do not pass it through a wrapper prop (`testId="x"`) that renders `data-testid={testId}`.

**Why:** Back's acceptance for MIN-4587 is `git grep -ho 'data-testid="[^"]*"' staging -- src | sort -u` diffed against the branch (plus a 6-line dynamic list). A wrapper prop made 6 ids vanish from the grep although they existed at runtime, so the diff was not empty.

**How to apply:** wrappers such as `PatientScreen` spread `...rest` onto the element and the caller writes `data-testid="..."`. Re-run both greps (static and `data-testid={`) before handing back any restyle.

Related: [[healthapp-dev-server-5185]]
