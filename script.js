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

/* ---------- 6. 结算与付款 ---------- */

const panel = document.getElementById('pay-panel');
const panelForm = document.getElementById('panel-form');
const panelPay = document.getElementById('panel-pay');
const panelStep = document.getElementById('panel-step');
const btnSubmit = document.getElementById('panel-submit');
const btnCopy = document.getElementById('panel-copy');
const btnPaid = document.getElementById('panel-paid');

const ckName = document.getElementById('ck-name');
const ckPhone = document.getElementById('ck-phone');
const ckAddress = document.getElementById('ck-address');
const ckNote = document.getElementById('ck-note');

let currentOrder = null;

function openPanel() {
  panel.classList.add('open');
  panel.setAttribute('aria-hidden', 'false');
  document.body.classList.add('no-scroll');
}

function closePanel() {
  panel.classList.remove('open');
  panel.setAttribute('aria-hidden', 'true');
  if (!cart.classList.contains('open')) document.body.classList.remove('no-scroll');
}

function loadBuyer() {
  try {
    const b = JSON.parse(localStorage.getItem('fruit-buyer') || '{}');
    ckName.value = b.name || '';
    ckPhone.value = b.phone || '';
    ckAddress.value = b.address || '';
  } catch (err) { /* 忽略 */ }
}

function saveBuyer() {
  try {
    localStorage.setItem('fruit-buyer', JSON.stringify({
      name: ckName.value.trim(),
      phone: ckPhone.value.trim(),
      address: ckAddress.value.trim(),
    }));
  } catch (err) { /* 忽略 */ }
}

function renderCheckout() {
  const sums = calc();

  const list = document.getElementById('ck-list');
  list.innerHTML = items.map(function (it) {
    return '<div><span>' + esc(it.name) + ' × ' + it.qty + '</span><span>' +
      money(Number(it.price) * it.qty) + '</span></div>';
  }).join('');

  document.getElementById('ck-subtotal').textContent = money(sums.subtotal);
  document.getElementById('ck-shipping').textContent =
    sums.shipping === 0 ? '¥0.00（包邮）' : money(sums.shipping);
  document.getElementById('ck-total').textContent = money(sums.total);

  const row = document.getElementById('ck-discount-row');
  row.hidden = sums.discount <= 0;
  if (sums.discount > 0) {
    document.getElementById('ck-discount').textContent = '-' + money(sums.discount);
  }
}

function makeOrderNo(phone) {
  const d = new Date();
  const p = function (n) { return n < 10 ? '0' + n : String(n); };
  const tail = String(phone || '').replace(/\D/g, '').slice(-4) || '0000';
  return 'WZ' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) +
    '-' + p(d.getHours()) + p(d.getMinutes()) + '-' + tail;
}

function orderText(order) {
  const lines = [];
  lines.push('【' + STORE.shop.name + '】订单 ' + order.no);
  lines.push('----------------');
  order.items.forEach(function (it, i) {
    lines.push((i + 1) + '. ' + it.name + '（' + it.spec + '）× ' + it.qty +
      '　' + money(Number(it.price) * it.qty));
  });
  lines.push('----------------');
  lines.push('商品小计：' + money(order.subtotal));
  if (order.discount > 0) lines.push('满减优惠：-' + money(order.discount));
  lines.push('运费：' + (order.shipping === 0 ? '¥0.00（包邮）' : money(order.shipping)));
  lines.push('应付金额：' + money(order.total));
  lines.push('');
  lines.push('收货人：' + order.buyer.name);
  lines.push('手机号：' + order.buyer.phone);
  lines.push('收货地址：' + order.buyer.address);
  if (order.buyer.note) lines.push('备注：' + order.buyer.note);
  lines.push('');
  lines.push('付款状态：' + order.status);
  return lines.join('\n');
}

function animateAmount(el, target) {
  const dur = 800;
  const start = performance.now();

  function frame(now) {
    const p = Math.min(1, (now - start) / dur);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = money(target * eased);
    if (p < 1) {
      requestAnimationFrame(frame);
    } else {
      el.textContent = money(target);
    }
  }

  requestAnimationFrame(frame);
}

document.getElementById('checkout').addEventListener('click', function () {
  if (items.length === 0) { toast('先挑几样水果吧'); return; }

  closeCart();
  renderCheckout();
  loadBuyer();

  panelForm.hidden = false;
  panelPay.hidden = true;
  btnSubmit.hidden = false;
  btnCopy.hidden = true;
  btnPaid.hidden = true;
  btnPaid.disabled = false;
  btnPaid.textContent = '我已支付';
  panelStep.textContent = '1 / 2';
  document.getElementById('panel-title').textContent = '确认订单';

  openPanel();
  window.scrollTo(0, 0);
});

document.getElementById('panel-close').addEventListener('click', closePanel);

