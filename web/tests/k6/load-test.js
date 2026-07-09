import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Rate } from "k6/metrics";

const baseUrl = (__ENV.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const profile = __ENV.PROFILE || "smoke";

const profiles = {
  smoke: {
    executor: "constant-vus",
    vus: 1,
    duration: "45s",
  },
  load: {
    executor: "ramping-vus",
    stages: [
      { duration: "1m", target: 20 },
      { duration: "3m", target: 50 },
      { duration: "1m", target: 0 },
    ],
  },
  stress: {
    executor: "ramping-vus",
    stages: [
      { duration: "2m", target: 50 },
      { duration: "3m", target: 150 },
      { duration: "3m", target: 300 },
      { duration: "2m", target: 0 },
    ],
  },
};

const pages = [
  { name: "home", path: "/", weight: 5 },
  { name: "roteiros", path: "/o-que-fazer", weight: 4 },
  { name: "gastronomia", path: "/gastronomia", weight: 4 },
  { name: "hospedagem", path: "/pousadas", weight: 4 },
  { name: "festival", path: "/festival-de-inverno", weight: 3 },
  { name: "sobre", path: "/sobre-a-cidade", weight: 2 },
  { name: "restaurante_acai", path: "/restaurantes/acai-bistro", weight: 2 },
  { name: "restaurante_aroeiras", path: "/restaurantes/parque-das-aroeiras", weight: 2 },
  { name: "pousada_colina", path: "/pousadas/colina-dos-flamboyants", weight: 2 },
  { name: "pousada_aroeiras", path: "/pousadas/parque-das-aroeiras", weight: 2 },
];

const totalWeight = pages.reduce((total, page) => total + page.weight, 0);
const contentFailures = new Rate("content_failures");
const unexpectedStatus = new Counter("unexpected_status");

export const options = {
  scenarios: {
    site: profiles[profile] || profiles.smoke,
  },
  thresholds: {
    http_req_failed: ["rate<0.02"],
    http_req_duration: ["p(95)<1500", "p(99)<3000"],
    checks: ["rate>0.98"],
    content_failures: ["rate<0.02"],
  },
};

function pickPage() {
  let cursor = Math.random() * totalWeight;

  for (const page of pages) {
    cursor -= page.weight;
    if (cursor <= 0) return page;
  }

  return pages[0];
}

function isHealthyHtml(body) {
  return (
    typeof body === "string" &&
    body.includes("<html") &&
    !body.includes("Application error") &&
    !body.includes("Internal Server Error") &&
    !body.includes("This Serverless Function has crashed")
  );
}

export default function runLoadTest() {
  const page = pickPage();
  const response = http.get(`${baseUrl}${page.path}`, {
    tags: {
      page: page.name,
      profile,
    },
    timeout: "10s",
  });

  const ok = check(response, {
    "status is 200": (res) => res.status === 200,
    "returns healthy html": (res) => isHealthyHtml(res.body),
  });

  if (!ok) {
    unexpectedStatus.add(1, {
      page: page.name,
      status: String(response.status),
    });
  }

  contentFailures.add(ok ? 0 : 1, {
    page: page.name,
  });

  sleep(Math.random() * 2 + 1);
}
