# Security

## Report a vulnerability

Report it privately, through
[a GitHub security advisory](https://github.com/simonvanlierde/simonvanlierde.github.io/security/advisories/new)
or by email to <code@duinlab.nl>. Don't open a public issue or pull request for it:
anyone can read those before there is a fix.

Please include what the problem is and where (a page, a file, a workflow or a dependency),
how to reproduce it, and the impact you expect.

I acknowledge a report within 14 days, then tell you whether I can reproduce it and when I
expect a fix. The site deploys from `main`, so a fix is live once it merges. I credit you in
the changelog unless you'd rather not be named.

## Scope

The site is static: it has no server code, no accounts and stores nothing about visitors.

In scope:

- The code in this repository and the pages it builds.
- The CI, preview and deploy workflows in `.github/workflows`.
- The dependencies in `pnpm-lock.yaml`, when the problem affects the site.

Out of scope:

- A problem in a dependency that doesn't affect the site. Report it upstream.
- GitHub Pages and Cloudflare themselves.
