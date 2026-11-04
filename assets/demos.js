/* EJU 生物 互动演示：纯计算（浏览器与 Node 测试共用） */
(function (G) {
  'use strict';
  var P = {};
  /* —— 血红蛋白氧解离曲线：Hill 式 S = P^n/(P^n+P50^n)，n≈2.7，P50≈26.8 mmHg（pH 7.4, 37 °C）。
     玻尔效应：Δlog P50/ΔpH ≈ −0.48；温度：Δlog P50/ΔT ≈ +0.024 /°C（文献典型值，模型近似） —— */
  P.hill = 2.7; P.P50 = 26.8;
  P.p50 = function (pH, temp) { return P.P50 * Math.pow(10, -0.48 * (pH - 7.4) + 0.024 * (temp - 37)); };
  P.satHb = function (pO2, p50, n) { n = n || P.hill; if (pO2 <= 0) return 0; var a = Math.pow(pO2, n); return a / (a + Math.pow(p50, n)); };
  P.unload = function (sLung, sTis) { return { ofAll: sLung - sTis, ofBound: (sLung - sTis) / sLung }; };
  /* —— 哈迪–温伯格 —— */
  P.hw = function (p) { var q = 1 - p; return { AA: p * p, Aa: 2 * p * q, aa: q * q }; };
  P.qFromAa = function (aa) { return Math.sqrt(aa); };
  /* 对隐性纯合子的选择（适应度 1−s）：q' = q(1−sq)/(1−sq²) */
  P.selectStep = function (q, s) { return q * (1 - s * q) / (1 - s * q * q); };
  /* —— 两对基因的配子与子代表型（独立：r=0.5；连锁 AB/ab：重组率 r） —— */
  P.gametes = function (g, r) { /* g: 'AaBb' 型字符串；对双杂合子 r 给出连锁（相引 AB/ab）；r=0.5 即独立 */
    var A = [g[0], g[1]], B = [g[2], g[3]], out = {};
    function add(k, v) { out[k] = (out[k] || 0) + v; }
    var het = A[0] !== A[1] && B[0] !== B[1];
    if (het && r != null && r !== 0.5) { add(A[0] + B[0], (1 - r) / 2); add(A[1] + B[1], (1 - r) / 2); add(A[0] + B[1], r / 2); add(A[1] + B[0], r / 2); }
    else A.forEach(function (a) { B.forEach(function (b) { add(a + b, 0.25); }); });
    return out;
  };
  P.cross = function (g1, g2, r) {
    var G1 = P.gametes(g1, r), G2 = P.gametes(g2, r), ph = {};
    Object.keys(G1).forEach(function (x) { Object.keys(G2).forEach(function (y) {
      var dA = x[0] === 'A' || y[0] === 'A', dB = x[1] === 'B' || y[1] === 'B', k = (dA ? 'A' : 'a') + (dB ? 'B' : 'b');
      ph[k] = (ph[k] || 0) + G1[x] * G2[y]; }); });
    return ph; /* 表型：AB=[A][B], Ab=[A]bb, aB=aa[B], ab=aabb */
  };
  /* —— 酶反应：米氏方程，可选竞争性／非竞争性抑制 —— */
  P.mm = function (S, Vmax, Km, I, Ki, type) { I = I || 0; Ki = Ki || 1;
    if (type === 'comp') Km = Km * (1 + I / Ki); else if (type === 'noncomp') Vmax = Vmax / (1 + I / Ki);
    return Vmax * S / (Km + S); };
  /* 温度・pH 的影响：示意模型（钟形曲线；仅用于定性说明，最适值为教科书典型值） */
  P.ENZ = { pepsin: { zh: '胃蛋白酶', pH: 2, T: 37 }, amylase: { zh: '唾液淀粉酶', pH: 7, T: 37 }, trypsin: { zh: '胰蛋白酶', pH: 8, T: 37 } };
  P.pHFactor = function (pH, opt) { return Math.exp(-Math.pow((pH - opt) / 1.5, 2)); };
  P.tFactor = function (t, opt) { var up = Math.pow(2, (t - opt) / 10); if (t <= opt) return up; return Math.max(0, 1 - Math.pow((t - opt) / 18, 2)); };
  /* —— 膜电位：能斯特式与 GHK 式（37 °C：RT/F·ln10 ≈ 61.5 mV） —— */
  P.RTF = 8.314 * 310.15 / 96485 * 1000; /* mV */
  P.nernst = function (z, out, inn) { return P.RTF / z * Math.log(out / inn); };
  P.ghk = function (pK, pNa, pCl, Ko, Ki, Nao, Nai, Clo, Cli) { return P.RTF * Math.log((pK * Ko + pNa * Nao + pCl * Cli) / (pK * Ki + pNa * Nai + pCl * Clo)); };
  if (typeof module !== 'undefined' && module.exports) module.exports = P; else G.SCI = P;
})(this);
/* EJU 互动演示（原生 JS + canvas；进入视口才初始化，离开视口暂停） */
(function () {
  'use strict';
  var P = window.SCI, RM = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var COL = {}, ALL = [], REG = {};
  function readCols() {
    var cs = getComputedStyle(document.documentElement);
    ['ink', 'ink-2', 'ink-3', 'line', 'surface', 'surface-2', 'accent', 'accent-soft', 'warn', 'good', 'c1', 'c2', 'c3', 'c4', 'bg'].forEach(function (k) {
      COL[k] = cs.getPropertyValue('--' + k).trim() || '#888';
    });
    COL.dark = document.documentElement.getAttribute('data-theme') === 'dark';
  }
  function fx(v, d) { if (!isFinite(v)) return '∞'; d = d == null ? 2 : d; var s = Math.abs(v) < 1e-9 ? (0).toFixed(d) : v.toFixed(d); return s.replace('-', '−'); }
  function sci(v, d) { if (v === 0) return '0'; var e = Math.floor(Math.log10(Math.abs(v))), m = v / Math.pow(10, e); return fx(m, d == null ? 2 : d) + '×10<sup>' + String(e).replace('-', '−') + '</sup>'; }
  function h(tag, attrs, parent, text) { var e = document.createElement(tag); for (var k in attrs || {}) e.setAttribute(k, attrs[k]); if (text != null) e.textContent = text; if (parent) parent.appendChild(e); return e; }

  function Demo(root, spec) {
    var d = this; d.root = root; d.spec = spec; d.handles = []; d.playing = false; d.visible = false; d.t = 0;
    root.classList.add('demo-on');
    var stage = h('div', { 'class': 'demo-stage' }, root);
    d.cv = h('canvas', { role: 'img', 'aria-label': root.getAttribute('data-title') || '互动演示' }, stage);
    d.ctx = d.cv.getContext('2d');
    d.ctl = h('div', { 'class': 'demo-ctl' }, root);
    d.outEl = h('div', { 'class': 'demo-out', 'aria-live': 'polite' }, root);
    d.aspect = spec.aspect || 1.6;
    d.resize = function () {
      var w = stage.clientWidth || 300, hgt = Math.min(Math.round(w / d.aspect), spec.maxH || 520);
      var r = Math.min(window.devicePixelRatio || 1, 2);
      d.W = w; d.H = hgt; d.cv.width = Math.round(w * r); d.cv.height = Math.round(hgt * r);
      d.cv.style.height = hgt + 'px'; d.ctx.setTransform(r, 0, 0, r, 0, 0);
      if (spec.resize) spec.resize(d);
      d.draw();
    };
    d.draw = function () { var c = d.ctx; c.clearRect(0, 0, d.W, d.H); c.save(); spec.draw(d, c); c.restore(); d.drawHandles(c); };
    var raf = 0, last = 0;
    function frame(ts) {
      raf = 0; var dt = last ? Math.min((ts - last) / 1000, 0.05) : 0; last = ts;
      if (spec.step && dt > 0) spec.step(d, dt);
      d.draw();
      if (d.playing && d.visible) raf = requestAnimationFrame(frame); else last = 0;
    }
    d.kick = function () { if (!raf && d.playing && d.visible) { last = 0; raf = requestAnimationFrame(frame); } };
    d.redraw = function () { if (!raf) { raf = requestAnimationFrame(function (ts) { raf = 0; d.draw(); d.kick(); }); } };
    d.setVisible = function (v) { d.visible = v; if (v) d.kick(); };
    d.play = function (on) { d.playing = on; if (d.playBtn) { d.playBtn.textContent = on ? '暂停' : '播放'; d.playBtn.setAttribute('aria-pressed', on); } if (on) d.kick(); else d.redraw(); };
    /* —— 控件 —— */
    d.slider = function (label, min, max, step, val, fmt, on) {
      var w = h('label', { 'class': 'demo-sl' }, d.ctl), sp = h('span', null, w), inp = h('input', { type: 'range', min: min, max: max, step: step, value: val }, w);
      var o = { v: +val, el: inp, set: function (x) { o.v = +x; inp.value = x; sp.innerHTML = label + '　<b>' + fmt(o.v) + '</b>'; } };
      o.set(val);
      inp.addEventListener('input', function () { o.set(inp.value); if (on) on(o.v); d.redraw(); });
      return o;
    };
    d.seg = function (label, opts, val, on) {
      var w = h('div', { 'class': 'demo-seg', role: 'group', 'aria-label': label }, d.ctl); h('span', null, w, label);
      var o = { v: val, btns: [] };
      opts.forEach(function (op) {
        var b = h('button', { type: 'button', 'aria-pressed': op[0] === val }, w, op[1]);
        b.addEventListener('click', function () { o.v = op[0]; o.btns.forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); if (on) on(o.v); d.redraw(); });
        o.btns.push(b);
      });
      return o;
    };
    d.button = function (label, on) { if (!d.row) d.row = h('div', { 'class': 'demo-row' }, d.ctl); var b = h('button', { type: 'button', 'class': 'demo-btn' }, d.row, label); b.addEventListener('click', function () { on(); d.redraw(); }); return b; };
    d.playToggle = function () { d.playBtn = d.button('播放', function () { d.play(!d.playing); }); d.playBtn.setAttribute('aria-pressed', 'false'); };
    d.out = function (rows, note) {
      var s = '<dl>' + rows.map(function (r) { return '<div><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>'; }).join('') + '</dl>';
      if (note) s += '<p>' + note + '</p>';
      if (s !== d._lastOut) { d.outEl.innerHTML = s; d._lastOut = s; }
    };
    /* —— 可拖动把手（显示 r≈9px，触控命中半径 24px ⇒ 48px 目标） —— */
    d.handle = function (o) { o.r = o.r || 9; d.handles.push(o); return o; };
    d.drawHandles = function (c) {
      d.handles.forEach(function (o) {
        if (o.hidden && o.hidden()) return;
        var p = o.get(); c.save(); c.beginPath(); c.arc(p[0], p[1], o.r + 6, 0, 7); c.fillStyle = COL.dark ? 'rgba(255,255,255,.10)' : 'rgba(0,0,0,.07)'; c.fill();
        c.beginPath(); c.arc(p[0], p[1], o.r, 0, 7); c.fillStyle = o.color ? o.color() : COL.accent; c.fill();
        c.lineWidth = 2; c.strokeStyle = COL.surface; c.stroke(); c.restore();
      });
    };
    function pos(e) { var b = d.cv.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; }
    function hit(p) { var best = null, bd = 24; d.handles.forEach(function (o) { if (o.hidden && o.hidden()) return; var q = o.get(), dd = Math.hypot(q[0] - p[0], q[1] - p[1]); if (dd <= bd) { bd = dd; best = o; } }); return best; }
    var drag = null;
    d.cv.addEventListener('touchstart', function (e) { var t = e.touches[0], b = d.cv.getBoundingClientRect(); if (hit([t.clientX - b.left, t.clientY - b.top])) e.preventDefault(); }, { passive: false });
    d.cv.addEventListener('pointerdown', function (e) { var o = hit(pos(e)); if (!o) return; drag = o; d.cv.setPointerCapture(e.pointerId); e.preventDefault(); d.cv.classList.add('grabbing'); if (o.start) o.start(); });
    d.cv.addEventListener('pointermove', function (e) {
      var p = pos(e);
      if (drag) { drag.set(p[0], p[1]); d.redraw(); return; }
      if (e.pointerType === 'mouse') d.cv.classList.toggle('grab', !!hit(p));
    });
    function up() { if (drag && drag.end) drag.end(); drag = null; d.cv.classList.remove('grabbing'); d.redraw(); }
    d.cv.addEventListener('pointerup', up); d.cv.addEventListener('pointercancel', up);
    d.dragging = function () { return !!drag; };
    spec.init(d);
    if (spec.animated) { d.playToggle(); d.playing = !RM.matches; d.play(d.playing); }
    if (window.ResizeObserver) new ResizeObserver(function () { if (stage.clientWidth !== d.W) d.resize(); }).observe(stage);
    d.resize();
  }
  /* —— 绘图工具 —— */
  function arrow(c, x1, y1, x2, y2, col, w, label, lpos) {
    var L = Math.hypot(x2 - x1, y2 - y1); c.save(); c.strokeStyle = c.fillStyle = col; c.lineWidth = w || 2.5;
    if (L > 1) {
      var a = Math.atan2(y2 - y1, x2 - x1), hd = Math.min(10, L * 0.45);
      c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2 - Math.cos(a) * hd * 0.6, y2 - Math.sin(a) * hd * 0.6); c.stroke();
      c.beginPath(); c.moveTo(x2, y2); c.lineTo(x2 - hd * Math.cos(a - 0.4), y2 - hd * Math.sin(a - 0.4)); c.lineTo(x2 - hd * Math.cos(a + 0.4), y2 - hd * Math.sin(a + 0.4)); c.closePath(); c.fill();
    }
    if (label) { c.font = '600 13px system-ui,"PingFang SC","Hiragino Sans","Noto Sans CJK SC","Noto Serif CJK SC",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; var lp = lpos || 14, ang = Math.atan2(y2 - y1, x2 - x1);
      txt(c, label, x2 + Math.cos(ang) * lp, y2 + Math.sin(ang) * lp, col); }
    c.restore();
  }
  function txt(c, s, x, y, col, font, align, base) {
    c.save(); c.font = font || '13px system-ui,"PingFang SC","Noto Sans CJK SC","Noto Serif CJK SC",sans-serif'; c.textAlign = align || 'center'; c.textBaseline = base || 'middle';
    c.lineWidth = 3; c.strokeStyle = COL.surface; c.lineJoin = 'round'; c.strokeText(s, x, y); c.fillStyle = col || COL.ink; c.fillText(s, x, y); c.restore();
  }
  function line(c, pts, col, w, dash) { c.save(); c.strokeStyle = col; c.lineWidth = w || 1.5; if (dash) c.setLineDash(dash); c.beginPath(); pts.forEach(function (p, i) { i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); }); c.stroke(); c.restore(); }
  function dot(c, x, y, r, col) { c.beginPath(); c.arc(x, y, r, 0, 7); c.fillStyle = col; c.fill(); }
  /* 线性映射：世界坐标 → 屏幕 */
  function Map(x0, x1, y0, y1, L, R, T, B) {
    var m = { x0: x0, x1: x1, y0: y0, y1: y1, L: L, R: R, T: T, B: B };
    m.X = function (x) { return m.L + (x - m.x0) / (m.x1 - m.x0) * (m.R - m.L); };
    m.Y = function (y) { return m.B - (y - m.y0) / (m.y1 - m.y0) * (m.B - m.T); };
    m.ix = function (X) { return m.x0 + (X - m.L) / (m.R - m.L) * (m.x1 - m.x0); };
    m.iy = function (Y) { return m.y0 + (m.B - Y) / (m.B - m.T) * (m.y1 - m.y0); };
    return m;
  }
  function axes(c, m, xl, yl, xt, yt) {
    c.save(); c.strokeStyle = COL.line; c.lineWidth = 1; c.font = '11px system-ui,"PingFang SC","Hiragino Sans","Noto Sans CJK SC","Noto Serif CJK SC",sans-serif'; c.fillStyle = COL['ink-3'];
    if (xt) for (var x = Math.ceil(m.x0 / xt) * xt; x <= m.x1 + 1e-9; x += xt) { c.beginPath(); c.moveTo(m.X(x), m.T); c.lineTo(m.X(x), m.B); c.stroke(); c.textAlign = 'center'; c.textBaseline = 'top'; c.fillText(+x.toFixed(6), m.X(x), m.B + 3); }
    if (yt) for (var y = Math.ceil(m.y0 / yt) * yt; y <= m.y1 + 1e-9; y += yt) { c.beginPath(); c.moveTo(m.L, m.Y(y)); c.lineTo(m.R, m.Y(y)); c.stroke(); c.textAlign = 'right'; c.textBaseline = 'middle'; c.fillText(+y.toFixed(6), m.L - 4, m.Y(y)); }
    c.strokeStyle = COL['ink-3']; c.lineWidth = 1.5; var zy = Math.max(m.T, Math.min(m.B, m.Y(0))), zx = Math.max(m.L, Math.min(m.R, m.X(0)));
    c.beginPath(); c.moveTo(m.L, zy); c.lineTo(m.R, zy); c.moveTo(zx, m.T); c.lineTo(zx, m.B); c.stroke(); c.restore();
    if (xl) txt(c, xl, m.R - 4, zy - 10, COL['ink-2'], null, 'right');
    if (yl) txt(c, yl, zx + 6, m.T + 8, COL['ink-2'], null, 'left');
  }
  function bars(c, x, y, w, hgt, items, max, title) { /* 竖直柱状图 items=[[label,val,col]] */
    var n = items.length, bw = w / n; txt(c, title || '', x + w / 2, y - 10, COL['ink-2'], '600 12px system-ui,"PingFang SC","Hiragino Sans","Noto Sans CJK SC","Noto Serif CJK SC",sans-serif');
    line(c, [[x, y + hgt], [x + w, y + hgt]], COL['ink-3'], 1);
    items.forEach(function (it, i) {
      var v = it[1], bh = Math.min(Math.abs(v) / (max || 1), 1.05) * hgt * (v < 0 ? 0 : 1);
      c.fillStyle = it[2]; c.fillRect(x + i * bw + bw * 0.18, y + hgt - bh, bw * 0.64, bh);
      txt(c, it[0], x + i * bw + bw / 2, y + hgt + 11, COL['ink-2'], '12px system-ui,"PingFang SC","Hiragino Sans","Noto Sans CJK SC","Noto Serif CJK SC",sans-serif');
    });
  }
  var DM = window.EJUDemo = { reg: function (n, f) { REG[n] = f; }, P: P, COL: COL, fx: fx, sci: sci, arrow: arrow, txt: txt, line: line, dot: dot, Map: Map, axes: axes, bars: bars };
  function boot() {
    readCols();
    var els = [].slice.call(document.querySelectorAll('.demo[data-demo]'));
    function init(el) { if (el._demo || !REG[el.getAttribute('data-demo')]) return; try { el._demo = new Demo(el, REG[el.getAttribute('data-demo')]()); ALL.push(el._demo); } catch (err) { el.textContent = '演示加载失败'; throw err; } }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) init(e.target); if (e.target._demo) e.target._demo.setVisible(e.isIntersecting); }); }, { rootMargin: '150px 0px' });
      els.forEach(function (el) { io.observe(el); });
    } else els.forEach(function (el) { init(el); el._demo.setVisible(true); });
    new MutationObserver(function () { readCols(); ALL.forEach(function (d) { d.redraw(); }); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    if (RM.addEventListener) RM.addEventListener('change', function () { if (RM.matches) ALL.forEach(function (d) { if (d.playBtn) d.play(false); }); });
  }
  DM.boot = boot;
})();
(function () {
  'use strict';
  var D = window.EJUDemo, P = D.P, C = D.COL, fx = D.fx, sci = D.sci, arrow = D.arrow, txt = D.txt, line = D.line, dot = D.dot, Map = D.Map, axes = D.axes, bars = D.bars;
  var F12 = '12px system-ui,"PingFang SC","Hiragino Sans","Noto Sans CJK SC",sans-serif', F14 = '600 14px system-ui,"PingFang SC","Hiragino Sans","Noto Sans CJK SC",sans-serif';
  function pct(v) { return fx(v * 100, 1) + ' %'; }

  /* ① 氧解离曲线与玻尔效应 */
  D.reg('hb', function () {
    var m, pH, T, pt;
    return { aspect: 1.55, maxH: 500,
      init: function (d) {
        pH = d.slider('组织的 pH（CO₂ 多 → pH 低）', 7.0, 7.6, 0.01, 7.2, function (v) { return fx(v, 2); });
        T = d.slider('组织温度 [°C]', 33, 42, 0.5, 37, function (v) { return fx(v, 1); });
        pt = d.slider('组织的 P<sub>O₂</sub> [mmHg]', 10, 60, 1, 40, function (v) { return fx(v, 0); });
        d.handle({ get: function () { return [m.X(pt.v), m.Y(P.satHb(pt.v, P.p50(pH.v, T.v)) * 100)]; }, set: function (x) { pt.set(Math.round(Math.max(10, Math.min(60, m.ix(x))))); }, color: function () { return C.c2; } });
      },
      resize: function (d) { m = Map(0, 110, 0, 100, 46, d.W - 16, 16, d.H - 28); },
      draw: function (d, c) {
        axes(c, m, 'P(O₂) [mmHg]', '氧合 Hb [%]', 10, 20);
        function curve(p50, col, w, dash) { var a = []; for (var x = 0; x <= 110; x += 0.5) a.push([m.X(x), m.Y(P.satHb(x, p50) * 100)]); line(c, a, col, w, dash); }
        var p0 = P.P50, p1 = P.p50(pH.v, T.v); curve(p0, C.c1, 2.5); curve(p1, C.c2, 2.5, p1 === p0 ? [6, 4] : null);
        txt(c, '肺（pH 7.4, 37 °C）', m.X(70), m.Y(P.satHb(70, p0) * 100) - 14, C.c1, F12);
        var sL = P.satHb(100, p0), sT = P.satHb(pt.v, p1), u = P.unload(sL, sT);
        dot(c, m.X(100), m.Y(sL * 100), 5, C.c1); line(c, [[m.X(pt.v), m.Y(sT * 100)], [m.X(pt.v), m.Y(sL * 100)]], C.c3, 2, [3, 3]);
        txt(c, '放出 ' + fx(u.ofAll * 100, 0) + '%', m.X(pt.v) + 8, m.Y((sT + sL) * 50), C.c3, F14, 'left');
        d.out([['肺（P<sub>O₂</sub> 100 mmHg）', pct(sL)], ['组织（右移后的曲线）', pct(sT)], ['P<sub>50</sub>（组织条件）', fx(p1, 1) + ' mmHg（基准 26.8）'], ['放出的 O₂', '占全部 Hb ' + pct(u.ofAll) + '；占肺中氧合 Hb ' + pct(u.ofBound)]],
          'pH 下降（CO₂ 增多）、温度升高时曲线右移（玻尔效应），同样的 P<sub>O₂</sub> 下氧合 Hb 更少，组织得到更多 O₂。曲线用希尔式近似（n = 2.7），数值为典型值；EJU 题目以给出的图为准，注意“占全部”还是“占氧合 Hb”。');
      } };
  });

  /* ② 哈迪–温伯格平衡与选择 */
  D.reg('hw', function () {
    var p, s, m;
    return { aspect: 1.9, maxH: 420,
      init: function (d) {
        p = d.slider('等位基因 A 的频率 p', 0.01, 0.99, 0.01, 0.7, function (v) { return fx(v, 2) + '（q = ' + fx(1 - v, 2) + '）'; });
        s = d.slider('对 aa 的选择系数 s（0 = 无选择）', 0, 1, 0.05, 0, function (v) { return fx(v, 2); });
      },
      resize: function (d) { m = Map(0, 30, 0, 1, d.W * 0.5 + 40, d.W - 14, 22, d.H - 28); },
      draw: function (d, c) {
        var g = P.hw(p.v); bars(c, 24, 40, d.W * 0.45 - 30, d.H - 90, [['AA  p²', g.AA, C.c1], ['Aa  2pq', g.Aa, C.c3], ['aa  q²', g.aa, C.c2]], 1, '基因型频率');
        axes(c, m, '世代', 'q', 5, 0.2);
        var q = 1 - p.v, pts = [[m.X(0), m.Y(q)]]; for (var t = 1; t <= 30; t++) { q = P.selectStep(q, s.v); pts.push([m.X(t), m.Y(q)]); } line(c, pts, C.c2, 2.5);
        d.out([['AA', pct(g.AA)], ['Aa（携带者）', pct(g.Aa)], ['aa', pct(g.aa)], ['30 代后 q', fx(q, 3)]],
          '平衡种群中 AA : Aa : aa = p² : 2pq : q²；由 aa 的比例求 q 要开平方。右图：若 aa 个体的适应度降为 1 − s，q 逐代下降，但 q 很小时 a 主要藏在杂合子中，下降变慢。平衡成立的条件：大种群、随机交配、无突变・迁移・自然选择。');
      } };
  });

  /* ③ 两对基因的杂交（独立／连锁） */
  D.reg('punnett', function () {
    var p1, p2, r, mode;
    var OPT = [['AaBb', 'AaBb'], ['AABB', 'AABB'], ['aabb', 'aabb'], ['AaBB', 'AaBB'], ['AABb', 'AABb'], ['Aabb', 'Aabb'], ['aaBb', 'aaBb']];
    return { aspect: 1.7, maxH: 560,
      init: function (d) {
        p1 = d.seg('亲本 ♀', OPT, 'AaBb'); p2 = d.seg('亲本 ♂', OPT, 'aabb');
        mode = d.seg('两对基因', [['ind', '独立遗传'], ['link', '连锁（AB/ab 相引）']], 'ind');
        r = d.slider('组换价（连锁时）', 0, 0.5, 0.01, 0.2, function (v) { return pct(v); });
      },
      draw: function (d, c) {
        var rr = mode.v === 'link' ? r.v : 0.5, G1 = P.gametes(p1.v, rr), G2 = P.gametes(p2.v, rr), k1 = Object.keys(G1), k2 = Object.keys(G2);
        var W = d.W * 0.58, H = d.H - 20, cw = Math.min((W - 60) / k2.length, 90), ch = Math.min((H - 40) / k1.length, 60), x0 = 70, y0 = 36;
        k2.forEach(function (g, j) { txt(c, g + ' ' + fx(G2[g] * 100, 0) + '%', x0 + cw * (j + 0.5), y0 - 14, C.c1, F12); });
        k1.forEach(function (g, i) { txt(c, g + ' ' + fx(G1[g] * 100, 0) + '%', x0 - 8, y0 + ch * (i + 0.5), C.c2, F12, 'right');
          k2.forEach(function (h, j) { var gA = [g[0], h[0]].sort().join(''), gB = [g[1], h[1]].sort().join(''), dA = /A/.test(gA), dB = /B/.test(gB);
            c.fillStyle = dA && dB ? C['accent-soft'] : dA ? 'rgba(42,98,176,.10)' : dB ? 'rgba(208,69,47,.12)' : 'rgba(127,127,127,.12)';
            c.fillRect(x0 + cw * j + 1, y0 + ch * i + 1, cw - 2, ch - 2); txt(c, gA + gB, x0 + cw * (j + 0.5), y0 + ch * (i + 0.5), C.ink, F14); }); });
        var ph = P.cross(p1.v, p2.v, rr), L = [['[AB]', ph.AB || 0, C.accent], ['[Ab]', ph.Ab || 0, C.c1], ['[aB]', ph.aB || 0, C.c2], ['[ab]', ph.ab || 0, C['ink-3']]];
        bars(c, d.W * 0.64, 40, d.W * 0.33, d.H - 90, L, 1, '子代表型比例');
        var mn = Math.min.apply(null, L.map(function (x) { return x[1]; }).filter(function (v) { return v > 1e-9; }));
        d.out([['表型比 [AB]:[Ab]:[aB]:[ab]', L.map(function (x) { return +(x[1] / mn).toFixed(2); }).join(' : ')], ['各表型', L.map(function (x) { return x[0] + ' ' + pct(x[1]); }).join('，')]],
          '[AB] 表示 A、B 都表现显性。独立遗传时 AaBb × AaBb = 9:3:3:1，AaBb × aabb（测交）= 1:1:1:1。选“连锁”后双杂合亲本按组换价产生配子：AB = ab = (1 − r)/2，Ab = aB = r/2；测交子代的比例就等于配子比例。表格格子里显示配子比例不等时的组合（面积相同，比例看行列标签）。');
      } };
  });

  /* ④ 酶反应速度：米氏方程、抑制剂、温度与 pH */
  D.reg('enzyme', function () {
    var m, E, I, type, enz, T, pH;
    return { aspect: 1.6, maxH: 500,
      init: function (d) {
        E = d.slider('酶量（相对）', 0.25, 2, 0.25, 1, function (v) { return fx(v, 2) + ' 倍'; });
        type = d.seg('抑制剂', [['none', '无'], ['comp', '竞争性'], ['noncomp', '非竞争性']], 'none');
        I = d.slider('抑制剂浓度 [I]/K<sub>i</sub>', 0, 4, 0.1, 1, function (v) { return fx(v, 1); });
        enz = d.seg('酶（最适 pH）', [['pepsin', '胃蛋白酶 (2)'], ['amylase', '唾液淀粉酶 (7)'], ['trypsin', '胰蛋白酶 (8)']], 'amylase');
        T = d.slider('温度 [°C]（示意）', 0, 70, 1, 37, function (v) { return fx(v, 0); });
        pH = d.slider('pH（示意）', 1, 11, 0.1, 7, function (v) { return fx(v, 1); });
      },
      resize: function (d) { m = Map(0, 20, 0, 2.2, 46, d.W * 0.62, 16, d.H - 28); },
      draw: function (d, c) {
        var e = P.ENZ[enz.v], f = P.tFactor(T.v, e.T) * P.pHFactor(pH.v, e.pH), Km = 2, Vm = E.v * f, ty = type.v === 'none' ? null : type.v, Ii = ty ? I.v : 0;
        axes(c, m, '底物浓度 [S]', '速度 v', 5, 0.5);
        function cur(V, I0, t0, col, w, dash) { var a = []; for (var s = 0; s <= 20; s += 0.1) a.push([m.X(s), m.Y(P.mm(s, V, Km, I0, 1, t0))]); line(c, a, col, w, dash); }
        cur(E.v, 0, null, C['ink-3'], 1.2, [5, 4]); cur(Vm, Ii, ty, C.c1, 2.5);
        line(c, [[m.X(0), m.Y(Vm / (ty === 'noncomp' ? 1 + Ii : 1))], [m.X(20), m.Y(Vm / (ty === 'noncomp' ? 1 + Ii : 1))]], C.c1, 1, [2, 4]);
        var x0 = d.W * 0.68, w = d.W - x0 - 14, h1 = (d.H - 70) / 2;
        var mt = Map(0, 70, 0, 1.25, x0, x0 + w, 30, 30 + h1 - 10), mp = Map(1, 11, 0, 1.15, x0, x0 + w, 30 + h1 + 30, d.H - 28);
        axes(c, mt, 't', '', 20, 0); axes(c, mp, 'pH', '', 2, 0);
        var a = []; for (var t = 0; t <= 70; t += 0.5) a.push([mt.X(t), mt.Y(P.tFactor(t, e.T))]); line(c, a, C.c2, 2); dot(c, mt.X(T.v), mt.Y(P.tFactor(T.v, e.T)), 4, C.c2);
        a = []; for (var q = 1; q <= 11; q += 0.05) a.push([mp.X(q), mp.Y(P.pHFactor(q, e.pH))]); line(c, a, C.c4, 2); dot(c, mp.X(pH.v), mp.Y(P.pHFactor(pH.v, e.pH)), 4, C.c4);
        txt(c, '温度的影响（示意）', x0 + w / 2, 16, C['ink-2'], F12); txt(c, 'pH 的影响（示意）', x0 + w / 2, 30 + h1 + 16, C['ink-2'], F12);
        var vS = P.mm(5, Vm, Km, Ii, 1, ty);
        d.out([['最大速度 V<sub>max</sub>', fx(Vm / (ty === 'noncomp' ? 1 + Ii : 1), 2)], ['表观 K<sub>m</sub>', fx(ty === 'comp' ? Km * (1 + Ii) : Km, 2)], ['[S] = 5 时的速度', fx(vS, 2)], ['温度・pH 因子', fx(f, 2)]],
          '底物浓度足够高时速度饱和（所有酶都在工作），此时增加酶量 V<sub>max</sub> 成比例增大。竞争性抑制剂与底物抢活性部位：底物越多影响越小，V<sub>max</sub> 不变；非竞争性抑制剂结合在别处：V<sub>max</sub> 下降。右侧温度・pH 曲线是定性示意（高温使酶变性失活），不是实测数据。');
      } };
  });

  /* ⑤ 静息电位：能斯特式与 GHK 式 */
  D.reg('memb', function () {
    var Ko, Nao, pNa, m;
    return { aspect: 1.9, maxH: 420,
      init: function (d) {
        Ko = d.slider('细胞外 K⁺ [mM]', 1, 40, 0.5, 4, function (v) { return fx(v, 1); });
        Nao = d.slider('细胞外 Na⁺ [mM]', 50, 200, 1, 145, function (v) { return fx(v, 0); });
        pNa = d.slider('Na⁺ 通透性 P<sub>Na</sub>/P<sub>K</sub>', 0.01, 20, 0.01, 0.04, function (v) { return fx(v, 2); });
      },
      resize: function (d) { m = Map(0, 1, -110, 70, 70, d.W * 0.36, 16, d.H - 20); },
      draw: function (d, c) {
        var Ki = 140, Nai = 15, Clo = 110, Cli = 10, EK = P.nernst(1, Ko.v, Ki), ENa = P.nernst(1, Nao.v, Nai), Vm = P.ghk(1, pNa.v, 0.45, Ko.v, Ki, Nao.v, Nai, Clo, Cli);
        c.save(); c.strokeStyle = C.line; c.lineWidth = 1; c.font = F12; c.fillStyle = C['ink-3']; c.textAlign = 'right'; c.textBaseline = 'middle';
        for (var v = -100; v <= 60; v += 20) { c.beginPath(); c.moveTo(m.L, m.Y(v)); c.lineTo(m.R, m.Y(v)); c.stroke(); c.fillText(v + ' mV', m.L - 6, m.Y(v)); } c.restore();
        [[EK, 'E_K', C.c1], [ENa, 'E_Na', C.c2], [Vm, '膜电位', C.accent]].forEach(function (q, i) { var y = m.Y(Math.max(-110, Math.min(70, q[0]))); line(c, [[m.L, y], [m.R, y]], q[2], i === 2 ? 3 : 2, i === 2 ? null : [6, 4]); txt(c, q[1] + ' ' + fx(q[0], 0), m.R + 6, y, q[2], F12, 'left'); });
        var cx = d.W * 0.5, cw = d.W * 0.46, cy = 30, chh = d.H - 60;
        c.fillStyle = C['surface-2']; c.fillRect(cx, cy, cw, chh); c.fillStyle = C['accent-soft']; c.fillRect(cx + cw * 0.5, cy, cw * 0.5, chh);
        line(c, [[cx + cw * 0.5, cy], [cx + cw * 0.5, cy + chh]], C['ink-2'], 3);
        txt(c, '细胞外', cx + cw * 0.25, cy + 14, C['ink-2'], F12); txt(c, '细胞内', cx + cw * 0.75, cy + 14, C['ink-2'], F12);
        function ions(x, n, col, lab, y) { for (var i = 0; i < Math.min(30, Math.round(n / 5)); i++) dot(c, x + (i % 10) * cw * 0.04 + 8, y + Math.floor(i / 10) * 12, 3.5, col); txt(c, lab, x + 8, y - 12, col, F12, 'left'); }
        ions(cx, Ko.v, C.c1, 'K⁺ ' + fx(Ko.v, 1), cy + 48); ions(cx, Nao.v, C.c2, 'Na⁺ ' + fx(Nao.v, 0), cy + chh * 0.55);
        ions(cx + cw * 0.5, Ki, C.c1, 'K⁺ 140', cy + 48); ions(cx + cw * 0.5, Nai, C.c2, 'Na⁺ 15', cy + chh * 0.55);
        d.out([['K⁺ 平衡电位 E<sub>K</sub>', fx(EK, 1) + ' mV'], ['Na⁺ 平衡电位 E<sub>Na</sub>', fx(ENa, 1) + ' mV'], ['膜电位（GHK 式）', fx(Vm, 1) + ' mV']],
          '静息时膜主要对 K⁺ 通透，K⁺ 顺浓度梯度外流使内侧为负（约 −70 mV，接近 E<sub>K</sub>）。把 P<sub>Na</sub>/P<sub>K</sub> 调大（Na⁺ 通道打开）模拟动作电位：膜电位向 E<sub>Na</sub>（正值）靠近。细胞外 K⁺ 升高时静息电位变浅（去极化）。37 °C，能斯特式 E = 61.5 log(外/内) mV（一价离子）；浓度为哺乳动物的典型值。');
      } };
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', D.boot); else D.boot();
})();
