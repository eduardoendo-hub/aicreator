/* ──────────────────────────────────────────────────────────────────────────────
 *  app.js — AI Creator (aicreator.technowhub.ai)
 *  ─────────────────────────────────────────────────────────────────────────────
 *  Mesma convenção das LPs irmãs (Lógica, Código Zero, QA Next, Claude):
 *   1. Captura utm_* (+ gclid/fbclid) da URL e persiste por sessão.
 *   2. Repassa esses params aos links de saída (checkout Engaged + WhatsApp).
 *   3. Empurra eventos pro IRIS (cockpit em tempo real): lp_view, click_compra,
 *      click_whats — POST /api/events.
 *   4. Pixel Meta (pixel IRIS único das LPs Impacta) + tag global do Google Ads.
 *
 *  Turma única: online ao vivo, 6–8/out/2026. Sem formulário de lead — WhatsApp
 *  e checkout vão direto (não há integração com integracao-rd).
 *  ──────────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var CFG = {
    PRODUCT_SLUG:    'aicreator',
    CAMPAIGN_SLUG:   'aicreator-outubro-2026',
    IRIS_EVENTS_URL: 'https://iris.technowhub.ai/api/events',
    TICKET_VALUE:    700,            // preço à vista — referência p/ value
    CURRENCY:        'BRL',
    // Pixel IRIS — pixel único de todas as LPs Impacta:
    META_PIXEL_ID:   '1581473926936760',
    CONTENT_NAME:    'aicreator',
    // Google Ads — tag global da conta da Impacta. O label da conversão
    // "InitiateCheckout LP AI Creator" ainda não foi criado no Google Ads;
    // enquanto estiver vazio, só a tag global carrega (nenhuma conversão).
    GOOGLE_ADS_ID:    'AW-1056567970',
    GOOGLE_ADS_LABEL: '',
  };

  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  // Outros params de clique que também devem ser repassados ao checkout:
  var PASSTHROUGH_KEYS = ['gclid', 'fbclid', 'gad_source', 'msclkid'];
  var ALL_KEYS = UTM_KEYS.concat(PASSTHROUGH_KEYS);

  // ─── 1. Captura + persiste params da URL ──────────────────────────────────
  function getTrackingParams() {
    var qs = new URLSearchParams(window.location.search);
    var saved = {};
    try { saved = JSON.parse(sessionStorage.getItem('aic_tracking') || '{}'); } catch (e) {}
    ALL_KEYS.forEach(function (k) {
      var v = qs.get(k);
      if (v) saved[k] = v;
    });
    try { sessionStorage.setItem('aic_tracking', JSON.stringify(saved)); } catch (e) {}
    return saved;
  }

  // ─── 2. Anexa os params capturados a uma URL absoluta, sem sobrescrever ────
  function withTracking(rawHref, params) {
    if (!rawHref) return rawHref;
    var url;
    try { url = new URL(rawHref, window.location.href); } catch (e) { return rawHref; }
    Object.keys(params).forEach(function (k) {
      if (!url.searchParams.has(k)) url.searchParams.set(k, params[k]);
    });
    return url.toString();
  }

  // ─── 3. Evento pra IRIS (cockpit em tempo real) ───────────────────────────
  function sendIrisEvent(eventName, extra) {
    try {
      var p = getTrackingParams();
      var body = {
        product_slug:  CFG.PRODUCT_SLUG,
        event_name:    eventName,
        campaign_slug: CFG.CAMPAIGN_SLUG,
        page_url:      location.href,
        utm_source:    p.utm_source   || null,
        utm_medium:    p.utm_medium   || null,
        utm_campaign:  p.utm_campaign || null,
        utm_content:   p.utm_content  || null,
        utm_term:      p.utm_term     || null,
        referrer:      document.referrer || null
      };
      if (extra && extra.value != null) body.value = extra.value;
      if (extra && extra.currency)      body.currency = extra.currency;
      if (extra)                        body.meta = extra;
      fetch(CFG.IRIS_EVENTS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        keepalive: true,
        mode: 'cors'
      }).catch(function () {});
    } catch (e) {}
  }

  // ─── 4. Aplica nos links de saída (checkout + whatsapp) ───────────────────
  function decorateOutboundLinks(params) {
    document.querySelectorAll('a[data-cta]').forEach(function (el) {
      if (el.dataset.utmApplied) return;
      var href = el.getAttribute('href') || '';
      // só decora URLs absolutas (checkout/WhatsApp), nunca âncoras internas
      if (href.indexOf('http') !== 0) return;
      el.setAttribute('href', withTracking(href, params));
      el.dataset.utmApplied = '1';
      var cta = el.getAttribute('data-cta');
      el.addEventListener('click', function () {
        if (cta === 'checkout') {
          var meta = {
            value:      CFG.TICKET_VALUE,
            currency:   CFG.CURRENCY,
            modalidade: el.getAttribute('data-modalidade') || null,
            turma:      el.getAttribute('data-turma') || null
          };
          sendIrisEvent('click_compra', meta);
          track('InitiateCheckout', { value: CFG.TICKET_VALUE, currency: CFG.CURRENCY, placement: cta, modalidade: meta.modalidade });
          trackGoogleConversion();
        } else if (cta === 'whatsapp') {
          sendIrisEvent('click_whats', { channel: 'whatsapp' });
          track('Contact', { placement: cta });
        }
      });
    });
  }

  // ─── 5. Pixel Meta ────────────────────────────────────────────────────────
  function initPixel() {
    if (!CFG.META_PIXEL_ID || window.fbq) return;
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
      n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
      (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', CFG.META_PIXEL_ID);
    window.fbq('track', 'PageView');
  }

  // ─── 5b. Google Ads (gtag) ────────────────────────────────────────────────
  function initGtag() {
    if (!CFG.GOOGLE_ADS_ID || window.gtag) return;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + CFG.GOOGLE_ADS_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', CFG.GOOGLE_ADS_ID);
  }

  // Conversão do Google Ads — só no clique de checkout (o botão abre em nova
  // aba, então não precisa de event_callback pra segurar a navegação).
  function trackGoogleConversion() {
    if (!window.gtag || !CFG.GOOGLE_ADS_LABEL) return;
    try {
      window.gtag('event', 'conversion', {
        send_to: CFG.GOOGLE_ADS_ID + '/' + CFG.GOOGLE_ADS_LABEL,
        value: CFG.TICKET_VALUE,
        currency: CFG.CURRENCY
      });
    } catch (e) {}
  }

  function track(eventName, params) {
    params = Object.assign({ content_name: CFG.CONTENT_NAME }, params || {});
    if (window.fbq) { try { window.fbq('track', eventName, params); } catch (e) {} }
    if (window.dataLayer) { window.dataLayer.push(Object.assign({ event: eventName }, params)); }
  }

  // ─── 6. Run + observa mudanças no DOM ─────────────────────────────────────
  function apply() {
    decorateOutboundLinks(getTrackingParams());
  }

  initPixel();
  initGtag();
  apply();
  new MutationObserver(apply).observe(document.body, { childList: true, subtree: true });

  // lp_view — uma vez por carregamento
  sendIrisEvent('lp_view');

  // ViewContent quando o visitante lê metade da página (sinal de engajamento
  // pro Meta; o IRIS não conta esse evento separado).
  var halfSent = false;
  window.addEventListener('scroll', function () {
    if (halfSent) return;
    var h = document.body.scrollHeight - window.innerHeight;
    if (h > 0 && (window.scrollY || 0) / h >= 0.5) {
      halfSent = true;
      track('ViewContent', { placement: 'scroll-50' });
    }
  }, { passive: true });
})();

/* ──────────────────────────────────────────────────────────────────────────────
 *  Interações da página (portadas do componente do canvas)
 *  ──────────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  // Vídeo do hero — toca quando entra na tela, pausa quando sai.
  document.querySelectorAll('video[data-autoplay-onview]').forEach(function (v) {
    v.muted = true;
    v.defaultMuted = true;
    var play = function () { var p = v.play(); if (p && p.catch) p.catch(function () {}); };
    play();
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { en.isIntersecting ? play() : v.pause(); });
    }, { threshold: 0.15 }).observe(v);
  });
})();
