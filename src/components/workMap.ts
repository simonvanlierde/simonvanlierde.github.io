import { statsSource } from "../data/figures.ts";
import type { ProjectData } from "../data/projectSchema.ts";
import { roleIds } from "../data/projectSchema.ts";
import stats from "../data/stats.json" with { type: "json" };
import { upstream } from "../data/upstream.ts";

export type MapProject = Pick<
  ProjectData,
  | "title"
  | "description"
  | "repo"
  | "demo"
  | "layer"
  | "threads"
  | "builds_on"
  | "tooling"
  | "serves"
  | "could_serve"
  | "extracts"
> & { id: string; href: string };
export interface MapNode {
  id: string;
  label: string;
  kind: "project" | "group" | "library" | "reservoir" | "role";
  x: number;
  y: number;
  width: number;
  height: number;
  members: string[];
  href?: string;
  stock?: { value: string; source: string; as_of: string };
  next?: boolean;
  context?: string;
}
export interface MapEdge {
  id: string;
  from: string;
  to: string;
  kind: "extraction" | "builds-on" | "tooling" | "output" | "loop";
  members: string[];
  future?: boolean;
  secondary?: boolean;
  path: string;
}

const featured = new Set(["cv-ie-taxonomy", "jsonvet", "credit-matrix", "ramascene-explorer", "r9lab"]);
const layers = [
  ["data", "Data"],
  ["software", "Research software"],
  ["tools-and-apps", "Tools and apps"],
] as const;
const columns: Record<string, [number, number]> = {
  "cv-ie-taxonomy": [0, 0],
  "msc-thesis-ie": [1, 1],
  jsonvet: [1, 1],
  monitoring: [1, 1],
  "project-templates": [2, 0],
  "brightway-benchmarks": [1, 1],
  "integrity-checker": [2, 0],
  citesync: [1, 1],
  "codemeta-drift": [2, 0],
  sourceledger: [0, 1],
  r9lab: [0, 0],
  "ramascene-explorer": [2, 1],
  "credit-matrix": [1, 0],
  "6-second-scribbles": [0, 1],
  bikespot: [1, 0],
  "duinlab-today": [2, 1],
  scattergories: [1, 0],
  tide: [2, 1],
  vuurtoren: [0, 0],
  "io-notebook": [2, 0],
  "cml-gallery": [0, 1],
  ai4ie: [1, 1],
};

