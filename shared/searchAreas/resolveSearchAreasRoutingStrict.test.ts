import { afterEach, describe, expect, it } from 'vitest';

import { resolveSearchAreasRoutingStrict } from './resolveSearchAreasRoutingStrict';

describe('resolveSearchAreasRoutingStrict', () => {
  const prevSam = process.env.AWS_SAM_LOCAL;
  const prevStrict = process.env.SEARCH_AREAS_ROUTING_STRICT;

  afterEach(() => {
    if (prevSam === undefined) {
      delete process.env.AWS_SAM_LOCAL;
    } else {
      process.env.AWS_SAM_LOCAL = prevSam;
    }
    if (prevStrict === undefined) {
      delete process.env.SEARCH_AREAS_ROUTING_STRICT;
    } else {
      process.env.SEARCH_AREAS_ROUTING_STRICT = prevStrict;
    }
  });

  it('is always true when not running under SAM local', () => {
    delete process.env.AWS_SAM_LOCAL;
    delete process.env.SEARCH_AREAS_ROUTING_STRICT;
    expect(resolveSearchAreasRoutingStrict()).toBe(true);
    process.env.SEARCH_AREAS_ROUTING_STRICT = '0';
    expect(resolveSearchAreasRoutingStrict()).toBe(true);
  });

  it('follows SEARCH_AREAS_ROUTING_STRICT when SAM local', () => {
    process.env.AWS_SAM_LOCAL = 'true';
    delete process.env.SEARCH_AREAS_ROUTING_STRICT;
    expect(resolveSearchAreasRoutingStrict()).toBe(false);
    process.env.SEARCH_AREAS_ROUTING_STRICT = '0';
    expect(resolveSearchAreasRoutingStrict()).toBe(false);
    process.env.SEARCH_AREAS_ROUTING_STRICT = '1';
    expect(resolveSearchAreasRoutingStrict()).toBe(true);
  });
});
