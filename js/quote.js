(() => {
    const form = document.getElementById('quote_request_form');
    if (!form) return;
    const button = form.querySelector('[type="submit"]');
    const status = document.getElementById('quote-form-status');
    const successDialog = document.getElementById('quote-success-dialog');
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
            showStatus('Online quote requests are currently unavailable. Please use the Contact Us page to discuss your shipment.', 'error');
            return;
        }
        button.disabled = true;
        button.textContent = 'Submitting…';
        form.setAttribute('aria-busy', 'true');
        showStatus('Submitting your quote request…', 'loading');
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
            showStatus('Your quote request could not be submitted. Please try again or contact our team for assistance.', 'error');
        } finally {
            clearTimeout(timeout);
            button.disabled = false;
            button.textContent = 'Request a Quote';
            form.removeAttribute('aria-busy');
        }
    });
})();
