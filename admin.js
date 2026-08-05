const cfg = window.TLAZOTLI_SUPABASE || {};
const configured = cfg.url && cfg.publicKey && !cfg.url.startsWith('CONFIGURAR_') && !cfg.publicKey.startsWith('CONFIGURAR_');
const configWarning = document.querySelector('#config-warning');
const loginSection = document.querySelector('#login-section');
const adminSection = document.querySelector('#admin-section');
const loginMessage = document.querySelector('#login-message');
const saveMessage = document.querySelector('#save-message');
let client = null;
let productsCache = [];
let editingProduct = null;

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

document.querySelector('#logout-button').addEventListener('click', async () => client.auth.signOut());
document.querySelector('#cancel-edit').addEventListener('click', resetForm);
document.querySelector('#admin-search').addEventListener('input', renderProducts);
document.querySelector('#save-product').addEventListener('click', saveProduct);
document.querySelector('#new-product-shortcut')?.addEventListener('click', () => {
  resetForm();
  window.scrollTo({ top: 260, behavior: 'smooth' });
});

document.querySelector('#show-out-shortcut')?.addEventListener('click', () => {
  document.querySelector('#admin-search').value = 'agotado';
  renderProducts('out');
});

document.querySelector('#show-sale-shortcut')?.addEventListener('click', () => {
  document.querySelector('#admin-search').value = 'oferta';
  renderProducts('sale');
});

async function uploadImage(file, name) {
  if (!file) return null;
  const extension = file.name.split('.').pop().toLowerCase();
  const safeName = `${Date.now()}-${name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}.${extension}`;
  const { error } = await client.storage.from('product-images').upload(safeName, file, { upsert: false });
  if (error) throw new Error(`No se pudo subir la imagen: ${error.message}`);
  const { data } = client.storage.from('product-images').getPublicUrl(safeName);
  return data.publicUrl;
}

async function saveProduct() {
  const name = document.querySelector('#product-name').value.trim();
  const price = Number(document.querySelector('#product-price').value);
  const stock = Number(document.querySelector('#product-stock').value || 0);
  const file = document.querySelector('#product-image').files[0];
  const onSale = document.querySelector('#product-on-sale').checked;
  const saleValue = document.querySelector('#product-sale-price').value.trim();
  const salePrice = saleValue === '' ? null : Number(saleValue);

  if (!name || !Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0) {
    showMessage(saveMessage, 'Completa nombre, precio e inventario correctamente.', true);
    return;
  }
  if (!editingProduct && !file) {
    showMessage(saveMessage, 'Selecciona una fotografía para el producto nuevo.', true);
    return;
  }
  if (onSale && (!Number.isFinite(salePrice) || salePrice < 0 || salePrice >= price)) {
    showMessage(saveMessage, 'El precio de oferta debe ser menor al precio normal.', true);
    return;
  }

  try {
    let imageUrl = editingProduct?.image_url || null;
    if (file) imageUrl = await uploadImage(file, name);

    const payload = {
      name,
      brand: document.querySelector('#product-brand').value.trim() || null,
      price,
      stock,
      category: document.querySelector('#product-category').value,
      description: document.querySelector('#product-description').value.trim() || null,
      image_url: imageUrl,
      active: document.querySelector('#product-active').checked,
      on_sale: onSale,
      sale_price: onSale ? salePrice : null,
      featured: document.querySelector('#product-featured').checked,
      updated_at: new Date().toISOString()
    };

    const query = editingProduct
      ? client.from('products').update(payload).eq('id', editingProduct.id)
      : client.from('products').insert(payload);
    const { error } = await query;
    if (error) throw error;

    if (editingProduct && file && editingProduct.image_url) await removeStoredImage(editingProduct.image_url);
    showMessage(saveMessage, editingProduct ? 'Producto actualizado correctamente.' : 'Producto publicado correctamente.');
    resetForm(false);
    await loadProducts();
  } catch (error) {
    showMessage(saveMessage, error.message || 'No se pudo guardar el producto.', true);
  }
}

