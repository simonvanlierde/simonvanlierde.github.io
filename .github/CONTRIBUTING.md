# Contributing

This is my personal site, so most changes come from me. A bug report is welcome: a broken
link, a page that renders wrong, or an accessibility problem. Please read the
[Code of Conduct](CODE_OF_CONDUCT.md) first, and report a vulnerability as
[SECURITY.md](SECURITY.md) says, not in a public issue.

## Scope and response

I maintain the site in my own time and expect to reply within about two weeks. I take bug
fixes and accessibility fixes; a pull request that changes the content or the design is
closed with a link to this section.

## Set up and check

[Local development](../README.md#local-development) in the README has the commands.
`pnpm check` runs the lint, type check and unit tests, and `pnpm test:e2e` the browser and
axe tests, as CI does on every pull request.

## Write commits and pull requests

- **Commits and pull request titles** follow
  [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/):
  `type(scope): summary`, in the imperative, lower case, with no period. The `pr title`
  check tests the title against [`committed.toml`](../committed.toml), since a squash merge
  makes it the commit on `main`.
- **The pull request body** follows [the template](pull_request_template.md): what it fixes
  and why, a few bullets, and a `Tests:` line.
- **The changelog** ([CHANGELOG.md](../CHANGELOG.md)) gets an entry for a change a visitor
  would notice.
