// Cloudflare Worker Proxy - patches fetch for India access
const SUPABASE_URL = "https://ffyhmewrruvhvwqkmvop.supabase.co";
const WORKER_URL = "https://charbhuja-proxy.deepseekhacks.workers.dev";

function rep(u: string): string {
  return u ? u.split(SUPABASE_URL).join(WORKER_URL) : u;
}

const _fetch = window.fetch.bind(window);
window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  if (typeof input === "string") {
    input = rep(input);
  } else if (input instanceof URL) {
    input = new URL(rep(input.href));
  } else if (input instanceof Request) {
    const newUrl = rep(input.url);
    if (newUrl !== input.url) {
      input = new Request(newUrl, {
        method: input.method,
        headers: input.headers,
        body: input.body,
        mode: input.mode,
        credentials: input.credentials,
        cache: input.cache,
        redirect: input.redirect,
        referrer: input.referrer,
        integrity: input.integrity,
      });
    }
  }
  return _fetch(input, init);
};

const _open = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function (method: string, url: string | URL, ...args: any[]) {
  if (typeof url === "string") {
    url = rep(url);
  }
  return _open.call(this, method, url, ...args);
};

console.log("[Proxy] Cloudflare Worker proxy patch applied");