function startEdit(id) {
  const p = productsCache.find(item => item.id === id);
  if (!p) return;
  editingProduct = p;
  document.querySelector('#form-title').textContent = `Editar: ${p.name}`;
  document.querySelector('#save-product').textContent = 'Guardar cambios';
  document.querySelector('#cancel-edit').classList.remove('hidden');
  document.querySelector('#product-name').value = p.name || '';
  document.querySelector('#product-brand').value = p.brand || '';
  document.querySelector('#product-price').value = p.price ?? '';
  document.querySelector('#product-stock').value = p.stock ?? 0;
  document.querySelector('#product-category').value = p.category || 'Otros';
  document.querySelector('#product-description').value = p.description || '';
  document.querySelector('#product-active').checked = Boolean(p.active);
  document.querySelector('#product-on-sale').checked = Boolean(p.on_sale);
  document.querySelector('#product-sale-price').value = p.sale_price ?? '';
  document.querySelector('#product-featured').checked = Boolean(p.featured);
  document.querySelector('#product-image').required = false;
  window.scrollTo({ top: 260, behavior: 'smooth' });
}

function resetForm(clearMessage = true) {
  editingProduct = null;
  document.querySelector('#form-title').textContent = 'Agregar producto';
  document.querySelector('#save-product').textContent = 'Guardar producto';
  document.querySelector('#cancel-edit').classList.add('hidden');
  ['#product-name','#product-brand','#product-price','#product-description','#product-image','#product-sale-price'].forEach(selector => document.querySelector(selector).value = '');
  document.querySelector('#product-stock').value = 0;
  document.querySelector('#product-active').checked = true;
  document.querySelector('#product-on-sale').checked = false;
  document.querySelector('#product-featured').checked = false;
  document.querySelector('#product-image').required = false;
  if (clearMessage) saveMessage.classList.add('hidden');
}

async function loadProducts() {
  const container = document.querySelector('#admin-products');
  container.innerHTML = '<p>Cargando…</p>';
  const { data, error } = await client.from('products').select('*').order('created_at', { ascending: false });
  if (error) {
    container.innerHTML = `<p>${error.message}</p>`;
    return;
  }
  productsCache = data || [];
  updateSummary();
  renderProducts();
}

function updateSummary() {
  document.querySelector('#summary-total').textContent = productsCache.length;
  document.querySelector('#summary-active').textContent = productsCache.filter(p => p.active).length;
  document.querySelector('#summary-out').textContent = productsCache.filter(p => Number(p.stock || 0) === 0).length;
  document.querySelector('#summary-sale').textContent = productsCache.filter(p => p.on_sale).length;
}

function renderProducts(forcedFilter = '') {
  const container = document.querySelector('#admin-products');
  const term = document.querySelector('#admin-search').value.trim().toLowerCase();
  let data = productsCache.filter(p => `${p.name} ${p.brand || ''} ${p.category}`.toLowerCase().includes(term));
  if (forcedFilter === 'out') data = productsCache.filter(p => Number(p.stock || 0) === 0);
  if (forcedFilter === 'sale') data = productsCache.filter(p => p.on_sale);
  if (!data.length) {
    container.innerHTML = '<p>No se encontraron productos.</p>';
    return;
  }
  container.innerHTML = data.map(product => {
    const stock = Number(product.stock || 0);
    const displayPrice = product.on_sale && product.sale_price != null
      ? `<strong>$${product.sale_price} MXN</strong> <s>$${product.price}</s>`
      : `<strong>$${product.price} MXN</strong>`;
    return `
      <article class="product-admin-row">
        <img src="${product.image_url || ''}" alt="${escapeHtml(product.name)}">
        <div>
          <strong>${escapeHtml(product.name)}</strong>
          <div class="brand">${escapeHtml(product.category)} · ${displayPrice}</div>
          <div style="margin-top:7px">
            <span class="status-chip">${product.active ? 'Visible' : 'Oculto'}</span>
            <span class="status-chip">Inventario: ${stock}</span>
            ${stock === 0 ? '<span class="status-chip">Agotado</span>' : ''}
            ${product.on_sale ? '<span class="status-chip offer-chip">Oferta</span>' : ''}
            ${product.featured ? '<span class="status-chip offer-chip">Destacado</span>' : ''}
          </div>
        </div>
        <div class="row-actions">
          <button class="small-btn edit-btn" data-edit="${product.id}" type="button">Editar</button>
          <button class="small-btn stock-btn" data-stock-minus="${product.id}" type="button">− Inventario</button>
          <button class="small-btn stock-btn" data-stock-plus="${product.id}" type="button">+ Inventario</button>
          <button class="small-btn offer-btn" data-offer="${product.id}" type="button">${product.on_sale ? 'Quitar oferta' : 'Poner oferta'}</button>
          <button class="small-btn copy-btn" data-duplicate="${product.id}" type="button">Duplicar</button>
          <button class="small-btn toggle-btn" data-toggle="${product.id}" type="button">${product.active ? 'Ocultar' : 'Mostrar'}</button>
          <button class="small-btn danger" data-delete="${product.id}" type="button">Eliminar</button>
        </div>
      </article>`;
  }).join('');

  container.querySelectorAll('[data-edit]').forEach(button => button.addEventListener('click', () => startEdit(button.dataset.edit)));
  container.querySelectorAll('[data-stock-minus]').forEach(button => button.addEventListener('click', () => changeStock(button.dataset.stockMinus, -1)));
  container.querySelectorAll('[data-stock-plus]').forEach(button => button.addEventListener('click', () => changeStock(button.dataset.stockPlus, 1)));
  container.querySelectorAll('[data-offer]').forEach(button => button.addEventListener('click', () => quickOffer(button.dataset.offer)));
  container.querySelectorAll('[data-duplicate]').forEach(button => button.addEventListener('click', () => duplicateProduct(button.dataset.duplicate)));
  container.querySelectorAll('[data-toggle]').forEach(button => button.addEventListener('click', () => toggleVisibility(button.dataset.toggle)));
  container.querySelectorAll('[data-delete]').forEach(button => button.addEventListener('click', () => deleteProduct(button.dataset.delete)));
}

