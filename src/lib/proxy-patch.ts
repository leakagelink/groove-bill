const PROXY_URL = "https://rapid-sea-bed5.leakagelink.workers.dev";
const SUPABASE_HOST = "ffyhmewrruvhvwqkmvop.supabase.co";

const originalFetch = window.fetch;
window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
  let url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  
  if (url.includes(SUPABASE_HOST)) {
    const proxiedUrl = url.replace(`https://${SUPABASE_HOST}`, PROXY_URL);
    
    if (typeof input === "string") {
      input = proxiedUrl;
    } else if (input instanceof URL) {
      input = new URL(proxiedUrl);
    } else {
      input = new Request(proxiedUrl, input);
    }
  }
  
  return originalFetch.call(window, input, init);
};
