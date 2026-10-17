/* =================================================================
   果园鲜生 · 交互脚本
   -----------------------------------------------------------------
   这里只有 6 件事，从小往大：
     1. 把店铺信息（电话 / 微信 / 地址）填进页面
     2. 手机端的菜单展开收起
     3. 果篮：加、减、算钱、记住
     4. 复制订单信息 / 复制微信号
     5. 滚动到哪，哪一块淡入
     6. 页脚年份
   -----------------------------------------------------------------
   ⚠️ 你要改的东西，几乎都在下面这个 SHOP 对象里（第 20 行左右）。
   ================================================================= */

// 告诉 CSS：JS 已经正常加载了（这样“淡入动画”才不会把内容藏死）
document.documentElement.classList.add('js');


/* ================================================================
   0. 店铺信息 —— 改这里，全站同步更新
   ================================================================ */
const SHOP = {
  name: '果园鲜生',
  phone: '138-0000-0000',      // 显示用的电话
  phoneRaw: '13800000000',     // 打电话用的号码（去掉横线）
  wechat: 'guoyuan-fresh',     // 客服微信号
  address: '云南省昆明市呈贡区',
};


/* ================================================================
   1. 把小工具准备好
   ================================================================ */

// 金额格式化：79.8 → "¥79.80"
function money(n) {
  return '¥' + n.toFixed(2);
}

// 提示条：屏幕下方弹一句话
const toastEl = document.getElementById('toast');
let toastTimer = null;

function toast(message) {
  toastEl.textContent = message;
  toastEl.classList.add('show');

  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    toastEl.classList.remove('show');
  }, 2200);
}

// 复制文字（优先用新版剪贴板 API，失败就退回老办法）
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


/* ================================================================
   2. 把店铺信息填进页面
   ================================================================ */

document.querySelectorAll('[data-shop="phone"]').forEach(function (el) {
  el.textContent = SHOP.phone;
});

document.querySelectorAll('[data-shop="wechat"]').forEach(function (el) {
  el.textContent = SHOP.wechat;
});

document.querySelectorAll('[data-shop="address"]').forEach(function (el) {
  el.textContent = SHOP.address;
});

// 所有“打电话”链接
document.querySelectorAll('[data-shop-tel]').forEach(function (el) {
  el.setAttribute('href', 'tel:' + SHOP.phoneRaw);
});

// 页脚年份
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();


/* ================================================================
   3. 手机端菜单
   ================================================================ */

const menuBtn = document.getElementById('menu-btn');
const navLinks = document.getElementById('nav-links');

if (menuBtn) {
  menuBtn.addEventListener('click', function () {
    const open = document.body.classList.toggle('nav-open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });

  // 点了菜单里的链接，就自动收起来
  navLinks.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      document.body.classList.remove('nav-open');
      menuBtn.setAttribute('aria-expanded', 'false');
    });
  });
}


/* ================================================================
   4. 果篮（购物车）
   ================================================================ */

const cart = document.getElementById('cart');
const overlay = document.getElementById('overlay');
const cartList = document.getElementById('cart-list');
const cartEmpty = document.getElementById('cart-empty');
const cartBadge = document.getElementById('cart-badge');

const sumSubtotal = document.getElementById('sum-subtotal');
const sumShipping = document.getElementById('sum-shipping');
const sumTotal = document.getElementById('sum-total');

const FREE_SHIPPING_FROM = 99;   // 满多少包邮
const SHIPPING_FEE = 10;         // 不满时的运费

// 从浏览器的小抽屉里读出上次的果篮；没有就用空数组
let items = [];
try {
  items = JSON.parse(localStorage.getItem('guoyuan-cart') || '[]');
  if (!Array.isArray(items)) items = [];
} catch (err) {
  items = [];
}

function saveItems() {
  try {
    localStorage.setItem('guoyuan-cart', JSON.stringify(items));
  } catch (err) {
    // 存储被禁用也不影响这次使用
  }
}

// 算钱
function calc() {
  let count = 0;
  let subtotal = 0;

  items.forEach(function (item) {
    count += item.qty;
    subtotal += item.price * item.qty;
  });

  subtotal = Math.round(subtotal * 100) / 100;

  const shipping = count === 0
    ? 0
    : (subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE);

  const total = Math.round((subtotal + shipping) * 100) / 100;

  return { count: count, subtotal: subtotal, shipping: shipping, total: total };
}

