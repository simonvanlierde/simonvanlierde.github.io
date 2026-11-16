import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";
import { parse } from "yaml";
import { graph, type MapProject } from "../../src/components/workMap.ts";
import { ProjectSchema, threadIds } from "../../src/data/projectSchema.ts";
import stats from "../../src/data/stats.json" with { type: "json" };

const dir = resolve(import.meta.dirname, "../../src/content/projects");
const projects: MapProject[] = readdirSync(dir)
  .filter((name) => name.endsWith(".md"))
  .map((name) => {
    const id = name.slice(0, -3);
    const data = ProjectSchema.parse(parse(readFileSync(resolve(dir, name), "utf8").split(/^---$/m)[1]));
    return { id, ...data, href: `/projects/${id}/` };
  });

for (const compact of [false, true]) {
  test(`supporting context is explicit and never inferred from shared audiences (${compact})`, () => {
    const map = graph(projects, "circular-data-economy", compact, "", "r9lab");
    assert.equal(map.nodes.find((node) => node.id === "jsonvet")?.context, "Tooling for R9lab");
    assert.equal(map.nodes.find((node) => node.id === "monitoring")?.context, "Tooling for R9lab");
    assert.ok(map.edges.some((edge) => edge.kind === "tooling" && edge.from === "jsonvet" && edge.to === "r9lab"));
    assert.ok(!map.nodes.some((node) => node.id === "group-duinlab" || node.id === "bikespot"));
    const chain = graph(
      projects.map((project) => (project.id === "cv-ie-taxonomy" ? { ...project, builds_on: ["citesync"] } : project)),
      "circular-data-economy",
      compact,
      "",
      "r9lab",
    );
    assert.equal(chain.nodes.find((node) => node.id === "citesync")?.context, "Via cv-ie-taxonomy");
    assert.ok(!chain.nodes.some((node) => node.id === "codemeta-drift"));
  });

  test(`all thread layouts preserve projects and touch targets (${compact ? "phone" : "wide"})`, () => {
    const positions = new Map<string, number>();
    for (const thread of ["", ...threadIds]) {
      const map = graph(projects, thread, compact);
      assert.equal(map.width, compact ? 360 : 760);
      const ids = new Set(map.nodes.map((node) => node.id));
      const members = map.nodes
        .filter((node) => ["project", "group"].includes(node.kind))
        .flatMap((node) => node.members);
      assert.deepEqual(members.toSorted(), projects.map((project) => project.id).toSorted());
      for (const project of projects.filter((entry) => entry.threads.some((id) => id === thread))) {
        assert.ok(ids.has(project.id), `${thread} unfolds ${project.id}`);
      }
      for (const node of map.nodes) {
        assert.ok(node.height >= 44 && node.width >= 44, node.id);
        assert.ok(node.x >= 0 && node.x + node.width <= map.width, node.id);
        assert.ok(node.y >= 0 && node.y + node.height <= map.height, node.id);
        for (const other of map.nodes.filter((entry) => entry.id !== node.id)) {
          assert.ok(
            node.x + node.width <= other.x ||
              other.x + other.width <= node.x ||
              node.y + node.height <= other.y ||
              other.y + other.height <= node.y,
            `${thread}: ${node.id} overlaps ${other.id}`,
          );
        }
      }
      for (const node of map.nodes.filter((entry) => entry.kind === "project")) {
        assert.equal(node.x, positions.get(node.id) ?? node.x, `${node.id} keeps its column`);
        positions.set(node.id, node.x);
      }
      for (const edge of map.edges) {
        assert.ok(ids.has(edge.from) && ids.has(edge.to), edge.id);
        assert.notEqual(edge.from, edge.to);
        assert.ok(!/NaN|undefined/.test(edge.path), edge.id);
        let x = 0,
          y = 0;
        for (const segment of edge.path.matchAll(/([MLCQ])([^MLCQ]+)/g)) {
          const v = segment[2]
            .trim()
            .split(/[,\s]+/)
            .map(Number);
          if (segment[1] === "M") {
            [x, y] = v;
            continue;
          }
          const startX = x,
            startY = y;
          for (let i = 1; i <= 100; i++) {
            const t = i / 100,
              u = 1 - t;
            if (segment[1] === "C") {
              x = u ** 3 * startX + 3 * u ** 2 * t * v[0] + 3 * u * t ** 2 * v[2] + t ** 3 * v[4];
              y = u ** 3 * startY + 3 * u ** 2 * t * v[1] + 3 * u * t ** 2 * v[3] + t ** 3 * v[5];
            } else if (segment[1] === "Q") {
              x = u ** 2 * startX + 2 * u * t * v[0] + t ** 2 * v[2];
              y = u ** 2 * startY + 2 * u * t * v[1] + t ** 2 * v[3];
            } else {
              x = u * startX + t * v[0];
              y = u * startY + t * v[1];
            }
            for (const node of [...map.nodes, map.downstreamLabel, ...map.captionBounds].filter(
              (n) => n.id !== edge.from && n.id !== edge.to,
            )) {
              assert.ok(
                x <= node.x + 0.01 ||
                  x >= node.x + node.width - 0.01 ||
                  y <= node.y + 0.01 ||
                  y >= node.y + node.height - 0.01,
                `${thread}: ${edge.id} crosses ${node.id} at ${x},${y}`,
              );
            }
          }
        }
      }
      assert.equal(new Set(map.edges.map((edge) => edge.id)).size, map.edges.length);
    }
  });
}