/** Fold projects without losing their actual dependencies or downstream users. */
export function graph(projects: MapProject[], thread: string, compact: boolean, openGroup = "", selectedId = "") {
  const width = compact ? 360 : 760;
  const left = compact ? 24 : 36;
  const right = compact ? 24 : 32;
  const gap = compact ? 12 : 16;
  const count = compact ? 2 : 3;
  const cell = (width - left - right - gap * (count - 1)) / count;
  const nodes: MapNode[] = [];
  const aliases = new Map<string, string>();
  const selected = projects.find((project) => project.id === selectedId);
  const related = new Set([
    ...(selected?.builds_on ?? []),
    ...projects
      .filter(
        (project) =>
          project.builds_on.includes(selectedId) ||
          project.extracts.some((entry) => entry.reservoir === selectedId) ||
          (selectedId === "products" && project.id === "r9lab"),
      )
      .map((project) => project.id),
  ]);
  const secondary = new Map<string, string>();
  if (selected) {
    for (const neighbor of projects.filter((project) => related.has(project.id))) {
      for (const dependency of neighbor.builds_on)
        if (dependency !== selectedId && !related.has(dependency)) secondary.set(dependency, `Via ${neighbor.title}`);
      for (const dependent of projects.filter((project) => project.builds_on.includes(neighbor.id)))
        if (dependent.id !== selectedId && !related.has(dependent.id))
          secondary.set(dependent.id, `Via ${neighbor.title}`);
    }
    for (const project of projects) {
      if (project.id === selectedId || related.has(project.id)) continue;
      if (selected.tooling.includes(project.id)) secondary.set(project.id, `Tooling for ${selected.title}`);
      else if (project.tooling.includes(selectedId)) secondary.set(project.id, `Uses ${selected.title}`);
    }
  }
  let y = compact ? 60 : 74;
  const rowGap = compact ? 4 : 8;
  const rowEnd = compact ? 8 : 16;
  const projectHeight = selectedId ? 72 : 44;
  const projectStep = projectHeight + rowGap;
  const row = (entries: Omit<MapNode, "x" | "y" | "width" | "height">[], cols: number, height: number) => {
    const size = (width - left - right - gap * (cols - 1)) / cols;
    for (const [i, entry] of entries.entries())
      nodes.push({
        ...entry,
        x: left + (i % cols) * (size + gap),
        y: y + Math.floor(i / cols) * (height + rowGap),
        width: size,
        height,
      });
    y += Math.ceil(entries.length / cols) * (height + rowGap) + rowEnd;
  };
  row(
    (["products", "buildings", "economy"] as const).map((id) => {
      const extract = projects.flatMap((project) => project.extracts).find((entry) => entry.reservoir === id);
      return {
        id,
        label: id === "economy" ? "Economy" : id[0].toUpperCase() + id.slice(1),
        kind: "reservoir" as const,
        members: [],
        ...(id === "products"
          ? { stock: { value: `${stats.totals.teardowns} products`, source: statsSource, as_of: stats.as_of } }
          : extract
            ? {
                stock: {
                  value: `${extract.stock.toLocaleString("en-US")} ${extract.unit}`,
                  source: extract.source,
                  as_of: extract.as_of,
                },
              }
            : {}),
      };
    }),
    3,
    44,
  );
  y += compact ? 20 : 12;
  const dependencies = new Set(projects.flatMap((project) => project.builds_on));
  const libraries = upstream.filter((library) => dependencies.has(library.repo));
  row(
    libraries.map((library) => ({
      id: library.repo,
      label: library.name,
      kind: "library",
      members: [],
      href: `https://github.com/${library.repo}`,
    })),
    compact ? 2 : 3,
    44,
  );
  const bands: { id: string; label: string; y: number; height: number }[] = [];
  for (const [layer, label] of layers) {
    const start = y;
    const rows = Array.from({ length: count }, () => 0);
    const entries: Omit<MapNode, "x" | "y" | "width" | "height">[] = [];
    const folded = new Map<string, MapProject[]>();
    for (const project of projects.filter((entry) => entry.layer === layer)) {
      const duinlab = project.demo && new URL(project.demo).hostname.endsWith(".duinlab.nl");
      const id = duinlab ? "group-duinlab" : `group-${layer}`;
      const visible = featured.has(project.id) || project.threads.includes(thread as ProjectData["threads"][number]);
      if (!visible) folded.set(id, [...(folded.get(id) ?? []), project]);
      if (visible || id === openGroup) {
        aliases.set(project.id, project.id);
        entries.push({
          id: project.id,
          label: project.title,
          kind: "project",
          members: [project.id],
          href: project.href,
        });
      } else {
        aliases.set(project.id, id);
      }
    }
    for (const [id, members] of folded)
      entries.push({
        id,
        label: id === "group-duinlab" ? `duinlab · ${members.length}` : `${label} · ${members.length} more`,
        kind: "group",
        members: members.map((project) => project.id),
      });
    for (const entry of entries) {
      const fixed = columns[entry.id]?.[compact ? 1 : 0];
      const col = fixed ?? rows.indexOf(Math.min(...rows));
      nodes.push({
        ...entry,
        x: left + col * (cell + gap),
        y: start + 34 + rows[col] * projectStep,
        width: cell,
        height: projectHeight,
      });
      rows[col]++;
    }
    const contextRows = selectedId
      ? Math.ceil(
          projects.filter(
            (project) =>
              project.layer === layer &&
              (project.id === selectedId || related.has(project.id) || secondary.has(project.id)),
          ).length / count,
        )
      : 0;
    const height = 34 + Math.max(1, contextRows, ...rows) * projectStep;
    bands.push({ id: layer, label, y: start, height });
    y += height;
  }
  y += compact ? 28 : 36;
  const downstreamLabel = { id: "downstream-label", x: 24, y: y - 24, width: 300, height: 24 };
  y += 8;
  row(
    roleIds.map((id) => ({
      id,
      label: id[0].toUpperCase() + id.slice(1),
      kind: "role",
      members: [],
      next: !projects.some((project) => project.serves.includes(id)),
    })),
    compact ? 3 : 5,
    44,
  );
  if (selectedId) {
    const relevant = new Set([
      selectedId,
      ...related,
      ...secondary.keys(),
      ...(selected?.extracts.map((entry) => entry.reservoir) ?? []),
      ...(selectedId === "r9lab" ? ["products"] : []),
      ...(selected?.serves ?? []),
      ...(selected?.could_serve ?? []),
    ]);
    const focused = nodes.filter((node) => relevant.has(node.id));
    for (const project of projects.filter((entry) => relevant.has(entry.id))) {
      if (focused.some((node) => node.id === project.id)) continue;
      const folded = nodes.find((node) => node.id === aliases.get(project.id));
      const band = bands.find((entry) => entry.id === project.layer);
      if (!folded || !band) throw new Error(`No lane for ${project.id}`);
      const slots = [
        [folded.x, folded.y],
        ...Array.from({ length: Math.round((band.height - 34) / projectStep) }, (_row, rowIndex) =>
          Array.from({ length: count }, (_column, col) => [
            left + col * (cell + gap),
            band.y + 34 + rowIndex * projectStep,
          ]),
        ).flat(),
      ];
      const slot = slots.find(([x, pointY]) => !focused.some((node) => node.x === x && node.y === pointY));
      if (!slot) throw new Error(`No room in ${project.layer} for ${project.id}`);
      focused.push({
        ...folded,
        id: project.id,
        label: project.title,
        kind: "project",
        members: [project.id],
        href: project.href,
        x: slot[0],
        y: slot[1],
      });
      aliases.set(project.id, project.id);
    }
    nodes.splice(0, nodes.length, ...focused);
    for (const node of nodes) if (secondary.has(node.id)) node.context = secondary.get(node.id);
  }
  const firstLibrary = nodes.find((node) => node.kind === "library");
  const captionBounds = [
    { id: "world-caption", x: 24, y: -4, width: 330, height: 28 },
    ...(firstLibrary ? [{ id: "library-caption", x: 24, y: firstLibrary.y - 26, width: 240, height: 28 }] : []),
    ...bands.map((band) => ({ id: `heading-${band.id}`, x: 28, y: band.y + 1, width: 200, height: 28 })),
  ];
  const obstacles = [...nodes, downstreamLabel, ...captionBounds];
  const edges: MapEdge[] = [];
  const byId = new Map(nodes.map((node) => [node.id, node]));
  type Point = [number, number];
  const clear = (points: Point[], ignored: string[]) =>
    points.slice(1).every(([x, pointY], index) => {
      const [previousX, previousY] = points[index];
      return obstacles.every(
        (node) =>
          ignored.includes(node.id) ||
          (x === previousX
            ? x <= node.x ||
              x >= node.x + node.width ||
              Math.max(previousY, pointY) <= node.y ||
              Math.min(previousY, pointY) >= node.y + node.height
            : pointY <= node.y ||
              pointY >= node.y + node.height ||
              Math.max(previousX, x) <= node.x ||
              Math.min(previousX, x) >= node.x + node.width),
      );
    });
  const gutters = Array.from({ length: count + 1 }, (_, index) => left + index * (cell + gap) - gap / 2);
  const add = (from: string, to: string, kind: MapEdge["kind"], member: string, future = false) => {
    from = aliases.get(from) ?? from;
    to = aliases.get(to) ?? to;
    if (from === to || !byId.has(from) || !byId.has(to)) return;
    const id = `${kind}:${from}:${to}${future ? ":future" : ""}`;
    const previous = edges.find((edge) => edge.id === id);
    if (previous) {
      if (!previous.members.includes(member)) previous.members.push(member);
      return;
    }
    const source = byId.get(from) as MapNode;
    const target = byId.get(to) as MapNode;
    const port = (node: MapNode) => {
      if (node.kind === "project" || node.kind === "group") return node.x + 18;
      if (node.kind === "library") return node.x + 8;
      return node.x + node.width / 2;
    };
    const radius = (node: MapNode) => (node.kind === "group" ? 7 : ["r9lab", "jsonvet"].includes(node.id) ? 13 : 9);
    const sx = port(source);
    const tx = port(target);
    const downward = target.y >= source.y;
    const sy =
      source.kind === "reservoir"
        ? source.y + source.height
        : source.y + source.height / 2 + (downward ? 1 : -1) * (source.kind === "library" ? 6 : radius(source));
    const ty =
      target.kind === "role" ? target.y : target.y + target.height / 2 + (downward ? -1 : 1) * (radius(target) + 3);
    const step = ((downward ? 1 : -1) * rowGap) / 2;
    const start: Point = [sx, sy];
    const end: Point = [tx, ty];
    const direct: Point[][] = [
      [start, [sx, ty - step], [tx, ty - step], end],
      [start, [sx, sy + step], [tx, sy + step], end],
    ];
    const preferred = kind === "output" ? source : target;
    const lanes = gutters.toSorted(
      (a, b) => Math.abs(a - preferred.x - preferred.width) - Math.abs(b - preferred.x - preferred.width),
    );
    const candidates: Point[][] = lanes.map((lane) => [
      start,
      [sx, sy + step],
      [lane, sy + step],
      [lane, ty - step],
      [tx, ty - step],
      end,
    ]);
    for (const departure of [sy + step, downward ? source.y + source.height + rowGap / 2 : source.y - rowGap / 2]) {
      for (const approach of [ty - step, downward ? target.y - rowGap / 2 : target.y + target.height + rowGap / 2]) {
        for (const lane of lanes)
          candidates.push([start, [sx, departure], [lane, departure], [lane, approach], [tx, approach], end]);
      }
    }
    if (kind === "extraction") {
      for (const outside of [24, width - 4]) {
        for (const lane of lanes)
          candidates.push([
            start,
            [sx, sy + step],
            [outside, sy + step],
            [outside, bands[0].y - 4],
            [lane, bands[0].y - 4],
            [lane, ty - step],
            [tx, ty - step],
            end,
          ]);
      }
    }
    const length = (route: Point[]) =>
      route
        .slice(1)
        .reduce(
          (total, [x, pointY], index) => total + Math.abs(x - route[index][0]) + Math.abs(pointY - route[index][1]),
          0,
        );
    const ignored = [from, to];
    const points =
      direct.find((route) => clear(route, ignored)) ??
      candidates.filter((route) => clear(route, ignored)).sort((a, b) => length(a) - length(b))[0];
    const mid = (sy + ty) / 2;
    const curve = `M${sx},${sy} C${sx},${mid} ${tx},${mid} ${tx},${ty}`;
    const pointClear = (x: number, py: number) =>
      obstacles.every(
        (node) =>
          ignored.includes(node.id) ||
          x <= node.x - 0.1 ||
          x >= node.x + node.width + 0.1 ||
          py <= node.y - 0.1 ||
          py >= node.y + node.height + 0.1,
      );
    const curveClear = Array.from({ length: 321 }, (_, i) => {
      const t = i / 320,
        u = 1 - t;
      return [
        u * u * u * sx + 3 * u * u * t * sx + 3 * u * t * t * tx + t * t * t * tx,
        u * u * u * sy + 3 * u * u * t * mid + 3 * u * t * t * mid + t * t * t * ty,
      ];
    }).every(([x, py]) => pointClear(x, py));
    if (!points && !curveClear && kind !== "loop") throw new Error(`No clear route for ${id}`);
    const rounded = (route: Point[]) => {
      let d = `M${route[0].join(",")}`;
      for (let i = 1; i < route.length - 1; i++) {
        const [px, py] = route[i - 1],
          [x, py2] = route[i],
          [nx, ny] = route[i + 1];
        let bend = Math.min(18, Math.hypot(x - px, py2 - py) / 2, Math.hypot(nx - x, ny - py2) / 2);
        const ax = x - Math.sign(x - px) * bend,
          ay = py2 - Math.sign(py2 - py) * bend;
        const bx = x + Math.sign(nx - x) * bend,
          by = py2 + Math.sign(ny - py2) * bend;
        if (
          !Array.from({ length: 51 }, (_, j) => {
            const t = j / 50,
              u = 1 - t;
            return pointClear(u * u * ax + 2 * u * t * x + t * t * bx, u * u * ay + 2 * u * t * py2 + t * t * by);
          }).every(Boolean)
        )
          bend = 0;
        d += ` L${x - Math.sign(x - px) * bend},${py2 - Math.sign(py2 - py) * bend} Q${x},${py2} ${x + Math.sign(nx - x) * bend},${py2 + Math.sign(ny - py2) * bend}`;
      }
      return `${d} L${route.at(-1)?.join(",")}`;
    };
    const loopX = width - 6,
      loopTop = 36;
    const loopBottom =
      Math.max(...nodes.filter((node) => node.kind === "role").map((node) => node.y + node.height)) + 4;
    const reservoirX = target.x + target.width / 2;
    const exitY = source.y + source.height + 2;
    const exitLane = source.x + source.width + gap / 2;
    const loopRoute: Point[] = [
      [sx, source.y + source.height - 2],
      ...(source.y + source.height < loopBottom - 4
        ? ([
            [sx, exitY],
            [exitLane, exitY],
            [exitLane, loopBottom],
          ] as Point[])
        : ([[sx, loopBottom]] as Point[])),
      [loopX, loopBottom],
      [loopX, loopTop],
      [reservoirX, loopTop],
      [reservoirX, target.y - 3],
    ];
    const path = kind === "loop" ? rounded(loopRoute) : curveClear ? curve : rounded(points as Point[]);
    edges.push({ id, from, to, kind, members: member ? [member] : [], ...(future ? { future: true } : {}), path });
  };
  for (const project of projects) {
    for (const dependency of project.builds_on) add(dependency, project.id, "builds-on", project.id);
    if (selectedId && (project.id === selectedId || project.tooling.includes(selectedId)))
      for (const tool of project.tooling) add(tool, project.id, "tooling", project.id);
    for (const extract of project.extracts) add(extract.reservoir, project.id, "extraction", project.id);
    if (project.id === "r9lab" && !project.extracts.some((extract) => extract.reservoir === "products"))
      add("products", project.id, "extraction", project.id);
    for (const role of project.serves) add(project.id, role, "output", project.id);
    for (const role of project.could_serve)
      if (!project.serves.includes(role)) add(project.id, role, "output", project.id, true);
  }
  add("researchers", "products", "loop", "");
  const visibleEdges = selectedId
    ? edges.filter(
        (edge) =>
          edge.kind !== "loop" &&
          (edge.from === selectedId ||
            edge.to === selectedId ||
            (edge.kind === "builds-on" &&
              (related.has(edge.from) || related.has(edge.to)) &&
              (secondary.has(edge.from) || secondary.has(edge.to)))),
      )
    : edges;
  for (const edge of visibleEdges)
    if (selectedId) edge.secondary = edge.kind === "tooling" || (edge.from !== selectedId && edge.to !== selectedId);
  const visibleIds = new Set([selectedId, ...visibleEdges.flatMap((edge) => [edge.from, edge.to])]);
  return {
    width,
    height: y,
    nodes: selectedId ? nodes.filter((node) => visibleIds.has(node.id)) : nodes,
    edges: visibleEdges,
    bands,
    downstreamLabel,
    captionBounds,
  };
}
