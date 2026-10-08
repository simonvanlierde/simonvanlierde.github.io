#!/usr/bin/env bash
# Reports where the homepage or the GitHub profile README has fallen behind the
# repos: public repos with new commits since the page was last edited that the
# page does not link yet, and links to repos that are gone, renamed or archived.
# Prints a Markdown report and exits 0 either way; prints nothing when clean.
# Needs gh (authenticated; GITHUB_TOKEN is enough) and jq.
set -euo pipefail

owner=simonvanlierde
site_repo=$owner/$owner.github.io
profile_repo=$owner/$owner
root=$(cd "$(dirname "$0")/.." && pwd)

# One repo name per line; # starts a comment.
ignore=$(sed 's/#.*//; /^[[:space:]]*$/d' "$root/.github/drift-ignore" 2>/dev/null || true)

# Newest commit date touching any of the given paths in a repo.
last_edit() {
  local repo=$1 path latest=""
  shift
  for path in "$@"; do
    d=$(gh api "repos/$repo/commits?path=$path&per_page=1" --jq '.[0].commit.committer.date // empty')
    [[ $d > $latest ]] && latest=$d
  done
  echo "$latest"
}

site_text=$(cat "$root"/src/content/projects/*.md "$root/src/pages/index.astro")
site_date=$(last_edit "$site_repo" src/content/projects src/pages/index.astro)
profile_text=$(gh api "repos/$profile_repo/readme" -H "Accept: application/vnd.github.raw")
profile_date=$(last_edit "$profile_repo" README.md)

# Fetched on its own line so a failed listing stops the script instead of
# reading as "no repos" and closing the issue.
all_repos=$(gh repo list "$owner" --visibility public --source --no-archived --limit 200 --json name --jq '.[].name')
repos=$(grep -vxF -e "$owner" -e "$owner.github.io" -f <(printf '%s\n' "$ignore") <<<"$all_repos" || true)

# Date of the newest commit not made by a bot (Renovate, Dependabot, Actions).
last_human_commit() {
  gh api "repos/$owner/$1/commits?per_page=30" \
    --jq '[.[] | select((.author.type // "User") != "Bot" and (.author.login // "" | endswith("[bot]") | not))][0].commit.committer.date // empty' 2>/dev/null || true
}

report=""
section() { # title, page date, page text
  local out="" name d linked
  # Exact names, so a link to tide-app does not count as one to tide. A dot that
  # ends a sentence is not part of the name.
  linked=$(grep -oiE "github\.com/$owner/[A-Za-z0-9_.-]+" <<<"$3" | sed 's#.*/##; s/\.git$//; s/\.*$//' | sort -fu || true)
  for name in $repos; do
    grep -qixF "$name" <<<"$linked" && continue
    d=$(last_human_commit "$name")
    [[ -n $d && $d > $2 ]] && out+="- [$name](https://github.com/$owner/$name): commits up to ${d:0:10}, not linked"$'\n'
  done
  for name in $linked; do
    [[ $name == "$owner" || $name == "$owner.github.io" ]] && continue
    info=$(gh api "repos/$owner/$name" --jq '"\(.name) \(.archived)"' 2>/dev/null || echo "")
    if [[ -z $info ]]; then
      out+="- \`$name\` is linked but the repo does not exist"$'\n'
    elif [[ ${info% *} != "$name" ]]; then
      out+="- \`$name\` is linked but the repo is now \`${info% *}\`"$'\n'
    elif [[ ${info#* } == true ]]; then
      out+="- \`$name\` is linked but archived"$'\n'
    fi
  done
  [[ -n $out ]] && report+="### $1 (last edited ${2:0:10})"$'\n\n'"$out"$'\n'
  return 0
}

section "Homepage projects and landing page" "$site_date" "$site_text"
section "GitHub profile README" "$profile_date" "$profile_text"
printf '%s' "$report"
