/* 生物互动演示公式的数值检查：node tests/test_bio.js */
var P = require('../assets/bio.js'), n = 0, bad = 0;
function ok(name, got, exp, tol) { n++; tol = tol == null ? 1e-6 : tol; var e = Math.abs(got - exp) <= tol * Math.max(1, Math.abs(exp));
  if (!e) { bad++; console.log('FAIL', name, got, 'expected', exp); } }
function T(name, c) { n++; if (!c) { bad++; console.log('FAIL', name); } }
/* 氧解离（与常用数据页的典型值对照） */
ok('P50 处饱和度 50%', P.satHb(26.8, 26.8), 0.5); T('肺 100 mmHg ≈ 97–98%', P.satHb(100, 26.8) > 0.965 && P.satHb(100, 26.8) < 0.985);
T('组织 40 mmHg ≈ 75%', Math.abs(P.satHb(40, 26.8) - 0.75) < 0.015); T('运动肌肉 20 mmHg ≈ 30–35%', P.satHb(20, 26.8) > 0.29 && P.satHb(20, 26.8) < 0.36);
T('pH 下降 → P50 增大（右移）', P.p50(7.2, 37) > 26.8); T('升温 → 右移', P.p50(7.4, 40) > 26.8); ok('基准条件 P50', P.p50(7.4, 37), 26.8);
var u = P.unload(0.96, 0.36); ok('站内题：96%→36% 占全部 60%', u.ofAll, 0.6); ok('占氧合 Hb 62.5%', u.ofBound, 0.625);
/* 哈迪–温伯格 */
var g = P.hw(0.7); ok('aa 9% 时 Aa 42%', g.Aa, 0.42); ok('和为 1', g.AA + g.Aa + g.aa, 1); ok('q=√aa', P.qFromAa(0.16), 0.4);
ok('无选择时 q 不变', P.selectStep(0.3, 0), 0.3); T('选择使 q 下降', P.selectStep(0.3, 0.5) < 0.3); ok('s=1：q′=q/(1+q)', P.selectStep(0.5, 1), 0.5 / 1.5);
/* 杂交 */
var c = P.cross('AaBb', 'AaBb'); ok('9:3:3:1 [AB]', c.AB, 9 / 16); ok('[ab] 1/16', c.ab, 1 / 16); ok('[Ab] 3/16', c.Ab, 3 / 16);
c = P.cross('AaBb', 'aabb'); ok('测交 1:1:1:1', c.AB, 0.25); ok('测交 [ab]', c.ab, 0.25);
c = P.cross('AaBb', 'aabb', 0.2); ok('连锁 r=20% 测交 AB 40%', c.AB, 0.4); ok('重组型 Ab 10%', c.Ab, 0.1);
c = P.cross('AaBb', 'AaBb', 0); ok('完全连锁自交 3:1', c.AB, 0.75); ok('完全连锁 aabb', c.ab, 0.25);
c = P.cross('Aabb', 'aaBb'); ok('Aabb×aaBb 各 1/4', c.AB, 0.25);
/* 米氏方程 */
ok('[S]=Km 时 v=Vmax/2', P.mm(2, 1, 2), 0.5); ok('竞争性：高 [S] 趋近 Vmax', P.mm(1e6, 1, 2, 3, 1, 'comp'), 1, 1e-4); ok('非竞争性：Vmax/(1+I/Ki)', P.mm(1e9, 1, 2, 1, 1, 'noncomp'), 0.5, 1e-6);
ok('最适 pH 因子=1', P.pHFactor(2, 2), 1); ok('最适温度因子=1', P.tFactor(37, 37), 1); T('高温失活', P.tFactor(60, 37) === 0);
/* 膜电位 */
ok('RT/F·ln10 ≈ 61.5 mV（37 °C）', P.RTF * Math.LN10, 61.5, 2e-3); ok('E_K（4/140）', P.nernst(1, 4, 140), 61.54 * Math.log10(4 / 140), 2e-3);
T('静息电位 −60 ~ −80 mV', (function () { var v = P.ghk(1, 0.04, 0.45, 4, 140, 145, 15, 110, 10); return v < -60 && v > -80; })());
T('Na 通透性大 → 正电位', P.ghk(1, 20, 0.45, 4, 140, 145, 15, 110, 10) > 30);
console.log(n + ' demo formula checks, ' + bad + ' failures'); process.exit(bad ? 1 : 0);
