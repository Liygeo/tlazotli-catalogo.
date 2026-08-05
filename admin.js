const cfg = window.TLAZOTLI_SUPABASE || {};
const configured = cfg.url && cfg.publicKey && !cfg.url.startsWith('CONFIGURAR_') && !cfg.publicKey.startsWith('CONFIGURAR_');
const configWarning = document.querySelector('#config-warning');
const loginSection = document.querySelector('#login-section');
const adminSection = document.querySelector('#admin-section');
const loginMessage = document.querySelector('#login-message');
const saveMessage = document.querySelector('#save-message');
let client = null;

function showMessage(el, text, isError = false) {
  el.textContent = text;
  el.classList.remove('hidden');
  el.style.background = isError ? '#fde8ee' : 'var(--blush)';
}

if (!configured || !window.supabase) {
  configWarning.classList.remove('hidden');
  loginSection.classList.add('hidden');
} else {
  client = window.supabase.createClient(cfg.url, cfg.publicKey);
  initialize();
}

async function initialize() {
  const { data } = await client.auth.getSession();
  setSession(data.session);
  client.auth.onAuthStateChange((_event, session) => setSession(session));
}

function setSession(session) {
  loginSection.classList.toggle('hidden', Boolean(session));
  adminSection.classList.toggle('hidden', !session);
  if (session) loadProducts();
}

document.querySelector('#login-button').addEventListener('click', async () => {
  const email = document.querySelector('#login-email').value.trim();
  const password = document.querySelector('#login-password').value;
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) showMessage(loginMessage, error.message, true);
});

document.querySelector('#logout-button').addEventListener('click', async () => {
  await client.auth.signOut();
});

document.querySelector('#save-product').addEventListener('click', async () => {
  const file = document.querySelector('#product-image').files[0];
  const name = document.querySelector('#product-name').value.trim();
  const price = Number(document.querySelector('#product-price').value);
  if (!file || !name || !Number.isFinite(price)) {
    showMessage(saveMessage, 'Completa nombre, precio y fotografía.', true);
    return;
  }

  const extension = file.name.split('.').pop().toLowerCase();
  const safeName = `${Date.now()}-${name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}.${extension}`;
  const { error: uploadError } = await client.storage.from('product-images').upload(safeName, file, { upsert: false });
  if (uploadError) {
    showMessage(saveMessage, `No se pudo subir la imagen: ${uploadError.message}`, true);
    return;
  }

  const { data: publicData } = client.storage.from('product-images').getPublicUrl(safeName);
  const payload = {
    name,
    brand: document.querySelector('#product-brand').value.trim() || null,
    price,
    category: document.querySelector('#product-category').value,
    description: document.querySelector('#product-description').value.trim() || null,
    image_url: publicData.publicUrl,
    active: document.querySelector('#product-active').checked
  };

  const { error } = await client.from('products').insert(payload);
  if (error) {
    showMessage(saveMessage, `No se pudo guardar: ${error.message}`, true);
    return;
  }

  showMessage(saveMessage, 'Producto publicado correctamente.');
  ['#product-name','#product-brand','#product-price','#product-description','#product-image'].forEach(selector => {
    const el = document.querySelector(selector);
    if (el.type === 'file') el.value = '';
    else el.value = '';
  });
  loadProducts();
});

async function loadProducts() {
  const container = document.querySelector('#admin-products');
  container.innerHTML = '<p>Cargando…</p>';
  const { data, error } = await client.from('products').select('*').order('created_at', { ascending: false });
  if (error) {
    container.innerHTML = `<p>${error.message}</p>`;
    return;
  }
  if (!data.length) {
    container.innerHTML = '<p>No hay productos registrados todavía.</p>';
    return;
  }
  container.innerHTML = data.map(product => `
    <article class="product-admin-row">
      <img src="${product.image_url || ''}" alt="${product.name}">
      <div>
        <strong>${product.name}</strong>
        <div class="brand">${product.category} · $${product.price} MXN</div>
        <div class="brand">${product.active ? 'Visible' : 'Oculto'}</div>
      </div>
      <button class="danger" data-delete="${product.id}" data-image="${product.image_url || ''}" type="button">Eliminar</button>
    </article>
  `).join('');
  container.querySelectorAll('[data-delete]').forEach(button => button.addEventListener('click', () => deleteProduct(button.dataset.delete, button.dataset.image)));
}

async function deleteProduct(id, imageUrl) {
  if (!confirm('¿Eliminar este producto?')) return;
  const { error } = await client.from('products').delete().eq('id', id);
  if (error) {
    alert(error.message);
    return;
  }
  if (imageUrl) {
    const marker = '/product-images/';
    const index = imageUrl.indexOf(marker);
    if (index >= 0) {
      const path = decodeURIComponent(imageUrl.slice(index + marker.length));
      await client.storage.from('product-images').remove([path]);
    }
  }
  loadProducts();
}