// 把果篮画到页面上
function render() {
  const sums = calc();

  // 列表
  cartList.innerHTML = '';

  items.forEach(function (item) {
    const li = document.createElement('li');
    li.className = 'cart-item';

    li.innerHTML =
      '<img src="assets/' + item.id + '.svg" alt="" />' +
      '<div class="ci-info">' +
        '<h4>' + item.name + '</h4>' +
        '<p>' + item.spec + '</p>' +
        '<span class="ci-price">' + money(item.price) + ' × ' + item.qty + '</span>' +
      '</div>' +
      '<div class="ci-qty">' +
        '<button type="button" data-act="dec" data-id="' + item.id + '" aria-label="减少一份">−</button>' +
        '<span>' + item.qty + '</span>' +
        '<button type="button" data-act="inc" data-id="' + item.id + '" aria-label="增加一份">+</button>' +
      '</div>';

    cartList.appendChild(li);
  });

  // 空状态
  cartEmpty.hidden = items.length > 0;

  // 金额
  sumSubtotal.textContent = money(sums.subtotal);
  sumShipping.textContent = sums.shipping === 0 ? '¥0.00（包邮）' : money(sums.shipping);
  sumTotal.textContent = money(sums.total);

  // 导航上的小红点
  if (sums.count > 0) {
    cartBadge.hidden = false;
    cartBadge.textContent = sums.count > 99 ? '99+' : String(sums.count);
  } else {
    cartBadge.hidden = true;
  }

  saveItems();
}

// 加入果篮
function addItem(data) {
  const found = items.find(function (item) {
    return item.id === data.id;
  });

  if (found) {
    found.qty += 1;
  } else {
    items.push({
      id: data.id,
      name: data.name,
      spec: data.spec,
      price: Number(data.price),
      qty: 1,
    });
  }

  render();
  toast('已放入果篮：' + data.name);
}

// 绑定所有“加入果篮”按钮
document.querySelectorAll('[data-add]').forEach(function (btn) {
  btn.addEventListener('click', function () {
    addItem({
      id: btn.dataset.id,
      name: btn.dataset.name,
      spec: btn.dataset.spec,
      price: btn.dataset.price,
    });
  });
});

// 果篮里的加减按钮（用事件委托，按钮是动态生成的）
cartList.addEventListener('click', function (event) {
  const btn = event.target.closest('button[data-act]');
  if (!btn) return;

  const id = btn.dataset.id;
  const item = items.find(function (x) { return x.id === id; });
  if (!item) return;

  if (btn.dataset.act === 'inc') {
    item.qty += 1;
  } else {
    item.qty -= 1;
    if (item.qty <= 0) {
      items = items.filter(function (x) { return x.id !== id; });
    }
  }

  render();
});

// 打开 / 关闭果篮
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

// 清空
document.getElementById('cart-clear').addEventListener('click', function () {
  if (items.length === 0) {
    toast('果篮本来就是空的');
    return;
  }
  items = [];
  render();
  toast('果篮已清空');
});


/* ================================================================
   5. 生成并复制订单信息
   ================================================================ */

const checkoutBtn = document.getElementById('checkout');

checkoutBtn.addEventListener('click', function () {
  if (items.length === 0) {
    toast('先挑几样水果吧');
    return;
  }

  const sums = calc();
  const lines = [];

  lines.push('【' + SHOP.name + '】果篮订单');
  lines.push('----------------');
  items.forEach(function (item, index) {
    lines.push(
      (index + 1) + '. ' + item.name + '（' + item.spec + '）× ' + item.qty +
      '　' + money(item.price * item.qty)
    );
  });
  lines.push('----------------');
  lines.push('商品小计：' + money(sums.subtotal));
  lines.push('运费：' + (sums.shipping === 0 ? '¥0.00（包邮）' : money(sums.shipping)));
  lines.push('合计：' + money(sums.total));
  lines.push('');
  lines.push('收货人：');
  lines.push('手机号：');
  lines.push('收货地址：');
  lines.push('');
  lines.push('下单后 24 小时内顺丰冷链发出。');
  lines.push('请把这条信息发给客服微信：' + SHOP.wechat);

  const text = lines.join('\n');

  copyText(text).then(function () {
    toast('订单信息已复制，发给客服即可下单');
  }).catch(function () {
    toast('复制失败，请截图发给客服');
  });
});


/* ================================================================
   6. 复制微信号（首屏和底部两个按钮）
   ================================================================ */

function bindWechatCopy(id) {
  const btn = document.getElementById(id);
  if (!btn) return;

  btn.addEventListener('click', function () {
    copyText(SHOP.wechat).then(function () {
      toast('微信号已复制：' + SHOP.wechat);
    }).catch(function () {
      toast('微信号：' + SHOP.wechat);
    });
  });
}

bindWechatCopy('copy-wechat');
bindWechatCopy('copy-wechat-2');


/* ================================================================
   7. 滚动时淡入
   ================================================================ */

const revealEls = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  revealEls.forEach(function (el) { observer.observe(el); });
} else {
  revealEls.forEach(function (el) { el.classList.add('in'); });
}


/* ================================================================
   8. 收尾：按 Esc 关闭
   ================================================================ */

document.addEventListener('keydown', function (event) {
  if (event.key !== 'Escape') return;

  closeCart();

  if (document.body.classList.contains('nav-open')) {
    document.body.classList.remove('nav-open');
    menuBtn.setAttribute('aria-expanded', 'false');
  }
});


/* ================================================================
   9. 开始
   ================================================================ */

render();
