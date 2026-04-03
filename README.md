# Housing Finder

London-first **area discovery** for buying a home: combine affordability (price / £/m², property type), commute, schools, and crime signals. Inspired by [Jitty](https://jitty.com/) at the UX level; **no commercial listing API** in phase 1.

## Quick start

```bash
npm install
sam build
npm run dev:stack
```

Open [http://localhost:5173](http://localhost:5173). (`dev:stack` runs the **SAM local API** on port 3000 and **Vite** together; Docker + [SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html) required.)

After changing Lambdas or `template.yaml`, run **`npm run sam:build`**, or **`npm run verify:sam`** to run **`npm run verify`** (lint, format, types, tests, Vite build), then **`npm run verify:data`** (DfE performance manifest quality gate; skips when no ingested school performance rows), then **`npm run sam:build`**.

Front-end only (no `/api`): `npm run dev` — you will see proxy errors for search until `npm run sam:local` is running separately.

## Documentation

Start at [docs/README.md](./docs/README.md). Design specs live under [docs/design/](docs/design/). Deploy checklist: [docs/production-readiness.md](./docs/production-readiness.md).

## Stack

- React 19, TypeScript, Vite, Chakra UI v3, Vitest + Testing Library
- AWS Lambda API under [`lambda/`](./lambda/) — local run with **SAM** (`npm run sam:local`; see [docs/infrastructure/aws-sam.md](./docs/infrastructure/aws-sam.md))

## Agents / standards

Cursor agents and rules live under [`.cursor/`](./.cursor/). Development standards: [`.agentrules/index.md`](./.agentrules/index.md).
