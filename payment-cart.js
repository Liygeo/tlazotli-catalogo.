(() => {
  const ADMIN_WHATSAPP = '528333074838';
  const paymentBlock = [
    'FORMAS DE PAGO',
    'Banco: Banamex',
    'Tarjeta / cuenta: 5204 1604 0795 7203',
    'Titular: Liliana Martínez',
    '',
    'Después de realizar el pago, por favor comparte tu comprobante para confirmar tu pedido.',
    'Gracias por tu compra.'
  ].join('\n');

  function sendCartWithPayment() {
    const entries = Object.entries(typeof cart !== 'undefined' ? cart : {});
    if (!entries.length) {
      if (typeof toast === 'function') toast('Agrega al menos un producto');
      return;
    }

    let total = 0;
    const lines = entries.map(([id, quantity]) => {
      const product = typeof PRODUCTS !== 'undefined'
        ? PRODUCTS.find(item => item.id === id)
        : null;
      if (!product) return null;
      if (product.price) total += product.price * quantity;
      return `• ${product.name} x${quantity} — ${product.label}`;
    }).filter(Boolean);

    const formattedTotal = typeof money === 'function'
      ? money(total)
      : `$${total.toLocaleString('es-MX')}`;

    const message = [
      'Hola, quiero realizar el siguiente pedido en TLAZOTLI:',
      '',
      ...lines,
      '',
      `Total estimado: ${formattedTotal} MXN`,
      '',
      'Nombre: ',
      'Forma de pago elegida: ',
      '',
      paymentBlock
    ].join('\n');

    window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(message)}`, '_blank');
  }

  const button = document.getElementById('whatsapp-order');
  if (button) button.onclick = sendCartWithPayment;
})();
