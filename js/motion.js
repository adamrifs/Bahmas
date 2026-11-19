/* Shared, progressive motion for the Bahmas pages. Content stays usable without JS. */
(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pending = new Set();
    const seen = new WeakSet();
    const initial = new Set();
    const animations = new Set();
    let observer;
    let introStarted = false;

    function reveal(element, delay = 0) {
        pending.delete(element);
        element.classList.remove('motion-pending');
        element.dataset.motionRevealed = 'true';
        if (preference.matches || !element.animate) return;

        const image = element.matches('img');
        const animation = element.animate([
            { opacity: 0, translate: image ? '0 16px' : '0 24px', scale: image ? '.97' : '1' },
            { opacity: 1, translate: '0 0', scale: '1' }
        ], { duration: 650, delay, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'backwards' });
        animations.add(animation);
        animation.onfinish = animation.oncancel = () => animations.delete(animation);
    }

    function delayFor(element) {
        const row = element.closest('.row');
        if (!row) return 0;
        const column = [...row.children].find(child => child.contains(element));
        return Math.max(0, [...row.children].indexOf(column) % 4) * 70;
    }

    function collect(root) {
        const selectors = [
            '#content section h2', '#content section .subtitle',
            '#content section > .container > p', '#content .row > div > p',
            '.bahmas-highlight-card', '.bahmas-service-card', '.bahmas-feature',
            '.about-expertise-card', '.about-benefit-card', '.about-purpose-card',
            '.team-highlight-card', '.team-approach-card', '.air-service-card',
            '.contact-info-card', '.contact-form-card', '.quote-form-card', '.quote-process-card',
            '.about-intro-image', '.about-experience-image', '.team-intro-image',
            '.air-intro-image', '.contact-intro-image', '.contact-assistance-image', '.quote-intro-image',
            '.bahmas-footer-grid > div', '.bahmas-footer-grid > nav'
        ].join(',');
        const candidates = [...root.querySelectorAll(selectors)].filter(element =>
            !element.closest('#subheader, .bahmas-hero, .faq-panel'));
        const groups = new Set(candidates);
        for (const element of candidates) {
            if (seen.has(element)) continue;
            // Reveal a card as one piece rather than animating its text twice.
            let parent = element.parentElement;
            while (parent && !groups.has(parent)) parent = parent.parentElement;
            if (parent) continue;
            seen.add(element);
            if (preference.matches || !observer) continue;
            const bounds = element.getBoundingClientRect();
            if (bounds.top < window.innerHeight && bounds.bottom > 0) {
                if (introStarted) reveal(element, delayFor(element));
                else initial.add(element);
            } else {
                pending.add(element);
                element.classList.add('motion-pending');
                observer.observe(element);
            }
        }
    }

    function introduce() {
        if (introStarted) return;
        introStarted = true;
        initial.forEach(element => reveal(element, delayFor(element)));
        initial.clear();
        document.querySelectorAll('.bahmas-hero-copy > *, #subheader h1, #subheader .crumb')
            .forEach((element, index) => reveal(element, Math.min(index, 4) * 100));
        const heroImage = document.querySelector('.bahmas-hero-image');
        if (heroImage && !preference.matches && heroImage.animate) {
            const animation = heroImage.animate([{ transform: 'scale(1.04)' }, { transform: 'scale(1)' }],
                { duration: 1800, easing: 'cubic-bezier(.2,.7,.2,1)' });
            animations.add(animation);
            animation.onfinish = animation.oncancel = () => animations.delete(animation);
        }
    }

    function prepareMenu() {
        const menu = document.getElementById('mainmenu');
        const header = document.querySelector('header');
        if (!menu || !header) return;
        const mobile = window.matchMedia('(max-width: 993px)');
        const toggles = [...menu.querySelectorAll(':scope > li > span')];
        const sync = () => {
            menu.inert = mobile.matches && !header.classList.contains('menu-open');
            toggles.forEach(toggle => {
                const expanded = toggle.classList.contains('active');
                toggle.setAttribute('aria-expanded', String(expanded));
                toggle.nextElementSibling.inert = mobile.matches && !expanded;
            });
        };
        toggles.forEach((toggle, index) => {
            if (toggle.hasAttribute('role')) return;
            const submenu = toggle.nextElementSibling;
            if (!submenu || submenu.tagName !== 'UL') return;
            submenu.id ||= `navigation-submenu-${index}`;
            toggle.setAttribute('role', 'button');
            toggle.tabIndex = 0;
            toggle.setAttribute('aria-label', `Toggle ${toggle.previousElementSibling.textContent.trim()} submenu`);
            toggle.setAttribute('aria-controls', submenu.id);
            toggle.addEventListener('click', sync);
            toggle.addEventListener('keydown', event => {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                toggle.click();
            });
        });
        sync();
        mobile.addEventListener('change', sync);
        new MutationObserver(sync).observe(header, { attributes: true, attributeFilter: ['class'], subtree: true });
    }

    function start() {
        if ('IntersectionObserver' in window) {
            observer = new IntersectionObserver(entries => {
                for (const entry of entries) {
                    if (!entry.isIntersecting) continue;
                    observer.unobserve(entry.target);
                    reveal(entry.target, delayFor(entry.target));
                }
            }, { rootMargin: '0px 0px -32px 0px', threshold: 0 });
        }
        collect(document);
        document.addEventListener('bahmas:components-ready', () => collect(document));
        document.addEventListener('bahmas:ready', () => {
            prepareMenu();
            // The existing template loader fades out in 500ms.
            window.setTimeout(introduce, 550);
        });
        // A missing optional template plugin must never prevent readable content.
        if (document.readyState === 'complete') window.setTimeout(introduce, 1200);
        else window.addEventListener('load', () => window.setTimeout(introduce, 1200), { once: true });
        document.addEventListener('focusin', event => {
            for (const element of pending) {
                if (element.contains(event.target)) {
                    observer?.unobserve(element);
                    reveal(element);
                }
            }
        });
        preference.addEventListener('change', () => {
            if (!preference.matches) return;
            observer?.disconnect();
            pending.forEach(element => reveal(element));
            initial.forEach(element => reveal(element));
            initial.clear();
            animations.forEach(animation => animation.cancel());
        });
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && document.querySelector('header.menu-open')) {
                const button = document.getElementById('menu-btn');
                button.click();
                button.focus();
            }
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
    else start();
})();
