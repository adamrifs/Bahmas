(() => {
  const hero = document.querySelector('[data-hero-slider]');
  if (hero && !hero.swiper) {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const paginationEl = hero.querySelector('.bahmas-hero-pagination');
    const controls = hero.querySelector('.bahmas-hero-controls');
    const pause  = controls ? controls.querySelector('.bahmas-hero-pause')  : null;
    const status = hero.querySelector('.bahmas-hero-status');
    const names = [...hero.querySelectorAll('[data-slide-name]')].map(slide => slide.dataset.slideName);
    let userPaused = preference.matches;
    let focused = false;
    let visible = true;
    const slider = new Swiper(hero, {
      loop: true,
      speed: preference.matches ? 0 : 900,
      slidesPerView: 1,
      spaceBetween: 0,
      touchEventsTarget: 'container',
      autoplay: { delay: 5500, disableOnInteraction: false },
      noSwipingSelector: 'a, button, input, select, textarea',
      navigation: controls ? {
        prevEl: controls.querySelector('.bahmas-hero-prev'),
        nextEl: controls.querySelector('.bahmas-hero-next')
      } : false,
      pagination: paginationEl ? {
        el: paginationEl,
        clickable: true,
        renderBullet: (index, className) => `<button type="button" class="${className}" aria-label="Show ${names[index].toLowerCase()} image"></button>`
      } : false,
      // The images are decorative; the custom status announces only manual changes.
      a11y: { enabled: false }
    });
    if (controls) controls.hidden = false;

    function sync() {
      if (!userPaused && !focused && visible && !document.hidden) slider.autoplay.start();
      else slider.autoplay.stop();
      if (pause) {
        pause.setAttribute('aria-label', userPaused ? 'Play slideshow' : 'Pause slideshow');
        pause.setAttribute('aria-pressed', String(userPaused));
        pause.firstElementChild.textContent = userPaused ? '\u25b6' : '\u275a\u275a';
      }
    }
    function updateCurrent() {
      const bullets = (paginationEl || controls)?.querySelectorAll('.swiper-pagination-bullet');
      bullets?.forEach((bullet, index) => {
        if (index === slider.realIndex) bullet.setAttribute('aria-current', 'true');
        else bullet.removeAttribute('aria-current');
      });
    }
    slider.on('slideChange', updateCurrent);
    updateCurrent();
    if (pause) {
      pause.addEventListener('click', () => {
        userPaused = !userPaused;
        // An explicit Play action can resume while the control still has focus.
        if (!userPaused) { focused = false; hovered = false; }
        sync();
        if (status) status.textContent = userPaused ? 'Slideshow paused.' : 'Slideshow playing.';
      });
    }
    if (paginationEl) {
      paginationEl.addEventListener('click', event => {
        if (!event.target.closest('button')) return;
        if (status) status.textContent = `${names[slider.realIndex]}, image ${slider.realIndex + 1} of ${names.length}.`;
      });
    }
    if (controls) {
      controls.addEventListener('click', event => {
        if (!event.target.closest('button') || event.target.closest('.bahmas-hero-pause')) return;
        if (status) status.textContent = `${names[slider.realIndex]}, image ${slider.realIndex + 1} of ${names.length}.`;
      });
      controls.addEventListener('keydown', event => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        if (event.key === 'ArrowLeft') slider.slidePrev();
        else slider.slideNext();
        if (status) status.textContent = `${names[slider.realIndex]}, image ${slider.realIndex + 1} of ${names.length}.`;
      });
    }
    hero.addEventListener('focusin', () => { focused = true; sync(); });
    hero.addEventListener('focusout', () => requestAnimationFrame(() => { focused = hero.contains(document.activeElement); sync(); }));
    document.addEventListener('visibilitychange', sync);
    preference.addEventListener('change', () => {
      slider.params.speed = preference.matches ? 0 : 900;
      if (preference.matches) userPaused = true;
      sync();
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }, { threshold: .05 }).observe(hero);
    }
    sync();
  }
  document.querySelectorAll('.swiper:not([data-hero-slider])').forEach(element => {
    if (element.swiper) return;
    new Swiper(element, {
  autoplay: {
    delay: 4000,
    disableOnInteraction: false
  },
  loop: true,
  spaceBetween: 0,
  effect: "creative",
  speed: 1500, // transition speed

  creativeEffect: {
    prev: {
      // Zoom out (shrink + fade)
      scale: 1.1,
      opacity: 0,
      translate: [0, 0, 0], // stay centered
    },
    next: {
      // Zoom in (grow + fade in)
      scale: 1.3,
      opacity: 0,
      translate: [0, 0, 0], // stay centered
    },
  },

  navigation: {
    nextEl: ".swiper-button-next",
    prevEl: ".swiper-button-prev",
  },
  pagination: {
    el: false,
    clickable: false,
  },
});
  });
})();