test("folds real duinlab hosts and keeps the flagships visible", () => {
  const map = graph(projects, "", false);
  const duinlab = map.nodes.find((node) => node.id === "group-duinlab");
  assert.ok(duinlab);
  assert.equal(duinlab.members.length, 5);
  assert.ok(!duinlab.members.includes("vuurtoren"));
  for (const id of ["r9lab", "cv-ie-taxonomy", "jsonvet", "credit-matrix", "ramascene-explorer"]) {
    assert.equal(map.nodes.find((node) => node.id === id)?.kind, "project");
  }
});

test("stocks retain their sources and dates and are never added across units", () => {
  const map = graph(projects, "circular-data-economy", false);
  const products = map.nodes.find((node) => node.id === "products");
  assert.deepEqual(products?.stock, {
    value: `${stats.totals.teardowns} products`,
    source: "https://api.r9lab.io/v1/stats/totals",
    as_of: stats.as_of,
  });
  for (const id of ["buildings", "economy"]) {
    const extract = projects.flatMap((project) => project.extracts).find((entry) => entry.reservoir === id);
    assert.ok(extract);
    assert.deepEqual(map.nodes.find((node) => node.id === id)?.stock, {
      value: `${extract.stock.toLocaleString("en-US")} ${extract.unit}`,
      source: extract.source,
      as_of: extract.as_of,
    });
  }
  assert.ok(map.edges.some((edge) => edge.from === "products" && edge.to === "r9lab" && edge.kind === "extraction"));
});

test("only actual dependencies and role declarations produce edges", () => {
  const map = graph(projects, "open-and-fair-research-software", false);
  assert.ok(
    map.edges.some((edge) => edge.from === "cv-ie-taxonomy" && edge.to === "r9lab" && edge.kind === "builds-on"),
  );
  for (const edge of map.edges.filter((entry) => entry.kind === "output")) {
    for (const id of edge.members) {
      const project = projects.find((entry) => entry.id === id);
      assert.ok(project);
      assert.ok((edge.future ? project.could_serve : project.serves).some((role) => role === edge.to));
    }
  }
  const built = graph(projects, "built-to-scale-and-last", false);
  assert.ok(!built.edges.some((edge) => edge.from === "monitoring" && edge.to === "r9lab"));
  assert.ok(
    map.nodes
      .filter((node) => node.kind === "role" && node.next)
      .every((role) => !projects.some((project) => project.serves.some((id) => id === role.id))),
  );
});

test("the atlas uses curved flows and a rounded return loop", () => {
  const map = graph(projects, "circular-data-economy", false);
  assert.ok(map.edges.some((edge) => edge.kind !== "loop" && edge.path.includes("C")));
  assert.ok(map.edges.filter((edge) => edge.kind === "loop").every((edge) => edge.path.includes("Q")));
});

for (const compact of [false, true]) {
  test(`focused maps distinguish primary relationships from declared supporting context (${compact})`, () => {
    const overview = graph(projects, "circular-data-economy", compact);
    for (const id of [...projects.map((project) => project.id), "products", "buildings", "economy", "IndEcol/pymrio"]) {
      const drawing = graph(projects, "circular-data-economy", compact, "", id);
      assert.ok(drawing.height >= overview.height, `${id} makes room for context`);
      assert.deepEqual(
        drawing.bands.map((band) => band.id),
        overview.bands.map((band) => band.id),
      );
      assert.ok(
        drawing.nodes.some((node) => node.id === id),
        id,
      );
      const neighbors = new Set([id]);
      for (const edge of drawing.edges) {
        assert.notEqual(edge.kind, "loop");
        const justified = !edge.secondary
          ? edge.from === id || edge.to === id
          : edge.kind === "tooling"
            ? projects.find((project) => project.id === edge.to)?.tooling.includes(edge.from)
            : drawing.nodes.some((node) => node.context && (node.id === edge.from || node.id === edge.to));
        assert.ok(justified, edge.id);
        neighbors.add(edge.from);
        neighbors.add(edge.to);
      }
      assert.deepEqual(new Set(drawing.nodes.map((node) => node.id)), neighbors);
    }
    const r9lab = graph(projects, "circular-data-economy", compact, "", "r9lab");
    assert.ok(r9lab.nodes.some((node) => node.id === "cv-ie-taxonomy" && node.kind === "project"));
    assert.ok(!r9lab.nodes.some((node) => node.id === "group-duinlab" || node.id === "bikespot"));
  });

  test(`direct project arrivals and unfolded clusters keep routable connections (${compact})`, () => {
    for (const project of projects) {
      const drawing = graph(projects, "circular-data-economy", compact, "", project.id);
      assert.equal(drawing.nodes.find((node) => node.id === project.id)?.kind, "project");
    }
    for (const cluster of ["group-software", "group-duinlab", "group-tools-and-apps"]) {
      const drawing = graph(projects, "circular-data-economy", compact, cluster);
      const group = drawing.nodes.find((node) => node.id === cluster);
      assert.ok(group?.members.every((id) => drawing.nodes.some((node) => node.id === id && node.kind === "project")));
    }
  });
}
