# Clean Code — Reference and Examples

## Names: Good vs Bad

```typescript
// Bad: vague, no intent
const d = 86400000;
function getData() { ... }

// Good: intent and scope clear
const MILLISECONDS_PER_DAY = 86400000;
function getActiveUserGames(userId: string) { ... }
```

## Functions: One Level of Abstraction

```typescript
// Bad: mixes policy and detail
function createGame(event: Event) {
  const body = JSON.parse(event.body ?? '{}');
  if (!body.title) return { statusCode: 400 };
  const id = crypto.randomUUID();
  const item = { pk: `GAME#${id}`, sk: 'META', gameId: id, title: body.title };
  await dynamo.send(new PutItemCommand({ TableName: TABLE, Item: marshall(item) }));
  return { statusCode: 201, body: JSON.stringify({ id }) };
}

// Better: policy at top, details in helpers
function createGame(event: Event) {
  const body = parseBody<CreateBody>(event);
  if (!body?.title?.trim()) return jsonResponse(400, { error: 'title required' });
  const id = crypto.randomUUID();
  await putCatalogItem(id, { title: body.title.trim() });
  return jsonResponse(201, { id });
}
```

## Comments: Prefer Code

```typescript
// Bad: comment restates code
// Check if user is active
if (user.status === 'active') { ... }

// Good: name carries the meaning
if (user.isActive()) { ... }
```

## Error Handling

```typescript
// Bad: swallow or ignore
try {
  await externalApi.call();
} catch (e) {}

// Good: log and rethrow or return controlled response
try {
  return await externalApi.call();
} catch (err) {
  const message = err instanceof Error ? err.message : 'Unknown error';
  console.error('External API failed:', message);
  return jsonResponse(503, { error: 'Service unavailable' });
}
```

## Tests: Readable and Focused

```typescript
// Bad: many concerns, magic data
it('works', () => {
  const r = handler({ body: '{"x":1}', path: '/games', ... });
  expect(r.statusCode).toBe(201);
  expect(JSON.parse(r.body).id).toBeDefined();
  expect(mockDynamo.send).toHaveBeenCalled();
});

// Good: one concept, clear setup
it('returns 201 and creates game when body has title', async () => {
  const event = createEvent({ method: 'POST', path: '/games', body: JSON.stringify({ title: 'Hollow Knight' }) });
  const res = asResult(await handler(event));
  expect(res.statusCode).toBe(201);
  const body = JSON.parse(res.body ?? '{}');
  expect(body.id).toMatch(UUID_REGEX);
  expect(body.title).toBe('Hollow Knight');
});
```
