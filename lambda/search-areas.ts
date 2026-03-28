import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';

import { parseSearchAreasRequestBody } from '../shared/parseSearchAreasRequestBody';
import { buildRankedAreas } from '../shared/rankAreas/buildRankedAreas';

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

  const areas = await buildRankedAreas(parsed.value, globalThis.fetch);
  return jsonResponse(200, { areas });
};
