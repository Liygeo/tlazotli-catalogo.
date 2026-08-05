const cfg = window.TLAZOTLI_SUPABASE || {};
const client = window.supabase.createClient(cfg.url, cfg.publicKey);
var PRODUCTS = [];
var cart = {};

const $ = selector => document.querySelector(selector);
const grid = $('#product-grid');
const search = $('#search');
const category = $('#category');
const sort = $('#sort');
const count = $('#result-count');

function money(value) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(value);
}

function normalizeProduct(row) {
  const sellingPrice = row.on_sale && row.sale_price != null ? Number(row.sale_price) : (row.price == null ? null : Number(row.price));
  return {
    id: row.code || row.id,
    dbId: row.id,
    name: row.name,
    brand: row.brand || '',
    category: row.category,
    price: sellingPrice,
    normalPrice: row.price == null ? null : Number(row.price),
    salePrice: row.sale_price == null ? null : Number(row.sale_price),
    onSale: Boolean(row.on_sale),
    featured: Boolean(row.featured),
    stock: Number(row.stock || 0),
    label: sellingPrice == null ? 'Consultar precio' : `${money(sellingPrice)} MXN`,
    description: row.description || '',
    image: row.image_url || null,
    active: Boolean(row.active)
  };
}

async function loadCatalog() {
  grid.innerHTML = '<p>Cargando productos…</p>';
  const { data, error } = await client.from('products').select('*').eq('active', true).order('featured', { ascending: false }).order('created_at', { ascending: false });
  if (error) {
    grid.innerHTML = `<p>No se pudo cargar el catálogo: ${error.message}</p>`;
    return;
  }
  PRODUCTS = (data || []).map(normalizeProduct);
  window.PRODUCTS = PRODUCTS;
  initCategories();
  render();
}

function initCategories() {
  category.innerHTML = '<option value="all">Todas</option>';
  [...new Set(PRODUCTS.map(p => p.category))].sort().forEach(item => {
    category.insertAdjacentHTML('beforeend', `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`);
  });
}

function productCard(product) {
  const media = product.image
    ? `<img class="product-photo" src="${encodeURI(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy">`
    : '<span class="product-emoji">📦</span>';
  const unavailable = product.stock === 0;
  const price = product.onSale && product.salePrice != null
    ? `<span class="price">${money(product.salePrice)} MXN</span> <s>${money(product.normalPrice)} MXN</s>`
    : `<span class="price">${product.label}</span>`;
  return `<article class="product-card">
    <div class="product-visual"><span class="product-code">${escapeHtml(product.id)}</span>${media}${unavailable ? '<span class="status-chip">Agotado</span>' : ''}${product.onSale ? '<span class="status-chip offer-chip">Oferta</span>' : ''}</div>
    <div class="product-body">
      <span class="product-category">${escapeHtml(product.category)}</span>
      <h3 class="product-title">${escapeHtml(product.name)}</h3>
      ${product.brand ? `<div class="brand">Marca: ${escapeHtml(product.brand)}</div>` : ''}
      <p class="description">${escapeHtml(product.description)}</p>
      <div class="card-bottom">${price}<button class="add-button" data-add="${escapeHtml(product.id)}" ${unavailable ? 'disabled' : ''}>${unavailable ? 'Agotado' : 'Agregar'}</button></div>
    </div>
  </article>`;
}

function render() {
  const term = search.value.trim().toLowerCase();
  let items = PRODUCTS.filter(product => (category.value === 'all' || product.category === category.value) && `${product.name} ${product.brand} ${product.category} ${product.description}`.toLowerCase().includes(term));
  if (sort.value === 'featured') items.sort((a, b) => Number(b.featured) - Number(a.featured));
  if (sort.value === 'price-asc') items.sort((a, b) => (a.price ?? 1e9) - (b.price ?? 1e9));
  if (sort.value === 'price-desc') items.sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
  if (sort.value === 'name') items.sort((a, b) => a.name.localeCompare(b.name));
  grid.innerHTML = items.map(productCard).join('');
  count.textContent = `${items.length} productos`;
  document.querySelectorAll('[data-add]').forEach(button => button.addEventListener('click', () => add(button.dataset.add)));
}

function add(id) {
  cart[id] = (cart[id] || 0) + 1;
  updateCart();
}

function change(id, delta) {
  cart[id] = (cart[id] || 0) + delta;
  if (cart[id] <= 0) delete cart[id];
  updateCart();
}

function updateCart() {
  const entries = Object.entries(cart);
  const units = entries.reduce((sum, [, quantity]) => sum + quantity, 0);
  $('#cart-count').textContent = units;
  $('#cart-units').textContent = units;
  let total = 0;
  $('#cart-items').innerHTML = entries.length ? entries.map(([id, quantity]) => {
    const product = PRODUCTS.find(item => item.id === id);
    if (product.price != null) total += product.price * quantity;
    return `<div class="cart-item"><div><h3>${escapeHtml(product.name)}</h3><div class="cart-meta">${product.label}</div><div class="qty"><button data-minus="${escapeHtml(id)}">−</button><strong>${quantity}</strong><button data-plus="${escapeHtml(id)}">+</button></div></div><button class="remove" data-remove="${escapeHtml(id)}">Quitar</button></div>`;
  }).join('') : '<div class="empty-cart">Tu pedido está vacío.</div>';
  $('#cart-total').textContent = `${money(total)} MXN`;
  document.querySelectorAll('[data-minus]').forEach(button => button.addEventListener('click', () => change(button.dataset.minus, -1)));
  document.querySelectorAll('[data-plus]').forEach(button => button.addEventListener('click', () => change(button.dataset.plus, 1)));
  document.querySelectorAll('[data-remove]').forEach(button => button.addEventListener('click', () => { delete cart[button.dataset.remove]; updateCart(); }));
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
}

search.addEventListener('input', render);
category.addEventListener('change', render);
sort.addEventListener('change', render);
$('#cart-button').addEventListener('click', () => { $('#cart-panel').classList.add('open'); $('#overlay').classList.add('show'); });
$('#close-cart').addEventListener('click', () => { $('#cart-panel').classList.remove('open'); $('#overlay').classList.remove('show'); });
$('#overlay').addEventListener('click', () => { $('#cart-panel').classList.remove('open'); $('#overlay').classList.remove('show'); });
$('#clear-cart').addEventListener('click', () => { cart = {}; updateCart(); });

loadCatalog();