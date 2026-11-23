import 'dotenv/config';
import { Provider, IdTokenValidationMethod } from 'ltijs';

function required(key: string): string {
  const value = process.env[key];
  if (!value || value === 'REPLACE_ME') throw new Error(`Missing ${key} in .env`);
  return value;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]!);
}

const provider = new Provider({
  database: { url: required('MONGODB_URL') },
  server: { port: Number(process.env.PORT ?? 3000) },
});

provider.onResourceLink(async (context, _request, response) => {
  const user = context.idToken.user;
  const name = escapeHtml(user.name ?? 'Canvas user');
  const roles = user.roles.map((role) => role.split('#').pop() ?? role);
  const rolesHtml = roles.map((role) => `<li>${escapeHtml(role)}</li>`).join('');

  // Proof-of-authentication only; NOT a source of permissions for approvals.
  response.html(`<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Extensions | Canvas</title>
<style>
body{font:16px system-ui,sans-serif;background:#f6f8fa;color:#1e293b;margin:0;padding:3rem 1rem}
main{max-width:700px;background:white;margin:auto;padding:2rem;border:1px solid #dce2e8;border-radius:14px}
small{color:#64748b}.status{background:#edf7ef;border-radius:6px;padding:.7rem 1rem}
</style></head><body><main>
<small>Canvas Extension Manager · LTI prototype</small>
<h1>Welcome, ${name}</h1>
<p class="status">✓ Canvas LTI 1.3 launch validated.</p>
<p><strong>Roles reported by Canvas:</strong></p><ul>${rolesHtml}</ul>
<p><strong>LTI user ID:</strong> ${escapeHtml(user.id)}</p>
<p><small>Next milestone: retrieve actual course enrollments and display assignments.</small></p>
</main></body></html>`);
});

async function main(): Promise<void> {
  await provider.listen();
  const issuer = required('CANVAS_ISSUER');
  const clientId = required('CANVAS_CLIENT_ID');
  const existing = await provider.platformManager.getPlatformByUrlAndClientId(issuer, clientId);
  if (!existing) {
    await provider.platformManager.registerPlatform({
      url: issuer,
      clientId,
      name: 'Canvas Test',
      authenticationEndpoint: required('CANVAS_AUTH_URL'),
      accessTokenEndpoint: required('CANVAS_TOKEN_URL'),
      idTokenValidation: {
        method: IdTokenValidationMethod.JwkSet,
        key: required('CANVAS_JWKS_URL'),
      },
    });
    console.log('Canvas LTI platform registered.');
  }
  console.log('Canvas Extension Manager is ready.');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
