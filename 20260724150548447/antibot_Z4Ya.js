/**
 * Aura Events — minimal invisible bot shield.
 * Self-contained: injects honeypots and guards CTAs without changing the landing page.
 */
(function (global) {
  'use strict';

  var HONEYPOTS = [
    { id: 'email_confirm', name: 'email_confirm', type: 'email', label: 'Confirm your email address' },
    { id: 'ab-honeypot-url', name: 'website', type: 'text', label: 'Website URL' },
    { id: 'ab-honeypot-name', name: 'full_name', type: 'text', label: 'Full name' }
  ];
  var PROTECTED_IDS = ['open-invitation', 'account-selector'];
  var loadTime = Date.now();
  var behaviorScore = 0;
  var pointerMoves = 0;
  var blocked = false;
  var humanReady = false;
  var tracking = false;
  var protectedNodes = false;
  var settings = global.AURA_SETTINGS || {};

  function cfg(key, fallback) {
    return settings[key] !== undefined ? settings[key] : fallback;
  }

  function hasCfClearance() {
    try {
      return /(?:^|;\s*)cf_clearance=/.test(document.cookie);
    } catch (_) {
      return false;
    }
  }

  function thresholds() {
    if (hasCfClearance()) {
      return {
        minDelay: cfg('antibotCfMinDelayMs', 400),
        minScore: cfg('antibotCfMinScore', 2),
        minMoves: cfg('antibotCfMinMoves', 1)
      };
    }
    return {
      minDelay: cfg('antibotMinDelayMs', 800),
      minScore: cfg('antibotMinScore', 4),
      minMoves: cfg('antibotMinMoves', 2)
    };
  }

  function isWebDriver() {
    return !!navigator.webdriver;
  }

  function looksLikeAutomationUa() {
    var ua = (navigator.userAgent || '').toLowerCase();
    return /headless|phantom|selenium|webdriver|puppeteer|playwright|slimerjs|splash/i.test(ua);
  }

  function looksLikeScannerOrTool() {
    var ua = (navigator.userAgent || '').trim();
    if (!ua || ua.length < 16) return true;
    var u = ua.toLowerCase();
    if (
      /wget|^curl\/|libcurl|python-requests|^java\/|okhttp|go-http|axios\/|node-fetch|undici|postman|insomnia|httpie|scrapy|httrack|nikto|sqlmap|nmap|masscan|zgrab|zmap|w3af|arachni|acunetix|nessus|openvas|qualys|burp|metasploit|hydra|dirbuster|gobuster|wfuzz|ffuf|semrush|ahrefs|mj12bot|petalbot|bytespider|gptbot|claudebot|amazonbot/i.test(
        u
      )
    ) {
      return true;
    }
    if (/python-urllib|^php\/|\bgo \d[\d.]*\b/i.test(u)) return true;
    return false;
  }

  function looksLikeEmailHarvester() {
    var ua = (navigator.userAgent || '').toLowerCase();
    return /email|harvest|extractor|collector|spambot|mailbot|emailextractor|contact.?scraper|leadgen|outreachbot/i.test(
      ua
    );
  }

  function looksLikeHeadless() {
    if (typeof window.outerWidth === 'number' && window.outerWidth === 0) return true;
    if (typeof window.outerHeight === 'number' && window.outerHeight === 0) return true;
    if (document.documentElement && document.documentElement.getAttribute('webdriver') != null) return true;
    try {
      var cdc = /cdc_[a-zA-Z0-9]+/i;
      for (var prop in window) {
        if (Object.prototype.hasOwnProperty.call(window, prop) && cdc.test(prop)) return true;
      }
    } catch (_) {}
    return false;
  }

  function looksLikeAutomationGlobals() {
    return !!(
      global.__nightmare ||
      global._phantom ||
      global.callPhantom ||
      global.__selenium_unwrapped ||
      global.__webdriver_evaluate ||
      global.__driver_evaluate ||
      global.domAutomation ||
      global.domAutomationController
    );
  }

  function probeEnvironment() {
    var light = hasCfClearance();

    if (isWebDriver()) return { ok: false };
    if (looksLikeAutomationUa()) return { ok: false };
    if (looksLikeScannerOrTool()) return { ok: false };
    if (looksLikeEmailHarvester()) return { ok: false };
    if (!light && looksLikeHeadless()) return { ok: false };
    if (!light && looksLikeAutomationGlobals()) return { ok: false };

    return { ok: true };
  }

  function injectHoneypots() {
    if (document.getElementById('email_confirm')) return;

    var trap = document.createElement('div');
    trap.setAttribute('aria-hidden', 'true');
    trap.style.cssText =
      'position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;z-index:-1';

    var i;
    for (i = 0; i < HONEYPOTS.length; i++) {
      var hp = HONEYPOTS[i];
      var label = document.createElement('label');
      label.setAttribute('for', hp.id);
      label.textContent = hp.label;

      var input = document.createElement('input');
      input.type = hp.type;
      input.name = hp.name;
      input.id = hp.id;
      input.tabIndex = -1;
      input.autocomplete = 'off';
      input.value = '';

      trap.appendChild(label);
      trap.appendChild(input);
    }

    document.body.insertBefore(trap, document.body.firstChild);
  }

  function honeypotsClean() {
    var i;
    for (i = 0; i < HONEYPOTS.length; i++) {
      var el = document.getElementById(HONEYPOTS[i].id);
      if (el && String(el.value || '').trim() !== '') return false;
    }
    return true;
  }

  function runtimeClean() {
    if (blocked) return false;
    if (!probeEnvironment().ok) {
      blocked = true;
      return false;
    }
    if (!honeypotsClean()) {
      blocked = true;
      return false;
    }
    return true;
  }

  function bumpScore(amount) {
    behaviorScore += amount || 1;
    maybeUnlock();
  }

  function onPointer() {
    pointerMoves += 1;
    bumpScore(1);
  }

  function onScroll() {
    bumpScore(1);
  }

  function startTracking() {
    if (tracking) return;
    tracking = true;
    document.addEventListener('mousemove', onPointer, { passive: true });
    document.addEventListener('touchstart', onPointer, { passive: true });
    document.addEventListener('pointerdown', onPointer, { passive: true });
    document.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('wheel', onScroll, { passive: true });
  }

  function isHumanReady() {
    if (blocked || !cfg('antibotEnabled', true)) return true;
    var t = thresholds();
    return (
      humanReady ||
      (runtimeClean() &&
        Date.now() - loadTime >= t.minDelay &&
        behaviorScore >= t.minScore &&
        pointerMoves >= t.minMoves)
    );
  }

  function maybeUnlock() {
    if (humanReady || blocked) return;
    if (!isHumanReady()) return;
    humanReady = true;
  }

  function canProceed(e) {
    if (!cfg('antibotEnabled', true)) return true;
    if (blocked) return false;
    if (e && e.isTrusted === false) return false;
    if (!runtimeClean()) return false;
    if (e && e.isTrusted) return true;
    if (!isHumanReady()) return false;
    return true;
  }

  function guardEvent(e) {
    if (!canProceed(e)) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }

  function protectButtons() {
    if (protectedNodes) return;
    protectedNodes = true;

    var i;
    for (i = 0; i < PROTECTED_IDS.length; i++) {
      (function (id) {
        var el = document.getElementById(id);
        if (!el) return;

        el.addEventListener('click', guardEvent, true);
        el.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') guardEvent(e);
        }, true);
      })(PROTECTED_IDS[i]);
    }
  }

  function init() {
    if (!cfg('antibotEnabled', true)) {
      humanReady = true;
      return;
    }

    injectHoneypots();

    var env = probeEnvironment();
    if (!env.ok) {
      blocked = true;
      protectButtons();
      return;
    }

    startTracking();
    protectButtons();

    var poll = setInterval(function () {
      maybeUnlock();
      if (humanReady || blocked) clearInterval(poll);
    }, 120);

    setTimeout(maybeUnlock, thresholds().minDelay + 50);
  }

  global.AuraShield = {
    canProceed: canProceed,
    isHumanReady: isHumanReady,
    hasCfClearance: hasCfClearance,
    honeypotsClean: honeypotsClean,
    init: init
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : this);
