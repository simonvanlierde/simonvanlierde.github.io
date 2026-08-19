import assert from "node:assert/strict";
import { test } from "node:test";
import { CvSchema } from "../../src/data/cvSchema.ts";

// The minimum a public export must carry. Every test below starts here and
// breaks one thing, so a passing suite says the contract still bites.
const minimal = () => ({
  basics: {
    name: "S. van Lierde",
    headline: "PhD researcher",
    location: "Leiden",
    links: {
      linkedin: "https://linkedin.com/in/x",
      github: "https://github.com/x",
      website: "https://example.com",
    },
  },
  profile: "One paragraph.",
  experience: [{ organization: "CML", role: "Researcher", start: "2024-04", end: "present" }],
  education: [{ institution: "TU Delft", degree: "MSc", start: 2018, end: 2021 }],
});

test("a minimal export parses, and every optional section defaults to empty", () => {
  const cv = CvSchema.parse(minimal());
  assert.deepEqual(cv.skills, []);
  assert.deepEqual(cv.publications, []);
  assert.deepEqual(cv.projects, []);
  assert.deepEqual(cv.professional_development, []);
  assert.deepEqual(cv.interests, []);
  assert.equal(cv.basics.email, undefined);
  assert.equal(cv.exported, undefined);
});

test("a dropped required section fails the build rather than rendering empty", () => {
  for (const key of ["basics", "profile", "experience", "education"]) {
    const broken = minimal();
    delete (broken as Record<string, unknown>)[key];
    assert.throws(() => CvSchema.parse(broken), new RegExp(key, "i"), `${key} must be required`);
  }
});

test("a malformed date is rejected, not rendered as `undefined 2024`", () => {
  const bad = minimal();
  bad.experience[0].start = "2024-13";
  assert.throws(() => CvSchema.parse(bad));
});

test("bare years, `YYYY-MM` and `present` are all accepted", () => {
  const cv = CvSchema.parse(minimal());
  assert.equal(cv.experience[0].end, "present");
  // YAML types a bare year as a number; it must survive as a string.
  assert.equal(cv.education[0].start, "2018");
});

test("a malformed email or link fails rather than rendering a dead mailto", () => {
  const base = minimal();
  assert.throws(() => CvSchema.parse({ ...base, basics: { ...base.basics, email: "not-an-address" } }));

  const badLink = minimal();
  badLink.basics.links.github = "github.com/x";
  assert.throws(() => CvSchema.parse(badLink));
});

test("the export stamp accepts a UTC or an offset timestamp, and rejects a bare date", () => {
  assert.equal(CvSchema.parse({ ...minimal(), exported: "2026-08-18T23:33:49Z" }).exported, "2026-08-18T23:33:49Z");
  assert.ok(CvSchema.parse({ ...minimal(), exported: "2026-08-18T23:33:49+02:00" }).exported);
  assert.throws(() => CvSchema.parse({ ...minimal(), exported: "2026-08-18" }));
});
