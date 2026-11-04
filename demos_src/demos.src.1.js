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
