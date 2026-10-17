/* =================================================================
   script.js —— 网站的行为
   -----------------------------------------------------------------
   所有商品、价格、活动都来自 data.js（STORE 对象）。
   这个文件一般不用改，除非要加新功能。
   ================================================================= */

document.documentElement.classList.add('js');

/* 数据兜底：万一 data.js 没加载，页面也不会整个崩掉 */
const STORE = window.STORE || {
  shop: { name: '水果店', phone: '', phoneRaw: '', wechat: '', address: '', hours: '' },
  banner: '',
  notice: '',
  shipping: { freeFrom: 99, fee: 10 },
  discounts: [],
  campaign: { tag: '', title: '活动', desc: '', end: '' },
  coupons: [],
  products: [],
};

/* ---------- 小工具 ---------- */

function esc(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function money(n) {
  return '¥' + Number(n).toFixed(2);
}

// 商品卡上显示的价：39.9 → 39.9，68 → 68.0
function priceText(n) {
  return Number(n).toFixed(1);
}

const toastEl = document.getElementById('toast');
let toastTimer = null;

function toast(message) {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    toastEl.classList.remove('show');
  }, 2200);
}

function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }
  return new Promise(function (resolve, reject) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.top = '-999px';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy') ? resolve() : reject(new Error('复制失败'));
    } catch (err) {
      reject(err);
    } finally {
      document.body.removeChild(ta);
    }
  });
}

/* ---------- 1. 把店铺信息、文案填进页面 ---------- */

const TEXTS = {
  banner: STORE.banner,
  notice: STORE.notice,
  shopName: STORE.shop.name,
  campaignTag: STORE.campaign.tag,
  campaignTitle: STORE.campaign.title,
  campaignDesc: STORE.campaign.desc,
  ctaDesc: '现在下单，送你一盒云南蓝莓试吃装（满 99 元可用）。',
  shipLine: '满 ' + STORE.shipping.freeFrom + ' 元包邮，不满 ' + STORE.shipping.freeFrom + ' 元运费 ' + STORE.shipping.fee + ' 元',
};

document.querySelectorAll('[data-text]').forEach(function (el) {
  const key = el.getAttribute('data-text');
  if (TEXTS[key]) el.textContent = TEXTS[key];
});

document.querySelectorAll('[data-shop="phone"]').forEach(function (el) {
  el.textContent = STORE.shop.phone;
});
document.querySelectorAll('[data-shop="wechat"]').forEach(function (el) {
  el.textContent = STORE.shop.wechat;
});
document.querySelectorAll('[data-shop="address"]').forEach(function (el) {
  el.textContent = STORE.shop.address;
});
document.querySelectorAll('[data-shop="hours"]').forEach(function (el) {
  el.textContent = STORE.shop.hours;
});
document.querySelectorAll('[data-shop-tel]').forEach(function (el) {
  el.setAttribute('href', 'tel:' + STORE.shop.phoneRaw);
});

document.title = STORE.shop.name + ' · 当季水果产地直发，24 小时冷链到家';

const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ---------- 2. 渲染商品 ---------- */

const TINTS = ['#fff3e2', '#ffeeef', '#f3eefc', '#fff6e0', '#ffeef2', '#eef2fc'];
const grid = document.getElementById('product-grid');

function renderProducts() {
  if (!grid) return;

  if (!STORE.products.length) {
    grid.innerHTML = '<p class="cart-empty">商品数据加载失败，请检查 data.js 是否存在。</p>';
    return;
  }

  grid.innerHTML = '';

  STORE.products.forEach(function (p, i) {
    const card = document.createElement('article');
    card.className = 'product reveal';
    card.style.setProperty('--tint', TINTS[i % TINTS.length]);

    const badge = p.badge
      ? '<span class="tag tag-' + esc(p.badgeColor || 'ink') + '">' + esc(p.badge) + '</span>'
      : '';

    const oldPrice = p.oldPrice
      ? '<del>¥' + priceText(p.oldPrice) + '</del>'
      : '';

    card.innerHTML =
      '<div class="product-media">' + badge +
        '<img src="' + esc(p.img) + '" alt="' + esc(p.name) + '" loading="lazy" />' +
      '</div>' +
      '<div class="product-body">' +
        '<h3>' + esc(p.name) + '</h3>' +
        '<p class="origin">' + esc(p.origin) + ' · ' + esc(p.spec) + '</p>' +
        '<div class="product-foot">' +
          '<div class="price"><strong>¥' + priceText(p.price) + '</strong>' + oldPrice + '</div>' +
          '<button class="add-btn" type="button">加入果篮</button>' +
        '</div>' +
      '</div>';

    card.querySelector('.add-btn').addEventListener('click', function () {
      addItem(p);
    });

    grid.appendChild(card);
  });

  observeReveals();
}

/* ---------- 3. 渲染优惠券 ---------- */

const couponBox = document.getElementById('coupons');

