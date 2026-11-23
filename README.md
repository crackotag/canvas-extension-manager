# Canvas Extension Manager — Milestone 1

**Current scope:** prove a Canvas LTI 1.3 launch and show the signed-in user's name and LTI roles. No student requests, Canvas REST API calls, or due-date modifications yet.

## Prerequisites

- Node.js 22+ and npm
- MongoDB running locally at port 27017 (or a hosted MongoDB URL)
- A public HTTPS address/tunnel to local port 3000, e.g. `ngrok http 3000`
- Canvas test environment admin access

## Setup

1. Run `npm install`.
2. Copy `.env.example` to `.env` and set `MONGODB_URL`, the actual Canvas environment authentication endpoints, and `PUBLIC_BASE_URL`. Do **not** commit `.env`.
3. Start MongoDB.
4. Reserve a public HTTPS tunnel hostname (e.g. ngrok static domain). You can start the tunnel even before the app is running.
5. Edit `canvas-lti-key.template.json`: replace *all* occurrences of `YOUR-TUNNEL.example` with your HTTPS tunnel host. Do not put an HTTP URL in the JSON.
6. Canvas test environment → Admin → Developer Keys → + Developer Key → LTI Key → Paste JSON. Paste JSON, save and enable the key.
7. Copy the resulting Canvas **Client ID** into `CANVAS_CLIENT_ID` in `.env`, then start the app with `npm run dev` and run the HTTPS tunnel to port 3000. The server creates the ltijs platform record on first start with the Client ID.
8. Canvas → Admin → Settings → Apps → add tool **By Client ID**; paste the same client ID.
9. Click **Extensions** in Canvas navigation. You should see your name, roles and "Canvas LTI 1.3 launch validated."

## Canvas URLs: important

Instructure-hosted Canvas often uses issuer `https://canvas.instructure.com` **even when your actual Canvas hostname differs**. The authorization endpoint is environment-specific; production may use `https://sso.canvaslms.com/api/lti/authorize_redirect`, while beta/test environments can have other endpoints. Check the Canvas LTI launch documentation and your test instance rather than blindly assuming the production defaults in `.env.example` apply to the test environment.

The code's `getPlatformByUrlAndClientId` lookup prevents duplicate platform registration on restarts. Changing a Canvas client ID causes a new registration. Do not delete or rotate credentials casually.

## Troubleshooting

- **404 after clicking Extensions:** confirm Canvas target/redirect URLs are exactly `https://YOUR-HOST/lti/launch` and your tunnel points to port 3000.
- **Platform not registered:** confirm issuer and Canvas client ID match the platform's actual launch values.
- **OIDC errors:** check auth URL, token URL and JWKS URL for your environment. Capture errors but do not publish tokens or student data.
- **Blank iframe:** try a private session and/or new-window placement while diagnosing browser storage restrictions.
- **MongoDB connection error:** start MongoDB or update `MONGODB_URL`.
- **Role seems wrong:** this milestone only *displays* LTI roles. Never grant approval privileges from global launch roles alone; future build must check per-course teacher enrollments.

## Security and subsequent development

This package is a **test scaffold**, not a production-ready student-data application. Before real use, add authenticated server endpoints, course-by-course authorization, request validation, rate limiting, audit logging, protected storage, FERPA/privacy review, backups, and school-approved API credentials. The email action flow must require an explicit confirmation POST to avoid email link scanners triggering approval.

Milestone 2: secure Canvas REST API read access to list courses, assignment due dates and current per-student overrides; do not build the request database or approval mutation until read access and permissions are verified.

Sources:
- https://developerdocs.instructure.com/services/canvas/external-tools/lti/file.lti_dev_key_config
- https://developerdocs.instructure.com/services/canvas/external-tools/lti/file.lti_launch_overview
- https://github.com/Cvmcosta/ltijs/blob/master/website/guides/getting-started.md
