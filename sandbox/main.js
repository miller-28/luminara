// Simple sandbox/demo for local development only.
// Import the core client class and run a demo request using a tiny browser driver.
import { LuminaraClient } from "../src/core/luminara.js";

const out = document.getElementById("out");
const btn = document.getElementById("run");

function log(...args) {
  out.textContent = args.map(a => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' ');
}

btn.addEventListener('click', async () => {
  try {
    
    log('creating client with browser driver...');

    // lightweight browser driver that uses fetch directly (no ofetch dependency).
    const BrowserDriver = () => ({
      async request(opts) {
        const { url, method = 'GET', headers, body, signal } = opts;
        const res = await fetch(url, { method, headers, body, signal });
        const contentType = res.headers.get('content-type') || '';
        const isJson = contentType.includes('application/json');
        const data = isJson ? await res.json() : await res.text();
        return { status: res.status, headers: res.headers, data };
      }
    });

    const client = new LuminaraClient(BrowserDriver());

    // Attach small plugin that adds a header and logs the lifecycle
    client.use({
      onRequest(req) {
        req.headers = { ...(req.headers || {}), 'X-Sandbox': '1' };
        console.info('[sandbox] onRequest', req);
        return req;
      },
      onSuccess(res) {
        console.info('[sandbox] onSuccess', res);
        return res;
      },
      onError(err, req) {
        console.error('[sandbox] onError', err, req);
      }
    });

    log('sending request to jsonplaceholder.typicode.com...');
    const res = await client.get('https://jsonplaceholder.typicode.com/todos/1');
    log('response status:', res.status, '\ndata:', res.data);
  } catch (err) {
    log('error:', err && err.message || err);
  }
});