function renderCoupons() {
  if (!couponBox) return;
  couponBox.innerHTML = '';

  (STORE.coupons || []).forEach(function (c) {
    const div = document.createElement('div');
    div.className = 'coupon';
    div.innerHTML =
      '<strong>' + esc(c.title) + '</strong>' +
      '<span>' + esc(c.desc) + '</span>' +
      '<button type="button">复制券码 ' + esc(c.code) + '</button>';

    div.querySelector('button').addEventListener('click', function () {
      copyText(c.code).then(function () {
        toast('券码已复制：' + c.code);
      }).catch(function () {
        toast('券码：' + c.code);
      });
    });

    couponBox.appendChild(div);
  });
}

/* ---------- 4. 活动倒计时 ---------- */

function startCountdown() {
  const box = document.getElementById('countdown');
  if (!box) return;

  const end = new Date(STORE.campaign.end).getTime();
  if (isNaN(end)) { box.hidden = true; return; }

  const dEl = document.getElementById('cd-d');
  const hEl = document.getElementById('cd-h');
  const mEl = document.getElementById('cd-m');
  const sEl = document.getElementById('cd-s');

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  function tick() {
    const diff = end - Date.now();
    if (diff <= 0) {
      box.hidden = true;
      return;
    }
    box.hidden = false;

    const day = Math.floor(diff / 86400000);
    const hour = Math.floor(diff % 86400000 / 3600000);
    const min = Math.floor(diff % 3600000 / 60000);
    const sec = Math.floor(diff % 60000 / 1000);

    dEl.textContent = pad(day);
    hEl.textContent = pad(hour);
    mEl.textContent = pad(min);
    sEl.textContent = pad(sec);
  }

  tick();
  setInterval(tick, 1000);
}

/* ---------- 5. 果篮 ---------- */

const cart = document.getElementById('cart');
const overlay = document.getElementById('overlay');
const cartList = document.getElementById('cart-list');
const cartEmpty = document.getElementById('cart-empty');
const cartBadge = document.getElementById('cart-badge');

const sumSubtotal = document.getElementById('sum-subtotal');
const sumShipping = document.getElementById('sum-shipping');
const sumTotal = document.getElementById('sum-total');
const sumDiscount = document.getElementById('sum-discount');
const discountLine = document.getElementById('discount-line');
const cartTip = document.getElementById('cart-tip');

let items = [];
try {
  items = JSON.parse(localStorage.getItem('fruit-cart') || '[]');
  if (!Array.isArray(items)) items = [];
} catch (err) {
  items = [];
}

function saveItems() {
  try {
    localStorage.setItem('fruit-cart', JSON.stringify(items));
  } catch (err) { /* 忽略 */ }
}

function calc() {
  let count = 0;
  let subtotal = 0;

  items.forEach(function (item) {
    count += item.qty;
    subtotal += Number(item.price) * item.qty;
  });

  subtotal = Math.round(subtotal * 100) / 100;

  const freeFrom = Number(STORE.shipping.freeFrom) || 0;
  const fee = Number(STORE.shipping.fee) || 0;

  const shipping = count === 0 ? 0 : (subtotal >= freeFrom ? 0 : fee);

  let discount = 0;
  (STORE.discounts || []).forEach(function (tier) {
    if (subtotal >= Number(tier.min) && Number(tier.off) > discount) {
      discount = Number(tier.off);
    }
  });
  if (count === 0) discount = 0;

  const total = Math.round((subtotal - discount + shipping) * 100) / 100;

  return { count: count, subtotal: subtotal, discount: discount, shipping: shipping, total: total };
}

function renderCart() {
  const sums = calc();

  cartList.innerHTML = '';

  items.forEach(function (item) {
    const li = document.createElement('li');
    li.className = 'cart-item';
    li.innerHTML =
      '<img src="' + esc(item.img) + '" alt="" />' +
      '<div class="ci-info">' +
        '<h4>' + esc(item.name) + '</h4>' +
        '<p>' + esc(item.spec) + '</p>' +
        '<span class="ci-price">' + money(item.price) + ' × ' + item.qty + '</span>' +
      '</div>' +
      '<div class="ci-qty">' +
        '<button type="button" data-act="dec" aria-label="减少一份">−</button>' +
        '<span>' + item.qty + '</span>' +
        '<button type="button" data-act="inc" aria-label="增加一份">+</button>' +
      '</div>';

    li.querySelector('[data-act="dec"]').addEventListener('click', function () {
      changeQty(item.id, -1);
    });
    li.querySelector('[data-act="inc"]').addEventListener('click', function () {
      changeQty(item.id, 1);
    });

    cartList.appendChild(li);
  });

  if (cartEmpty) cartEmpty.hidden = items.length > 0;

  sumSubtotal.textContent = money(sums.subtotal);
  sumShipping.textContent = sums.shipping === 0 ? '¥0.00（包邮）' : money(sums.shipping);
  sumTotal.textContent = money(sums.total);

  if (discountLine) {
    discountLine.hidden = sums.discount <= 0;
    if (sums.discount > 0) sumDiscount.textContent = '-' + money(sums.discount);
  }

  if (cartTip) {
    cartTip.textContent = '满 ' + STORE.shipping.freeFrom + ' 元包邮，不满 ' + STORE.shipping.freeFrom +
      ' 元运费 ' + STORE.shipping.fee + ' 元';
  }

  if (sums.count > 0) {
    cartBadge.hidden = false;
    cartBadge.textContent = sums.count > 99 ? '99+' : String(sums.count);
  } else {
    cartBadge.hidden = true;
  }

  saveItems();
}

