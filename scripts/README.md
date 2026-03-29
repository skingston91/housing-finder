# Scripts

## Schools (GIAS / Get Information about Schools)

1. Download the official **establishments** CSV from [Get Information about Schools — Downloads](https://www.get-information-schools.service.gov.uk/Downloads) (OGL).
2. Run:

```bash
npm run ingest:gias -- /path/to/downloaded.csv
```

This overwrites `shared/schools/londonStateSchoolEstablishmentSample.ts` (default output path). Optional second argument sets a different output file.

The script (`ingest-gias-establishments.mjs`) keeps **open** schools, drops independents where columns allow, filters to a **Greater London** bounding box, maps **phase** labels to `primary` / `secondary` / `sixth_form`, and uses **Latitude/Longitude** or **Easting/Northing** (OSGB → WGS84). A tiny sample CSV lives under `scripts/fixtures/` for smoke-testing the parser.
