<script lang="ts">
import { onMount, type Snippet, tick } from "svelte";
import { flip } from "svelte/animate";
import { quartOut } from "svelte/easing";
import { Tween } from "svelte/motion";
import { draw, fade } from "svelte/transition";
import { graph, type MapNode, type MapProject } from "./workMap.ts";

let { projects, mission, children }: { projects: MapProject[]; mission: string; children?: Snippet } = $props();
const threads = [
  ["", "Folded overview"],
  ["circular-data-economy", "Circular data economy"],
  ["footprints-and-flows", "Footprints and flows"],
  ["open-and-fair-research-software", "Open and fair research software"],
  ["open-and-reproducible-ml", "Open and reproducible ML"],
  ["tools-that-respect-people", "Tools that respect people"],
  ["built-to-scale-and-last", "Built to scale and last"],
];
let reducedMotion = $state(false);

onMount(() => {
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const update = () => {
    reducedMotion = preference.matches;
  };
  update();
  preference.addEventListener("change", update);
  return () => preference.removeEventListener("change", update);
});

function travel(animation: SVGAnimationElement, delay: number) {
  const timer = window.setTimeout(() => animation.beginElement(), delay);
  return { destroy: () => window.clearTimeout(timer) };
}

let thread = $state("circular-data-economy");
let selectedId = $state("");
let openGroup = $state("");
let expanded = $state(false);
let viewport = $state(1200);
let detailHeading = $state<HTMLHeadingElement>();
let readingPane = $state<HTMLElement>();
let storyHost = $state<HTMLDivElement>();
let originalScroll = 0;
let opener: HTMLButtonElement | undefined;
let previewId = $state("");
const compact = $derived(viewport < 720);
const narrowDrawing = $derived(viewport < 1080);
const drawings = $derived([
  graph(projects, thread, false, openGroup, selectedId),
  graph(projects, thread, true, openGroup, selectedId),
]);
const cameras = [
  new Tween({ x: -72, y: -60, paddingX: 144, height: drawings[0].height + 120 }),
  new Tween({ x: -32, y: -28, paddingX: 64, height: drawings[1].height + 56 }),
];

$effect(() => {
  const id = selectedId;
  const phone = compact;
  const duration = reducedMotion ? 0 : 640;
  drawings.forEach((drawing, index) => {
    const node = drawing.nodes.find((item) => item.id === id);
    const inset = index === 0 ? 24 : 12;
    const padding = index === 0 ? 72 : 32;
    const pan = node ? Math.max(-8, Math.min(8, (node.x + node.width / 2 - drawing.width / 2) * 0.025)) : 0;
    const panY = node
      ? Math.max(-inset * 0.7, Math.min(inset * 0.7, (node.y + node.height / 2 - drawing.height / 2) * 0.12))
      : 0;
    cameras[index]
      .set(
        node
          ? { x: -inset + pan, y: -inset + panY, paddingX: inset * 2, height: drawing.height + inset * 2 }
          : {
              x: -padding,
              y: index === 0 ? -60 : -28,
              paddingX: padding * 2,
              height: drawing.height + (index === 0 ? 120 : 56),
            },
        { duration, easing: quartOut },
      )
      .then(() => {
        if (phone && index === 1 && selectedId === id && !expanded) keepSelectedVisible();
      });
  });
});

