#!/usr/bin/env node
/**
 * Ingest MHCLG **domestic EPC** open data via the official search API and emit
 * `shared/sizeFit/londonBoroughEpcMedianFloorM2.generated.ts` with **median total floor area (m²)**
 * per London borough (app slug) and {@link PropertyTypeDto} bucket.
 *
 * **Auth** (HTTP Basic: base64(`email:api-key`)):
 *   EPC_EMAIL — account email
 *   EPC_API_KEY — API key from https://epc.opendatacommunities.org/
 *
 *   EPC_BASIC_TOKEN — optional; if set, used as full Base64 token (overrides email+key)
 *
 * Usage:
 *   EPC_EMAIL=you@example.com EPC_API_KEY=secret npm run ingest:epc-london-medians
 *
 * **Keep aligned** with `shared/sizeFit/epcCertificateRowClassification.ts` (row → property type).
 * OGL / MHCLG terms apply — do not misrepresent register coverage.
 */
import { parse } from 'csv-parse/sync';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '../shared/sizeFit/londonBoroughEpcMedianFloorM2.generated.ts');

/** London borough slug → ONS local authority code (LAMA), same set as `londonBoroughMedians.ts`. */
const BOROUGHS = [
  ['barking-dagenham', 'E09000002'],
  ['barnet', 'E09000003'],
  ['bexley', 'E09000004'],
  ['brent', 'E09000005'],
  ['bromley', 'E09000006'],
  ['camden', 'E09000007'],
  ['croydon', 'E09000008'],
  ['ealing', 'E09000009'],
  ['greenwich', 'E09000011'],
  ['hackney', 'E09000012'],
  ['hammersmith-fulham', 'E09000013'],
  ['haringey', 'E09000014'],
  ['harrow', 'E09000015'],
  ['havering', 'E09000016'],
  ['hillingdon', 'E09000017'],
  ['hounslow', 'E09000018'],
  ['islington', 'E09000019'],
  ['kensington-chelsea', 'E09000020'],
  ['kingston', 'E09000021'],
  ['lambeth', 'E09000022'],
  ['lewisham', 'E09000023'],
  ['merton', 'E09000024'],
  ['newham', 'E09000025'],
  ['redbridge', 'E09000026'],
  ['richmond', 'E09000027'],
  ['southwark', 'E09000028'],
  ['sutton', 'E09000029'],
  ['tower-hamlets', 'E09000030'],
  ['waltham-forest', 'E09000031'],
  ['wandsworth', 'E09000032'],
  ['westminster', 'E09000033'],
];

const APP_TYPES = ['flat', 'terraced', 'semi_detached', 'detached', 'bungalow'];
const MIN_SAMPLE = 20;

/** Dedupe certificates that appear in more than one API slice (e.g. house built-form bungalow vs property-type bungalow). */
const createSeenSetsPerSlug = () =>
  Object.fromEntries(
    BOROUGHS.map(([slug]) => [slug, Object.fromEntries(APP_TYPES.map((pt) => [pt, new Set()]))]),
  );

