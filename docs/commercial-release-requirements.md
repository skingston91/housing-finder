# Commercial release requirements (deferred)

The app is built as a **discovery prototype** (anonymous search, serverless Lambdas, optional third-party APIs). **Nothing here is a commitment to implement**—it is a checklist to revisit before **charging customers**, operating at **sustained scale**, or representing results as **professional advice**.

Cross-check [data-sources.md](./data-sources.md) whenever an integration changes.

## Rate limiting and abuse prevention

**Current state (intentionally light):** geocode has a **per-Lambda-instance** IP limit (`GEOCODE_RATE_LIMIT_PER_MINUTE`); search has **no** end-user throttle; TfL and OpenRouteService responses are **cached in memory** per warm container only (not a global quota).

**Likely needs for a commercial product:**

- **Per-client quotas** on API Gateway (usage plans / API keys) or WAF rules, plus **per-IP** and (if you add accounts) **per-user** limits.
- **Shared counters** (e.g. ElastiCache / Redis) so limits survive cold starts and scale horizontally.
- **Budgets** on upstream calls (TfL, ORS, Mapbox, Nominatim): monitor daily/monthly usage, error rates, and **retry/backoff** policies aligned with each provider’s terms.
- **Cost controls** on Lambda concurrency and API Gateway if traffic spikes.

## Secrets and configuration

- Prefer **AWS Secrets Manager** or **SSM Parameter Store** for production keys instead of long-lived plaintext in `template.yaml` / env only.
- **Rotation**, **least-privilege IAM**, and **separate keys** per environment (dev / staging / prod).

## Legal, licensing, and attribution

- Re-read **commercial-use** terms for every provider (TfL, OpenRouteService, Mapbox, Carto basemaps, data.police.uk, any future listing or registry data).
- Keep on-screen and in-metadata **attribution** accurate and complete; add an “About data” or legal page if required.
- **Privacy:** if you log IPs, workplace strings, or analytics, align with GDPR/UK GDPR (lawful basis, retention, DPIA as needed).

## Reliability and observability

- Structured logs, **metrics** (latency, 4xx/5xx, upstream failures), **alarms**, and runbooks.
- Timeouts and **circuit breaking** so one bad dependency does not burn concurrency or user patience.

## Product and compliance

- Scores are **indicative**; commercial positioning may need clearer **disclaimers** (not conveyancing, admissions, or live listings unless licensed).
- **Accessibility** and **security** review appropriate to your threat model (OWASP ASVS level, penetration test if enterprise).

Update this file when you add integrations or change how traffic hits the APIs.