async function changeStock(id, delta) {
  const product = productsCache.find(p => p.id === id);
  if (!product) return;
  const next = Math.max(0, Number(product.stock || 0) + delta);
  const { error } = await client.from('products').update({ stock: next, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) return alert(error.message);
  loadProducts();
}

async function quickOffer(id) {
  const product = productsCache.find(p => p.id === id);
  if (!product) return;
  if (product.on_sale) {
    const { error } = await client.from('products').update({ on_sale: false, sale_price: null, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) return alert(error.message);
    return loadProducts();
  }
  const raw = prompt(`Precio normal: $${product.price} MXN\nEscribe el precio de oferta:`);
  if (raw === null) return;
  const salePrice = Number(raw);
  if (!Number.isFinite(salePrice) || salePrice < 0 || salePrice >= Number(product.price)) {
    return alert('El precio de oferta debe ser menor al precio normal.');
  }
  const { error } = await client.from('products').update({ on_sale: true, sale_price: salePrice, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) return alert(error.message);
  loadProducts();
}

async function duplicateProduct(id) {
  const product = productsCache.find(p => p.id === id);
  if (!product) return;
  const payload = {
    name: `${product.name} (copia)`,
    brand: product.brand,
    price: product.price,
    stock: 0,
    category: product.category,
    description: product.description,
    image_url: product.image_url,
    active: false,
    on_sale: false,
    sale_price: null,
    featured: false
  };
  const { error } = await client.from('products').insert(payload);
  if (error) return alert(error.message);
  loadProducts();
}

async function toggleVisibility(id) {
  const product = productsCache.find(p => p.id === id);
  if (!product) return;
  const { error } = await client.from('products').update({ active: !product.active, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) return alert(error.message);
  loadProducts();
}

async function deleteProduct(id) {
  const product = productsCache.find(p => p.id === id);
  if (!product || !confirm(`¿Eliminar “${product.name}”? Esta acción no se puede deshacer.`)) return;
  const { error } = await client.from('products').delete().eq('id', id);
  if (error) return alert(error.message);
  await removeStoredImage(product.image_url);
  if (editingProduct?.id === id) resetForm();
  loadProducts();
}

async function removeStoredImage(imageUrl) {
  if (!imageUrl) return;
  const marker = '/product-images/';
  const index = imageUrl.indexOf(marker);
  if (index < 0) return;
  const path = decodeURIComponent(imageUrl.slice(index + marker.length));
  await client.storage.from('product-images').remove([path]);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
}
