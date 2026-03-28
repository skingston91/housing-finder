import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';

import { geocodeWithNominatim } from '../shared/geocoding/nominatim';
import { parseGeocodeRequestBody } from '../shared/parseGeocodeRequestBody';

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

  const parsed = parseGeocodeRequestBody(raw);
  if (!parsed.ok) {
    return jsonResponse(400, { error: parsed.error });
  }

  try {
    const hit = await geocodeWithNominatim(parsed.value.q, globalThis.fetch);
    if (!hit) {
      return jsonResponse(404, { error: 'No results for that query' });
    }
    return jsonResponse(200, {
      latitude: hit.latitude,
      longitude: hit.longitude,
      displayName: hit.displayName,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Geocoding failed';
    return jsonResponse(502, { error: msg });
  }
};
