(() => {
  const cfg = window.TLAZOTLI_SUPABASE || {};
  if (!window.supabase || !cfg.url || !cfg.publicKey) return;
  const marketingClient = window.supabase.createClient(cfg.url, cfg.publicKey);
  const sessionKey = 'tlazotli_session_id';
  let sessionId = localStorage.getItem(sessionKey);
  if (!sessionId) {
    sessionId = (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);
    localStorage.setItem(sessionKey, sessionId);
  }

  async function track(productCode, eventType) {
    const product = (window.PRODUCTS || []).find(p => p.id === productCode);
    if (!product?.dbId) return;
    await marketingClient.from('product_events').insert({
      product_id: product.dbId,
      event_type: eventType,
      session_id: sessionId
    });
  }

  document.addEventListener('click', event => {
    const addButton = event.target.closest('[data-add]');
    if (addButton) track(addButton.dataset.add, 'cart');

    const card = event.target.closest('.product-card');
    if (card && !addButton) {
      const code = card.querySelector('.product-code')?.textContent?.trim();
      if (code) track(code, 'view');
    }
  });

  const form = document.querySelector('#subscriber-form');
  const message = document.querySelector('#subscriber-message');
  if (!form || !message) return;

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const data = new FormData(form);
    const payload = {
      name: String(data.get('name') || '').trim(),
      whatsapp: String(data.get('whatsapp') || '').replace(/\D/g, ''),
      email: String(data.get('email') || '').trim() || null,
      consent: data.get('consent') === 'on'
    };

    if (!payload.name || payload.whatsapp.length < 10 || !payload.consent) {
      message.textContent = 'Completa nombre, WhatsApp y autorización.';
      return;
    }

    const { error } = await marketingClient.from('subscribers').upsert(payload, { onConflict: 'whatsapp' });
    if (error) {
      message.textContent = `No se pudo completar la suscripción: ${error.message}`;
      return;
    }

    message.textContent = '¡Listo! Ya formas parte de TLAZOTLI y tendrás 5% en tu primera compra.';
    form.reset();
  });
})();
