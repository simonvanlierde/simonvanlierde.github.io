# Font sources

These WOFF2 files are Latin subsets of the SIL Open Font License 1.1 fonts
distributed by [Google Fonts](https://github.com/google/fonts/tree/c30b221beb0c1da59d563feb91ec8656a1fa972a/ofl).
Each family’s complete licence is beside its font files.

| File | Weight and style | Bytes |
| --- | --- | ---: |
| `schibsted-grotesk-latin-400.woff2` | 400 normal | 25,972 |
| `schibsted-grotesk-latin-800.woff2` | 800 normal | 26,992 |
| `newsreader-latin-400.woff2` | 400 normal, optical size 16 | 23,636 |
| `newsreader-latin-400-italic.woff2` | 400 italic, optical size 16 | 25,616 |
| `atlas-mono-latin-400.woff2` | 400 normal | 15,992 |

Total: 118,208 bytes. All five fonts are static instances.

## Upstream files

Paths below are relative to `ofl/` at commit
`c30b221beb0c1da59d563feb91ec8656a1fa972a` in the Google Fonts repository.

| Source | Version | SHA-256 |
| --- | --- | --- |
| `schibstedgrotesk/SchibstedGrotesk[wght].ttf` | 1.100 | `6ceeadf6be8e1fd7687011c7fa38ed0edd1abe967a0b73d97caec183552e823d` |
| `newsreader/Newsreader[opsz,wght].ttf` | 1.003 | `8a08d13f8a6c0d51be379a60af84f945f65369a67e509ee3c3bdcc421254d7c1` |
| `newsreader/Newsreader-Italic[opsz,wght].ttf` | 1.003 | `796668611f80b64d5adf182fde3b6f29ed83b4e7cbec7b96937e84ac01364792` |
| `ibmplexmono/IBMPlexMono-Regular.ttf` | 2.3 | `6a3412f058c7d8dfd9170c41e85ade48e5156ecb89356110ca57a0a27734af46` |

Upstream projects: [Schibsted Grotesk](https://github.com/schibsted/schibsted-grotesk),
[Newsreader](https://github.com/productiontype/Newsreader),
[IBM Plex](https://github.com/IBM/plex).
Atlas Mono is a subset of IBM Plex Mono. Its internal family and PostScript names
were changed because the licence reserves the name “Plex”. Copyright and licence
records remain intact.

## Subset settings

Built with fontTools 4.68.0 (`fonttools[woff]`). Variable axes were pinned with
`fontTools.varLib.instancer.instantiateVariableFont` before subsetting: Schibsted
`wght=400` or `800`; Newsreader `wght=400, opsz=16`. Hinting is retained.
The subsetter retains all layout features (`layout_features=['*']`), all name IDs,
all name languages and legacy names, then saves with `flavor='woff2'`.

Requested Unicode coverage, limited to glyphs present upstream:

```text
U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+2074,U+20AC,U+2122,U+2190-2199,U+2212,U+2265,U+FEFF,U+FFFD
```

Schibsted and Atlas Mono include `→`, `↗` and `≥`. Newsreader has no arrow glyphs;
render arrows in the grotesque or mono family. Latin Extended characters outside
this range, Greek and Cyrillic need another subset or the system fallback.
Schibsted and Newsreader retain `tnum`; Atlas Mono’s digits have equal advances.