function revealReading(element: HTMLElement) {
  let animation: Animation | undefined;
  function reveal() {
    animation?.cancel();
    animation = element.animate(
      reducedMotion
        ? [{ opacity: 0.75 }, { opacity: 1 }]
        : [
            { opacity: 0.3, clipPath: "inset(0 0 18% 0)" },
            { opacity: 1, clipPath: "inset(0)" },
          ],
      { duration: reducedMotion ? 100 : 360, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
    );
  }
  reveal();
  return { update: reveal, destroy: () => animation?.cancel() };
}
const selection = $derived(drawings[0].nodes.find((node) => node.id === selectedId));
const selectedProject = $derived(projects.find((project) => project.id === selectedId));
const supportingProjects = $derived(drawings[0].nodes.filter((node) => node.context && node.kind === "project"));

function previewConnection(event: PointerEvent | FocusEvent) {
  previewId = (event.target as Element).closest<HTMLElement>("[data-node-id]")?.dataset.nodeId ?? "";
}
const connections = $derived(
  projects.filter(
    (project) =>
      selectedProject && (selectedProject.builds_on.includes(project.id) || project.builds_on.includes(selectedId)),
  ),
);
const contextProjects = $derived(
  selection && !selectedProject
    ? projects.filter((project) => drawings[0].nodes.some((node) => node.id === project.id))
    : [],
);
const contextDescription = $derived(
  selection?.kind === "library"
    ? `${selection.label} is an upstream library used by the connected work shown here.`
    : selection?.id === "products"
      ? "Product disassembly is the starting point for R9lab: researchers record parts, materials and photographs as they take products apart."
      : selection?.id === "buildings"
        ? "Building records provide the observations behind the building-stock dataset. The source below documents the scope and date of those records."
        : selection?.id === "economy"
          ? "Regional economic data provides the context for the footprint and flow scenarios explored in RaMa-Scene."
          : "",
);

$effect(() => {
  if (!storyHost) return;
  for (const story of storyHost.querySelectorAll<HTMLElement>("[data-project-story]"))
    story.hidden = story.dataset.projectStory !== selectedId;
});

function remember() {
  history.replaceState(
    {
      ...history.state,
      mapReadingScroll: readingPane?.scrollTop ?? 0,
      mapScroll: window.scrollY,
      mapExpanded: expanded,
      mapFocus: (document.activeElement as HTMLElement)?.dataset.nodeId ?? selectedId,
    },
    "",
  );
}

function writeHistory() {
  const url = new URL(window.location.href);
  for (const [key, value] of [
    ["project", selectedProject?.id ?? ""],
    ["context", selection && !selectedProject ? selectedId : ""],
    ["cluster", openGroup],
    ["thread", thread === "circular-data-economy" ? "" : thread || "all"],
  ]) {
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  }
  history.pushState({ mapReadingScroll: 0, mapScroll: originalScroll, mapExpanded: expanded }, "", url);
}

async function restore() {
  const params = new URLSearchParams(location.search);
  thread =
    params.get("thread") === "all"
      ? ""
      : threads.some(([id]) => id === params.get("thread"))
        ? (params.get("thread") ?? "")
        : "circular-data-economy";
  openGroup = params.get("cluster") ?? "";
  const projectId = params.get("project") ?? "";
  const contextId = params.get("context") ?? "";
  selectedId = projects.some((project) => project.id === projectId)
    ? projectId
    : graph(projects, thread, false).nodes.some(
          (node) => node.id === contextId && ["reservoir", "library"].includes(node.kind),
        )
      ? contextId
      : "";
  expanded = history.state?.mapExpanded ?? false;
  await tick();
  if (readingPane) readingPane.scrollTop = history.state?.mapReadingScroll ?? 0;
  window.scrollTo(0, history.state?.mapScroll ?? originalScroll);
  if (selectedId) detailHeading?.focus({ preventScroll: true });
  else if (history.state?.mapFocus)
    document
      .querySelector<HTMLButtonElement>(
        `.map-drawing.${narrowDrawing ? "phone" : "wide"} [data-node-id="${history.state.mapFocus}"]`,
      )
      ?.focus({ preventScroll: true });
  if (compact && selectedId && !expanded) keepSelectedVisible();
}

onMount(() => {
  restore();
  window.addEventListener("popstate", restore);
  return () => window.removeEventListener("popstate", restore);
});

async function openProject(id: string, event?: MouseEvent) {
  remember();
  originalScroll = selection ? originalScroll : window.scrollY;
  if (event) opener = event.currentTarget as HTMLButtonElement;
  selectedId = id;
  writeHistory();
  if (readingPane) readingPane.scrollTop = 0;
  await tick();
  detailHeading?.focus({ preventScroll: true });
  if (compact) keepSelectedVisible();
}

function keepSelectedVisible() {
  if (!selectedId) return;
  const node = document.querySelector<HTMLElement>(`.map-drawing.phone [data-node-id="${selectedId}"]`);
  const sheetTop = readingPane?.getBoundingClientRect().top;
  const nodeBottom = node?.getBoundingClientRect().bottom;
  if (sheetTop !== undefined && nodeBottom !== undefined && nodeBottom > sheetTop - 12)
    window.scrollBy({ top: nodeBottom - sheetTop + 12, behavior: "instant" });
}

async function expandReading() {
  expanded = true;
  await tick();
  detailHeading?.focus({ preventScroll: true });
}

async function showMap() {
  expanded = false;
  await tick();
  readingPane?.querySelector<HTMLButtonElement>(".expand-detail")?.focus({ preventScroll: true });
  keepSelectedVisible();
}

function trapReadingFocus(event: KeyboardEvent) {
  const controls = Array.from(
    readingPane?.querySelectorAll<HTMLElement>(
      'button:not(:disabled), a[href], summary, select, input, textarea, [tabindex]:not([tabindex="-1"])',
    ) ?? [],
  ).filter((element) => element.getClientRects().length > 0);
  const first = controls[0];
  const last = controls.at(-1);
  if (
    event.shiftKey &&
    (document.activeElement === first || !controls.includes(document.activeElement as HTMLElement))
  ) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first?.focus();
  }
}

function choose(node: MapNode, event: MouseEvent) {
  if (node.kind === "group") {
    remember();
    openGroup = openGroup === node.id ? "" : node.id;
    selectedId = "";
    expanded = false;
    writeHistory();
  } else openProject(node.id, event);
}

async function closeDetails() {
  remember();
  const previousId = selectedId;
  selectedId = "";
  openGroup = "";
  expanded = false;
  writeHistory();
  await tick();
  if (compact) window.scrollTo(0, originalScroll);
  const nodes = drawings[narrowDrawing ? 1 : 0].nodes;
  // Outgoing nodes remain in the DOM while fading, but cannot hold restored focus.
  const target =
    nodes.find((node) => node.id === previousId) ?? nodes.find((node) => node.members.includes(previousId));
  const control = document.querySelector<HTMLButtonElement>(
    `.map-drawing.${narrowDrawing ? "phone" : "wide"} [data-node-id="${target?.id}"]`,
  );
  (control ?? opener)?.focus({ preventScroll: true });
}

function changeThread() {
  remember();
  selectedId = "";
  openGroup = "";
  expanded = false;
  writeHistory();
}

$effect(() => {
  if (!compact || !selectedId || expanded) return;
  const width = viewport;
  const project = selectedId;
  tick().then(async () => {
    // FLIP animations start after the layout commits, on the next frame.
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const node = document.querySelector(`.map-drawing.phone [data-node-id="${project}"]`)?.closest("foreignObject");
    await Promise.allSettled(node?.getAnimations().map((animation) => animation.finished) ?? []);
    if (compact && !expanded && viewport === width && selectedId === project) keepSelectedVisible();
  });
});

