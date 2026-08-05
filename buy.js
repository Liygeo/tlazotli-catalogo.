(() => {
  const ADMIN_WHATSAPP = '528333074838';
  const PAYMENT_DETAILS = [
    'FORMAS DE PAGO',
    'Banco: Banamex',
    'Tarjeta / cuenta: 5204 1604 0795 7203',
    'Titular: Liliana Martínez',
    '',
    'Después de realizar el pago, por favor comparte tu comprobante para confirmar tu pedido.',
    'Gracias por tu compra.'
  ].join('\n');

  const style = document.createElement('style');
  style.textContent = `
    .purchase-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
    .buy-now-button{border:0;border-radius:999px;padding:10px 14px;background:#1f9d55;color:#fff;font-weight:800;cursor:pointer}
    .buy-now-button:hover{filter:brightness(1.05)}
    @media(max-width:420px){.purchase-actions{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  function openDirectOrder(product) {
    const priceLine = product.price === null
      ? 'Precio: consultar disponibilidad y precio'
      : `Precio: ${product.label}`;

    const message = [
      'Hola, quiero comprar este producto de TLAZOTLI:',
      '',
      `Producto: ${product.name}`,
      `Código: ${product.id}`,
      priceLine,
      'Cantidad: 1',
      '',
      'Mi nombre: ',
      'Forma de pago elegida: ',
      '',
      PAYMENT_DETAILS,
      '',
      '¿Está disponible?'
    ].join('\n');

    window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(message)}`, '_blank');
  }

  function enhanceCards() {
    document.querySelectorAll('.product-card').forEach(card => {
      if (card.dataset.buyEnhanced === 'true') return;

      const code = card.querySelector('.product-code')?.textContent?.trim();
      const product = typeof PRODUCTS !== 'undefined'
        ? PRODUCTS.find(item => item.id === code)
        : null;
      const addButton = card.querySelector('[data-add]');

      if (!product || !addButton) return;

      const actions = document.createElement('div');
      actions.className = 'purchase-actions';

      const buyButton = document.createElement('button');
      buyButton.type = 'button';
      buyButton.className = 'buy-now-button';
      buyButton.textContent = 'Comprar';
      buyButton.setAttribute('aria-label', `Comprar ${product.name} por WhatsApp`);
      buyButton.addEventListener('click', () => openDirectOrder(product));

      addButton.parentElement.insertAdjacentElement('afterend', actions);
      actions.append(addButton, buyButton);
      card.dataset.buyEnhanced = 'true';
    });
  }

  const grid = document.getElementById('product-grid');
  if (grid) {
    const observer = new MutationObserver(enhanceCards);
    observer.observe(grid, { childList: true, subtree: true });
  }

  enhanceCards();
})();
