import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';

import { jsonResponse } from './http';

export const handler: APIGatewayProxyHandlerV2 = async () =>
  jsonResponse(200, { ok: true, service: 'housing-finder-api' });
