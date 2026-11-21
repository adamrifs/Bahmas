(() => {
    const form = document.getElementById('contact_form');
    if (!form) return;
    const button = form.querySelector('[type="submit"]');
    const status = document.getElementById('contact-form-status');
    const successDialog = document.getElementById('contact-success-dialog');
    successDialog.addEventListener('close', () => button.focus());
    const showStatus = (message, state) => { status.textContent = message; status.dataset.state = state; };
    form.addEventListener('input', event => { event.target.setCustomValidity?.(''); });
    form.addEventListener('submit', async event => {
        event.preventDefault();
        if (button.disabled) return;
        for (const field of form.querySelectorAll('[required]')) field.setCustomValidity(field.value.trim() ? '' : 'Please complete this field.');
        if (!form.reportValidity()) return;
        const endpoint = form.dataset.endpoint.trim();
        if (!endpoint) {
            showStatus('Online messaging is currently unavailable. Please call +974 40014111 or email info@bhamasqatar.com to contact our team.', 'error');
            return;
        }
        button.disabled = true;
        button.textContent = 'Sending…';
        form.setAttribute('aria-busy', 'true');
        showStatus('Sending your message…', 'loading');
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        try {
            const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(Object.fromEntries([...new FormData(form)].map(([key, value]) => [key, String(value).trim()]))), signal: controller.signal });
            if (!response.ok) throw new Error('Delivery failed');
            const result = await response.json();
            if (result.success !== true) throw new Error('Delivery was not confirmed');
            form.reset();
            showStatus('', 'success');
            successDialog.showModal();
        } catch {
            showStatus('Your message could not be sent. Please try again, call +974 40014111 or email info@bhamasqatar.com.', 'error');
        } finally {
            clearTimeout(timeout);
            button.disabled = false;
            button.textContent = 'Send Message';
            form.removeAttribute('aria-busy');
        }
    });

    // Preload the map in the background without blocking initial page presentation
    const mapIframe = document.querySelector('.contact-map[data-src]');
    if (mapIframe) {
        let loaded = false;
        const loadMap = () => {
            if (loaded) return;
            loaded = true;
            if (mapIframe.dataset.src) {
                mapIframe.src = mapIframe.dataset.src;
                mapIframe.removeAttribute('data-src');
            }
        };

        // Start loading the map as soon as the main thread is idle or after a short delay
        if ('requestIdleCallback' in window) {
            window.requestIdleCallback(loadMap, { timeout: 1000 });
        } else {
            setTimeout(loadMap, 500);
        }

        // Or load immediately on first user scroll / pointer movement
        window.addEventListener('scroll', loadMap, { once: true, passive: true });
        window.addEventListener('pointermove', loadMap, { once: true, passive: true });
        window.addEventListener('touchstart', loadMap, { once: true, passive: true });
    }
})();
