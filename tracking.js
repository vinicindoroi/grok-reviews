(function () {
  "use strict";

  var TRACK_ENDPOINT = "https://track.newtool.online/event";

  var ALAN_CHECKOUT = "https://offers.metavisiontktk.com/v3";

  var VENDEPAY_HOST = "checkout.vendepay.com";
  var KASHPAY_HOST = "checkout.kashpay.com.br";
  var DS24_HOST_1 = "checkout-ds24.com";
  var DS24_HOST_2 = "www.checkout-ds24.com";
  var DIGISTORE_NEW_HOST = "funnels.armdigitalservices.us";
  var MYCHECKOUT_HOST = "pay.mycheckoutt.com";
  var ARM_DIGITAL_HOST = "arm-digital.com";
  var PAYFLOW_HOST = "payflow-delta-dun.vercel.app";
  var GROK_HOST = "grok.arm-mediagroup.com";
  var METAVISION_HOST = "offers.metavisiontktk.com";

  var PRODUCT_NAME = "App Acess";
  var OFFER_KEY = "front";
  var OFFER_VALUE = "9.90";
  var CURRENCY = "USD";
  var CHECKOUT_PROVIDER = "digistore";
  var STORAGE_PREFIX = "mundpay_funnel_";

  function nowMs() {
    return Date.now();
  }

  function getParams() {
    return new URLSearchParams(window.location.search);
  }

  function getParam(key) {
    return getParams().get(key) || "";
  }

  function getCookie(name) {
    var match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
    return match ? decodeURIComponent(match[2]) : "";
  }

  function setCookie(name, value, maxAge) {
    try {
      if (!value) return;
      var secure = window.location.protocol === "https:" ? "; Secure" : "";
      document.cookie = name + "=" + encodeURIComponent(value) + "; Path=/; Max-Age=" + String(maxAge || 7776000) + "; SameSite=Lax" + secure;
    } catch (e) {}
  }

  function getStorage(key) {
    try {
      return localStorage.getItem(STORAGE_PREFIX + key) || "";
    } catch (e) {
      return "";
    }
  }

  function setStorage(key, value) {
    try {
      if (value !== undefined && value !== null && value !== "") {
        localStorage.setItem(STORAGE_PREFIX + key, String(value));
      }
    } catch (e) {}
  }

  function uuidLike() {
    return "trk_" + nowMs() + "_" + Math.random().toString(36).slice(2, 12);
  }

  function saveCurrentParams() {
    getParams().forEach(function (value, key) {
      if (!value) return;

      setStorage(key, value);
      setStorage(key.replace(/^_/, ""), value);
    });
  }

  function getStoredOrParam(keys) {
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var fromUrl = getParam(key);

      if (fromUrl) {
        setStorage(key.replace(/^_/, ""), fromUrl);
        return fromUrl;
      }
    }

    for (var j = 0; j < keys.length; j++) {
      var saved = getStorage(keys[j].replace(/^_/, ""));
      if (saved) return saved;
    }

    return "";
  }

  function getIncomingTrackingId() {
    return (
      getParam("custom") ||
      getParam("tracking_id") ||
      getParam("sck") ||
      getParam("xcod") ||
      getParam("external_code") ||
      getParam("ref") ||
      getParam("ds24tr") ||
      getParam("trackingkey") ||
      ""
    );
  }

  function getStoredTrackingId() {
    return (
      getStorage("tracking_id") ||
      getStorage("custom") ||
      getStorage("sck") ||
      getStorage("xcod") ||
      getStorage("external_code") ||
      getStorage("ref") ||
      getStorage("ds24tr") ||
      getStorage("trackingkey") ||
      ""
    );
  }

  function clearOldAttribution() {
    [
      "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "utm_id",
      "fbclid", "fbc", "_fbc", "gclid", "ttclid",
      "custom", "tracking_id", "sck", "xcod", "external_code", "ref", "ds24tr", "trackingkey",
      "sub1", "sub2", "sub3", "sub4"
    ].forEach(function (key) {
      try { localStorage.removeItem(STORAGE_PREFIX + key); } catch (e) {}
    });
  }

  function syncTrackingAliases(id) {
    ["custom", "tracking_id", "sck", "xcod", "external_code", "ref", "ds24tr", "trackingkey"].forEach(function (key) {
      setStorage(key, id);
    });
  }

  function putTrackingIdInCurrentUrl(id) {
    try {
      var currentUrl = new URL(window.location.href);
      var changed = false;
      ["custom", "tracking_id", "sck", "xcod", "external_code", "ref", "ds24tr", "trackingkey"].forEach(function (key) {
        if (currentUrl.searchParams.get(key) !== id) {
          currentUrl.searchParams.set(key, id);
          changed = true;
        }
      });
      if (changed) history.replaceState(history.state, "", currentUrl.toString());
    } catch (e) {}
  }

  function getTrackingId() {
    var incomingId = getIncomingTrackingId();
    var previousId = getStoredTrackingId();
    var currentFbclid = getParam("fbclid");
    var previousFbclid = getStorage("fbclid");
    var currentUtmId = getParam("utm_id");
    var previousUtmId = getStorage("utm_id");
    var currentCampaign = getParam("utm_campaign");
    var previousCampaign = getStorage("utm_campaign");
    var isNewAttribution =
      (incomingId && previousId && incomingId !== previousId) ||
      (currentFbclid && previousFbclid && currentFbclid !== previousFbclid) ||
      (!currentFbclid && currentUtmId && previousUtmId && currentUtmId !== previousUtmId) ||
      (!currentFbclid && !currentUtmId && currentCampaign && previousCampaign && currentCampaign !== previousCampaign);

    if (isNewAttribution) clearOldAttribution();

    var id = incomingId || (isNewAttribution ? uuidLike() : previousId || uuidLike());
    saveCurrentParams();
    syncTrackingAliases(id);
    putTrackingIdInCurrentUrl(id);
    return id;
  }

  function getFbp() {
    var fromUrl = getParam("fbp") || getParam("_fbp");
    var cookieFbp = getCookie("_fbp");
    var saved = getStorage("fbp");
    var value = fromUrl || cookieFbp || saved || "";
    if (value) { setStorage("fbp", value); setStorage("_fbp", value); }
    return value;
  }

  function getFbc() {
    var currentFbclid = getParam("fbclid") || "";
    var incomingFbc = getParam("fbc") || getParam("_fbc") || "";
    var cookieFbc = getCookie("_fbc");
    var savedFbc = getStorage("fbc") || getStorage("_fbc");
    var value = "";

    if (currentFbclid) {
      setStorage("fbclid", currentFbclid);
      if (incomingFbc && incomingFbc.endsWith("." + currentFbclid)) value = incomingFbc;
      else if (cookieFbc && cookieFbc.endsWith("." + currentFbclid)) value = cookieFbc;
      else if (savedFbc && savedFbc.endsWith("." + currentFbclid)) value = savedFbc;
      else value = "fb.1." + nowMs() + "." + currentFbclid;
    } else value = incomingFbc || cookieFbc || savedFbc;

    if (value) {
      setStorage("fbc", value);
      setStorage("_fbc", value);
      setCookie("_fbc", value, 7776000);
    }
    return value || "";
  }

  function normalizeEmail(value) {
    var normalizedEmail = String(value || "").trim().toLowerCase();
    setStorage("email", normalizedEmail);
    return normalizedEmail;
  }

  function getOriginalEmailForFacebook() {
    try {
      var sessionEmail = window.sessionStorage.getItem("vsl_email");
      if (sessionEmail) return String(sessionEmail).trim().toLowerCase();
    } catch (e) {}

    var savedOriginal = getStorage("email_original");
    return savedOriginal ? String(savedOriginal).trim().toLowerCase() : "";
  }

  function getEmailFromPageOrUrl() {
  var fromUrl = getParam("email") || getStorage("email");
  if (fromUrl) return normalizeEmail(fromUrl);

    try {
      var selectors = [
        'input[type="email"]',
        'input[name="email"]',
        'input[id*="email" i]',
        'input[placeholder*="email" i]',
        'input[placeholder*="e-mail" i]'
      ];

      for (var i = 0; i < selectors.length; i++) {
        var el = document.querySelector(selectors[i]);
        if (el && el.value) return normalizeEmail(el.value);
      }
    } catch (e) {}

    return "";
  }

  function getNameParts() {
    var first = getParam("first_name") || getStorage("first_name");
    var last = getParam("last_name") || getStorage("last_name");
    var full = getParam("name") || getStorage("name");

    if ((!first || !last) && full) {
      var parts = String(full).trim().split(/\s+/);

      if (!first && parts.length) {
        first = parts.slice(0, Math.max(1, parts.length - 1)).join(" ");
      }

      if (!last && parts.length > 1) {
        last = parts[parts.length - 1];
      }
    }

    return {
      name: full || [first, last].filter(Boolean).join(" "),
      first_name: first || "",
      last_name: last || ""
    };
  }

  function getAssignedCheckoutUrl() {
    return ALAN_CHECKOUT;
  }

  function isDs24Url(value) {
    var text = String(value || "");
    return text.indexOf(DS24_HOST_1) !== -1 || text.indexOf(DS24_HOST_2) !== -1 || text.indexOf(DIGISTORE_NEW_HOST) !== -1;
  }

  function isVendepayUrl(value) {
  return String(value || "").indexOf(VENDEPAY_HOST) !== -1;
  }

  function isKashpayUrl(value) {
  return String(value || "").indexOf(KASHPAY_HOST) !== -1;
  }

  function isMyCheckoutUrl(value) {
  return String(value || "").indexOf(MYCHECKOUT_HOST) !== -1;
  }

  function isArmDigitalUrl(value) {
  return String(value || "").indexOf(ARM_DIGITAL_HOST) !== -1;
  }

  function isPayflowUrl(value) {
  return String(value || "").indexOf(PAYFLOW_HOST) !== -1;
  }

  function isGrokUrl(value) {
  return String(value || "").indexOf(GROK_HOST) !== -1 || String(value || "").indexOf(METAVISION_HOST) !== -1;
  }

  function getProviderFromUrl(value) {
  if (isDs24Url(value)) return "digistore";
  if (isKashpayUrl(value)) return "kashpay";
  if (isVendepayUrl(value)) return "vendepay";
  if (isMyCheckoutUrl(value)) return "mundpay";
  if (isPayflowUrl(value) || isGrokUrl(value)) return "digistore";
  return CHECKOUT_PROVIDER;
  }

  function addTrackingIdToUtmContent(originalUtmContent, trackingId) {
    var original = String(originalUtmContent || "");
    var id = String(trackingId || "");

    if (!id) return original;

    var cleaned = original
      .split("|")
      .filter(function (part) {
        return !String(part).trim().startsWith("trk=");
      })
      .join("|");

    return cleaned ? cleaned + "|trk=" + id : "trk=" + id;
  }

  function buildCheckoutUrl(originalUrl) {
    saveCurrentParams();

    var trackingId = getTrackingId();
    var fbp = getFbp();
    var fbc = getFbc();
    var fbclid = getParam("fbclid") || getStorage("fbclid");
    var names = getNameParts();
    var email = getEmailFromPageOrUrl();

    var url;

    try {
      url = new URL(originalUrl || getAssignedCheckoutUrl());
    } catch (e) {
      url = new URL(getAssignedCheckoutUrl());
    }

    // A VSL usa exclusivamente a Digistore24 para este checkout.
    var provider = isDs24Url(url.toString()) ? "digistore" : getProviderFromUrl(url.toString());

    getParams().forEach(function (value, key) {
      url.searchParams.set(key, value);
    });

    [
      "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "utm_id",
      "fbclid", "gclid", "ttclid", "sck", "xcod", "ref", "tracking_id", "custom", "pixel_key"
    ].forEach(function (key) {
      if (url.searchParams.has(key)) return;
      var saved = getStorage(key);
      if (saved) url.searchParams.set(key, saved);
    });

    [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_content",
      "utm_term",
      "utm_id",
      "fbclid",
      "gclid",
      "ttclid"
    ].forEach(function (key) {
      var value = getParam(key) || getStorage(key);
      if (value) url.searchParams.set(key, value);
    });

    // O parâmetro custom é exclusivo da Digistore24.
    // A KashPay/VendePay recebe os parâmetros normais de tracking abaixo,
    // mas não recebe custom.
    if (provider === "digistore") {
      url.searchParams.set("custom", trackingId);
    }

  // A KashPay usa sid1 e src como campos de atribuição. Os outros
  // parâmetros podem ser descartados pelo redirecionamento do checkout.
  if (provider === "kashpay" || isArmDigitalUrl(url.toString())) {
  if (!url.searchParams.has("sid1")) {
    url.searchParams.append("sid1", getParam("sid1") || getStorage("sid1") || trackingId);
  }
  var originalSrc = getParam("src");
  if (originalSrc && !url.searchParams.has("src")) {
    url.searchParams.set("src", originalSrc);
  }
  }

    var checkoutHost = url.hostname.toLowerCase();
    var isGrokersIntermediate =
      checkoutHost === "funnels.armdigitalservices.us" ||
      checkoutHost === "funnels.armdigitalservices.us.";

    if (isGrokersIntermediate) {
      var originalUtmContent =
        getParams().get("utm_content") ||
        getStorage("utm_content") ||
        url.searchParams.get("utm_content") ||
        "";
      var finalUtmContent = addTrackingIdToUtmContent(originalUtmContent, trackingId);
      url.searchParams.set("utm_content", finalUtmContent);
    }

    // Parâmetros normais de tracking, enviados para os dois provedores.
    url.searchParams.set("tracking_id", trackingId);
    url.searchParams.set("sck", trackingId);
    url.searchParams.set("xcod", trackingId);
    url.searchParams.set("external_code", trackingId);
    url.searchParams.set("ref", trackingId);
    url.searchParams.set("ds24tr", trackingId);
    url.searchParams.set("trackingkey", trackingId);

    // META PARAMS: somente enviar identificadores que realmente existem.
    if (fbp) {
      url.searchParams.set("fbp", fbp);
      url.searchParams.set("_fbp", fbp);
    }

    if (fbc) {
      url.searchParams.set("fbc", fbc);
      url.searchParams.set("_fbc", fbc);
    }

    if (fbclid) {
      url.searchParams.set("fbclid", fbclid);
    }

    var pixelKey = getParam("pixel_key") || getStorage("pixel_key");
    if (pixelKey) {
      setStorage("pixel_key", pixelKey);
      url.searchParams.set("pixel_key", pixelKey);
    }

    // DADOS DE CONTATO, CASO EXISTAM
    if (email) url.searchParams.set("email", email);
    if (names.name) url.searchParams.set("name", names.name);

    if (provider === "kashpay") {
      // KashPay recebe o nome completo e o email tratado pelo checkout
      // nos parâmetros próprios name e email.
      if (names.name) url.searchParams.set("name", names.name);
      if (email) url.searchParams.set("email", email);
  if (names.first_name) url.searchParams.set("first_name", names.first_name);
  if (names.last_name) url.searchParams.set("last_name", names.last_name);
    } else {
      if (names.first_name) url.searchParams.set("first_name", names.first_name);
      if (names.last_name) url.searchParams.set("last_name", names.last_name);
    }

    // IDENTIFICAÇÃO DO FUNIL
    url.searchParams.set("checkout_provider", provider);
    url.searchParams.set("offer_key", OFFER_KEY);
    url.searchParams.set("offer_name", PRODUCT_NAME);
    url.searchParams.set("content_name", PRODUCT_NAME);
    url.searchParams.set("currency", CURRENCY);
    url.searchParams.set("value", OFFER_VALUE);
    url.searchParams.set("from_vsl", "1");

    return url.toString();
  }

  function sendInitiateCheckout(finalCheckoutUrl, userActivated) {
    if (userActivated !== true) return Promise.resolve(false);

    var provider = getProviderFromUrl(finalCheckoutUrl);
    var trackingId = getTrackingId();
    var fbp = getFbp();
    var fbc = getFbc();
    var fbclid = getParam("fbclid") || getStorage("fbclid") || "";
    var names = getNameParts();
  var email = getEmailFromPageOrUrl();
  var originalEmailForFacebook = getOriginalEmailForFacebook();
  
  var eventId = "initiate_checkout_front_" + trackingId;

    try {
      if (typeof window.fbq === "function") {
        window.fbq(
          "track",
          "InitiateCheckout",
          {
            content_name: PRODUCT_NAME,
            content_type: "product",
            currency: CURRENCY,
            value: Number(OFFER_VALUE),
            checkout_provider: provider,
            offer_key: OFFER_KEY
          },
          { eventID: eventId }
        );
      }
    } catch (e) {}

    var userData = {
      external_id: trackingId,
      tracking_id: trackingId,
      fbp: fbp,
      _fbp: fbp,
      fbc: fbc || undefined,
      _fbc: fbc || undefined,
      client_user_agent: navigator.userAgent
    };

  if (originalEmailForFacebook || email) {
    userData.email = originalEmailForFacebook || email;
  }
  if (names.first_name) userData.first_name = names.first_name;
    if (names.last_name) userData.last_name = names.last_name;
    if (names.name) userData.name = names.name;

    var payload = {
      event_name: "InitiateCheckout",
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId,
      event_source_url: window.location.href,
      tracking_id: trackingId,
      user_data: userData,
      custom_data: {
        content_name: PRODUCT_NAME,
        content_type: "product",
        currency: CURRENCY,
        value: Number(OFFER_VALUE),
        checkout_provider: provider,
        offer_key: OFFER_KEY,
        offer_name: PRODUCT_NAME,

        custom: trackingId,
        tracking_id: trackingId,
        sck: trackingId,
        xcod: trackingId,
        external_code: trackingId,
        ref: trackingId,
        ds24tr: trackingId,
        trackingkey: trackingId,

        fbp: fbp,
        _fbp: fbp,
        fbc: fbc || undefined,
        _fbc: fbc || undefined,
        fbclid: fbclid || undefined,

        utm_source: getParam("utm_source") || getStorage("utm_source") || undefined,
        utm_medium: getParam("utm_medium") || getStorage("utm_medium") || undefined,
        utm_campaign: getParam("utm_campaign") || getStorage("utm_campaign") || undefined,
        utm_content: getParam("utm_content") || getStorage("utm_content") || undefined,
        utm_term: getParam("utm_term") || getStorage("utm_term") || undefined,
        utm_id: getParam("utm_id") || getStorage("utm_id") || undefined,

        checkout_url: finalCheckoutUrl,
        page_name: "InitiateCheckout Front VSL",
        page_url: window.location.href,
        from_vsl: "1",
        referrer: document.referrer || ""
      }
    };

    var body = JSON.stringify(payload);

    try {
      return fetch(TRACK_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        keepalive: true,
        body: body
      }).catch(function () {
        try {
          navigator.sendBeacon(
            TRACK_ENDPOINT,
            new Blob([body], { type: "application/json" })
          );
        } catch (e) {}
      });
    } catch (e) {
      try {
        navigator.sendBeacon(
          TRACK_ENDPOINT,
          new Blob([body], { type: "application/json" })
        );
      } catch (err) {}

      return Promise.resolve(false);
    }
  }

  function sendPageView() {
    var trackingId = getTrackingId();
    var pageKey = "newtool_pageview_" + trackingId + "_" + window.location.pathname;
    try {
      if (sessionStorage.getItem(pageKey) === "1") return;
      sessionStorage.setItem(pageKey, "1");
    } catch (err) {}

    var params = getParams();
    var fbp = getFbp();
    var fbc = getFbc();
    var fbclid = params.get("fbclid") || getStorage("fbclid") || "";
    var pageUrl = window.location.href;
    var eventId = "pageview_entry_" + trackingId + "_" + Date.now();
    var aliases = {
      custom: trackingId,
      tracking_id: trackingId,
      sck: trackingId,
      xcod: trackingId,
      external_code: trackingId,
      ref: trackingId,
      ds24tr: trackingId,
      trackingkey: trackingId,
    };
    var payload = {
      event_name: "PageView",
      event_id: eventId,
      event_time: Math.floor(Date.now() / 1000),
      event_source_url: pageUrl,
      action_source: "website",
      tracking_id: trackingId,
      user_data: {
        tracking_id: trackingId,
        external_id: trackingId,
        fbp: fbp || undefined,
        _fbp: fbp || undefined,
        fbc: fbc || undefined,
        _fbc: fbc || undefined,
        client_user_agent: navigator.userAgent,
      },
      custom_data: Object.assign({}, aliases, {
        page: window.location.pathname,
        page_url: pageUrl,
        fbclid: fbclid || undefined,
        fbp: fbp || undefined,
        _fbp: fbp || undefined,
        fbc: fbc || undefined,
        _fbc: fbc || undefined,
        utm_source: params.get("utm_source") || getStorage("utm_source") || undefined,
        utm_medium: params.get("utm_medium") || getStorage("utm_medium") || undefined,
        utm_campaign: params.get("utm_campaign") || getStorage("utm_campaign") || undefined,
        utm_content: params.get("utm_content") || getStorage("utm_content") || undefined,
        utm_term: params.get("utm_term") || getStorage("utm_term") || undefined,
        utm_id: params.get("utm_id") || getStorage("utm_id") || undefined,
        gclid: params.get("gclid") || getStorage("gclid") || undefined,
        ttclid: params.get("ttclid") || getStorage("ttclid") || undefined,
        hostname: window.location.hostname,
      }),
    };

    try {
      if (typeof window.fbq === "function") {
        window.fbq("track", "PageView", {}, { eventID: eventId });
      }
    } catch (err) {}

    var body = JSON.stringify(payload);
    var beaconSent = false;
    try {
      if (navigator.sendBeacon) {
        beaconSent = navigator.sendBeacon(
          TRACK_ENDPOINT,
          new Blob([body], { type: "application/json" })
        );
      }
    } catch (err) {}

    if (!beaconSent) {
      try {
        fetch(TRACK_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: body,
          keepalive: true,
        }).catch(function () {});
      } catch (err) {}
    }
  }

  function isTargetCheckout(url) {
    return isDs24Url(url) || isVendepayUrl(url) || isKashpayUrl(url) || isMyCheckoutUrl(url) || isArmDigitalUrl(url) || isPayflowUrl(url) || isGrokUrl(url);
  }

  function findCheckoutLink(element) {
    var el = element;

    while (el && el !== document.body) {
      if (el.tagName === "A" && el.href && isTargetCheckout(el.href)) {
        return el;
      }

      el = el.parentElement;
    }

    return null;
  }

  getTrackingId();
  saveCurrentParams();
  sendPageView();

  var lastTrackedUrl = window.location.href;
  function trackNavigation() {
    if (window.location.href === lastTrackedUrl) return;
    lastTrackedUrl = window.location.href;
    saveCurrentParams();
    sendPageView();
  }

  ["pushState", "replaceState"].forEach(function (method) {
    var original = window.history[method];
    window.history[method] = function () {
      var result = original.apply(this, arguments);
      window.dispatchEvent(new Event("tracking:navigation"));
      return result;
    };
  });

  window.addEventListener("popstate", trackNavigation);
  window.addEventListener("tracking:navigation", trackNavigation);

  document.addEventListener(
    "click",
    function (event) {
      var link = findCheckoutLink(event.target);
      if (!link || !event.isTrusted) return;

      event.preventDefault();
      event.stopPropagation();

      var clickedUrl = link.href;

    var checkoutWithMeta = buildCheckoutUrl(clickedUrl);
    link.href = checkoutWithMeta;
    sendInitiateCheckout(checkoutWithMeta, true);
    window.location.href = checkoutWithMeta;
    },
    true
  );
})();
