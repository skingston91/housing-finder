# Housing Finder

London-first **area discovery** for buying a home: combine affordability (price / £/m², property type), commute, schools, and crime signals. Inspired by [Jitty](https://jitty.com/) at the UX level; **no commercial listing API** in phase 1.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Documentation

Start at [docs/README.md](./docs/README.md).

## Stack

- React 19, TypeScript, Vite, Chakra UI v3, Vitest + Testing Library
- Serverless API stubs under [`api/`](./api/) (run with `vercel dev`)

## Agents / standards

Cursor agents and rules live under [`.cursor/`](./.cursor/). Development standards: [`.agentrules/index.md`](./.agentrules/index.md).
