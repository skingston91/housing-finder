import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';

import { parseSearchAreasRequestBody } from '../shared/parseSearchAreasRequestBody';
import { buildRankedAreas } from '../shared/rankAreas/buildRankedAreas';
import { resolveSecretString } from '../shared/secrets/apiSecrets';

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
  return jsonResponse(200, { areas });
};
