# Scripts

## Schools (GIAS / Get Information about Schools)

To replace the hand-maintained sample in `shared/schools/londonStateSchoolEstablishmentSample.ts` with a fuller London extract:

1. Download the official **establishments** CSV from [Get Information about Schools — Downloads](https://www.get-information-schools.service.gov.uk/Downloads) (OGL).
2. Filter rows to Greater London local authorities and columns you need (URN, name, phase, coordinates if present).
3. Emit a TypeScript or JSON module matching `LondonSchoolSeed` (`latitude`, `longitude`, `phases`) and point `LONDON_SCHOOL_POINTS_FOR_RANKING` at it.

A small Node ingest script can be added here later; keep coordinates and phase mappings auditable.
