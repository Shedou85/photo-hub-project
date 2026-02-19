const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
let initialized = false;

export function initGA() {
  if (!GA_ID || initialized) return;
  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  script.async = true;
  document.head.appendChild(script);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID, { send_page_view: false });
  initialized = true;
}

export function trackPageView(path) {
  if (!window.gtag || !GA_ID) return;
  window.gtag('event', 'page_view', { page_path: path });
}
