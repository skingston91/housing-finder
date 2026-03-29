# Design spec: Area search (phase 1)

**Status:** Implemented (iterate as real data lands).  
**Reference UX:** [Jitty](https://jitty.com/) — clear hero, generous whitespace, trustworthy filters, scannable results.

## Goals

- Let a **single anonymous user** define **budget**, **property type**, **workplace** (label + coordinates), **commute**, **schools**, and **crime weighting**, then see **ranked areas** (not listings yet).
- Make **data limitations** obvious (stub scores, API setup hint) without feeling broken.

## Structure

| Area            | Location                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------ |
| Page shell      | `src/pages/AreaSearchPage/AreaSearchPage.tsx`                                              |
| Criteria form   | `src/pages/AreaSearchPage/AreaSearchCriteriaForm.tsx`                                      |
| Request builder | `src/pages/AreaSearchPage/buildSearchAreasRequest.ts` (`buildAreaSearchCriteria` → domain) |
| Result card     | `src/pages/AreaSearchPage/AreaResultCard.tsx`                                              |
| Results map     | `src/pages/AreaSearchPage/ResultsMap.tsx` (list ↔ map highlight)                           |
| Score bars      | `src/pages/AreaSearchPage/ScoreBar.tsx`                                                    |
| Ports           | `src/adapters/ports.ts` (`AreaDiscoveryPort`, `WorkplaceGeocodePort`)                      |
| HTTP adapters   | `src/adapters/httpAreaDiscovery.ts`, `httpWorkplaceGeocode.ts`                             |
| DTO ↔ domain    | `src/adapters/mapSearchAreasContract.ts`                                                   |
| Client fetch    | `src/services/searchAreasClient.ts`, `geocodeWorkplaceClient.ts`                           |
| Server          | `lambda/search-areas.ts`, `lambda/geocode-workplace.ts`                                    |
| Shared contract | `shared/searchAreasContract.ts`                                                            |

## User flow

1. User adjusts criteria (defaults pre-filled for London demo).
2. **Search areas** → `POST /api/search-areas` with JSON body.
3. **Loading:** spinner + “Ranking areas…”
4. **Success:** results column shows a **map** (workplace + centroids) and **cards**; selecting a card or a map point **highlights** the same area (ring on card, larger/darker circle on map).
5. **Error:** inline alert with server message or validation hint.
6. **Empty (no search yet):** short copy explaining `npm run dev:stack` or `sam local` + Vite proxy for local API.
7. **Optional:** **Fill coordinates from label** → `POST /api/geocode-workplace` (Nominatim; low volume).

## Data and state

- **Local React state** only (no auth): form state (`AreaSearchFormState`), `areas` (domain `RankedArea[]`), `loading`, `error`, `selectedAreaId` (list ↔ map).
- **URL state:** deferred (could sync criteria later for shareable links).

## Visual and UX consistency (Jitty-inspired, light)

- **Background:** page `gray.50`; **panels** white, `rounded="xl"`, light border/shadow.
- **Typography:** large tight heading; **muted** secondary copy via `fg.muted` / `gray.600` where semantic token exists.
- **Primary action:** blue **Search areas** button; full-width form column on mobile.
- **Layout:** two-column **SimpleGrid** on `lg`: criteria left, results right; stack on small screens.
- **Results:** outlined **Card** per area; **Badge** for composite score; human-readable provenance; **details/summary** for numeric score metadata when crime data is present; **info Alert** for shared attribution when results include `dataPoliceUk`.

## UI states

| State   | Treatment                                  |
| ------- | ------------------------------------------ |
| Loading | `Spinner` + short label                    |
| Error   | `Alert` error variant, title + description |
| Empty   | Explanatory text (API / dev setup)         |
| Success | Grid of result cards                       |

## Accessibility

- **Labels:** `aria-label` on inputs; section **Headings** (`h1` page, `h3` per result).
- **Forms:** submit button `type="submit"`; prevent default on container `form`.
- **Alerts:** use Chakra `Alert` with indicator for error recognition.
- **Focus:** native focus order follows visual order; future map must have text alternative.

## Acceptance criteria

- [x] Criteria cover affordability, property types, workplace, commute mode/time, school phases + optional max time, crime window + JSON weights.
- [x] Submit calls `/api/search-areas` with validated JSON; errors surface in UI.
- [x] Results show name, composite score, four breakdown bars, stub metadata.
- [x] Layout is responsive (single column mobile, two column desktop).
- [x] New user sees how to run API locally when results are empty.

## Follow-ups

- Map pane and attribution block (`docs/data-sources.md`).
- Debounce + loading skeletons if criteria become heavy.
- Replace stub metadata with real provenance (Land Registry, police.uk, DfE).
