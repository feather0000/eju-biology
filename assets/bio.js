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
