import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';

import { parseSearchAreasRequestBody } from '../shared/parseSearchAreasRequestBody';
import { buildRankedAreas } from '../shared/rankAreas/buildRankedAreas';
import { resolveSchoolsPerformanceAcademicYearForMetadata } from '../shared/schools/resolveSchoolsPerformanceAcademicYearForMetadata';
import { resolveSecretString } from '../shared/secrets/apiSecrets';
import { validateSearchAreasRoutingKeys } from '../shared/searchAreas/validateSearchAreasRoutingKeys';

import { jsonResponse } from './http';

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const method = event.requestContext.http.method;
  if (method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  let raw: unknown;
  try {
    raw = event.body ? (JSON.parse(event.body) as unknown) : undefined;
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON body' });
  }

  const parsed = parseSearchAreasRequestBody(raw);
  if (!parsed.ok) {
    return jsonResponse(400, { error: parsed.error });
  }

  const tflAppKey = await resolveSecretString('TFL_APP_KEY');
  const orsApiKey = await resolveSecretString('ORS_API_KEY');
  const routingStrict = process.env.SEARCH_AREAS_ROUTING_STRICT?.trim() === '1';
  const routingError = validateSearchAreasRoutingKeys(
    parsed.value,
    tflAppKey,
    orsApiKey,
    routingStrict,
  );
  if (routingError !== null) {
    return jsonResponse(400, { error: routingError });
  }
  const useLiveUkhpiMedians = process.env.UKHPI_LIVE?.trim() !== '0';
  const routing =
    (tflAppKey !== undefined && tflAppKey !== '') || (orsApiKey !== undefined && orsApiKey !== '')
      ? {
          ...(tflAppKey ? { tfl: { appKey: tflAppKey } as const } : {}),
          ...(orsApiKey ? { openRouteService: { apiKey: orsApiKey } as const } : {}),
        }
      : undefined;
  const areas = await buildRankedAreas(parsed.value, globalThis.fetch, {
    ...routing,
    useLiveUkhpiMedians,
  });
  const tflFallbackAreas = areas.filter(
    (a) => a.metadata?.commuteModel === 'tfl-fallback-straight-line',
  ).length;
  const tflNationalSearchOk = areas.filter(
    (a) => a.metadata?.commuteTflNationalSearchUsed === 1,
  ).length;
  if (areas.length > 0) {
    const meta = areas[0]?.metadata;
    console.info(
      JSON.stringify({
        component: 'search_areas',
        event: 'ranked',
        areaCount: areas.length,
        schoolsModel: meta?.schoolsModel,
        schoolsPerformanceAcademicYear: resolveSchoolsPerformanceAcademicYearForMetadata(),
        schoolsPerformanceCoveragePct: meta?.schoolsPerformanceCoveragePct,
        schoolsPointsMatchedByUrn: meta?.schoolsPointsMatchedByUrn,
        schoolsPointsWithUrn: meta?.schoolsPointsWithUrn,
        candidateMode: meta?.candidateMode,
        policeUk: meta?.policeUk,
        affordabilityPriceSource: meta?.affordabilityPriceSource,
        tflFallbackAreas,
        tflNationalSearchOkAreas: tflNationalSearchOk,
      }),
    );
  }
  return jsonResponse(200, { areas });
};