btnSubmit.addEventListener('click', function () {
  const name = ckName.value.trim();
  const phone = ckPhone.value.trim();
  const address = ckAddress.value.trim();
  const note = ckNote.value.trim();

  if (name.length < 2) { toast('请填写收货人姓名'); ckName.focus(); return; }
  if (!/^1\d{10}$/.test(phone)) { toast('请填写 11 位手机号'); ckPhone.focus(); return; }
  if (address.length < 6) { toast('请填写详细收货地址'); ckAddress.focus(); return; }

  saveBuyer();

  const sums = calc();

  currentOrder = {
    no: makeOrderNo(phone),
    time: new Date().toISOString(),
    items: items.map(function (it) {
      return { name: it.name, spec: it.spec, price: Number(it.price), qty: it.qty };
    }),
    subtotal: sums.subtotal,
    discount: sums.discount,
    shipping: sums.shipping,
    total: sums.total,
    buyer: { name: name, phone: phone, address: address, note: note },
    status: '待付款',
  };

  try {
    const orders = JSON.parse(localStorage.getItem('fruit-orders') || '[]');
    orders.unshift(currentOrder);
    localStorage.setItem('fruit-orders', JSON.stringify(orders.slice(0, 50)));
  } catch (err) { /* 忽略 */ }

  /* 订单已生成，清空果篮，避免重复下单 */
  items = [];
  renderCart();

  panelForm.hidden = true;
  panelPay.hidden = false;
  btnSubmit.hidden = true;
  btnCopy.hidden = false;
  btnPaid.hidden = false;
  panelStep.textContent = '2 / 2';
  document.getElementById('panel-title').textContent = '扫码付款';

  document.getElementById('ck-no').textContent = currentOrder.no;
  animateAmount(document.getElementById('ck-big'), currentOrder.total);

  toast('订单已生成，请按金额付款');
});

btnCopy.addEventListener('click', function () {
  if (!currentOrder) return;
  copyText(orderText(currentOrder)).then(function () {
    toast('订单信息已复制，发给客服即可');
  }).catch(function () {
    toast('复制失败，请截图发给客服');
  });
});

btnPaid.addEventListener('click', function () {
  if (!currentOrder) return;

  currentOrder.status = '已付款待确认';
  copyText(orderText(currentOrder)).then(function () {
    toast('已复制订单，去微信发给客服吧');
  }).catch(function () { /* 忽略 */ });

  btnPaid.disabled = true;
  btnPaid.textContent = '已提交，等待客服确认';

  const tip = document.querySelector('#panel-pay .ck-tip');
  if (tip) {
    tip.textContent = '订单已提交。请把复制的订单信息发给客服，客服确认到账后安排发货。';
  }
});

document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape') closePanel();
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

/* ---------- 11. 物流查询 ---------- */

(function initTracking() {
  const input = document.getElementById('track-input');
  const btn = document.getElementById('track-btn');
  const box = document.getElementById('track-result');
  if (!input || !btn || !box) return;

  // 快递公司 → 快递100 的代码
  const CODES = {
    '顺丰': 'shunfeng', '顺丰速运': 'shunfeng',
    '中通': 'zhongtong', '圆通': 'yuantong', '韵达': 'yunda',
    '申通': 'shentong', '极兔': 'jtexpress', '极兔速递': 'jtexpress',
    '京东': 'jd', '京东物流': 'jd',
    'EMS': 'ems', '邮政': 'youzhengguonei', '德邦': 'debangwuliu',
  };

  function trackUrl(courier, no) {
    const code = CODES[courier] || '';
    return 'https://www.kuaidi100.com/chaxun?com=' + code + '&nu=' + encodeURIComponent(no);
  }

  function card(s) {
    return '<div class="track-card">' +
      '<div class="track-row"><span>快递公司</span><strong>' + esc(s.courier || '—') + '</strong></div>' +
      '<div class="track-row"><span>快递单号</span><strong class="no">' + esc(s.no || '—') + '</strong></div>' +
      '<div class="track-row"><span>发货时间</span><strong>' + esc(s.date || '—') + '</strong></div>' +
      '<div class="track-actions">' +
        '<button class="btn btn-ghost" type="button" data-copy="' + esc(s.no || '') + '">复制单号</button>' +
        '<a class="btn btn-primary" href="' + trackUrl(s.courier, s.no || '') + '" target="_blank" rel="noopener">去查询物流</a>' +
      '</div>' +
    '</div>';
  }

  function search() {
    const q = input.value.trim().toLowerCase();
    if (!q) { toast('请输入订单号或手机尾号'); return; }

    const all = STORE.shipments || [];
    const hits = all.filter(function (s) {
      const orderNo = String(s.orderNo || '').toLowerCase();
      const phone = String(s.phone || '');

      if (orderNo === q) return true;
      if (/^\d{4}$/.test(q) && phone.slice(-4) === q) return true;
      return false;
    });

    if (hits.length === 0) {
      box.hidden = false;
      box.innerHTML = '<p class="track-empty">没有查到单号。<br>' +
        '可能是还没发货，或单号还没录入。可以微信联系客服（' + esc(STORE.shop.wechat) + '）帮你查。</p>';
      return;
    }

    box.hidden = false;
    box.innerHTML = hits.map(card).join('');

    box.querySelectorAll('[data-copy]').forEach(function (b) {
      b.addEventListener('click', function () {
        copyText(b.getAttribute('data-copy')).then(function () {
          toast('单号已复制');
        }).catch(function () {
          toast('复制失败，请长按选择');
        });
      });
    });
  }

  btn.addEventListener('click', search);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') search();
  });
})();
