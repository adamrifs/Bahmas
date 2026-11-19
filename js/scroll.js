/* =============================================================
 * Bahmas – supplemental scroll enhancements.
 *
 * The core scroll behaviours (sticky header via .smaller,
 * back-to-top button, horizontal progress bar via div.scrollbar)
 * are all driven by the existing designesia.js / jQuery system.
 *
 * This file adds only the enhancements that designesia.js does
 * NOT cover for this site:
 *   1. Subtle parallax on hero & CTA background images
 *   2. Staggered scroll-reveal for the hero highlights strip
 *      and the CTA copy block (excluded from motion.js)
 *
 * Runs AFTER components are ready (injected by components.js).
 * ============================================================= */
(() => {
  'use strict';

  /* ── 1. Parallax on hero & CTA background images ────────── */
  function initParallax() {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduced.matches) return;

    const targets = [
      { sel: '.bahmas-hero-slides',  speed: 0.25 },
      { sel: '.bahmas-quote-image',  speed: 0.20 },
    ];

    const nodes = targets.flatMap(({ sel, speed }) =>
      [...document.querySelectorAll(sel)].map(el => ({ el, speed }))
    );
    if (!nodes.length) return;

    let ticking = false;
    function apply() {
      nodes.forEach(({ el, speed }) => {
        const section = el.closest('section') || el.closest('.bahmas-hero');
        if (!section) return;
        const rect  = section.getBoundingClientRect();
        const viewH = window.innerHeight;
        if (rect.bottom < 0 || rect.top > viewH) return;
        const progress = (viewH - rect.top) / (viewH + rect.height); // 0–1
        const offset   = (progress - 0.5) * rect.height * speed;
        el.style.transform = `translateY(${offset.toFixed(2)}px)`;
      });
      ticking = false;
    }
    function onScroll() {
      if (!ticking) { requestAnimationFrame(apply); ticking = true; }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    apply();

    reduced.addEventListener('change', () => {
      if (!reduced.matches) return;
      nodes.forEach(({ el }) => { el.style.transform = ''; });
      window.removeEventListener('scroll', onScroll);
    });
  }

  /* ── 2. Staggered reveal for hero highlights & CTA copy ─── */
  function initHighlightReveal() {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduced.matches || !('IntersectionObserver' in window)) return;

    // Hero highlights strip is inside .bahmas-hero which motion.js excludes.
    // CTA copy children are also not covered.
    const items = [
      ...document.querySelectorAll('.bahmas-hero-highlights > li'),
      ...document.querySelectorAll('.bahmas-quote-copy > *'),
    ];
    if (!items.length) return;

    const seen = new WeakSet();
    const obs  = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting || seen.has(entry.target)) return;
        seen.add(entry.target);
        obs.unobserve(entry.target);
        const idx   = items.indexOf(entry.target);
        const delay = (idx % 6) * 70;
        entry.target.animate(
          [{ opacity: 0, translate: '0 20px' }, { opacity: 1, translate: '0 0' }],
          { duration: 600, delay, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'backwards' }
        );
      });
    }, { rootMargin: '0px 0px -16px 0px', threshold: 0.08 });

    items.forEach(el => obs.observe(el));
  }

  /* ── Boot ───────────────────────────────────────────────── */
  let booted = false;
  function boot() {
    if (booted) return;
    booted = true;
    initParallax();
    initHighlightReveal();
  }

  // Loaded dynamically by components.js after bahmas:components-ready fires,
  // so the header is already in the DOM. Boot immediately.
  if (document.querySelector('header')) {
    boot();
  } else {
    document.addEventListener('bahmas:components-ready', boot, { once: true });
  }
})();
