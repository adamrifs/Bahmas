(async function () {
    async function includeComponent(element) {
        const path = element.dataset.include;
        const url = new URL(path, document.baseURI);
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to load component "${path}": ${response.status}`);
        }

        const template = document.createElement('template');
        template.innerHTML = await response.text();
        element.replaceWith(template.content);
    }

    function loadScript(path) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = new URL(path, document.baseURI).href;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Failed to load script "${path}"`));
            document.body.appendChild(script);
        });
    }

    try {
        const componentElements = document.querySelectorAll('[data-include]');
        await Promise.all(Array.from(componentElements, includeComponent));
        document.dispatchEvent(new Event('bahmas:components-ready'));

        const header = document.querySelector('header');
        if (header) {
            const updateHeaderBackground = () => {
                header.classList.toggle('is-scrolled', window.scrollY > 20);
            };
            updateHeaderBackground();
            window.addEventListener('scroll', updateHeaderBackground, { passive: true });
        }

        for (const path of [
            'js/plugins.js',
            'js/designesia.js',
            'js/swiper.js',
            'js/custom-swiper-1.js',
            'js/custom-marquee.js'
        ]) {
            await loadScript(path);
        }

        if (document.readyState === 'complete') {
            window.dispatchEvent(new Event('load'));
        }
        document.dispatchEvent(new Event('bahmas:ready'));
    } catch (error) {
        console.error('Unable to initialize shared page components.', error);
    }
})();