$effect(() => {
  if (!expanded || !compact) return;
  const previous = document.body.style.overflow;
  const background = Array.from(
    document.querySelectorAll<HTMLElement>(
      ".map-intro, .map-figure, .map-text-alternative, .site-header, .site-footer",
    ),
  );
  const previousInert = background.map((element) => element.inert);
  document.body.style.overflow = "hidden";
  background.forEach((element) => {
    element.inert = true;
  });
  return () => {
    document.body.style.overflow = previous;
    background.forEach((element, index) => {
      element.inert = previousInert[index];
    });
  };
});
</script>

<svelte:window bind:innerWidth={viewport} onkeydown={(event) => { if (event.key === "Escape" && selection) closeDetails(); else if (event.key === "Tab" && compact && expanded) trapReadingFocus(event); }} />

<section class="work-map" class:reading={!!selection} class:unfolded={!!openGroup} aria-labelledby="map-name">
  <div class="map-intro">
    <h1 id="map-name">Connected work</h1>
    <p class="map-mission">{mission}</p>
    {#if !selection}
      <p class="map-invitation">Explore the projects, the ideas they build on, and who they help. Each project opens its story here.</p>
      <button class="start-project" type="button" onclick={() => openProject("r9lab")}>Start with R9lab <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true"><path d="M3 10h13m-5-5 5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.5" /></svg></button>
    {/if}
    <label class="thread-picker">
      <span>Follow a thread</span>
      <select aria-label="Follow a thread" bind:value={thread} onchange={changeThread}>
        {#each threads as [id, title]}<option value={id}>{title}</option>{/each}
      </select>
    </label>
  </div>

  <div class="map-detail" class:detail-expanded={compact && expanded} hidden={!selection} bind:this={readingPane} aria-labelledby="map-detail-title" role={compact && expanded ? "dialog" : "complementary"} aria-modal={compact && expanded ? "true" : undefined}>
    <div class="reading-navigation">
      <button type="button" onclick={closeDetails}><svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true"><path d="m11 4-6 6 6 6M5 10h12" fill="none" stroke="currentColor" stroke-width="1.5" /></svg>Back to map</button>
      {#if compact && expanded}<button type="button" onclick={showMap}>Show the map</button>{/if}
    </div>
    <div class="detail-head" use:revealReading={selectedId}>
      <h2 id="map-detail-title" tabindex="-1" bind:this={detailHeading}>{selection?.label ?? "Project"}</h2>
    </div>
    {#if compact && !expanded}<p class="detail-description">{selectedProject?.description ?? contextDescription}</p>{/if}
    {#if compact && !expanded}<button class="expand-detail" type="button" aria-expanded={expanded} onclick={expandReading}>Read more</button>{/if}
    <div class="reading-body" hidden={compact && !expanded} use:revealReading={selectedId}>
      {#if selectedProject}
        <ul class="detail-actions">
          {#if selectedProject.demo}<li><a href={selectedProject.demo}>Open {selectedProject.title}</a></li>{/if}
          <li><a href={selectedProject.repo}>Source</a></li>
        </ul>
        {#if connections.length}
          <section class="related-projects" aria-labelledby="connections-title">
            <h3 id="connections-title">Connected projects</h3>
            {#each connections as project}
              <button type="button" onclick={() => openProject(project.id)}><span>{project.title}</span><span>{selectedProject.builds_on.includes(project.id) ? "Builds on" : "Used by"}</span><svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true"><path d="M3 10h13m-5-5 5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.5" /></svg></button>
            {/each}
          </section>
        {/if}
      {:else if selection}
        <p class="context-description">{contextDescription}</p>
        {#if selection.stock}
          <p class="context-source">{selection.stock.value} · recorded <time datetime={selection.stock.as_of}>{selection.stock.as_of}</time></p>
        {/if}
        <a class="context-source-link" href={selection.stock?.source ?? selection.href}>Source</a>
        <section class="related-projects" aria-labelledby="context-projects-title">
          <h3 id="context-projects-title">Explore the connected work</h3>
          {#each contextProjects as project}<button type="button" onclick={() => openProject(project.id)}>{project.title}<span>Open project</span></button>{/each}
        </section>
      {/if}
      <div hidden={!selectedProject} bind:this={storyHost}>{@render children?.()}</div>
      {#if selectedProject}
        {#if supportingProjects.length}
          <section class="supporting-projects" aria-labelledby="supporting-title">
            <h3 id="supporting-title">Supporting connections</h3>
            {#each supportingProjects as project}<button type="button" onclick={() => openProject(project.id)}><span>{project.label}</span><span>{project.context}</span></button>{/each}
          </section>
        {/if}
        <a class="project-permalink" href={selectedProject.href}>Open {selectedProject.title} as a page</a>
      {/if}
    </div>
  </div>

  <figure class="map-figure">
      <div class="map-focus-caption" aria-live="polite">
        <h2>{selection ? selectedProject ? `Connected to ${selection.label}` : selection.label : "Explore the work"}</h2>
        <p>{selection ? selectedProject ? "Direct connections lead the way. Supporting tools and one further connection stay in quieter ink. Select a project to follow it." : "Select a connected project to follow its story, or return to the overview to explore everything." : "Projects sit in three contribution lanes. Open a project or unfold a group; use a thread to explore a theme across them."}</p>
      </div>
    {#each drawings as drawing, drawingIndex}
      {@const edges = drawing.edges.filter((edge) => !edge.future || (selection?.kind === "project" && (edge.members.includes(selection.id) || edge.from === selection.id || edge.to === selection.id)))}
      {@const world = drawing.nodes.find((node) => node.kind === "reservoir")}
      {@const people = drawing.nodes.find((node) => node.kind === "role")}
    <svg class="map-drawing" class:phone={drawingIndex === 1} class:wide={drawingIndex === 0} class:focused={!!selection} onpointerover={previewConnection} onpointerout={() => previewId = ""} onfocusin={previewConnection} onfocusout={() => previewId = ""} viewBox={`${cameras[drawingIndex].current.x} ${cameras[drawingIndex].current.y} ${drawing.width + cameras[drawingIndex].current.paddingX} ${cameras[drawingIndex].current.height}`} role="group" aria-label="The metabolism of my work: from the physical world, through libraries and projects, to the people who use them">
      <title>The metabolism of my work</title>
      <defs>
        {#each ["extraction", "builds-on", "tooling", "output", "loop"] as kind}
          <marker id={`map-${drawingIndex}-${kind}`} viewBox="0 0 10 10" refX="8" refY="5" markerUnits="userSpaceOnUse" markerWidth="7" markerHeight="7" orient="auto"><path class={`arrow-tip ${kind}`} d="M1 1 8 5 1 9" /></marker>
        {/each}
      </defs>
      {#if world}<text class="world-label" x="24" y="14">Data from the physical world</text>{/if}
      {#if !selection}<text class="loop-label" x={drawing.width - 14} y="30" text-anchor="end">circular data economy</text>{/if}
      {#if drawing.nodes.some((node) => node.kind === "library")}<text class="world-label" x="24" y={(drawing.nodes.find((n) => n.kind === "library")?.y ?? 100) - 4}>Upstream libraries</text>{/if}
      {#if people}<text class="world-label" x={drawing.downstreamLabel.x} y={drawing.downstreamLabel.y + 18}>Downstream · who uses it</text>{/if}
      <desc>Expand a cluster or follow a thread to reveal projects. Select a project to read its story and explore its connections, or use the project list below.</desc>
      {#if world && people}
        <g class="metabolism-overview" class:subdued={selection?.kind === "project"} aria-hidden="true">
          <path class="metabolism-spine" d={`M18,${world.y + world.height / 2} V${people.y + people.height / 2}`} />
          {#each drawing.bands as band}
            <path class="stage-arrow" d={`m14,${band.y + 4} 4,4 4,-4`} />
          {/each}
          <path class="stage-arrow" d={`m14,${people.y + people.height / 2 - 4} 4,4 4,-4`} />
        </g>
      {/if}
      {#each drawing.bands as band}
        <path class="contribution-lane" d={`M32,${band.y} H${drawing.width - 24}`} />
        <text class="band-label" x="32" y={band.y + 22}>{band.label}</text>
      {/each}
      {#key `${thread}:${openGroup}`}
      {#each edges as edge (edge.id)}
        <path d={edge.path} class={`flow ${edge.kind}`} class:secondary={edge.secondary} class:traced={!!previewId && (edge.from === previewId || edge.to === previewId)} class:project-connection={edge.kind !== "loop"} marker-end={`url(#map-${drawingIndex}-${edge.kind})`} class:future={edge.future} class:muted={edge.kind !== "loop" && !(selection && !edge.secondary && (edge.from === selection.id || edge.to === selection.id))} data-from={edge.from} data-to={edge.to} in:draw={{ delay: reducedMotion ? 0 : 100, duration: reducedMotion ? 0 : edge.kind === "loop" ? 650 : 520, easing: quartOut }} out:fade={{ duration: reducedMotion ? 0 : 240 }} />
      {/each}
      {/key}
      {#if selectedProject && !reducedMotion}
        {#key selectedProject.id}
          <g aria-hidden="true">
            {#each edges.filter((edge) => !edge.future && !edge.secondary && (edge.from === selectedProject.id || edge.to === selectedProject.id)) as edge (edge.id)}
              {@const delay = edge.kind === "output" ? 500 : 260}
              <circle class={`flow-packet ${edge.kind}`} r={edge.kind === "loop" ? 2.8 : 2.4} style={`--packet-delay: ${delay}ms`}>
                <animateMotion path={edge.path} dur="1.4s" begin="indefinite" fill="freeze" use:travel={delay} />
              </circle>
            {/each}
          </g>
        {/key}
      {/if}
      {#each drawing.nodes as node (node.id)}
        <foreignObject class:secondary-context={!!node.context} animate:flip={{ duration: reducedMotion ? 0 : 560, easing: quartOut }} in:fade={{ delay: reducedMotion ? 0 : 100, duration: reducedMotion ? 0 : 320 }} out:fade={{ duration: reducedMotion ? 0 : 260 }} x={node.x} y={node.y} width={node.width} height={node.height}>
          {#if node.kind === "project" || node.kind === "group"}
            <div class="node-content">
            <button type="button" class="map-node" class:folded={node.kind === "group"} class:primary-node={["r9lab", "jsonvet"].includes(node.id)} class:chosen={selection?.id === node.id} class:cluster-open={node.kind === "group" && openGroup === node.id} data-node-id={node.id} aria-pressed={node.kind === "project" ? selection?.id === node.id : undefined} aria-expanded={node.kind === "group" ? openGroup === node.id : undefined} aria-label={node.kind === "group" ? `${node.label}: ${openGroup === node.id ? "fold cluster" : "unfold cluster"}` : `${node.label}: show project details`} aria-describedby={selectedProject && node.kind === "project" && node.id !== selectedId ? `relation-${drawingIndex}-${node.id}` : undefined} onclick={(event) => choose(node, event)}>
              <span class="node-dot" aria-hidden="true">{#if node.kind === "group"}<span class="cluster-mark">{openGroup === node.id ? "−" : "+"}</span>{/if}</span><span class="node-label">{node.label}</span>
            </button>
            {#if selectedProject && node.kind === "project" && node.id !== selectedId}<span class="node-relation" id={`relation-${drawingIndex}-${node.id}`}>{node.context ?? (selectedProject.builds_on.includes(node.id) ? `Used by ${selectedProject.title}` : "Uses this work")}</span>{/if}
            </div>
          {:else if node.kind === "reservoir"}
            <button type="button" class="reservoir" aria-label={`${node.label}: show context`} aria-pressed={selection?.id === node.id} onclick={(event) => openProject(node.id, event)} data-node-id={node.id} data-source={node.stock?.source} data-as-of={node.stock?.as_of}>
              <span>{node.label}</span>
            </button>
          {:else if node.kind === "library"}
            <button type="button" class="library" aria-label={`${node.label}: show context`} aria-pressed={selection?.id === node.id} data-node-id={node.id} onclick={(event) => openProject(node.id, event)}><span class="library-dot" aria-hidden="true"></span>{node.label}</button>
          {:else}
            {@const potential = selectedProject ? edges.some((edge) => edge.to === node.id && edge.future) : node.next}
            <div class="role-node" class:next={potential}><span>{node.label}</span>{#if potential}<span class="role-next">Potential</span>{/if}</div>
          {/if}
        </foreignObject>
      {/each}
    </svg>
    {/each}
    <figcaption>
      <span>{selection?.kind === "project" ? `${selection.label}: its sources, dependencies and users.` : "Physical world → data → software → tools → people. Select a project to read its story and explore its connections."}</span>
      <span class="map-key" aria-label="Flow key">
        <span><i class="key-line extraction"></i>Extraction</span>
        <span><i class="key-line builds-on"></i>Builds on</span>
        <span><i class="key-line output"></i>Serves</span>
        {#if selectedProject && supportingProjects.length}<span><i class="key-line tooling"></i>Supporting connection</span>{/if}
        {#if !selection}<span><i class="key-line loop"></i>Circular data economy</span>{/if}
      </span>
    </figcaption>
  </figure>


</section>

<details class="map-text-alternative" id="work-map-list">
  <summary>Read the project list</summary>
  {#each [["data", "Data"], ["software", "Software"], ["tools-and-apps", "Tools and apps"]] as [layer, label]}
    <h2>{label}</h2>
    <ul>{#each projects.filter((p) => p.layer === layer) as project}<li><a href={project.href}>{project.title}</a><p>{project.description}</p></li>{/each}</ul>
  {/each}
</details>

<style>
  .work-map { display: grid; grid-template-columns: minmax(320px, 38%) minmax(0, 1fr); column-gap: clamp(24px, 4vw, 56px); align-items: start; padding-block: 24px 12px; transition: grid-template-columns 520ms cubic-bezier(0.16, 1, 0.3, 1); }
  .map-intro { grid-column: 1; }
  h1 { font: 400 clamp(34px, 3.1vw, 44px)/1.05 var(--font-sans); letter-spacing: -0.025em; text-wrap: balance; }
  .map-mission { font: 400 clamp(19px, 1.6vw, 23px)/1.5 var(--font-sans); max-width: 35ch; margin-top: 20px; color: var(--ink); }
  .map-invitation { font: 400 17px/1.5 var(--font-sans); max-width: 38ch; color: var(--ink-2); margin-top: 16px; }
  .start-project { display: inline-flex; align-items: center; gap: 16px; min-height: 44px; margin-top: 16px; padding: 8px 0; border: 0; background: transparent; color: var(--river); font: italic 21px/1.3 var(--font-sans); text-decoration: underline; text-underline-offset: 5px; cursor: pointer; }
  .thread-picker { display: grid; gap: 8px; margin-top: 24px; font: italic 16px/1.4 var(--font-sans); }
  .thread-picker > span { color: var(--ink-2); }
  select { width: 100%; min-height: 44px; padding: 8px 24px 8px 0; border: 0; border-bottom: 1px solid var(--river); border-radius: 0; font: 400 18px/1.4 var(--font-sans); color: var(--ink); background: transparent; cursor: pointer; }
  select:focus-visible { outline: 2px solid var(--river); outline-offset: 4px; }
  option { color: var(--ink); background: var(--paper); }
  .map-figure { grid-column: 2; grid-row: 1 / span 3; min-width: 0; width: 100%; margin: 0; }
  .map-drawing { width: 100%; height: calc(100svh - 252px); overflow: visible; }
  .map-focus-caption { min-height: 84px; padding-bottom: 16px; }
  .map-focus-caption h2 { font: italic 26px/1.2 var(--font-sans); }
  .map-focus-caption p { font: 400 16px/1.4 var(--font-sans); color: var(--ink-2); max-width: 65ch; margin-top: 6px; }
  .map-drawing.phone { display: none; }
  .contribution-lane { fill: none; stroke: var(--rule); stroke-width: 0.8; }
  .world-label { font: 400 14px var(--font-draft); fill: var(--ink-2); }
  .loop-label { font: italic 14px var(--font-sans); fill: var(--loop); }
  .arrow-tip { fill: none; stroke-width: 1.2; stroke-linecap: round; stroke-linejoin: round; }
  .band-label { font: 600 15px var(--font-draft); fill: var(--ink); }
  .flow { fill: none; stroke-width: 1.8; stroke-linecap: round; transition: opacity 180ms cubic-bezier(0.16, 1, 0.3, 1), stroke-width 180ms cubic-bezier(0.16, 1, 0.3, 1); }
  .extraction { stroke: var(--river); }
  .flow.extraction { stroke-width: 3; }
  .builds-on { stroke: var(--tech); stroke-width: 1; }
  .tooling { stroke: var(--tech); stroke-width: 1.4; stroke-dasharray: 1 5; }
  .output { stroke: var(--loam); }
  .loop { stroke: var(--loop); stroke-width: 2.6; }
  .flow.future { stroke-dasharray: 3 4; opacity: 0.5; }
  .flow.muted { opacity: 0.32; }
  .flow.extraction.muted { opacity: 0.58; }
  .flow.output.muted { opacity: 0.48; }
  .flow.builds-on.muted { opacity: 0.42; }
  .focused .flow.muted { opacity: 0.16; }
  .focused .flow.secondary { opacity: 0.45; }
  .flow.traced, .focused .flow.traced { opacity: 1; stroke-width: 2.8; }
  .metabolism-spine, .stage-arrow { fill: none; stroke: var(--river); stroke-width: 0.8; opacity: 0.4; }
  .metabolism-overview.subdued { opacity: 0.2; }
  foreignObject { overflow: visible; transition: opacity 240ms ease-out; }
  .map-node, .reservoir, .library, .role-node { box-sizing: border-box; display: flex; width: 100%; height: 100%; align-items: center; justify-content: center; gap: 8px; color: var(--ink); font: italic 17px/1.2 var(--font-sans); text-align: left; }
  .map-node { justify-content: flex-start; padding: 0 0 0 5px; border: 0; background: none; cursor: pointer; text-wrap: balance; border-radius: 2px; }
  .map-node:hover, .map-node:focus-visible, .map-node.chosen { background: var(--sheet); text-decoration: underline; text-underline-offset: 4px; }
  .map-node:focus-visible, a:focus-visible { outline: 2px solid var(--ink); outline-offset: 1px; }
  .map-node:not(.primary-node):not(.folded) .node-dot { margin-left: 4px; }
  .folded .node-dot { margin-left: 6px; }
  .node-label { background: var(--paper); padding-inline: 3px; }
  .node-content { position: relative; width: 100%; height: 100%; }
  .map-node[aria-describedby] .node-label { align-self: flex-start; margin-top: 4px; }
  .node-relation { position: absolute; left: 36px; bottom: 0; font: 400 14px/1.2 var(--font-draft); color: var(--ink-2); background: var(--sheet); padding-inline: 3px; pointer-events: none; }
  .secondary-context .node-label { color: var(--ink-2); }
  .secondary-context .node-dot { border-color: var(--ink-2); outline: none; }
  .focused .map-node { font-size: 19px; }
  .focused .primary-node { font-size: 20px; }
  .wide.focused .world-label { font-size: 22px; }
  .wide.focused .band-label { font-size: 20px; }
  .wide.focused .node-relation { font-size: 18px; }
  .wide.focused .role-node { font-size: 20px; }
  .wide.focused .role-next { font-size: 18px; }
  .phone.focused .map-node { font-size: 16px; }
  .phone.focused .primary-node { font-size: 17px; }
  .phone .node-relation { font-size: 12px; }
  .secondary-context:has(button:hover) .node-label, .secondary-context:has(button:focus-visible) .node-label { color: var(--ink); }
  .node-dot { display: inline-block; width: 18px; height: 18px; background: var(--paper); border: 1.5px solid var(--ink); border-radius: 50%; flex-shrink: 0; }
  .primary-node { padding-left: 5px; gap: 6px; font: 800 18px/1.2 var(--font-draft); }
  .primary-node .node-dot { width: 26px; height: 26px; border-width: 1.5px; outline: 1px solid var(--ink-2); outline-offset: 3px; }
  .node-dot { transition: background-color 180ms ease-out, border-color 180ms ease-out, transform 180ms cubic-bezier(0.16, 1, 0.3, 1); }
  .map-node:hover .node-dot, .map-node:focus-visible .node-dot { border-color: var(--river); background: var(--res); transform: scale(1.12); }
  .chosen .node-dot { background: var(--river); border-color: var(--river); }
  .folded { color: var(--ink-2); font-size: 15px; }
  .folded .node-dot { border-style: dashed; border-color: var(--ink-2); width: 14px; height: 14px; }
  .reservoir { background: transparent; color: var(--ink-2); border: 0; border-bottom: 1px solid var(--eco); border-radius: 0; text-decoration: none; padding: 4px; cursor: pointer; font-size: 16px; }
  .reservoir:hover { text-decoration: underline; }
  .library { justify-content: flex-start; gap: 6px; font-size: 15px; padding-left: 3px; border: 0; background: var(--paper); text-decoration: none; cursor: pointer; }
  .library:hover { text-decoration: underline; }
  .library-dot { display: inline-block; width: 10px; height: 10px; border: 1px solid var(--tech); background: var(--lib); border-radius: 50%; flex-shrink: 0; }
  .role-node { flex-direction: column; gap: 2px; font-size: 16px; background: var(--paper); text-align: center; }
  .role-node.next { color: var(--ink-2); }
  .role-next { font: italic 12px/1 var(--font-sans); }
  figcaption { max-width: none; margin-top: 8px; font: 400 16px/1.5 var(--font-sans); color: var(--ink-2); }
  .map-key { display: flex; flex-wrap: wrap; gap: 6px 16px; margin-top: 8px; }
  .map-key > span { display: flex; align-items: center; gap: 6px; }
  .key-line { display: block; width: 18px; border-top: 1px solid var(--tech); }
  .key-line.extraction { border-color: var(--river); border-top-width: 2px; }
  .key-line.output { border-color: var(--loam); border-top-width: 2px; }
  .key-line.loop { border-color: var(--loop); border-top-width: 3px; }
  .key-line.tooling { border-top-style: dotted; }
  .map-detail { grid-column: 1; margin-top: 24px; min-width: 0; }
  .map-detail { border-top: 1px solid var(--rule); padding-top: 16px; color: var(--ink); }
  .detail-head { display: flex; align-items: start; justify-content: space-between; gap: 8px; }
  .detail-head h2 { font: italic 26px/1.2 var(--font-sans); overflow-wrap: anywhere; }
  .detail-close { display: grid; place-items: center; flex-shrink: 0; width: 44px; height: 44px; padding: 12px; margin-top: -10px; border: 0; color: var(--ink); background: none; cursor: pointer; }
  .detail-description { font: 400 16px/1.5 var(--font-sans); margin-top: 8px; }
  .map-detail h3 { font: 400 13px/1.5 var(--font-draft); margin-top: 16px; }
  .map-detail ul { padding-left: 18px; font-size: 15px; }
  .detail-links { display: flex; flex-wrap: wrap; gap: 0 16px; margin-top: 12px; font: 400 16px/1.4 var(--font-sans); }
  .detail-links a, .group-list a { display: inline-flex; min-height: 44px; align-items: center; }
  .expand-detail { min-height: 44px; padding: 8px 16px; margin-top: 8px; border: 1px solid var(--ink-2); border-radius: 2px; background: none; color: var(--ink); font: italic 17px/1.4 var(--font-sans); cursor: pointer; }
  .map-text-alternative { margin-top: 12px; font: italic 16px/1.5 var(--font-sans); color: var(--ink-2); }
  .map-text-alternative summary { min-height: 44px; cursor: pointer; text-decoration: underline; text-underline-offset: 4px; }
  .map-text-alternative h2 { font-size: 20px; margin-block: 24px 8px; }
  .map-text-alternative ul { list-style: none; }
  .map-text-alternative li { padding-block: 12px; border-bottom: 1px solid var(--rule); }
  .map-text-alternative p { max-width: 50ch; font: 400 16px/1.5 var(--font-sans); }
  .map-detail[hidden], .reading-body[hidden] { display: none; }
  .cluster-mark { display: grid; place-items: center; height: 100%; font: 13px/1 var(--font-sans); }
  .cluster-open .node-dot { border-style: solid; border-color: var(--river); }
  .reading-navigation { position: sticky; top: 0; z-index: 2; background: var(--paper); display: flex; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
  .reading-navigation::before { content: ""; position: absolute; inset: -16px 0 -8px; z-index: -1; background: inherit; pointer-events: none; }
  .reading-navigation button { display: inline-flex; align-items: center; gap: 8px; min-height: 44px; padding: 0; border: 0; background: transparent; color: var(--ink-2); font: italic 16px/1.3 var(--font-sans); cursor: pointer; }
  .detail-head h2:focus { outline: none; }
  .reading-navigation button:hover { color: var(--river); }
  .reading-body { margin-top: 20px; }
  .related-projects { border-block: 1px solid var(--rule); margin-block: 16px 24px; padding-block: 16px; }
  .related-projects h3 { font: italic 23px/1.2 var(--font-sans); margin-block: 0 8px; }
  .related-projects p { font: 400 16px/1.5 var(--font-sans); color: var(--ink-2); }
  .related-projects button { display: flex; align-items: center; width: 100%; min-height: 52px; gap: 12px; padding: 8px 0; border: 0; border-bottom: 1px solid var(--rule); color: var(--ink); background: transparent; font: 18px/1.3 var(--font-sans); text-align: left; cursor: pointer; }
  .related-projects button > span:nth-child(2) { margin-left: auto; font: italic 14px/1.3 var(--font-sans); color: var(--ink-2); }
  .related-projects button:hover { color: var(--river); }
  .related-projects button svg { flex-shrink: 0; transition: transform 160ms cubic-bezier(0.16, 1, 0.3, 1); }
  .related-projects button:hover svg, .related-projects button:focus-visible svg { transform: translateX(3px); }
  .project-permalink { display: inline-flex; align-items: center; min-height: 44px; margin-top: 16px; font: italic 15px/1.4 var(--font-sans); }
  .detail-actions { display: flex; gap: 24px; list-style: none; padding: 0; margin: 0; }
  .detail-actions a, .context-source-link { display: inline-flex; align-items: center; min-height: 44px; font: 400 18px/1.4 var(--font-sans); }
  .context-description { font: 400 18px/1.6 var(--font-sans); }
  .context-source { font: 400 16px/1.5 var(--font-sans); color: var(--ink-2); margin-top: 12px; }
  .work-map.reading { grid-template-columns: minmax(360px, 50%) minmax(0, 1fr); }
  .supporting-projects { margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--rule); }
  .supporting-projects h3 { font: italic 22px/1.3 var(--font-sans); }
  .supporting-projects p { color: var(--ink-2); font-size: 16px; }
  .supporting-projects button { display: flex; align-items: center; justify-content: space-between; gap: 12px; width: 100%; min-height: 44px; padding: 8px 0; color: var(--ink); background: none; border: 0; font: 17px/1.4 var(--font-sans); cursor: pointer; text-align: left; }
  .supporting-projects button span + span { color: var(--ink-2); font-size: 14px; }
  .supporting-projects button:hover { color: var(--river); }
  .reading .map-intro { grid-column: 1; grid-row: 1; }
  .reading h1 { font-size: 28px; }
  .reading .map-mission { display: none; }
  .reading .thread-picker { margin-top: 16px; }

  .reading .map-figure { grid-column: 2; grid-row: 1 / span 3; position: sticky; top: 80px; }
  .reading .map-detail { grid-column: 1; grid-row: 2; position: sticky; top: 104px; max-height: calc(100svh - 284px); margin: 20px 0 0; padding: 12px 12px 24px 0; border-top: 1px solid var(--rule); overflow-y: auto; scrollbar-color: var(--rule) transparent; scrollbar-width: thin; }
  .reading .detail-head h2 { font-size: 40px; }
  .unfolded .map-drawing { height: auto; }
  @media (min-width: 720px) and (max-width: 1079px) {
    .work-map { grid-template-columns: minmax(0, 1fr); }
    .map-intro { display: grid; grid-template-columns: 1fr 1fr; gap: 0 24px; }
    .map-mission { margin-top: 0; }
    .thread-picker { grid-column: 1 / -1; max-width: 360px; margin-top: 12px; }
    .map-figure { grid-column: 1; grid-row: auto; }
    .map-drawing { height: auto; }
    .map-drawing.wide { display: none; }
    .map-drawing.phone { display: block; }
    .work-map, .work-map.reading { grid-template-columns: minmax(300px, 0.9fr) minmax(0, 1.1fr); column-gap: 16px; }
    .map-intro { display: block; }
    .map-figure { grid-column: 2; grid-row: 1 / span 3; }
  }
  @media (max-width: 719px) {
    .work-map, .work-map.reading { display: block; padding-top: 16px; }
    h1, .reading h1 { font-size: 34px; text-wrap: nowrap; }
    .map-mission { font-size: 16px; line-height: 1.45; margin-top: 12px; max-width: 38ch; }
    .reading .map-intro { display: block; padding-bottom: 0; }
    .reading .map-mission { display: block; }
    .thread-picker, .reading .thread-picker { display: grid; grid-template-columns: 82px minmax(0, 1fr); align-items: center; margin-top: 12px; gap: 8px; max-width: none; }
    .reading .thread-picker > span { display: block; }
    .map-node { font-size: 16px; }
    .primary-node { font-size: 16px; }
    .focused .map-node, .focused .primary-node { font-size: 17px; }
    .node-relation { font-size: 12px; }
    .library { font-size: 15px; }
    .role-node { font-size: 14px; }
    .loop-label { font-size: 11px; }
    .thread-picker > span { font-size: 14px; }
    select { font-size: 16px; }
    .map-figure, .reading .map-figure { position: static; margin-top: 12px; }
    .work-map:not(.reading) .map-focus-caption p { display: none; }
    .work-map:not(.reading) .map-focus-caption { min-height: 0; padding-bottom: 8px; }
    .map-drawing, .reading .map-drawing { height: auto; max-height: none; }
    .map-drawing.wide { display: none; }
    .map-drawing.phone { display: block; }
    .map-detail, .reading .map-detail { position: fixed; inset: auto 8px 8px; max-height: 34dvh; margin: 0; padding: 12px 16px 16px; border: 1px solid var(--rule); border-radius: 16px 16px 2px 2px; background: var(--sheet); overflow: auto; z-index: 70; box-shadow: 0 -8px 32px color-mix(in oklch, var(--ink) 8%, transparent); }
    .detail-description { margin-top: 4px; }
    .detail-head h2, .reading .detail-head h2 { font-size: 26px; }
    .reading-navigation { margin-bottom: 4px; background: var(--sheet); }
    .reading .detail-expanded { max-height: calc(100dvh - 32px); height: calc(100dvh - 32px); }
    .detail-expanded .detail-head h2 { font-size: 36px; }
  }
  @media (max-width: 359px) { h1, .reading h1 { font-size: 29px; } }
  .flow-packet { stroke: var(--paper); stroke-width: 1; animation: packet-pass 1400ms linear var(--packet-delay) both; }
  .flow-packet.extraction { fill: var(--river); }
  .flow-packet.builds-on { fill: var(--tech); }
  .flow-packet.output { fill: var(--loam); }
  .flow-packet.loop { fill: var(--loop); }
  @keyframes packet-pass { 0%, 100% { opacity: 0; } 8%, 88% { opacity: 1; } }
  @media (prefers-reduced-motion: reduce) { .work-map { transition: none; } .flow { transition-duration: 100ms; } .node-dot { transition: background-color 100ms ease-out; } .flow-packet { display: none; } .map-node:hover .node-dot, .map-node:focus-visible .node-dot, .related-projects button:hover svg, .related-projects button:focus-visible svg { transform: none; } }
</style>