function addItem(p) {
  const found = items.find(function (x) { return x.id === p.id; });

  if (found) {
    found.qty += 1;
  } else {
    items.push({
      id: p.id,
      name: p.name,
      spec: p.spec,
      price: Number(p.price),
      img: p.img,
      qty: 1,
    });
  }

  renderCart();
  toast('已放入果篮：' + p.name);
}

function changeQty(id, delta) {
  const item = items.find(function (x) { return x.id === id; });
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) {
    items = items.filter(function (x) { return x.id !== id; });
  }
  renderCart();
}

function openCart() {
  cart.classList.add('open');
  overlay.classList.add('open');
  cart.setAttribute('aria-hidden', 'false');
  document.body.classList.add('no-scroll');
}

function closeCart() {
  cart.classList.remove('open');
  overlay.classList.remove('open');
  cart.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('no-scroll');
}

document.getElementById('cart-open').addEventListener('click', openCart);
document.getElementById('cart-close').addEventListener('click', closeCart);
overlay.addEventListener('click', closeCart);

document.getElementById('cart-clear').addEventListener('click', function () {
  if (items.length === 0) { toast('果篮本来就是空的'); return; }
  items = [];
  renderCart();
  toast('果篮已清空');
});

/* ---------- 6. 复制订单信息 ---------- */

document.getElementById('checkout').addEventListener('click', function () {
  if (items.length === 0) { toast('先挑几样水果吧'); return; }

  const sums = calc();
  const lines = [];

  lines.push('【' + STORE.shop.name + '】果篮订单');
  lines.push('----------------');
  items.forEach(function (item, index) {
    lines.push(
      (index + 1) + '. ' + item.name + '（' + item.spec + '）× ' + item.qty +
      '　' + money(Number(item.price) * item.qty)
    );
  });
  lines.push('----------------');
  lines.push('商品小计：' + money(sums.subtotal));
  if (sums.discount > 0) lines.push('满减优惠：-' + money(sums.discount));
  lines.push('运费：' + (sums.shipping === 0 ? '¥0.00（包邮）' : money(sums.shipping)));
  lines.push('合计：' + money(sums.total));
  lines.push('');
  lines.push('收货人：');
  lines.push('手机号：');
  lines.push('收货地址：');
  lines.push('');
  lines.push('下单后 24 小时内顺丰冷链发出。');
  lines.push('请把这条信息发给客服微信：' + STORE.shop.wechat);

  copyText(lines.join('\n')).then(function () {
    toast('订单信息已复制，发给客服即可下单');
  }).catch(function () {
    toast('复制失败，请截图发给客服');
  });
});

/* ---------- 7. 复制微信号 ---------- */

function bindWechatCopy(id) {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.addEventListener('click', function () {
    copyText(STORE.shop.wechat).then(function () {
      toast('微信号已复制：' + STORE.shop.wechat);
    }).catch(function () {
      toast('微信号：' + STORE.shop.wechat);
    });
  });
}

bindWechatCopy('copy-wechat');
bindWechatCopy('copy-wechat-2');

/* ---------- 8. 手机菜单 ---------- */

const menuBtn = document.getElementById('menu-btn');
const navLinks = document.getElementById('nav-links');

if (menuBtn) {
  menuBtn.addEventListener('click', function () {
    const open = document.body.classList.toggle('nav-open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });

  navLinks.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      document.body.classList.remove('nav-open');
      menuBtn.setAttribute('aria-expanded', 'false');
    });
  });
}

/* ---------- 9. 滚动淡入 ---------- */

let observer = null;

function observeReveals() {
  const els = document.querySelectorAll('.reveal');

  if (!('IntersectionObserver' in window)) {
    els.forEach(function (el) { el.classList.add('in'); });
    return;
  }

  if (!observer) {
    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  }

  els.forEach(function (el) {
    if (!el.classList.contains('in')) observer.observe(el);
  });
}

/* ---------- 10. 启动 ---------- */

renderProducts();
renderCoupons();
startCountdown();
renderCart();
observeReveals();

document.addEventListener('keydown', function (event) {
  if (event.key !== 'Escape') return;
  closeCart();
  if (document.body.classList.contains('nav-open')) {
    document.body.classList.remove('nav-open');
    menuBtn.setAttribute('aria-expanded', 'false');
  }
});