const norm = (v) =>
  String(v ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

const terracedBuilt = new Set([
  'mid-terrace',
  'end-terrace',
  'enclosed mid-terrace',
  'enclosed end-terrace',
  'terrace',
]);

/** Mirror `epcDomesticRowMatchesPropertyType` in TS. */
const rowMatches = (row, propertyType) => {
  const prop = norm(row.PROPERTY_TYPE ?? row['property-type']);
  const built = norm(row.BUILT_FORM ?? row['built-form']).replace(/_/g, '-');
  switch (propertyType) {
    case 'flat':
      return prop === 'flat' || prop === 'maisonette';
    case 'terraced':
      return prop === 'house' && terracedBuilt.has(built);
    case 'semi_detached':
      return prop === 'house' && built === 'semi-detached';
    case 'detached':
      return prop === 'house' && built === 'detached';
    case 'bungalow':
      return prop === 'bungalow' || (prop === 'house' && built.includes('bungalow'));
    default:
      return false;
  }
};

const floorArea = (row) => {
  const raw = row.TOTAL_FLOOR_AREA ?? row['total-floor-area'];
  if (raw === undefined || raw === null || raw === '') {
    return null;
  }
  const n = typeof raw === 'number' ? raw : Number.parseFloat(String(raw));
  if (!Number.isFinite(n) || n <= 0 || n > 2500) {
    return null;
  }
  return n;
};

const median = (nums) => {
  if (nums.length === 0) {
    return null;
  }
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  const v = s.length % 2 === 1 ? s[m] : (s[m - 1] + s[m]) / 2;
  return Math.round(v * 100) / 100;
};

const authHeader = () => {
  const pre = process.env.EPC_BASIC_TOKEN?.trim();
  if (pre) {
    return `Basic ${pre}`;
  }
  const email = process.env.EPC_EMAIL?.trim();
  const key = process.env.EPC_API_KEY?.trim();
  if (!email || !key) {
    throw new Error('Set EPC_EMAIL and EPC_API_KEY, or EPC_BASIC_TOKEN (base64 of email:api-key).');
  }
  const token = Buffer.from(`${email}:${key}`, 'utf8').toString('base64');
  return `Basic ${token}`;
};

async function fetchDomesticCsvChunk(url) {
  const res = await fetch(url, {
    headers: { Accept: 'text/csv', Authorization: authHeader() },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`EPC HTTP ${String(res.status)} ${t.slice(0, 200)}`);
  }
  const text = await res.text();
  const next = res.headers.get('x-next-search-after');
  return { text, nextSearchAfter: next && next.length > 0 ? next : null };
}

async function fetchAllRowsForQuery(baseParams) {
  const rows = [];
  let searchAfter = null;
  let first = true;
  do {
    const u = new URL('https://epc.opendatacommunities.org/api/v1/domestic/search');
    for (const [k, v] of baseParams) {
      u.searchParams.append(k, v);
    }
    u.searchParams.set('size', '5000');
    if (searchAfter) {
      u.searchParams.set('search-after', searchAfter);
    }
    const { text, nextSearchAfter } = await fetchDomesticCsvChunk(u.href);
    let body = text;
    if (!first && body.length > 0) {
      body = body.split('\n').slice(1).join('\n');
    }
    first = false;
    if (body.trim().length > 0) {
      const chunk = parse(body, {
        columns: true,
        skip_empty_lines: true,
        relax_column_count: true,
      });
      rows.push(...chunk);
    }
    searchAfter = nextSearchAfter;
  } while (searchAfter !== null);
  return rows;
}

async function main() {
  const generatedIso = new Date().toISOString();
  /** @type {Record<string, Record<string, number[]>>} */
  const acc = {};
  for (const [slug] of BOROUGHS) {
    acc[slug] = { flat: [], terraced: [], semi_detached: [], detached: [], bungalow: [] };
  }
  const seenPerSlug = createSeenSetsPerSlug();

  const lmkOf = (row) => {
    const k = String(row.LMK_KEY ?? row['lmk-key'] ?? '').trim();
    return k.length > 0 ? k : null;
  };

  const pushSample = (slug, pt, row, area) => {
    const key = lmkOf(row) ?? `anon:${String(area)}:${norm(row.ADDRESS ?? row['address'] ?? '')}`;
    const set = seenPerSlug[slug][pt];
    if (set.has(key)) {
      return;
    }
    set.add(key);
    acc[slug][pt].push(area);
  };

  for (const [slug, la] of BOROUGHS) {
    process.stderr.write(`Borough ${slug} (${la})…\n`);

    const houseRows = await fetchAllRowsForQuery([
      ['local-authority', la],
      ['property-type', 'house'],
    ]);
    for (const row of houseRows) {
      const a = floorArea(row);
      if (a === null) {
        continue;
      }
      for (const pt of ['terraced', 'semi_detached', 'detached', 'bungalow']) {
        if (rowMatches(row, pt)) {
          pushSample(slug, pt, row, a);
        }
      }
    }

    const flatRows = [
      ...(await fetchAllRowsForQuery([
        ['local-authority', la],
        ['property-type', 'flat'],
      ])),
      ...(await fetchAllRowsForQuery([
        ['local-authority', la],
        ['property-type', 'maisonette'],
      ])),
    ];
    for (const row of flatRows) {
      const a = floorArea(row);
      if (a === null || !rowMatches(row, 'flat')) {
        continue;
      }
      pushSample(slug, 'flat', row, a);
    }

    const bungalowRows = await fetchAllRowsForQuery([
      ['local-authority', la],
      ['property-type', 'bungalow'],
    ]);
    for (const row of bungalowRows) {
      const a = floorArea(row);
      if (a === null || !rowMatches(row, 'bungalow')) {
        continue;
      }
      pushSample(slug, 'bungalow', row, a);
    }
  }

  /** @type {Record<string, Record<string, { medianM2: number; certificateCount: number }>>} */
  const out = {};
  for (const [slug] of BOROUGHS) {
    out[slug] = {};
    for (const pt of APP_TYPES) {
      const arr = acc[slug][pt];
      if (arr.length >= MIN_SAMPLE) {
        const med = median(arr);
        if (med !== null) {
          out[slug][pt] = { medianM2: med, certificateCount: arr.length };
        }
      }
    }
  }

  const ts = `/**
 * Machine-written by npm run ingest:epc-london-medians from MHCLG EPC Open Data
 * (https://epc.opendatacommunities.org/). Do not hand-edit medians. OGL — follow EPC terms.
 *
 * When empty, resolveTypicalFloorM2ForBorough falls back to heuristicTypicalFloorM2.ts.
 */
import type { PropertyTypeDto } from '../searchAreasContract';

export interface EpcMedianFloorCell {
  readonly medianM2: number;
  readonly certificateCount: number;
}

/** ISO timestamp (UTC) of last successful ingest. */
export const LONDON_EPC_MEDIAN_GENERATED_ISO: string | null = ${JSON.stringify(generatedIso)};

export const LONDON_BOROUGH_EPC_MEDIAN_M2: Readonly<
  Record<string, Partial<Readonly<Record<PropertyTypeDto, EpcMedianFloorCell>>>>
> = Object.freeze(${JSON.stringify(out, null, 2)}) as Readonly<
  Record<string, Partial<Readonly<Record<PropertyTypeDto, EpcMedianFloorCell>>>>
>;
`;

  writeFileSync(OUT, ts, 'utf8');
  process.stderr.write(`Wrote ${OUT}\n`);
}

main().catch((e) => {
  process.stderr.write(String(e?.stack ?? e) + '\n');
  process.exit(1);
});
