(() => {
    const figures = document.querySelector('.about-experience-figures');
    if (!figures || !('IntersectionObserver' in window) ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const counters = [...figures.querySelectorAll('[data-count-to]')];
    const duration = 1600;
    const observer = new IntersectionObserver(entries => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        observer.disconnect();

        const started = performance.now();
        counters.forEach(counter => { counter.textContent = '0'; });
        const update = now => {
            const progress = Math.min((now - started) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            counters.forEach(counter => {
                counter.textContent = String(Math.floor(Number(counter.dataset.countTo) * eased));
            });
            if (progress < 1) requestAnimationFrame(update);
        };
        requestAnimationFrame(update);
    }, { threshold: 0.35 });

    observer.observe(figures);
})();
