# Scripts

## Schools (GIAS / Get Information about Schools)

1. Download the official **establishments** CSV from [Get Information about Schools — Downloads](https://www.get-information-schools.service.gov.uk/Downloads) (OGL).
2. Run:

```bash
npm run ingest:gias -- /path/to/downloaded.csv
```

This overwrites `shared/schools/londonStateSchoolEstablishmentSample.ts` (default output path). Optional second argument sets a different output file.

The script (`ingest-gias-establishments.mjs`) keeps **open** schools, drops independents where columns allow, filters to a **Greater London** bounding box, maps **phase** labels to `primary` / `secondary` / `sixth_form`, emits **`urn`** when a URN column is present, and uses **Latitude/Longitude** or **Easting/Northing** (OSGB → WGS84). A tiny sample CSV lives under `scripts/fixtures/` for smoke-testing the parser.

## Schools (DfE performance tables — CSV)

1. Download institution-level CSVs from [Find school performance data](https://www.find-school-performance-data.service.gov.uk/download-data) or [Explore education statistics](https://explore-education-statistics.service.gov.uk/) (Key Stage 2 / 4 releases — OGL-style open data; confirm attribution for your product).
2. Run one or more inputs (last argument optional `.ts` output path). Set the **academic year** label for metadata/UI (recommended):

```bash
npm run ingest:dfe -- --academic-year 2023/24 /path/to/ks4.csv /path/to/ks2.csv
```

If you omit `--academic-year`, the script tries to infer a label from **filenames** (e.g. `…2023-24…`, `…2023_24…`, `…2023-2024…`).

This overwrites `shared/schools/londonSchoolPerformanceByUrn.ts` by default and also generates `shared/schools/londonSchoolPerformanceManifest.ts`.

- URN map module emits **`LONDON_SCHOOL_PERFORMANCE_ACADEMIC_YEAR`** (used in API metadata `schoolsPerformanceAcademicYear` and UI provenance).
- Manifest module emits source and quality counters (`rowsIn`, `rowsWithUrn`, `rowsMapped`, `rowsDroppedNoMappedScore`, candidate unmapped metric columns).

The script maps **Progress 8**-style averages to `secondary` / `sixth_form` and **KS2 “expected standard”**-style percentage columns to `primary` (see `scripts/ingest-dfe-performance.mjs` for column heuristics). Pair with a GIAS ingest that includes **URN** so `mergePerformanceIntoSchoolSeeds` can attach scores to ranking points.

Smoke (inference from filename): `npm run ingest:dfe -- scripts/fixtures/dfe-ks4-2023-24-sample.csv scripts/fixtures/dfe-ks2-sample.csv /tmp/londonSchoolPerformanceByUrn.ts`

Quality gate (reads generated JSON manifest, exits non-zero on bad thresholds):

```bash
npm run check:dfe-manifest
```

`npm run verify:data` runs the same check. **`npm run verify:sam`** runs `verify`, then **`verify:data`**, then `sam build` so deploy prep includes the gate.

If the manifest JSON is missing or `rowsWithUrn` is 0 (no DfE ingest yet), the check **exits 0** with `skipped: true` in stderr JSON.

Optional thresholds:

```bash
npm run check:dfe-manifest -- --min-coverage 50 --max-dropped-no-mapped-pct 40 --path shared/schools/londonSchoolPerformanceManifest.json
```

**Runtime note:** ingested school coordinates and performance are **bundled** into the API build—there are no live DfE HTTP calls per search. Ranking metadata exposes join quality (`schoolsPointsMatchedByUrn`, `schoolsPointsWithUrn`, `schoolsPerformanceCoveragePct`) so low-coverage releases are visible during QA.
