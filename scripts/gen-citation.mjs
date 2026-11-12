import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parse } from "yaml";
import { personName } from "../src/data/personName.ts";
import { acquireMetadataLock, generateMetadata, metadataRoot, publishMetadata } from "./metadata.mjs";

await acquireMetadataLock();

const pkg = JSON.parse(await readFile(resolve(metadataRoot, "package.json"), "utf8"));
const cv = parse(await readFile(resolve(metadataRoot, "src/data/cv-public.yaml"), "utf8"));
const generated = await generateMetadata({
  kind: "site",
  metadata: {
    "@context": "https://w3id.org/codemeta/3.0",
    "@type": "SoftwareSourceCode",
    name: pkg.name,
    description: pkg.description,
    version: pkg.version,
    codeRepository: `${cv.basics.links.github}/simonvanlierde.github.io`,
    author: [{ "@type": "Person", "@id": cv.basics.links.orcid, ...personName(cv.basics.name) }],
  },
});
await publishMetadata(generated.files);
