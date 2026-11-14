(function () {
  'use strict';
  var D = window.EJUDemo, P = D.P, C = D.COL, fx = D.fx, sci = D.sci, arrow = D.arrow, txt = D.txt, line = D.line, dot = D.dot, Map = D.Map, axes = D.axes, bars = D.bars;
  var clamp = D.clamp, shade = D.shade, alpha = D.alpha, mix = D.mix, rrect = D.rrect, shadow = D.shadow, drawBall = D.drawBall, glow = D.glow, knob = D.knob, hint = D.hint;
  var allele = D.allele, drawCell = D.drawCell, molSprite = D.molSprite, blit = D.blit, swarm = D.swarm, sprite = D.sprite;
  var F12 = '12px system-ui,"PingFang SC","Hiragino Sans","Noto Sans CJK SC",sans-serif', F14 = '600 14px system-ui,"PingFang SC","Hiragino Sans","Noto Sans CJK SC",sans-serif';
  function pct(v) { return fx(v * 100, 1) + ' %'; }
  function snap(v, st, a, b) { return +clamp(Math.round(v / st) * st, a, b).toFixed(6); } /* 取整到滑块步长并限制范围（与滑块读数一致） */
  function panel(c, x, y, w, hgt, col) { /* 场景底板：圆角、淡色、内阴影感 */
    rrect(c, x, y, w, hgt, 10); var g = c.createLinearGradient(0, y, 0, y + hgt); g.addColorStop(0, alpha(col, C.dark ? 0.16 : 0.07)); g.addColorStop(1, alpha(col, C.dark ? 0.08 : 0.03));
    c.fillStyle = g; c.fill(); c.lineWidth = 1; c.strokeStyle = C.line; c.stroke();
  }

  /* ① 氧解离曲线与玻尔效应 */
  D.reg('hb', function () {
    var m, pH, T, pt, box, gT, gP, swL = swarm(20, { seed: 3, speed: 20 }), swT = swarm(8, { seed: 11, speed: 20 }), t = 0;
    var OXY = '#e0333a', DEOXY = '#7a2452';
    function rbc(c, x, y, rx, sat) { /* 红细胞（双凹圆盘，斜视）：颜色随氧合程度由暗红紫 → 鲜红 */
      var ry = rx * 0.6, col = mix(DEOXY, OXY, sat);
      shadow(c, x + 2, y + ry + 3, rx * 0.95, ry * 0.25, 0.3);
      var g = c.createRadialGradient(x - rx * 0.1, y - ry * 0.15, rx * 0.05, x, y, rx);
      g.addColorStop(0, shade(col, 0.22)); g.addColorStop(0.42, shade(col, 0.05)); g.addColorStop(0.7, shade(col, 0.18)); g.addColorStop(1, shade(col, -0.4));
      c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.fillStyle = g; c.fill(); c.lineWidth = 1; c.strokeStyle = shade(col, -0.5); c.stroke();
      c.beginPath(); c.ellipse(x, y + ry * 0.04, rx * 0.46, ry * 0.4, 0, 0, 7); c.lineWidth = Math.max(1.5, rx * 0.1); c.strokeStyle = alpha(shade(col, -0.45), 0.45); c.stroke(); /* 中央凹陷 */
      c.beginPath(); c.ellipse(x - rx * 0.42, y - ry * 0.5, rx * 0.28, ry * 0.16, -0.3, 0, 7); c.fillStyle = 'rgba(255,255,255,.32)'; c.fill();
    }
    function hbRow(c, x0, x1, y, sat) { /* 10 个 Hb 四聚体（每个 4 个血红素）= 40 个结合位点；按协同结合依次装满 */
      var n = 10, cw = (x1 - x0) / n, k = Math.round(sat * 4 * n), s = cw * 0.21, rr = Math.max(2.2, cw * 0.19);
      for (var i = 0; i < n; i++) {
        var cx = x0 + cw * (i + 0.5);
        c.beginPath(); c.arc(cx, y, s * 2.1, 0, 7); c.fillStyle = alpha(C['ink-3'], 0.12); c.fill();
        for (var j = 0; j < 4; j++) {
          var on = i * 4 + j < k, px = cx + (j % 2 ? s : -s), py = y + (j < 2 ? -s : s);
          drawBall(c, px, py, rr, on ? OXY : DEOXY);
        }
      }
      txt(c, (x1 - x0 > 220 ? 'Hb 示意：' : '') + k + ' / 40 个血红素结合 O₂', (x0 + x1) / 2, y + s * 2.1 + 10, C['ink-3'], F12);
    }
    function scene(c, b, sat, sw, lung, pO2) {
      var x = b[0], y = b[1], w = b[2], hh = b[3], cy = y + hh * 0.44, bh = clamp(hh * 0.26, 26, 54), o2 = molSprite(3.2, OXY);
      panel(c, x, y, w, hh, lung ? C.c1 : C.c4);
      if (!lung) for (var i = 0; i < 3; i++) drawCell(c, x + w * (0.2 + i * 0.3), y + hh * 0.2, w * 0.13, hh * 0.07, { col: C.c4, nucleus: true }); /* 组织细胞 */
      sw.each(function (u, v) { var px = x + 8 + u * (w - 16), py = y + 24 + v * (hh * 0.68 - 24); blit(c, o2, px, py, 6.4, 6.4); });
      var g = c.createLinearGradient(0, cy - bh / 2, 0, cy + bh / 2); g.addColorStop(0, 'rgba(208,69,47,.10)'); g.addColorStop(0.5, 'rgba(208,69,47,.20)'); g.addColorStop(1, 'rgba(208,69,47,.10)');
      c.fillStyle = g; c.fillRect(x + 1, cy - bh / 2, w - 2, bh);
      line(c, [[x + 1, cy - bh / 2], [x + w - 1, cy - bh / 2]], alpha(C.c2, 0.55), 2); line(c, [[x + 1, cy + bh / 2], [x + w - 1, cy + bh / 2]], alpha(C.c2, 0.55), 2);
      var rx = Math.min(bh * 0.9, w * 0.16), bx = x + w * 0.27 + (D.reduced() ? 0 : Math.sin(t * 1.3 + (lung ? 0 : 2)) * w * 0.03);
      rbc(c, bx, cy + Math.sin(t * 2.1) * 1.2, rx, sat);
      if (!lung) [-1, 0, 1].forEach(function (a) { arrow(c, bx + a * rx * 0.5, cy - rx * 0.4, bx + a * rx * 1.1, cy - bh / 2 - 14, alpha(OXY, 0.8), 1.8); }); /* O₂ 从红细胞扩散进组织 */
      txt(c, (lung ? '肺泡（P(O₂) 100 mmHg）' : '组织（P(O₂) ' + fx(pO2, 0) + ' mmHg）'), x + 10, y + 13, C['ink-2'], F12, 'left');
      txt(c, '氧合 Hb ' + fx(sat * 100, 0) + '%', bx + rx + 6, cy, mix(DEOXY, OXY, sat), w < 230 ? '600 12px ' + D.FONT : F14, 'left');
      hbRow(c, x + 10, x + w - 10, y + hh * 0.78 + (lung ? hh * 0.02 : 0), sat);
    }
    return { aspect: function (w) { return w < 560 ? 0.8 : 1.55; }, maxH: 520, animated: true,
      init: function (d) {
        pH = d.slider('组织的 pH（CO₂ 多 → pH 低）', 7.0, 7.6, 0.01, 7.2, function (v) { return fx(v, 2); });
        T = d.slider('组织温度 [°C]', 33, 42, 0.5, 37, function (v) { return fx(v, 1); });
        pt = d.slider('组织的 P<sub>O₂</sub> [mmHg]', 10, 60, 1, 40, function (v) { return fx(v, 0); });
        gT = d.grab({ r: 8, autoplay: false, get: function () { return [m.X(pt.v), m.Y(P.satHb(pt.v, P.p50(pH.v, T.v)) * 100)]; },
          set: function (x) { pt.set(snap(m.ix(x), 1, 10, 60)); } });
        gP = d.grab({ r: 8, autoplay: false, get: function () { return [m.X(P.p50(pH.v, T.v)), m.Y(50)]; },
          set: function (x) { /* 由 P50 反解 pH：log(P50/26.8) = −0.48(pH − 7.4) + 0.024(T − 37) */
            var q = clamp(m.ix(x), 5, 105); pH.set(snap(7.4 - (Math.log10(q / P.P50) - 0.024 * (T.v - 37)) / 0.48, 0.01, 7, 7.6)); } });
      },
      resize: function (d) {
        if (d.W < 560) { var y0 = Math.round(d.H * 0.53) + 44, bw = (d.W - 30) / 2; m = Map(0, 110, 0, 100, 46, d.W - 16, 16, d.H * 0.53); box = [[10, y0, bw, d.H - y0 - 8], [20 + bw, y0, bw, d.H - y0 - 8]]; }
        else { var x0 = d.W * 0.64, bh = (d.H - 40) / 2; m = Map(0, 110, 0, 100, 46, d.W * 0.6, 16, d.H - 28); box = [[x0, 10, d.W - x0 - 10, bh], [x0, 30 + bh, d.W - x0 - 10, bh]]; }
      },
      step: function (d, dt) { t += dt; swL.step(dt, box[0][2], box[0][3]); swT.step(dt, box[1][2], box[1][3]); },
      draw: function (d, c) {
        axes(c, m, 'P(O₂) [mmHg]', '氧合 Hb [%]', 10, 20);
        function curve(p50, col, w, dash) { var a = []; for (var x = 0; x <= 110; x += 0.5) a.push([m.X(x), m.Y(P.satHb(x, p50) * 100)]); line(c, a, col, w, dash); }
        var p0 = P.P50, p1 = P.p50(pH.v, T.v); curve(p0, C.c1, 2.5); curve(p1, C.c2, 2.5, p1 === p0 ? [6, 4] : null);
        txt(c, '肺（pH 7.4, 37 °C）', m.X(70), m.Y(P.satHb(70, p0) * 100) - 14, C.c1, F12);
        var sL = P.satHb(100, p0), sT = P.satHb(pt.v, p1), u = P.unload(sL, sT);
        line(c, [[m.X(p1), m.Y(50)], [m.X(p1), m.B]], alpha(C.c2, 0.6), 1, [2, 3]); txt(c, 'P₅₀ ' + fx(p1, 1), m.X(p1) + 6, m.B - 10, C.c2, F12, 'left');
        drawBall(c, m.X(100), m.Y(sL * 100), 5, C.c1); line(c, [[m.X(pt.v), m.Y(sT * 100)], [m.X(pt.v), m.Y(sL * 100)]], C.c3, 2, [3, 3]);
        txt(c, '放出 ' + fx(u.ofAll * 100, 0) + '%', m.X(pt.v) + 8, m.Y((sT + sL) * 50), C.c3, F14, 'left');
        knob(c, m.X(p1), m.Y(50), C.c2, d.dragging(gP)); knob(c, m.X(pt.v), m.Y(sT * 100), C.c2, d.dragging(gT));
        hint(c, '拖 ● 改组织 P(O₂)；拖 P₅₀ 点改 pH', m.R - 4, m.Y(30), 'right');
        swL.size(20); swT.size(Math.round(pt.v / 5)); /* 游离 O₂ 颗粒数 ∝ P_O₂（肺 100 mmHg = 20 个） */
        scene(c, box[0], sL, swL, true, 100); scene(c, box[1], sT, swT, false, pt.v);
        var b0 = box[0], b1 = box[1];
        if (d.W < 560) { arrow(c, b0[0] + b0[2] * 0.62, b0[1] - 10, b1[0] + b1[2] * 0.38, b1[1] - 10, C['ink-3'], 1.5); txt(c, '血流', b0[0] + b0[2] * 0.62 - 6, b0[1] - 10, C['ink-3'], F12, 'right'); } else arrow(c, b0[0] + 24, b0[1] + b0[3] + 1, b0[0] + 24, b1[1] - 1, C['ink-3'], 1.5);
        if (d.W >= 560) txt(c, '血流（肺 → 组织）', b0[0] + 34, (b0[1] + b0[3] + b1[1]) / 2, C['ink-3'], F12, 'left');
        d.out([['肺（P<sub>O₂</sub> 100 mmHg）', pct(sL)], ['组织（右移后的曲线）', pct(sT)], ['P<sub>50</sub>（组织条件）', fx(p1, 1) + ' mmHg（基准 26.8）'], ['放出的 O₂', '占全部 Hb ' + pct(u.ofAll) + '；占肺中氧合 Hb ' + pct(u.ofBound)]],
          'pH 下降（CO₂ 增多）、温度升高时曲线右移（玻尔效应），同样的 P<sub>O₂</sub> 下氧合 Hb 更少，组织得到更多 O₂。曲线用希尔式近似（n = 2.7），数值为典型值；EJU 题目以给出的图为准，注意“占全部”还是“占氧合 Hb”。' +
          '<br>操作：拖曲线上的组织点改 P<sub>O₂</sub>；左右拖 P<sub>50</sub> 点改组织 pH（取 0.01 的倍数）。右侧红细胞的颜色和 10 个 Hb（40 个血红素）中结合 O₂ 的个数按饱和度取整，游离 O₂ 颗粒数与 P<sub>O₂</sub> 成比例（示意）。');
      } };
  });

  /* ② 哈迪–温伯格平衡与选择 */
  D.reg('hw', function () {
    var p, s, m, pop, gP, g0, g30, bar;
    function counts(g) { /* 100 个个体，最大余数法取整，保证合计 100 */
      var raw = [g.AA * 100, g.Aa * 100, g.aa * 100], n = raw.map(Math.floor), rem = 100 - n[0] - n[1] - n[2];
      [0, 1, 2].sort(function (a, b) { return (raw[b] - n[b]) - (raw[a] - n[a]); }).slice(0, rem).forEach(function (i) { n[i]++; });
      return n;
    }
    function q30(k) { var q = 1 - p.v; for (var t = 0; t < 30; t++) q = P.selectStep(q, k); return q; }
    function ind(gt, cs) { /* 个体（细胞 + 两个等位基因珠）的缓存图 */
      return sprite('hw' + gt + cs, cs, cs, function (g) { var rb = cs < 24 ? cs * 0.25 : cs * 0.2; /* 小屏上珠子放大，便于分辨显隐性 */
        drawCell(g, cs / 2, cs / 2, cs * 0.46, cs * 0.4, { col: C.c4 }); allele(g, cs / 2 - rb * 1.05, cs / 2, rb, gt[0]); allele(g, cs / 2 + rb * 1.05, cs / 2, rb, gt[1]); });
    }
    return { aspect: function (w) { return w < 560 ? 0.9 : 1.9; }, maxH: 440,
      init: function (d) {
        p = d.slider('等位基因 A 的频率 p', 0.01, 0.99, 0.01, 0.7, function (v) { return fx(v, 2) + '（q = ' + fx(1 - v, 2) + '）'; });
        s = d.slider('对 aa 的选择系数 s（0 = 无选择）', 0, 1, 0.05, 0, function (v) { return fx(v, 2); });
        gP = d.grab({ r: 9, get: function () { return [bar.x0 + p.v * (bar.x1 - bar.x0), bar.y + 9]; }, set: function (x) { p.set(snap((x - bar.x0) / (bar.x1 - bar.x0), 0.01, 0.01, 0.99)); } });
        g0 = d.grab({ r: 8, get: function () { return [m.X(0), m.Y(1 - p.v)]; }, set: function (x, y) { p.set(snap(1 - m.iy(y), 0.01, 0.01, 0.99)); } });
        g30 = d.grab({ r: 8, get: function () { return [m.X(30), m.Y(q30(s.v))]; },
          set: function (x, y) { /* 由第 30 代的 q 反推 s：在滑块的 21 个取值中找最接近的 */
            var tg = m.iy(y), best = 0, bd = Infinity; for (var i = 0; i <= 20; i++) { var e = Math.abs(q30(i * 0.05) - tg); if (e < bd - 1e-12) { bd = e; best = i * 0.05; } } s.set(+best.toFixed(2)); } });
      },
      resize: function (d) {
        if (d.W < 560) { pop = { x: 12, y: 6, w: d.W - 24, h: d.H * 0.46, cols: 20 }; m = Map(0, 30, 0, 1, 40, d.W - 16, d.H * 0.46 + 30, d.H - 26); }
        else { pop = { x: 14, y: 6, w: d.W * 0.48 - 14, h: d.H - 12, cols: 10 }; m = Map(0, 30, 0, 1, d.W * 0.5 + 40, d.W - 14, 22, d.H - 28); }
        bar = { x0: pop.x + 4, x1: pop.x + pop.w - 4, y: pop.y + 22 };
      },
      draw: function (d, c) {
        var g = P.hw(p.v), n = counts(g), fit = 1 - s.v;
        /* 基因库条：A（p）与 a（q）的比例，分界可拖 */
        txt(c, '基因库（配子中的等位基因）', pop.x + 4, pop.y + 9, C['ink-2'], '600 12px ' + D.FONT, 'left');
        var bx = bar.x0 + p.v * (bar.x1 - bar.x0), by = bar.y, gr = c.createLinearGradient(0, by, 0, by + 18);
        gr.addColorStop(0, shade(C.c1, 0.25)); gr.addColorStop(1, shade(C.c1, -0.2));
        c.save(); rrect(c, bar.x0, by, bar.x1 - bar.x0, 18, 9); c.clip(); c.fillStyle = gr; c.fillRect(bar.x0, by, bx - bar.x0, 18);
        c.fillStyle = mix(C.c1, C.dark ? '#d8d8d8' : '#ffffff', 0.68); c.fillRect(bx, by, bar.x1 - bx, 18); c.restore();
        rrect(c, bar.x0, by, bar.x1 - bar.x0, 18, 9); c.lineWidth = 1; c.strokeStyle = shade(C.c1, -0.3); c.stroke();
        c.font = '600 12px ' + D.FONT; c.textBaseline = 'middle'; /* 条内文字不描边，直接写在色块上 */
        if (bx - bar.x0 > 76) { c.textAlign = 'left'; c.fillStyle = '#fff'; c.fillText('A  p = ' + fx(p.v, 2), bar.x0 + 10, by + 9.5); }
        if (bar.x1 - bx > 76) { c.textAlign = 'right'; c.fillStyle = shade(C.c1, -0.3); c.fillText('a  q = ' + fx(1 - p.v, 2), bar.x1 - 10, by + 9.5); }
        knob(c, bx, by + 9, C.c1, d.dragging(gP));
        /* 100 个个体：按基因型排列（单位图），aa 的透明度表示适应度 1 − s */
        var top = by + 40, rows = 100 / pop.cols, bot = pop.y + pop.h - 18, cs = Math.floor(Math.min(pop.w / pop.cols, (bot - top) / rows)), gx = pop.x + (pop.w - cs * pop.cols) / 2;
        txt(c, '个体（100 个，p² : 2pq : q² 取整）', pop.x + 4, top - 10, C['ink-2'], '600 12px ' + D.FONT, 'left');
        var GT = ['AA', 'Aa', 'aa'], k = 0;
        GT.forEach(function (gt, j) { var img = ind(gt, cs);
          for (var i = 0; i < n[j]; i++, k++) { c.globalAlpha = j === 2 ? 0.25 + 0.75 * fit : 1; c.drawImage(img, gx + (k % pop.cols) * cs, top + Math.floor(k / pop.cols) * cs, cs, cs); }
          c.globalAlpha = 1; });
        var lx = pop.x + 4, ly = Math.min(pop.y + pop.h - 7, top + rows * cs + 14); /* 图例紧贴在个体图下方 */
        GT.forEach(function (gt, j) { c.drawImage(ind(gt, 16), lx, ly - 8, 16, 16); txt(c, gt + ' ' + n[j], lx + 19, ly, C['ink-2'], F12, 'left'); lx += 66; });
        if (s.v > 0) txt(c, 'aa 适应度 ' + fx(fit, 2), lx, ly, C.c2, F12, 'left');
        /* 右图：q 的逐代变化 */
        axes(c, m, '世代', 'q', 5, 0.2);
        var q = 1 - p.v, pts = [[m.X(0), m.Y(q)]]; for (var t = 1; t <= 30; t++) { q = P.selectStep(q, s.v); pts.push([m.X(t), m.Y(q)]); } line(c, pts, C.c2, 2.5);
        knob(c, m.X(0), m.Y(1 - p.v), C.c1, d.dragging(g0)); knob(c, m.X(30), m.Y(q), C.c2, d.dragging(g30));
        txt(c, 'q₃₀ = ' + fx(q, 3), m.X(30) - 12, m.Y(q) + (q > 0.85 ? 16 : -16), C.c2, F12, 'right');
        hint(c, '拖起点改 q₀；拖终点改 s', m.X(15), m.T + 26, 'center');
        d.out([['AA', pct(g.AA)], ['Aa（携带者）', pct(g.Aa)], ['aa', pct(g.aa)], ['30 代后 q', fx(q, 3)]],
          '平衡种群中 AA : Aa : aa = p² : 2pq : q²；由 aa 的比例求 q 要开平方。右图：若 aa 个体的适应度降为 1 − s，q 逐代下降，但 q 很小时 a 主要藏在杂合子中，下降变慢。平衡成立的条件：大种群、随机交配、无突变・迁移・自然选择。' +
          '<br>操作：左右拖基因库条的分界改 p；上下拖右图起点改 q₀ = 1 − p，拖第 30 代的终点反推选择系数 s（取 0.05 的倍数）。100 个个体按 p²:2pq:q² 取整排列，aa 越淡表示适应度 1 − s 越低。');
      } };
  });

  /* ③ 两对基因的杂交（独立／连锁） */
  D.reg('punnett', function () {
    var p1, p2, r, mode, G = ['AaBb', 'aabb'], lay = {}, held = null, TR = ['A', 'a', 'B', 'b'];
    var OPT = [['AaBb', 'AaBb'], ['AABB', 'AABB'], ['aabb', 'aabb'], ['AaBB', 'AaBB'], ['AABb', 'AABb'], ['Aabb', 'Aabb'], ['aaBb', 'aaBb'], ['AAbb', 'AAbb'], ['aaBB', 'aaBB']];
    var PHC = function (k) { return { AB: C.c3, Ab: C.c1, aB: C.c2, ab: C['ink-3'] }[k]; };
    function norm(g) { return [g[0], g[1]].sort().join('') + [g[2], g[3]].sort().join(''); } /* 显性写在前：连锁时即相引 AB/ab */
    function setG(i, g) { G[i] = norm(g); (i ? p2 : p1).set(G[i]); }
    function setAl(i, j, ch) { var a = G[i].split(''); a[j] = ch; setG(i, a.join('')); }
    function link() { return mode.v === 'link'; }
    function rod(i, k) { var P0 = lay.par[i]; return { x: P0.x + (k ? 1 : -1) * P0.rx * 0.24, y0: P0.y - P0.ry * 0.68, y1: P0.y + P0.ry * 0.68 }; }
    function bRange(i) { var R = rod(i, 0), yA = R.y0 + lay.bead * 1.3; return [yA + lay.bead * 2.3, R.y1 - lay.bead * 1.1]; }
    function slot(i, j) { /* 亲本 i 的第 j 个等位基因（0,1 = A 座两条同源染色体；2,3 = B 座）在画面上的位置 */
      var P0 = lay.par[i];
      if (link()) { var R = rod(i, j % 2), br = bRange(i); return [R.x, j < 2 ? R.y0 + lay.bead * 1.3 : br[0] + (br[1] - br[0]) * r.v / 0.5]; }
      return [P0.x + [-0.47, -0.17, 0.17, 0.47][j] * P0.rx, P0.y];
    }
    function nearest(x, y, loc, skip) { var best = null, bd = Math.max(30, lay.bead * 2.6);
      [0, 1].forEach(function (i) { [0, 1, 2, 3].forEach(function (j) { if ((j < 2 ? 'A' : 'B') !== loc || (skip && skip[0] === i && skip[1] === j)) return;
        var q = slot(i, j), dd = Math.hypot(q[0] - x, q[1] - y); if (dd < bd) { bd = dd; best = [i, j]; } }); });
      return best;
    }
    function moving() { return held && !held.rd && (held.src === 'tray' || held.mv >= 6); } /* 正在拖着走的等位基因（点按、拖 B 改组换价时不算） */
    function trayPos(k) { var T = lay.tray; return T.grid ? [T.x0 + T.w * (0.27 + 0.46 * (k % 2)), T.y + T.h * (0.42 + 0.4 * Math.floor(k / 2))] : [T.x0 + T.w * (0.14 + 0.24 * k), T.y + T.h * 0.55]; }
    return { aspect: function (w) { return w < 560 ? 0.82 : 1.6; }, maxH: 600,
      init: function (d) {
        p1 = d.seg('亲本 ♀', OPT, 'AaBb', function (v) { G[0] = v; }); p2 = d.seg('亲本 ♂', OPT, 'aabb', function (v) { G[1] = v; });
        mode = d.seg('两对基因', [['ind', '独立遗传'], ['link', '连锁（AB/ab 相引）']], 'ind');
        r = d.slider('组换价（连锁时）', 0, 0.5, 0.01, 0.2, function (v) { return pct(v); });
        TR.forEach(function (ch, k) { /* 托盘里的等位基因：拖进细胞，落在同一基因座上即替换 */
          var o = d.grab({ r: function () { return lay.bead + 2; }, get: function () { return held && held.o === o ? [held.x, held.y] : trayPos(k); },
            start: function (x, y) { held = { o: o, src: 'tray', ch: ch, x: x, y: y }; }, set: function (x, y) { held.x = x; held.y = y; },
            release: function () { var t = nearest(held.x, held.y, ch.toUpperCase()); if (t) setAl(t[0], t[1], ch); held = null; } });
        });
        [0, 1].forEach(function (i) { [0, 1, 2, 3].forEach(function (j) { /* 细胞里的等位基因：点按切换显隐性；拖到另一基因座上交换；连锁时沿染色体拖 B 改组换价 */
          var o = d.grab({ r: function () { return lay.bead + 1; }, get: function () { return held && held.o === o && !held.rd ? [held.x, held.y] : slot(i, j); },
            start: function (x, y) { held = { o: o, src: 'slot', i: i, j: j, ch: G[i][j], x: x, y: y, x0: x, y0: y, mv: 0, rd: link() && j >= 2 }; },
            set: function (x, y) { held.mv = Math.max(held.mv, Math.hypot(x - held.x0, y - held.y0)); held.x = x; held.y = y;
              if (held.rd && held.mv >= 6) { var br = bRange(i); r.set(snap((y - br[0]) / (br[1] - br[0]) * 0.5, 0.01, 0, 0.5)); } },
            release: function () {
              var h = held; held = null; if (h.mv < 6) { var ch = G[i][j]; setAl(i, j, ch === ch.toUpperCase() ? ch.toLowerCase() : ch.toUpperCase()); return; }
              if (h.rd) return; var t = nearest(h.x, h.y, j < 2 ? 'A' : 'B', [i, j]); if (!t) return;
              var a = G[i][j], b = G[t[0]][t[1]]; setAl(i, j, b); setAl(t[0], t[1], a); } });
        }); });
      },
      resize: function (d) {
        var hTop = clamp(d.H * 0.27, 100, 138), rx = Math.min(d.W * 0.15, 82), ry = (hTop - 34) / 2;
        lay.hTop = hTop; lay.bead = clamp(rx * 0.115, 6, 10);
        lay.par = [{ x: 8 + rx, y: 24 + ry, rx: rx, ry: ry }]; lay.par.push({ x: lay.par[0].x + 2 * rx + 34, y: 24 + ry, rx: rx, ry: ry });
        var tx = lay.par[1].x + rx + 20; lay.tray = { x0: tx, w: d.W - 8 - tx, y: 10, h: hTop - 14, grid: d.W - 8 - tx < 200 };
      },
      draw: function (d, c) {
        var rr = link() ? r.v : 0.5, G1 = P.gametes(G[0], rr), G2 = P.gametes(G[1], rr), k1 = Object.keys(G1), k2 = Object.keys(G2), B = lay.bead;
        /* —— 亲本细胞与染色体 —— */
        [0, 1].forEach(function (i) {
          var P0 = lay.par[i], tgt = moving() && nearest(held.x, held.y, held.ch.toUpperCase(), held.src === 'slot' ? [held.i, held.j] : null);
          drawCell(c, P0.x, P0.y, P0.rx, P0.ry, { col: i ? C.c1 : C.c2, glow: tgt && tgt[0] === i });
          txt(c, (i ? '♂ ' : '♀ ') + G[i], P0.x, 11, i ? C.c1 : C.c2, F14);
          var rods = link() ? [rod(i, 0), rod(i, 1)] : [0, 1, 2, 3].map(function (j) { var q = slot(i, j); return { x: q[0], y0: P0.y - P0.ry * 0.5, y1: P0.y + P0.ry * 0.5 }; });
          rods.forEach(function (R) { var w = B * 1.25, g = c.createLinearGradient(R.x - w / 2, 0, R.x + w / 2, 0);
            g.addColorStop(0, alpha(C.c3, 0.35)); g.addColorStop(0.45, alpha(C.c3, 0.2)); g.addColorStop(1, alpha(C.c3, 0.45));
            rrect(c, R.x - w / 2, R.y0, w, R.y1 - R.y0, w / 2); c.fillStyle = g; c.fill(); c.lineWidth = 1; c.strokeStyle = alpha(C.c3, 0.55); c.stroke(); });
          [0, 1, 2, 3].forEach(function (j) { if (moving() && held.src === 'slot' && held.i === i && held.j === j) return; var q = slot(i, j); allele(c, q[0], q[1], B, G[i][j]); });
          if (link()) { var br = bRange(i), yA = rod(i, 0).y0 + B * 1.3, yB = slot(i, 2)[1], xr = P0.x + P0.rx * 0.24 + B + 5;
            line(c, [[xr, yA], [xr + 4, yA], [xr + 4, yB], [xr, yB]], C['ink-3'], 1); txt(c, 'r ' + fx(r.v * 100, 0) + '%', xr + 7, (yA + yB) / 2, C['ink-2'], F12, 'left'); }
        });
        txt(c, '×', (lay.par[0].x + lay.par[1].x) / 2, lay.par[0].y, C['ink-2'], '600 20px ' + D.FONT);
        /* —— 托盘 —— */
        var Tr = lay.tray; rrect(c, Tr.x0, Tr.y, Tr.w, Tr.h, 10); c.fillStyle = alpha(C['ink-3'], C.dark ? 0.12 : 0.06); c.fill(); c.strokeStyle = C.line; c.lineWidth = 1; c.stroke();
        txt(c, Tr.grid ? '拖入细胞' : '等位基因：拖入细胞', Tr.x0 + Tr.w / 2, Tr.y + 11, C['ink-2'], F12);
        TR.forEach(function (ch, k) { var q = trayPos(k); allele(c, q[0], q[1], B + 2, ch, { alpha: held && held.src === 'tray' && held.ch === ch ? 0.35 : 1 }); });
        if (!Tr.grid) hint(c, '点按细胞里的基因：切换显隐性', Tr.x0 + Tr.w / 2, Tr.y + Tr.h - 9, 'center');
        if (moving()) allele(c, held.x, held.y, B + 2, held.ch, { lift: true });
        /* —— 棋盘格 —— */
        var top = lay.hTop + 8, W = d.W * 0.6, x0 = 86, y0 = top + 34, cw = Math.min((W - x0 - 6) / k2.length, 92), ch = Math.min((d.H - y0 - 8) / k1.length, 62), rb = 6.5;
        line(c, [[8, top], [d.W - 8, top]], C.line, 1);
        k2.forEach(function (g, j) { var cx = x0 + cw * (j + 0.5); allele(c, cx - rb - 1, y0 - 22, rb, g[0]); allele(c, cx + rb + 1, y0 - 22, rb, g[1]); txt(c, fx(G2[g] * 100, 0) + '%', cx, y0 - 8, C.c1, F12); });
        k1.forEach(function (g, i) { var cy = y0 + ch * (i + 0.5); allele(c, x0 - 64, cy, rb, g[0]); allele(c, x0 - 49, cy, rb, g[1]); txt(c, fx(G1[g] * 100, 0) + '%', x0 - 7, cy, C.c2, F12, 'right');
          k2.forEach(function (h, j) { var gA = [g[0], h[0]].sort().join(''), gB = [g[1], h[1]].sort().join(''), ph = (/A/.test(gA) ? 'A' : 'a') + (/B/.test(gB) ? 'B' : 'b'), col = PHC(ph);
            var X = x0 + cw * j + 1.5, Y = y0 + ch * i + 1.5, gg = c.createLinearGradient(0, Y, 0, Y + ch - 3);
            gg.addColorStop(0, alpha(col, C.dark ? 0.34 : 0.22)); gg.addColorStop(1, alpha(col, C.dark ? 0.18 : 0.1));
            rrect(c, X, Y, cw - 3, ch - 3, 6); c.fillStyle = gg; c.fill(); c.lineWidth = 1; c.strokeStyle = alpha(col, 0.5); c.stroke();
            c.fillStyle = 'rgba(255,255,255,' + (C.dark ? 0.06 : 0.35) + ')'; c.fillRect(X + 4, Y + 2, cw - 11, 1.5);
            txt(c, gA + gB, X + (cw - 3) / 2, Y + (ch - 3) / 2, C.ink, F14); }); });
        txt(c, '♂ 配子', x0 - 40, y0 - 22, C.c1, F12); txt(c, '♀ 配子', x0 - 57, y0 - 8, C.c2, F12);
        var ph = P.cross(G[0], G[1], rr), L = [['[AB]', ph.AB || 0, PHC('AB')], ['[Ab]', ph.Ab || 0, PHC('Ab')], ['[aB]', ph.aB || 0, PHC('aB')], ['[ab]', ph.ab || 0, PHC('ab')]];
        bars(c, d.W * 0.64, top + 34, d.W * 0.33, d.H - top - 62, L, 1, '子代表型比例');
        var mn = Math.min.apply(null, L.map(function (x) { return x[1]; }).filter(function (v) { return v > 1e-9; }));
        d.out([['表型比 [AB]:[Ab]:[aB]:[ab]', L.map(function (x) { return +(x[1] / mn).toFixed(2); }).join(' : ')], ['各表型', L.map(function (x) { return x[0] + ' ' + pct(x[1]); }).join('，')]],
          '[AB] 表示 A、B 都表现显性。独立遗传时 AaBb × AaBb = 9:3:3:1，AaBb × aabb（测交）= 1:1:1:1。选“连锁”后双杂合亲本按组换价产生配子：AB = ab = (1 − r)/2，Ab = aB = r/2；测交子代的比例就等于配子比例。表格格子里显示配子比例不等时的组合（面积相同，比例看行列标签）。' +
          '<br>操作：把托盘里的等位基因拖到细胞的同一基因座上即替换；点按细胞里的基因切换显性／隐性，拖到另一个基因座上则互换。连锁时两基因在同一条染色体上（按相引 AB/ab 排列），沿染色体上下拖 B 基因可改组换价。');
      } };
  });

  /* ④ 酶反应速度：米氏方程、抑制剂、温度与 pH */
  D.reg('enzyme', function () {
    var m, mt, mp, sc, side, E, S, I, type, enz, T, pH, gS, gT, gH, t = 0;
    var swS = swarm(10, { seed: 5, speed: 26 }), swI = swarm(0, { seed: 19, speed: 22 }), prod = [], ENZ = [], ORD = [0, 5, 2, 7, 4, 1, 6, 3];
    for (var i = 0; i < 8; i++) ENZ.push({ ph: (i * 0.37) % 1, st: null });
    var Km = 2;
    function model() {
      var e = P.ENZ[enz.v], tf = P.tFactor(T.v, e.T), pf = P.pHFactor(pH.v, e.pH), f = tf * pf, ty = type.v === 'none' ? null : type.v, Ii = ty ? I.v : 0;
      var fDen = (T.v > e.T ? tf : 1) * pf;  /* 失活（变性）的只算高温与偏离最适 pH；低温只是变慢 */
      return { e: e, f: f, fDen: fDen, ty: ty, Ii: Ii, Vm: E.v * f };
    }
    function states(M) { /* 按比例给每个酶分配状态（示意）：失活、结合底物 S、竞争性抑制剂占据活性部位、非竞争性抑制剂结合在别构部位 */
      var n = Math.round(E.v * 4), nAct = n - Math.round(n * (1 - M.fDen)), x = S.v / Km, kS, kI = 0, kN = 0;
      if (M.ty === 'comp') { kS = Math.round(nAct * x / (1 + x + M.Ii)); kI = Math.min(nAct - kS, Math.round(nAct * M.Ii / (1 + x + M.Ii))); }
      else { kS = Math.round(nAct * S.v / (Km + S.v)); if (M.ty === 'noncomp') kN = Math.round(nAct * M.Ii / (1 + M.Ii)); }
      var act = ORD.filter(function (i) { return i < n; });
      ENZ.forEach(function (o, i) { o.on = i < n; o.den = act.indexOf(i) >= nAct; o.S = false; o.I = false; o.N = false; });
      act.slice(0, nAct).forEach(function (i, k) { var o = ENZ[i]; if (k < kS) o.S = true; else if (k < kS + kI) o.I = true; if (nAct - 1 - k < kN) o.N = true; });
      ENZ.forEach(function (o) { if (!o.S) o.ph = 0; });
      return n;
    }
    function epos(i) { var col = [0, 2, 1, 3, 0, 2, 1, 3][i], row = [0, 1, 0, 1, 1, 0, 1, 0][i]; return [sc.x + sc.w * (0.16 + 0.225 * col), sc.y + sc.h * (0.4 + 0.36 * row)]; }
    function enzyme(c, x, y, r, o, rS) { /* 酶：带凹口（活性部位）的蛋白质团块；变性时外形扭曲、失去凹口 */
      var col = o.den ? mix(C.c4, '#9a9a9a', 0.7) : C.c4, rn = rS * 1.3, phi = 2 * Math.asin(Math.min(0.95, rn / (2 * r))), a;
      shadow(c, x + 2, y + r + 2, r * 0.9, r * 0.22, 0.28);
      var g = c.createRadialGradient(x - r * 0.35, y - r * 0.2, r * 0.1, x, y, r * 1.1); g.addColorStop(0, shade(col, 0.45)); g.addColorStop(0.55, col); g.addColorStop(1, shade(col, -0.45));
      c.beginPath();
      if (o.den) for (var k = 0; k <= 36; k++) { a = k / 36 * 6.2832; var rr = r * (1 + 0.13 * Math.sin(5 * a + 1) + 0.08 * Math.sin(9 * a + 2)); k ? c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : c.moveTo(x + rr, y); }
      else { c.arc(x, y, r, -Math.PI / 2 + phi, Math.PI * 1.5 - phi); var s1 = r * Math.sin(phi), h1 = r * (1 - Math.cos(phi)); c.arc(x, y - r, rn, Math.atan2(h1, -s1), Math.atan2(h1, s1), true); }
      c.closePath(); c.fillStyle = g; c.fill(); c.lineWidth = 1; c.strokeStyle = shade(col, -0.55); c.stroke();
      if (!o.den) { c.beginPath(); c.arc(x + r * 0.97, y + r * 0.25, rS * 0.9, Math.PI * 0.55, Math.PI * 1.45); c.strokeStyle = alpha(shade(col, -0.5), 0.6); c.lineWidth = 1.2; c.stroke(); } /* 别构部位 */
      if (o.N) drawBall(c, x + r * 1.02, y + r * 0.25, rS * 0.85, C.c3);
      var sy = y - r + rn - rS * 1.05; /* 底物恰好嵌进活性部位 */
      if (o.S) { drawBall(c, x, sy, rS, mix(C.c1, C.c2, o.N ? 0 : o.ph)); if (!o.N && !D.reduced()) glow(c, x, sy, rS * 2.4, C.c2, 0.25 * o.ph); }
      if (o.I) drawBall(c, x, sy, rS, C.c3);
    }
    return { aspect: function (w) { return w < 560 ? 0.7 : 1.55; }, maxH: 580, animated: true,
      init: function (d) {
        E = d.slider('酶量（相对）', 0.25, 2, 0.25, 1, function (v) { return fx(v, 2) + ' 倍'; });
        S = d.slider('底物浓度 [S]', 0.5, 20, 0.5, 5, function (v) { return fx(v, 1); });
        type = d.seg('抑制剂', [['none', '无'], ['comp', '竞争性'], ['noncomp', '非竞争性']], 'none');
        I = d.slider('抑制剂浓度 [I]/K<sub>i</sub>', 0, 4, 0.1, 1, function (v) { return fx(v, 1); });
        enz = d.seg('酶（最适 pH）', [['pepsin', '胃蛋白酶 (2)'], ['amylase', '唾液淀粉酶 (7)'], ['trypsin', '胰蛋白酶 (8)']], 'amylase');
        T = d.slider('温度 [°C]（示意）', 0, 70, 1, 37, function (v) { return fx(v, 0); });
        pH = d.slider('pH（示意）', 1, 11, 0.1, 7, function (v) { return fx(v, 1); });
        gS = d.grab({ r: 8, autoplay: false, get: function () { var M = model(); return [m.X(S.v), m.Y(P.mm(S.v, M.Vm, Km, M.Ii, 1, M.ty))]; }, set: function (x) { S.set(snap(m.ix(x), 0.5, 0.5, 20)); } });
        gT = d.grab({ r: 7, autoplay: false, get: function () { return [mt.X(T.v), mt.Y(P.tFactor(T.v, P.ENZ[enz.v].T))]; }, set: function (x) { T.set(snap(mt.ix(x), 1, 0, 70)); } });
        gH = d.grab({ r: 7, autoplay: false, get: function () { return [mp.X(pH.v), mp.Y(P.pHFactor(pH.v, P.ENZ[enz.v].pH))]; }, set: function (x) { pH.set(snap(mp.ix(x), 0.1, 1, 11)); } });
      },
      resize: function (d) {
        var nar = d.W < 560, t0, x0;
        if (nar) { m = Map(0, 20, 0, 2.2, 46, d.W - 16, 16, d.H * 0.42); t0 = d.H * 0.42 + 26; sc = { x: 10, y: t0 + 4, w: d.W * 0.57 - 10, h: d.H - t0 - 12 }; x0 = d.W * 0.62; }
        else { m = Map(0, 20, 0, 2.2, 46, d.W * 0.62, 16, d.H * 0.58); t0 = 0; sc = { x: 14, y: d.H * 0.58 + 30, w: d.W * 0.62 - 14, h: d.H * 0.42 - 38 }; x0 = d.W * 0.68; }
        var w = d.W - x0 - 14, h1 = (d.H - t0 - 70) / 2;
        side = { x0: x0, w: w, t0: t0, h1: h1 };
        mt = Map(0, 70, 0, 1.25, x0, x0 + w, t0 + 30, t0 + 30 + h1 - 10); mp = Map(1, 11, 0, 1.15, x0, x0 + w, t0 + 30 + h1 + 30, d.H - 28);
      },
      step: function (d, dt) {
        t += dt; var M = model(), sp = 0.8 * (T.v > M.e.T ? 1 : P.tFactor(T.v, M.e.T)); /* 每个工作中的酶的周转速度 ∝ 未计变性的因子（低温变慢） */
        states(M);
        ENZ.forEach(function (o, i) { if (!o.on || !o.S || o.N || o.den) return; o.ph += dt * sp;
          if (o.ph >= 1) { o.ph -= 1; var q = epos(i); if (prod.length < 40) prod.push({ x: q[0], y: q[1] - 14, a: Math.random() * 6.283, age: 0 }); } });
        prod.forEach(function (p) { p.age += dt; p.a += (Math.random() - 0.5) * 3 * Math.sqrt(dt) * 4; p.x += Math.cos(p.a) * 26 * dt; p.y += Math.sin(p.a) * 26 * dt; });
        prod = prod.filter(function (p) { return p.age < 2.6 && p.x > sc.x && p.x < sc.x + sc.w && p.y > sc.y && p.y < sc.y + sc.h; });
        swS.step(dt, sc.w, sc.h); swI.step(dt, sc.w, sc.h);
      },
      draw: function (d, c) {
        var M = model(), e = M.e, f = M.f, Vm = M.Vm, ty = M.ty, Ii = M.Ii;
        axes(c, m, '底物浓度 [S]', '速度 v', 5, 0.5);
        function cur(V, I0, t0, col, w, dash) { var a = []; for (var s = 0; s <= 20; s += 0.1) a.push([m.X(s), m.Y(P.mm(s, V, Km, I0, 1, t0))]); line(c, a, col, w, dash); }
        cur(E.v, 0, null, C['ink-3'], 1.2, [5, 4]); cur(Vm, Ii, ty, C.c1, 2.5);
        line(c, [[m.X(0), m.Y(Vm / (ty === 'noncomp' ? 1 + Ii : 1))], [m.X(20), m.Y(Vm / (ty === 'noncomp' ? 1 + Ii : 1))]], C.c1, 1, [2, 4]);
        var vS = P.mm(S.v, Vm, Km, Ii, 1, ty);
        line(c, [[m.X(S.v), m.Y(vS)], [m.X(S.v), m.B]], alpha(C.c1, 0.6), 1, [2, 3]); line(c, [[m.L, m.Y(vS)], [m.X(S.v), m.Y(vS)]], alpha(C.c1, 0.6), 1, [2, 3]);
        txt(c, 'v = ' + fx(vS, 2), m.X(S.v) + 10, m.Y(vS) + (vS > 1.9 ? 14 : -14), C.c1, F14, 'left'); knob(c, m.X(S.v), m.Y(vS), C.c1, d.dragging(gS));
        hint(c, '拖 ● 改 [S]', m.X(13), m.Y(0.3), 'center');
        var x0 = side.x0, w = side.w, t0 = side.t0, h1 = side.h1;
        axes(c, mt, 't', '', 20, 0); axes(c, mp, 'pH', '', 2, 0);
        var a = []; for (var tt = 0; tt <= 70; tt += 0.5) a.push([mt.X(tt), mt.Y(P.tFactor(tt, e.T))]); line(c, a, C.c2, 2); knob(c, mt.X(T.v), mt.Y(P.tFactor(T.v, e.T)), C.c2, d.dragging(gT));
        a = []; for (var q = 1; q <= 11; q += 0.05) a.push([mp.X(q), mp.Y(P.pHFactor(q, e.pH))]); line(c, a, C.c4, 2); knob(c, mp.X(pH.v), mp.Y(P.pHFactor(pH.v, e.pH)), C.c4, d.dragging(gH));
        txt(c, '温度的影响（示意）', x0 + w / 2, t0 + 16, C['ink-2'], F12); txt(c, 'pH 的影响（示意）', x0 + w / 2, t0 + 30 + h1 + 16, C['ink-2'], F12);
        /* —— 反应液（示意）：酶、底物、产物、抑制剂 —— */
        panel(c, sc.x, sc.y, sc.w, sc.h, C.c1); txt(c, '反应液（示意）', sc.x + 8, sc.y + 11, C['ink-2'], '600 12px ' + D.FONT, 'left');
        var n = states(M), r = clamp(Math.min(sc.h * 0.17, sc.w * 0.075), 9, 22), rS = clamp(r * 0.3, 3, 6);
        var imS = molSprite(rS, C.c1), imP = molSprite(rS * 0.8, C.c2), imI = molSprite(rS, C.c3);
        swS.size(Math.round(S.v * 2)); swI.size(ty ? Math.round(Ii * 3) : 0); /* 颗粒数 ∝ 浓度 */
        function at(u, v) { return [sc.x + 8 + u * (sc.w - 16), sc.y + 22 + v * (sc.h - 30)]; }
        var zS = Math.ceil(2 * rS + 2), zP = Math.ceil(1.6 * rS + 2); /* 与缓存图同尺寸绘制，避免缩放发虚 */
        swS.each(function (u, v) { var q = at(u, v); blit(c, imS, q[0], q[1], zS, zS); });
        swI.each(function (u, v) { var q = at(u, v); blit(c, imI, q[0], q[1], zS, zS); });
        prod.forEach(function (p) { c.globalAlpha = clamp(1.6 - p.age * 0.6, 0, 1); blit(c, imP, p.x - rS * 0.6, p.y, zP, zP); blit(c, imP, p.x + rS * 0.6, p.y + 1, zP, zP); }); c.globalAlpha = 1;
        ENZ.forEach(function (o, i) { if (!o.on) return; var q = epos(i); enzyme(c, q[0], q[1] + Math.sin(t * 1.7 + i) * (D.reduced() ? 0 : 1.2), r, o, rS); });
        var lx = sc.x + sc.w - 8, lgy = sc.w < 330 ? sc.y + sc.h - 10 : sc.y + 11; /* 窄屏图例放到底部 */
        [['抑制剂', C.c3, ty], ['产物', C.c2, 1], ['底物', C.c1, 1]].forEach(function (L) { if (!L[2]) return; c.font = F12; var tw = c.measureText(L[0]).width; txt(c, L[0], lx, lgy, C['ink-2'], F12, 'right'); drawBall(c, lx - tw - 8, lgy, 4, L[1]); lx -= tw + 22; });
        var cat = P.mm(S.v, 1, Km, Ii, 1, ty);
        d.out([['最大速度 V<sub>max</sub>', fx(Vm / (ty === 'noncomp' ? 1 + Ii : 1), 2)], ['表观 K<sub>m</sub>', fx(ty === 'comp' ? Km * (1 + Ii) : Km, 2)], ['[S] = ' + fx(S.v, 1) + ' 时的速度', fx(vS, 2)], ['温度・pH 因子', fx(f, 2)], ['正在催化的酶（ES）比例', pct(cat)]],
          '底物浓度足够高时速度饱和（所有酶都在工作），此时增加酶量 V<sub>max</sub> 成比例增大。竞争性抑制剂与底物抢活性部位：底物越多影响越小，V<sub>max</sub> 不变；非竞争性抑制剂结合在别处：V<sub>max</sub> 下降。右侧温度・pH 曲线是定性示意（高温使酶变性失活），不是实测数据。' +
          '<br>操作：拖速度曲线上的点改 [S]，拖右侧两条曲线上的点改温度、pH。反应液中蓝色为底物、橙色为产物、紫色为抑制剂，颗粒数与浓度成比例；' + n + ' 个酶中结合底物、被抑制或变性的个数按上面的比例取整（示意）。“正在催化的比例”= v ÷（酶量 × 温度・pH 因子）。');
      } };
  });

  /* ⑤ 静息电位：能斯特式与 GHK 式 */
  D.reg('memb', function () {
    var Ko, Nao, pNa, m, sc, Ki = 140, Nai = 15, Clo = 110, Cli = 10, gK, gN, gV, gG, flux = [], t = 0, acc = { K: 0, Na: 0 }, g0;
    var sw = { Ko: swarm(1, { seed: 5, speed: 16 }), Nao: swarm(36, { seed: 9, speed: 16 }), Ki: swarm(35, { seed: 13, speed: 16 }), Nai: swarm(4, { seed: 17, speed: 16 }) };
    function V() { return { EK: P.nernst(1, Ko.v, Ki), ENa: P.nernst(1, Nao.v, Nai), Vm: P.ghk(1, pNa.v, 0.45, Ko.v, Ki, Nao.v, Nai, Clo, Cli) }; }
    function openF() { return clamp(Math.log(pNa.v / 0.01) / Math.log(2000), 0, 1); } /* P_Na/P_K 0.01–20 的对数位置 → 通道开度 */
    function geo() { var mx = sc.x + sc.w / 2, mw = clamp(sc.w * 0.09, 16, 26), chH = clamp(sc.h * 0.16, 28, 46);
      return { mx: mx, mw: mw, chH: chH, yK: sc.y + sc.h * 0.36, yNa: sc.y + sc.h * 0.72, xo0: sc.x + 6, xo1: mx - mw / 2 - 10, xi0: mx + mw / 2 + 10, xi1: sc.x + sc.w - 6, y0: sc.y + (sc.w < 300 ? 52 : 38), y1: sc.y + sc.h - 6 }; }
    function bilayer(G) { /* 磷脂双分子层（缓存图）：亲水头部朝外、疏水尾部朝内；通道处留空 */
      var w = G.mw, hh = Math.round(sc.h), gk = [G.yK - sc.y, G.yNa - sc.y];
      return sprite('bilayer' + w + '|' + Math.round(gk[0]) + '|' + Math.round(gk[1]) + '|' + G.chH, w + 2, hh, function (g) {
        var hr = Math.max(2.4, w * 0.13), st = hr * 2 + 0.8, hc = C.dark ? '#d9a95a' : '#e0a84a';
        g.fillStyle = alpha(C.c4, C.dark ? 0.12 : 0.08); g.fillRect(1, 0, w, hh);
        for (var y = hr; y < hh - hr; y += st) {
          if (gk.some(function (k) { return Math.abs(y - k) < G.chH / 2 + hr; })) continue;
          g.strokeStyle = alpha(C['ink-3'], 0.7); g.lineWidth = 0.9; g.beginPath();
          [-1, 1].forEach(function (sd) { var xh = 1 + w / 2 + sd * (w / 2 - hr); for (var k = -1; k <= 1; k += 2) { g.moveTo(xh - sd * hr, y + k * hr * 0.35); g.quadraticCurveTo(xh - sd * w * 0.25, y + k * hr * 0.9, 1 + w / 2 - sd * 1, y + k * hr * 0.3); } });
          g.stroke(); drawBall(g, 1 + hr, y, hr, hc); drawBall(g, 1 + w - hr, y, hr, hc);
        }
      });
    }
    function channel(c, x, y, w, hh, col, open, lab) { /* 离子通道：上下两个蛋白亚基围成横穿膜的孔道，孔径随开度变化；返回孔径 */
      var pw = 3 + open * 6, sh = (hh - pw) / 2, cw = w + 10;
      [-1, 1].forEach(function (sd) { var yy = sd < 0 ? y - pw / 2 - sh : y + pw / 2, g = c.createLinearGradient(0, yy, 0, yy + sh);
        g.addColorStop(0, shade(col, 0.3)); g.addColorStop(0.6, col); g.addColorStop(1, shade(col, -0.35));
        rrect(c, x - cw / 2, yy, cw, sh, sh * 0.4); c.fillStyle = g; c.fill(); c.lineWidth = 1; c.strokeStyle = shade(col, -0.55); c.stroke(); });
      txt(c, lab, x - cw / 2 - 5, y, col, '600 12px ' + D.FONT, 'right');
      return pw;
    }
    function flow(kind, G, dirOut) { return { k: kind, t: 0, out: dirOut, y: kind === 'K' ? G.yK : G.yNa, tr: D.trail(6, 0.06) }; }
    return { aspect: function (w) { return w < 560 ? 1.0 : 1.9; }, maxH: 440, animated: true,
      init: function (d) {
        Ko = d.slider('细胞外 K⁺ [mM]', 1, 40, 0.5, 4, function (v) { return fx(v, 1); });
        Nao = d.slider('细胞外 Na⁺ [mM]', 50, 200, 1, 145, function (v) { return fx(v, 0); });
        pNa = d.slider('Na⁺ 通透性 P<sub>Na</sub>/P<sub>K</sub>', 0.01, 20, 0.01, 0.04, function (v) { return fx(v, 2); });
        function ly(v) { return m.Y(clamp(v, -110, 70)); }
        /* 刻度上的线可上下拖：E_K、E_Na 由能斯特式反解细胞外浓度；膜电位由 GHK 式反解 P_Na/P_K（对 P_Na 单调，二分法） */
        gK = d.grab({ r: 8, autoplay: false, get: function () { return [m.L + (m.R - m.L) * 0.22, ly(V().EK)]; }, set: function (x, y) { Ko.set(snap(Ki * Math.exp(m.iy(y) / P.RTF), 0.5, 1, 40)); } });
        gN = d.grab({ r: 8, autoplay: false, get: function () { return [m.L + (m.R - m.L) * 0.5, ly(V().ENa)]; }, set: function (x, y) { Nao.set(snap(Nai * Math.exp(m.iy(y) / P.RTF), 1, 50, 200)); } });
        gV = d.grab({ r: 8, autoplay: false, get: function () { return [m.L + (m.R - m.L) * 0.78, ly(V().Vm)]; }, set: function (x, y) {
          var tg = m.iy(y), lo = 0, hi = 1; for (var i = 0; i < 40; i++) { var md = (lo + hi) / 2; if (P.ghk(1, 0.01 * Math.pow(2000, md), 0.45, Ko.v, Ki, Nao.v, Nai, Clo, Cli) < tg) lo = md; else hi = md; }
          pNa.set(snap(0.01 * Math.pow(2000, (lo + hi) / 2), 0.01, 0.01, 20)); } });
        gG = d.grab({ r: function () { return geo().chH / 2; }, autoplay: false, get: function () { var G = geo(); return [G.mx, G.yNa]; },
          start: function (x, y) { g0 = [y, openF()]; }, set: function (x, y) { pNa.set(snap(0.01 * Math.pow(2000, clamp(g0[1] + (g0[0] - y) / (sc.h * 0.4), 0, 1)), 0.01, 0.01, 20)); } });
      },
      resize: function (d) { m = Map(0, 1, -110, 70, 70, d.W * 0.36, 16, d.H - 20); sc = { x: d.W * 0.5, y: 12, w: d.W * 0.48, h: d.H - 24 }; },
      step: function (d, dt) {
        t += dt; var v = V(), G = geo();
        ['Ko', 'Nao', 'Ki', 'Nai'].forEach(function (k) { sw[k].step(dt, G.xo1 - G.xo0, G.y1 - G.y0); });
        /* 通过通道的离子流（示意）：频率 ∝ 通透性 × |膜电位 − 平衡电位|；方向由驱动力决定 */
        acc.K += dt * 0.9 * Math.abs(v.Vm - v.EK) / 40; acc.Na += dt * 0.9 * openF() * Math.abs(v.Vm - v.ENa) / 40;
        if (acc.K >= 1) { acc.K = 0; if (flux.length < 12) flux.push(flow('K', G, v.Vm > v.EK)); }
        if (acc.Na >= 1) { acc.Na = 0; if (flux.length < 12) flux.push(flow('Na', G, v.Vm > v.ENa)); }
        flux.forEach(function (f) { f.t += dt / 1.3; }); flux = flux.filter(function (f) { return f.t < 1; });
      },
      draw: function (d, c) {
        var v = V(), EK = v.EK, ENa = v.ENa, Vm = v.Vm, G = geo(), op = openF();
        c.save(); c.strokeStyle = C.line; c.lineWidth = 1; c.font = F12; c.fillStyle = C['ink-3']; c.textAlign = 'right'; c.textBaseline = 'middle';
        for (var vv = -100; vv <= 60; vv += 20) { c.beginPath(); c.moveTo(m.L, m.Y(vv)); c.lineTo(m.R, m.Y(vv)); c.stroke(); c.fillText(vv + ' mV', m.L - 6, m.Y(vv)); } c.restore();
        [[EK, 'E_K', C.c1, gK], [ENa, 'E_Na', C.c2, gN], [Vm, '膜电位', C.accent, gV]].forEach(function (q, i) { var y = m.Y(Math.max(-110, Math.min(70, q[0])));
          line(c, [[m.L, y], [m.R, y]], q[2], i === 2 ? 3 : 2, i === 2 ? null : [6, 4]); txt(c, q[1] + ' ' + fx(q[0], 0), m.R + 6, y, q[2], F12, 'left');
          var k = q[3].get(); knob(c, k[0], k[1], q[2], d.dragging(q[3])); });
        /* —— 细胞膜场景 —— */
        var x0 = sc.x, w = sc.w, mx = G.mx;
        rrect(c, x0, sc.y, w, sc.h, 10); c.save(); c.clip();
        c.fillStyle = alpha(C.c1, C.dark ? 0.08 : 0.04); c.fillRect(x0, sc.y, w / 2, sc.h); c.fillStyle = alpha(C.c4, C.dark ? 0.16 : 0.1); c.fillRect(mx, sc.y, w / 2, sc.h); c.restore();
        rrect(c, x0, sc.y, w, sc.h, 10); c.lineWidth = 1; c.strokeStyle = C.line; c.stroke();
        txt(c, '细胞外', (G.xo0 + G.xo1) / 2, sc.y + 12, C['ink-2'], '600 12px ' + D.FONT); txt(c, '细胞内', (G.xi0 + G.xi1) / 2, sc.y + 12, C['ink-2'], '600 12px ' + D.FONT);
        function conc(x, k, na) { c.font = F12; var a = 'K⁺ ' + k, b = 'Na⁺ ' + na, wa = c.measureText(a).width, wb = c.measureText(b).width, s0 = x - (wa + wb + 8) / 2;
          if (wa + wb + 14 > G.xo1 - G.xo0) { txt(c, a, x, sc.y + 27, C.c1, F12); txt(c, b, x, sc.y + 41, C.c2, F12); return; } /* 窄屏分两行 */
          txt(c, a, s0, sc.y + 27, C.c1, F12, 'left'); txt(c, b, s0 + wa + 8, sc.y + 27, C.c2, F12, 'left'); }
        conc((G.xo0 + G.xo1) / 2, fx(Ko.v, 1), fx(Nao.v, 0)); conc((G.xi0 + G.xi1) / 2, '140', '15');
        var DPR = Math.min(window.devicePixelRatio || 1, 2), imK = molSprite(4.5, C.c1, '+'), imN = molSprite(3.6, C.c2, '+');
        function ions(s, img, r, a, b, n) { s.size(Math.max(1, Math.round(n / 4))); s.each(function (u, vv) { blit(c, img, a + u * (b - a), G.y0 + vv * (G.y1 - G.y0), 2 * r + 2, 2 * r + 2); }); } /* 颗粒数 = 浓度 ÷ 4 mM（至少 1 个） */
        ions(sw.Ko, imK, 4.5, G.xo0, G.xo1, Ko.v); ions(sw.Nao, imN, 3.6, G.xo0, G.xo1, Nao.v); ions(sw.Ki, imK, 4.5, G.xi0, G.xi1, Ki); ions(sw.Nai, imN, 3.6, G.xi0, G.xi1, Nai);
        var bl = bilayer(G); c.drawImage(bl, mx - G.mw / 2 - 1, sc.y, G.mw + 2, Math.round(sc.h));
        /* 膜两侧的电荷：膜电位为负时外正内负 */
        var nq = Math.min(8, Math.round(Math.abs(Vm) / 12)), so = Vm < 0 ? '+' : '−', si = Vm < 0 ? '−' : '+';
        for (var i = 0; i < nq; i++) { var yy = sc.y + 44 + (sc.h - 56) * (i + 0.5) / nq; if (Math.abs(yy - G.yK) < G.chH / 2 + 4 || Math.abs(yy - G.yNa) < G.chH / 2 + 4) continue;
          txt(c, so, mx - G.mw / 2 - 7, yy, so === '+' ? C.c2 : C.c1, '700 13px ' + D.FONT); txt(c, si, mx + G.mw / 2 + 7, yy, si === '+' ? C.c2 : C.c1, '700 13px ' + D.FONT); }
        channel(c, mx, G.yK, G.mw, G.chH, C.c1, 1, 'K⁺ 通道');
        if (d.dragging(gG)) glow(c, mx, G.yNa, G.chH, C.c2, 0.35);
        var pw = channel(c, mx, G.yNa, G.mw, G.chH, C.c2, op, 'Na⁺ 通道'), hx = mx + G.mw / 2 + 5, hy = G.yNa - pw / 2 - 1, ga = Math.PI / 2 * (1 - op) - 0.6 * op; /* 闸门：关闭时盖住细胞内侧孔口，打开时向上翻开 */
        c.save(); c.lineCap = 'round'; c.strokeStyle = shade(C.c2, -0.3); c.lineWidth = 3.5; c.beginPath(); c.moveTo(hx, hy); c.lineTo(hx + Math.cos(ga) * (pw + 5), hy + Math.sin(ga) * (pw + 5)); c.stroke(); c.restore();
        drawBall(c, hx, hy, 2.6, shade(C.c2, -0.2));
        hint(c, '↕ 拖', hx + 10, G.yNa + G.chH / 2 + 2, 'left');
        flux.forEach(function (f) { var a = f.out ? G.xi0 + 6 : G.xo1 - 6, b = f.out ? G.xo1 - 18 : G.xi0 + 18, x = a + (b - a) * f.t, y = f.y + Math.sin(f.t * 9) * 1.5, img = f.k === 'K' ? imK : imN, r = f.k === 'K' ? 4.5 : 3.6;
          f.tr.push(f.t * 1.3, x, y); f.tr.each(function (px, py, fr) { c.globalAlpha = fr * 0.35; blit(c, img, px, py, 2 * r + 2, 2 * r + 2); }); c.globalAlpha = 1; blit(c, img, x, y, 2 * r + 2, 2 * r + 2); });
        d.out([['K⁺ 平衡电位 E<sub>K</sub>', fx(EK, 1) + ' mV'], ['Na⁺ 平衡电位 E<sub>Na</sub>', fx(ENa, 1) + ' mV'], ['膜电位（GHK 式）', fx(Vm, 1) + ' mV']],
          '静息时膜主要对 K⁺ 通透，K⁺ 顺浓度梯度外流使内侧为负（约 −70 mV，接近 E<sub>K</sub>）。把 P<sub>Na</sub>/P<sub>K</sub> 调大（Na⁺ 通道打开）模拟动作电位：膜电位向 E<sub>Na</sub>（正值）靠近。细胞外 K⁺ 升高时静息电位变浅（去极化）。37 °C，能斯特式 E = 61.5 log(外/内) mV（一价离子）；浓度为哺乳动物的典型值。' +
          '<br>操作：上下拖 E<sub>K</sub> 线改细胞外 K⁺、拖 E<sub>Na</sub> 线改细胞外 Na⁺（由能斯特式反算），拖膜电位线或上下拖 Na⁺ 通道改 P<sub>Na</sub>/P<sub>K</sub>。离子颗粒数 = 浓度 ÷ 4 mM（示意，未画 Cl⁻）；穿过通道的离子方向由驱动力（膜电位 − 平衡电位）决定。');
      } };
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', D.boot); else D.boot();
})();
