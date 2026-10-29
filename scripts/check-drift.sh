#!/usr/bin/env bash
# Reports where the homepage or the GitHub profile README has fallen behind the
# repos: public repos with new commits since the page was last edited that the
# page does not link yet, and links to repos that are gone, renamed or archived.
# Prints a Markdown report and exits 0 either way; prints nothing when clean.
# Needs gh (authenticated; GITHUB_TOKEN is enough) and jq.
# DRIFT_OFFLINE=1 runs only the checks that need no gh call; DRIFT_STATS_FILE
# points the stats check at another file, and DRIFT_PINNED_JSON replaces the
# pinned-repos query with a JSON list of {nameWithOwner, isArchived} (all three
# are for the tests).
set -euo pipefail

owner=simonvanlierde
site_repo=$owner/$owner.github.io
profile_repo=$owner/$owner
root=$(cd "$(dirname "$0")/.." && pwd)

stats_max_days=21
stats_file=${DRIFT_STATS_FILE:-$root/src/data/stats.json}

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

report=""

# The weekly refresh keeps the old snapshot when the API fails, so a stale
# fetched_at is the only sign that the refresh stopped. as_of only moves when
# the counts do, so it cannot tell a quiet stretch from a dead refresh.
stats_as_of=$(jq -r '.fetched_at // empty' "$stats_file")
# An empty date would parse as today and pass, so it counts as stale.
stats_age=9999
[[ -n $stats_as_of ]] && stats_age=$((($(date -u +%s) - $(date -u -d "$stats_as_of" +%s)) / 86400))
if ((stats_age > stats_max_days)); then
  stats_state="is from $stats_as_of, $stats_age days ago (limit $stats_max_days)"
  [[ -n $stats_as_of ]] || stats_state="has no fetched_at date"
  report+="### R9lab stats"$'\n\n'"- \`src/data/stats.json\` $stats_state. Check the refresh-data workflow."$'\n\n'
fi

# Pinned repos on the GitHub profile: each must be live and have a card here.
pinned=${DRIFT_PINNED_JSON:-}
if [[ -z $pinned && ${DRIFT_OFFLINE:-} != 1 ]]; then
  # shellcheck disable=SC2016 # $login is a GraphQL variable, not shell
  pinned=$(gh api graphql -f login="$owner" -f query='
    query($login: String!) { user(login: $login) { pinnedItems(first: 6, types: REPOSITORY) {
      nodes { ... on Repository { nameWithOwner isArchived } } } } }' \
    --jq '.data.user.pinnedItems.nodes')
fi
if [[ -n $pinned ]]; then
  pin_out=""
  while read -r name archived; do
    [[ $archived == true ]] && pin_out+="- pinned \`$name\` is archived"$'\n'
    grep -qiE "^repo: https://github.com/$name/?$" "$root"/src/content/projects/*.md ||
      grep -qixF "${name#*/}" <<<"$ignore"$'\n'"$owner"$'\n'"$owner.github.io" ||
      pin_out+="- pinned \`$name\` has no card in src/content/projects"$'\n'
  done < <(jq -r '.[] | "\(.nameWithOwner) \(.isArchived)"' <<<"$pinned")
  [[ -n $pin_out ]] && report+="### Pinned repos"$'\n\n'"$pin_out"$'\n'
fi

if [[ ${DRIFT_OFFLINE:-} == 1 ]]; then
  printf '%s' "$report"
  exit 0
fi

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

section() { # title, page date, page text, "links-only" to skip the unlinked-repo check
  local out="" name d linked
  # Exact names, so a link to tide-app does not count as one to tide. A dot that
  # ends a sentence is not part of the name.
  linked=$(grep -oiE "github\.com/$owner/[A-Za-z0-9_.-]+" <<<"$3" | sed 's#.*/##; s/\.git$//; s/\.*$//' | sort -fu || true)
  [[ ${4:-} == links-only ]] || for name in $repos; do
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
# The profile README is a short pointer to the site, so it only must not link dead repos.
section "GitHub profile README" "$profile_date" "$profile_text" links-only
printf '%s' "$report"
