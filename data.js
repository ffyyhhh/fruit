/* =================================================================
   data.js —— 全站的数据（商品、价格、活动、联系方式）
   -----------------------------------------------------------------
   ★ 这个文件就是你的“后台数据”。改这里，网站就变。
   ★ 但更推荐你用 admin.html（可视化后台）改，改完导出这个文件覆盖上去。
   ================================================================= */

window.STORE = {

  /* ---------- 1. 店铺信息 ---------- */
  shop: {
    name: '王总水果店',
    phone: '188-2335-6789',
    phoneRaw: '18823356789',
    wechat: 'facai168',
    address: '广东省化州市',
    hours: '每天 8:00 – 21:00',
  },

  /* ---------- 2. 文案 ---------- */
  banner: '🚚 满 99 元顺丰包邮 · 坏果包赔 · 今日下单，明日开吃',
  notice: '🌿 本周到货：云南蓝莓 · 丹东草莓',

  /* ---------- 3. 运费与满减 ---------- */
  shipping: {
    freeFrom: 99,   // 满多少包邮
    fee: 10,        // 不满时的运费
  },

  // 满减阶梯：达到 min 就减 off。系统自动取“最划算”的那一档
  discounts: [
    { min: 199, off: 20 },
    { min: 99, off: 10 },
  ],

  /* ---------- 4. 活动 ---------- */
  campaign: {
    tag: '限定',
    title: '十月尝鲜节',
    desc: '满 199 减 20 · 满 99 减 10 · 再送云南蓝莓试吃装一份',
    end: '2026-11-30T23:59:59',   // 倒计时结束时间
  },

  // 优惠券（只能展示和复制券码，线下核销）
  coupons: [
    { code: 'FRUIT10', title: '满 99 减 10', desc: '全场通用 · 不限品类' },
    { code: 'NEW5', title: '新客立减 5', desc: '首单可用 · 与其他优惠同享' },
  ],

  /* ---------- 5. 商品 ----------
     badge：角标文字（留空不显示）
     badgeColor：orange / purple / green / ink
     img：图片路径（放在 assets 里）
  */
  products: [
    { id: 'orange',     name: '赣南脐橙',       spec: '5 斤装',  origin: '江西赣州', price: 88, oldPrice: 49.9, badge: '人气', badgeColor: 'orange', img: 'assets/orange.jpg' },
    { id: 'strawberry', name: '丹东草莓',       spec: '2 斤装',  origin: '辽宁丹东', price: 168,   oldPrice: 88,   badge: '当季', badgeColor: 'orange', img: 'assets/strawberry.jpg' },
    { id: 'grape',      name: '阳光玫瑰葡萄',   spec: '3 斤装',  origin: '云南宾川', price: 159.9, oldPrice: 79,   badge: '人气', badgeColor: 'ink',    img: 'assets/grape.jpg' },
    { id: 'mango',      name: '海南贵妃芒',     spec: '5 斤装',  origin: '海南三亚', price: 145,   oldPrice: 55,   badge: '当季', badgeColor: 'orange', img: 'assets/mango.jpg' },
    { id: 'peach',      name: '阳山水蜜桃',     spec: '6 个装',  origin: '江苏无锡', price: 178,   oldPrice: 98,   badge: '爆款', badgeColor: 'purple', img: 'assets/peach.jpg' },
    { id: 'blueberry',  name: '云南蓝莓',       spec: '4 盒装',  origin: '云南澄江', price: 189,   oldPrice: 109,  badge: '新到', badgeColor: 'green',  img: 'assets/blueberry.jpg' },

    { id: 'apple',      name: '烟台红富士',     spec: '5 斤装',  origin: '山东烟台', price: 129.9, oldPrice: 39.9, badge: '当季', badgeColor: 'orange', img: 'assets/apple.svg' },
    { id: 'cherry',     name: '智利车厘子',     spec: '2 斤装',  origin: '智利进口', price: 1128,  oldPrice: 158,  badge: '超甜', badgeColor: 'orange', img: 'assets/cherry.svg' },
    { id: 'kiwi',       name: '徐香猕猴桃',     spec: '12 个装', origin: '陕西眉县', price: 145,   oldPrice: 55,   badge: '人气', badgeColor: 'ink',    img: 'assets/kiwi.svg' },
    { id: 'watermelon', name: '宁夏硒砂瓜',     spec: '1 个装',  origin: '宁夏中卫', price: 139,   oldPrice: 49,   badge: '当季', badgeColor: 'orange', img: 'assets/watermelon.svg' },
    { id: 'lemon',      name: '安岳黄柠檬',     spec: '3 斤装',  origin: '四川安岳', price: 125,   oldPrice: 32,   badge: '新到', badgeColor: 'green',  img: 'assets/lemon.svg' },
    { id: 'pear',       name: '库尔勒香梨',     spec: '5 斤装',  origin: '新疆库尔勒', price: 149, oldPrice: 59,   badge: '脆甜', badgeColor: 'purple', img: 'assets/pear.svg' },
  ],
};
