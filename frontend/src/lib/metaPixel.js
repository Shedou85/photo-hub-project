const PIXEL_ID = '1650351699205701';
let initialized = false;

export function initMetaPixel() {
  if (initialized || typeof window === 'undefined') return;

  // Meta Pixel base code
  (function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e);
    t.async = true;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

  window.fbq('init', PIXEL_ID);
  window.fbq('track', 'PageView');
  initialized = true;
}

export function trackMetaEvent(eventName, params = {}) {
  if (!window.fbq) return;
  window.fbq('track', eventName, params);
}

export function trackMetaCustomEvent(eventName, params = {}) {
  if (!window.fbq) return;
  window.fbq('trackCustom', eventName, params);
}
