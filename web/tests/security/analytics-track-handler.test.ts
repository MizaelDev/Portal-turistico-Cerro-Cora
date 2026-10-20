import assert from "node:assert/strict";
import test from "node:test";
import {
  createAnalyticsTrackHandler,
  type AnalyticsEventRecord,
  type AnalyticsTrackDependencies,
} from "../../src/lib/analytics-track-handler";

const validPayload = {
  entityType: "restaurant",
  entityId: "123e4567-e89b-42d3-a456-426614174000",
  eventType: "page_view",
  sourcePath: "/restaurantes/exemplo?utm=teste",
  sessionId: "session_12345678",
};

function createRequest(payload: unknown = validPayload, headers: Record<string, string> = {}) {
  return new Request("http://localhost:3000/api/track", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost:3000",
      "x-forwarded-for": "203.0.113.10",
      ...headers,
    },
    body: JSON.stringify(payload),
  });
}

function setup(overrides: Partial<AnalyticsTrackDependencies> = {}) {
  const inserted: AnalyticsEventRecord[] = [];
  let resolved = 0;
  let rateLimitCalls = 0;
  const dependencies: AnalyticsTrackDependencies = {
    async resolveEntity() {
      resolved += 1;
      return { id: validPayload.entityId, name: "Restaurante Teste", category: "regional" };
    },
    async consumeRateLimit() {
      rateLimitCalls += 1;
      return { allowed: true };
    },
    async insertEvent(record) {
      inserted.push(record);
      return {};
    },
    ...overrides,
  };
  const handler = createAnalyticsTrackHandler(
    { salt: "a".repeat(32), production: false, siteUrl: "http://localhost:3000" },
    dependencies,
  );
  return { handler, inserted, counts: () => ({ resolved, rateLimitCalls }) };
}

test("insere um evento válido somente depois da proteção distribuída", async () => {
  const context = setup();
  const response = await context.handler(createRequest());

  assert.equal(response.status, 200);
  assert.equal(context.inserted.length, 1);
  assert.equal(context.counts().rateLimitCalls, 1);
  assert.match(context.inserted[0]!.ip_hash, /^[a-f0-9]{64}$/);
  assert.equal(context.inserted[0]!.source_path, "/restaurantes/exemplo");
});

test("não consulta nem insere quando o payload é inválido", async () => {
  const context = setup();
  const response = await context.handler(createRequest({ ...validPayload, entityId: "invalido" }));

  assert.equal(response.status, 400);
  assert.equal(context.inserted.length, 0);
  assert.deepEqual(context.counts(), { resolved: 0, rateLimitCalls: 0 });
});

test("falha fechada e não insere quando a RPC de rate limit falha", async () => {
  const context = setup({
    async consumeRateLimit() {
      return { allowed: null, errorCode: "rpc_unavailable" };
    },
  });
  const response = await context.handler(createRequest());

  assert.equal(response.status, 503);
  assert.equal(context.inserted.length, 0);
  assert.equal(context.counts().resolved, 0);
});

test("falha fechada quando a RPC de rate limit lança uma exceção", async () => {
  const context = setup({
    async consumeRateLimit() {
      throw new Error("infraestrutura indisponível");
    },
  });
  const response = await context.handler(createRequest());

  assert.equal(response.status, 503);
  assert.equal(context.inserted.length, 0);
  assert.equal(context.counts().resolved, 0);
});

test("não insere quando o limite distribuído foi excedido", async () => {
  const context = setup({
    async consumeRateLimit() {
      return { allowed: false };
    },
  });
  const response = await context.handler(createRequest());

  assert.equal(response.status, 429);
  assert.equal(context.inserted.length, 0);
});

test("produção exige salt válido e IP fornecido pela Vercel", async () => {
  let insertions = 0;
  const dependencies: AnalyticsTrackDependencies = {
    async resolveEntity() {
      return { id: validPayload.entityId, name: "Teste", category: "teste" };
    },
    async consumeRateLimit() {
      return { allowed: true };
    },
    async insertEvent() {
      insertions += 1;
      return {};
    },
  };

  const missingSalt = createAnalyticsTrackHandler(
    { production: true, salt: "curto", siteUrl: "http://localhost:3000" },
    dependencies,
  );
  assert.equal((await missingSalt(createRequest())).status, 503);

  const missingTrustedIp = createAnalyticsTrackHandler(
    { production: true, salt: "b".repeat(32), siteUrl: "http://localhost:3000" },
    dependencies,
  );
  assert.equal((await missingTrustedIp(createRequest())).status, 503);

  const trustedRequest = createRequest(validPayload, {
    "x-vercel-id": "gru1::example",
    "x-vercel-forwarded-for": "203.0.113.11",
  });
  assert.equal((await missingTrustedIp(trustedRequest)).status, 200);
  assert.equal(insertions, 1);
});
