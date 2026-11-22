import importlib.util, glob, os, json, html, sys, math
import mapkids
sys.path.insert(0,"content")
open('assets/demos.js','w').write(''.join(open(f).read() for f in ['assets/bio.js']+sorted(glob.glob('demos_src/*.js'))))
DEMOS={
'homeostasis':[('hb','氧解离曲线与玻尔效应','酸素解離曲線とボーア効果','调组织的 pH、温度和氧分压，看曲线右移与组织中放出的 O₂。可直接拖曲线上的组织点和 P₅₀ 点；右侧红细胞的颜色随氧合程度变化。')],
'evolution':[('hw','哈迪–温伯格平衡与自然选择','ハーディ・ワインベルグの法則','由等位基因频率得到基因型频率；加入对 aa 的选择，看 q 逐代变化。可拖基因库条的分界改 p，拖 q 曲线的起点和终点。')],
'genetics':[('punnett','两对基因的杂交（独立／连锁）','2組の対立遺伝子の交配','选择亲本基因型，看配子、棋盘格与子代表型比；连锁时可调组换价。可把等位基因拖进亲本细胞，点按切换显隐性。')],
'metabolism':[('enzyme','酶反应速度','酵素反応の速度','底物浓度、酶量、竞争性／非竞争性抑制剂，以及温度和 pH 的影响（示意）。可拖曲线上的点改 [S]、温度和 pH，反应液中可看到酶与底物结合。')],
'nerve':[('memb','静息电位与离子浓度','静止電位','改变细胞外 K⁺、Na⁺ 浓度和 Na⁺ 通透性，看能斯特电位与膜电位。可上下拖电位线或 Na⁺ 通道，看离子穿过细胞膜。')],
}
def demosec(t):
    ds=DEMOS.get(t['slug'],[])
    if not ds: return ''
    body=''.join(f'<div class="demo" data-demo="{k}" data-title="{zh}"><h3>{zh}</h3><p class="demo-desc">{jp}　{desc}</p></div>' for k,zh,jp,desc in ds)
    return f'<section id="demo"><h2>互动演示</h2><p class="jp-sub">インタラクティブ・デモ（可拖动・调参数；离开画面自动暂停）</p>{body}</section>'
TOPICS=[]
for f in sorted(glob.glob('content/[0-9]*.py')):
    s=importlib.util.spec_from_file_location(os.path.basename(f)[:-3],f); m=importlib.util.module_from_spec(s); s.loader.exec_module(m); TOPICS.append(m.TOPIC)
MARK='①②③④⑤⑥'
# DEMO-HOOK
from _x import demo_hub
TOPICS = [t for t in TOPICS if t['slug'] != 'demos']
_k = next((i for i, t in enumerate(TOPICS) if not (t.get('bank') or t['problems'])), len(TOPICS))
TOPICS.insert(_k, demo_hub(TOPICS, DEMOS))
# TIPS-HOOK
_TIPS = next((t.get('tips_data') for t in TOPICS if t.get('tips_data')), None)
if _TIPS:
    from _x import tip_backsec
    for t in TOPICS:
        if t.get('bank') or t['problems']:
            t['sections'] = [s for s in t['sections'] if s[0] != 'tips']
            _s = tip_backsec(t['slug'], _TIPS)
            if _s: t['sections'].append(_s)
# THEME-JS：头脚本（首次绘制前定主题并同步 <meta name="color-scheme">）与主题切换（四站同一份）
HEADJS = """<script>(function(){var d=document.documentElement,m=document.querySelector('meta[name="color-scheme"]'),t=null;try{t=localStorage.getItem('eju-theme')}catch(e){}if(t!=='light'&&t!=='dark')t=window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';d.setAttribute('data-theme',t);if(m)m.content=t})()</script>"""
TOGGLEJS = """<script>(function(){var d=document.documentElement,b=document.getElementById('theme');if(!b)return;function s(t){d.setAttribute('data-theme',t);var m=document.querySelector('meta[name="color-scheme"]');if(m)m.content=t;b.textContent=t==='dark'?'浅色':'深色';b.setAttribute('aria-label',t==='dark'?'切换到浅色主题':'切换到深色主题')}s(d.getAttribute('data-theme')==='dark'?'dark':'light');b.onclick=function(){var t=d.getAttribute('data-theme')==='dark'?'light':'dark';s(t);try{localStorage.setItem('eju-theme',t)}catch(e){}};addEventListener('storage',function(e){if(e.key==='eju-theme'&&(e.newValue==='light'||e.newValue==='dark'))s(e.newValue)});var q=window.matchMedia&&matchMedia('(prefers-color-scheme: dark)');if(q&&q.addEventListener)q.addEventListener('change',function(e){var v=null;try{v=localStorage.getItem('eju-theme')}catch(_){}if(v!=='light'&&v!=='dark')s(e.matches?'dark':'light')})})();</script>"""
# SITE-META：每站主色（<html data-site>）、favicon、OG / Twitter 分享卡片（og:image 用绝对 URL）、共用交互脚本
import siteenv
CFG = siteenv.load('biology')
SITE = 'biology'; SITE_NAME = 'EJU 理科 生物'; SITE_PATH = CFG.site_path; SITE_URL = CFG.site_url

SITE_DESC = '按 JASSO《日本留学試験 理科シラバス（生物）》编排：细胞・代谢・遗传・发生・调节・免疫・植物・生态・进化。每页含要点讲解（中文 + 日语术语）、关键公式、原创例题（含遗传比例/计算题）和带解答的 EJU 风格选择题。'
def headmeta(title, desc, path, root):
    t, d = html.escape(title), html.escape(html.unescape(desc))
    return (f'<meta name="description" content="{d}">'
            f'<link rel="icon" href="{root}assets/favicon.svg" type="image/svg+xml"><link rel="icon" href="{root}assets/favicon-32.png" sizes="32x32" type="image/png"><link rel="apple-touch-icon" href="{root}assets/apple-touch-icon.png">\n'
            f'<meta property="og:type" content="website"><meta property="og:site_name" content="{SITE_NAME}"><meta property="og:locale" content="zh_CN"><meta property="og:title" content="{t}"><meta property="og:description" content="{d}"><meta property="og:url" content="{SITE_URL}{path}">'
            f'<meta property="og:image" content="{SITE_URL}assets/og.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="{SITE_NAME} · 全专题中文讲义">'
            f'<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{t}"><meta name="twitter:description" content="{d}"><meta name="twitter:image" content="{SITE_URL}assets/og.png">\n' + siteenv.extra_meta(CFG, path))
def page(t):
    meta = headmeta(f'{SITE_NAME} · {t["n"]} {t["zh"]}', t["lead"], f'topics/{t["slug"]}/', '../../')
    toc=[(sid,tt) for sid,tt,_,_ in t['sections']]+([('demo','互动演示')] if DEMOS.get(t['slug']) else [])+([('examples','例题')] if t['examples'] else [])+([('practice','练习题')] if t['problems'] else [])+([('terms','术语对照')] if t['terms'] else [])
    tochtml=''.join(f'<li><a href="#{i}">{k+1} {tt}</a></li>' for k,(i,tt) in enumerate(toc))
    secs=''.join(f'<section id="{sid}"><h2>{tt}</h2><p class="jp-sub">{jp}</p>{body}</section>' for sid,tt,jp,body in t['sections'])
    ex=''.join(f'<article class="q"><div class="q-head"><b>例题 {k+1}　{e[0]}</b></div>{e[1]}<details><summary>解答</summary><div class="ans">{e[2]}</div></details></article>' for k,e in enumerate(t['examples']))
    pr=''
    for k,p in enumerate(t['problems']):
        opts=''.join(f'<li>{MARK[j]} {o}</li>' for j,o in enumerate(p['opts']))
        pr+=(f'<article class="q" id="p{k+1}"><div class="q-head"><b>问 {k+1}</b>{'<span class="origin hf">原创 · 过去问高频题型</span>' if p.get("new") else '<span class="origin">原创 · EJU 风格</span>'}</div><p>{p["q"]}</p><ol class="opts">{opts}</ol>'
             f'<details><summary>解答</summary><div class="ans"><p><strong>正解：{MARK[p["ans"]]}</strong></p>{p["sol"]}</div></details></article>')
    terms=''.join(f'<tr><td>{a}</td><td lang="ja">{b}</td><td class="kana" lang="ja">{c}</td></tr>' for a,b,c in t['terms'])
    hero=''.join(f'$${h}$$' for h in t['hero'])
    hero_box = f'<div class="hero-formula" aria-hidden="true">{hero}</div>' if hero else ''
    EX=f'''<section id="examples"><h2>例题</h2><p class="jp-sub">例題</p>{ex}</section>''' if t['examples'] else ''
    PR=f'''<section id="practice"><h2>练习题</h2><p class="jp-sub">練習問題（{len(t["problems"])} 题，选择题）</p>{pr}</section>''' if t['problems'] else ''
    TE=f'''<section id="terms"><h2>术语对照</h2><p class="jp-sub">用語</p><div class="tw"><table><tr><th>中文</th><th>日本語</th><th>读法</th></tr>{terms}</table></div></section>''' if t['terms'] else ''
    return f'''<!DOCTYPE html><html lang="zh-CN" data-site="{SITE}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><meta name="color-scheme" content="light dark">
{HEADJS}<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<title>EJU 理科 生物 · {t["n"]} {t["zh"]}</title>{meta}<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" integrity="sha384-nB0miv6/jRmo5UMMR1wu3Gz6NLsoTkbqJghGIsx//Rlm+ZU03BU6SQNC66uf4l5+" crossorigin="anonymous" referrerpolicy="no-referrer">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js" integrity="sha384-7zkQWkzuo3B5mTepMUcHkMB5jZaolc2xDwL6VFqjFALcbeS9Ggm/Yr2r3Dy4lfFg" crossorigin="anonymous" referrerpolicy="no-referrer"></script><script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js" integrity="sha384-43gviWU0YVjaDtb/GhzOouOXtZMP/7XUzwPTstBeZFe/+rCMvRwr4yROQP43s0Xk" crossorigin="anonymous" referrerpolicy="no-referrer"></script><script defer src="../../assets/lazy-katex.js"></script><script defer src="../../assets/eju-ux.js"></script><script defer src="../../assets/demos.js?v=2"></script>
<link rel="stylesheet" href="../../assets/site.css"></head><body>
<a class="skip" href="#main">跳到正文</a><div id="cdn-note" hidden>公式库（KaTeX）未能加载，公式将显示为源码。请联网后刷新页面。</div>
<header class="hero"><div class="hero-in"><div class="hero-text"><p class="back"><a href="../../">← 目录</a></p><p class="eyebrow">EJU 理科 生物 · {t["area"]} · {t["ja"]}</p><h1>{t["n"]} {t["zh"]}</h1><p class="lead">{t["lead"]}</p></div>{hero_box}</div></header>
<div class="layout"><nav class="toc" aria-label="目录"><div style="flex:1;min-width:0"><p class="toc-title">目录</p><ol>{tochtml}</ol></div><button class="chip theme-btn" id="theme" type="button">深色</button></nav>
<main id="main">{secs}{demosec(t)}{EX}{PR}{TE}
<footer>原创讲义与题目，非 JASSO 官方内容。按《日本留学試験 理科シラバス（生物）》编排。</footer></main></div>
{TOGGLEJS}<script>(function(){{
var L=[].slice.call(document.querySelectorAll('nav.toc a'));if('IntersectionObserver'in window){{var io=new IntersectionObserver(function(es){{es.forEach(function(e){{if(e.isIntersecting)L.forEach(function(a){{a.classList.toggle('on',a.getAttribute('href')==='#'+e.target.id)}})}})}},{{rootMargin:'-20% 0px -70% 0px'}});document.querySelectorAll('main section').forEach(function(x){{io.observe(x)}})}}
window.addEventListener('load',function(){{if(!window.renderMathInElement){{document.getElementById('cdn-note').hidden=false;return}}renderMathInElement(document.body,{{delimiters:[{{left:'$$',right:'$$',display:true}},{{left:'$',right:'$',display:false}}],throwOnError:false}})}})}})();</script>
<script src="../../assets/nav.js"></script></body></html>'''
for t in TOPICS:
    os.makedirs(f'topics/{t["slug"]}',exist_ok=True); open(f'topics/{t["slug"]}/index.html','w').write(siteenv.with_banner(CFG, page(t), f'topics/{t["slug"]}/'))
# HOME：首页目次（像书的目录：左侧章号，右侧章名与专题，点线引到右侧的题数・过去问・星级）；目次下是知识导图（homemap.py 生成的内联 SVG），
# 之后「附」列资料与工具，「表」是过去问频度表。样式在 site.css 末尾「生物站首页目次」块，只作用于 body.contents / #map
# 各专题的 area 几乎一题一个分野，目次按讲义常见的六章合并（只在这里分组，不改专题自己的 area）
CHAPTERS = [  # 章名、日文名、导图上的短名、提要、所含专题
 ('细胞与代谢', '細胞と代謝', '细胞代谢', '原核细胞与真核细胞、细胞器与生体物质；酶与 ATP，呼吸、发酵与光合作用。', ['cell', 'metabolism']),
 ('遗传信息', '遺伝情報', '遗传信息', 'DNA 的结构与复制、转录与翻译、基因表达调控；细胞周期、体细胞分裂与减数分裂。', ['dna', 'division']),
 ('生殖与遗传', '生殖と遺伝', '生殖遗传', '有性生殖与配子形成、受精与发生、细胞分化；孟德尔定律、连锁与交换的比例计算。', ['development', 'genetics']),
 ('动物的反应与体内环境', '動物の反応と体内環境', '动物反应', '感受器、神经与肌肉；体液与肾脏、自主神经与激素的调节；先天免疫与获得免疫。', ['nerve', 'homeostasis', 'immunity']),
 ('植物的环境应答', '植物の環境応答', '植物', '植物激素与向性、光敏色素与光周期性、开花与种子萌发。', ['plant']),
 ('生态与进化', '生態と進化', '生态进化', '种群与群落、生态系统的物质循环与能量流动；进化的机制、哈迪–温伯格定律与系统分类。', ['ecology', 'evolution']),
]
def _stars(s): return f'<span class="stars" aria-label="重要度 {len(s)}/3">{s}</span>'
def _entry(t, label=None, meta=None):
    if meta is None:
        meta = (f'{len(t["problems"])} 题' if t['problems'] else t.get('sub', '常用数据速查')) + (f'<span class="ct-sep"> · </span>过去问 {t["bank"]["n"]} {_stars(t["bank"]["stars"])}' if t.get('bank') else '')
    return (f'<li><a href="topics/{t["slug"]}/"><span class="ct-n">{t["n"]:02d}</span><span class="ct-t"><span class="ct-zh">{label or t["zh"]}</span>'
            f'<span class="ct-ja" lang="ja">{t["ja"]}</span></span><span class="ct-dots" aria-hidden="true"></span><span class="ct-m">{meta}</span></a></li>')
_BY = {t['slug']: t for t in TOPICS}
_parts = []
for k, (name, ja, _, intro, slugs) in enumerate(CHAPTERS, 1):
    ts = [_BY[s] for s in slugs]
    nb = sum(t['bank']['n'] for t in ts if t.get('bank'))
    _parts.append(f'<li class="ct-part"><p class="ct-no" aria-hidden="true">{k}</p><div class="ct-body">'
                  f'<h3 id="ch-{k}"><span class="ct-vh">第 {k} 章　</span>{name}<span class="ct-chja" lang="ja">{ja}</span></h3>'
                  f'<p class="ct-intro">{intro}<span class="ct-sum">{len(ts)} 个专题 · 过去问 {nb} 题</span></p>'
                  f'<ol class="ct-list">{"".join(_entry(t) for t in ts)}</ol></div></li>')
_D = next(t for t in TOPICS if t['slug'] == 'demos')
_CH_SLUGS = {s for c in CHAPTERS for s in c[4]}
assert _CH_SLUGS == {t['slug'] for t in TOPICS if t['problems']}, '目次分组要覆盖全部讲解专题'
_appx = ''.join(_entry(t, f'互动演示总览（{t["demo_count"]} 个）', '全部演示一览') if t['slug'] == 'demos' else _entry(t)
                for t in TOPICS if t['slug'] not in _CH_SLUGS)
# MAP：知识导图。每章一色（site.css 的 --mp-1…--mp-6），一幅线描插图；每个专题一条代表式（取自本专题页抬头的式子、14_formulas 或讲解正文），
# 记法见 homemap.fml：` 包起来的部分直立（化学式、碱基、细胞周期各期），其余拉丁字母为斜体（变量、基因符号）
XLINKS = [  # (slug, slug, 标签)
 ('cell', 'metabolism', '细胞器'), ('dna', 'division', 'DNA 复制'), ('dna', 'genetics', '基因与性状'), ('development', 'genetics', '配子形成'),
 ('nerve', 'homeostasis', '自主神经'), ('homeostasis', 'immunity', '体内环境'), ('metabolism', 'plant', '光合作用'), ('ecology', 'evolution', '自然选择'),
]
MAPF = {
 'cell': '`H_2O` ≈ 70%',                        # 01_cell 抬头：细胞中水约占 70%
 'metabolism': '`RQ = CO_2/O_2`',               # 02_metabolism 抬头 / 14_formulas：呼吸商
 'dna': '`A = T, G = C`',                       # 03_dna 抬头 / 14_formulas：沙加夫法则
 'division': '`G_1 → S → G_2 → M`',             # 04_division 抬头：细胞周期
 'development': '细胞数 = 2^n',                  # 14_formulas：卵裂
 'genetics': 'AaBb × AaBb → 9:3:3:1',           # 06_genetics 抬头 / 14_formulas：独立定律
 'nerve': 'v = Δx/Δt',                          # 07_nerve 抬头 / 14_formulas：传导速度
 'homeostasis': '浓缩率 = 尿中浓度/血浆中浓度',    # 08_homeostasis 抬头 / 14_formulas
 'immunity': '抗原 + 抗体 → 抗原抗体反应',         # 09_immunity 抬头
 'plant': '生长素 → 背光侧',                      # 10_plant 抬头与讲解：单侧光照时生长素移向背光侧
 'ecology': 'N = M × n/m',                      # 14_formulas：标志重捕法
 'evolution': 'p^2 + 2pq + q^2 = 1',            # 12_evolution 抬头 / 14_formulas：哈迪–温伯格定律
}
MAPL = {'division': '细胞周期与分裂', 'nerve': '感受器・神经', 'ecology': '种群・生态系统'}
from homemap import ico, render
def _icon_cell(x, y, s):  # 细胞切面：细胞膜、细胞核与核仁、一个线粒体（内膜折成嵴）、几粒核糖体
    return ico(x, y, s, lambda P, R: f'<path d="M{P(.08, .5)}C{P(.08, .16)} {P(.92, .12)} {P(.92, .48)}C{P(.92, .86)} {P(.08, .86)} {P(.08, .5)}Z"/>'
               f'<circle cx="{x + .38 * s:.1f}" cy="{y + .46 * s:.1f}" r="{R(.15)}"/><circle class="mp-dot" cx="{x + .41 * s:.1f}" cy="{y + .43 * s:.1f}" r="{R(.04)}"/>'
               f'<path d="M{P(.58, .62)}C{P(.58, .54)} {P(.82, .54)} {P(.82, .62)}C{P(.82, .7)} {P(.58, .7)} {P(.58, .62)}Z"/>'
               f'<path class="mp-thin" d="M{P(.61, .62)}L{P(.65, .58)}L{P(.68, .66)}L{P(.72, .58)}L{P(.75, .66)}L{P(.79, .61)}"/>'
               + ''.join(f'<circle class="mp-dot" cx="{x + u * s:.1f}" cy="{y + v * s:.1f}" r="{R(.018)}"/>' for u, v in ((.62, .34), (.7, .4), (.24, .7), (.5, .74), (.78, .45))))
def _icon_helix(x, y, s):  # DNA 双螺旋：两条相位差半周的链 + 碱基对横档
    N = 48; A = .2
    def strand(ph): return f'M{P_(.5 + A * math.sin(ph), .04)}' + ''.join(f'L{P_(.5 + A * math.sin(ph + 2 * math.pi * 1.5 * i / N), .04 + .92 * i / N)}' for i in range(1, N + 1))
    P_ = lambda u, v: f'{x + u * s:.1f} {y + v * s:.1f}'
    rungs = ''.join(f'M{P_(.5 + A * math.sin(2 * math.pi * 1.5 * i / 12), .04 + .92 * i / 12)}L{P_(.5 + A * math.sin(math.pi + 2 * math.pi * 1.5 * i / 12), .04 + .92 * i / 12)}' for i in range(1, 12) if abs(math.sin(2 * math.pi * 1.5 * i / 12)) > .3)
    return ico(x, y, s, lambda P, R: f'<path d="{strand(0)}"/><path d="{strand(math.pi)}"/><path class="mp-thin" d="{rungs}"/>')
def _icon_punnett(x, y, s):  # 孟德尔杂交的棋盘格：亲本配子 A・a 作表头，2×2 格里是子代基因型
    g = [.3, .6, .9]
    return ico(x, y, s, lambda P, R: f'<path d="M{P(.3, .3)}H{x + .9 * s:.1f}V{y + .9 * s:.1f}H{x + .3 * s:.1f}Z"/><path class="mp-thin" d="M{P(.6, .3)}V{y + .9 * s:.1f}M{P(.3, .6)}H{x + .9 * s:.1f}M{P(.06, .3)}H{x + .3 * s:.1f}M{P(.3, .06)}V{y + .3 * s:.1f}"/>'
               + ''.join(f'<text class="mp-it" x="{x + u * s:.1f}" y="{y + v * s:.1f}" text-anchor="middle">{t}</text>' for u, v, t in ((.45, .22, 'A'), (.75, .22, 'a'), (.17, .5, 'A'), (.17, .8, 'a')))
               + ''.join(f'<circle class="{"mp-dot" if (i, j) != (1, 1) else "mp-ion"}" cx="{x + (.45 + .3 * i) * s:.1f}" cy="{y + (.45 + .3 * j) * s:.1f}" r="{R(.05)}"/>' for i in (0, 1) for j in (0, 1)))
def _icon_neuron(x, y, s):  # 神经元：细胞体与树突、带髓鞘的轴突、末梢分支
    return ico(x, y, s, lambda P, R: f'<circle cx="{x + .2 * s:.1f}" cy="{y + .42 * s:.1f}" r="{R(.09)}"/><circle class="mp-dot" cx="{x + .2 * s:.1f}" cy="{y + .42 * s:.1f}" r="{R(.03)}"/>'
               f'<path class="mp-thin" d="M{P(.14, .35)}L{P(.06, .18)}M{P(.1, .26)}L{P(.02, .26)}M{P(.13, .49)}L{P(.04, .62)}M{P(.21, .33)}L{P(.24, .12)}M{P(.23, .2)}L{P(.32, .14)}"/>'
               f'<path d="M{P(.29, .45)}C{P(.45, .52)} {P(.6, .6)} {P(.8, .72)}"/>'
               + ''.join(f'<path d="M{P(u - .045, v - .045)}L{P(u + .045, v + .02)}L{P(u + .065, v - .015)}L{P(u - .025, v - .08)}Z"/>' for u, v in ((.42, .53), (.56, .6), (.7, .7)))
               + f'<path class="mp-thin" d="M{P(.8, .72)}L{P(.94, .66)}M{P(.8, .72)}L{P(.95, .8)}M{P(.8, .72)}L{P(.88, .9)}"/>')
def _icon_leaf(x, y, s):  # 叶片：叶缘两条弧、主脉与侧脉、叶柄
    return ico(x, y, s, lambda P, R: f'<path d="M{P(.2, .82)}C{P(.12, .45)} {P(.45, .12)} {P(.88, .1)}C{P(.86, .52)} {P(.56, .86)} {P(.2, .82)}Z"/>'
               f'<path class="mp-thin" d="M{P(.08, .94)}L{P(.2, .82)}C{P(.42, .6)} {P(.62, .38)} {P(.86, .13)}'
               + ''.join(f'M{P(u, v)}L{P(u + du, v + dv)}' for u, v, du, dv in ((.35, .66, -.04, -.2), (.5, .5, -.04, -.22), (.65, .35, -.02, -.18), (.35, .66, .2, .04), (.5, .5, .2, .02), (.65, .35, .16, .02))) + '"/>')
def _icon_tree(x, y, s):  # 系统树：自下而上分叉，末端是现生的类群（小圆点）
    seg = [((.5, .92), (.5, .7)), ((.2, .7), (.8, .7)), ((.2, .7), (.2, .44)), ((.8, .7), (.8, .52)), ((.08, .44), (.32, .44)), ((.66, .52), (.94, .52)),
           ((.08, .44), (.08, .16)), ((.32, .44), (.32, .16)), ((.66, .52), (.66, .16)), ((.94, .52), (.94, .3)), ((.82, .3), (.94, .3)), ((.82, .3), (.82, .16)), ((.94, .3), (.94, .16))]
    return ico(x, y, s, lambda P, R: '<path d="' + ''.join(f'M{P(*a)}L{P(*b)}' for a, b in seg) + '"/>'
               + ''.join(f'<circle class="mp-dot" cx="{x + u * s:.1f}" cy="{y + .12 * s:.1f}" r="{R(.035)}"/>' for u in (.08, .32, .66, .82, .94)))
_ICONS = [_icon_cell, _icon_helix, _icon_punnett, _icon_neuron, _icon_leaf, _icon_tree]
_MC = [dict(name=name, ja=ja, short=sh, icon=_ICONS[k],
            topics=[dict(slug=s, zh=_BY[s]['zh'], ja=_BY[s]['ja'], num=f'{_BY[s]["n"]:02d}', label=MAPL.get(s, _BY[s]['zh']), f=MAPF[s], href=f'topics/{s}/') for s in slugs])
       for k, (name, ja, sh, _, slugs) in enumerate(CHAPTERS)]
MAPSVG, MAPLEGEND, MAPSTAT = render(dict(subject='生物', cap_ja='図　生物の体系', chapters=_MC, xlinks=XLINKS, start=150, MINSEC=1.8,
    W=1240, H=1300, CX=620, CY=630, R0=58, R1=208, R2=348, NR=46, IS=58, FN=17, FF=16, FSUB=11, FL=15, BH=58, GAP=11, FCH=21))
print('map:', MAPSTAT)
def _mapdata():
    chs, tps = {}, {}
    for k, (name, ja, _sh, intro, slugs) in enumerate(CHAPTERS, 1):
        chs[str(k)] = {'zh': name, 'ja': ja, 'intro': intro, 'href': f'#ch-{k}'}
        for top in TOPICS:
            if top.get('slug') in slugs and top.get('problems'):
                tps[top['slug']] = {'zh': top['zh'], 'ja': top['ja'], 'intro': top.get('lead') or '', 'href': f'topics/{top["slug"]}/', 'ch': str(k), 'children': mapkids.kids_from_sections(top.get('sections') or [], top['slug'])}
    s = json.dumps({'subject': '生物', 'chapters': chs, 'topics': tps}, ensure_ascii=False, separators=(',', ':'))
    return s.replace('<', '\\u003c')
MAPDATA = _mapdata()
_nk=sum(len(v.get('children') or []) for v in json.loads(MAPDATA.replace('\\u003c','<')).get('topics',{}).values())
print('map kids:', _nk)

RANKTBL=''.join(f'<tr><td><a href="topics/{t["slug"]}/">{t["n"]} {t["zh"]}</a></td><td>{" ".join(t["bank"]["codes"])}</td><td class="num">{t["bank"]["n"]}</td><td class="stars">{t["bank"]["stars"]}</td></tr>' for t in sorted([t for t in TOPICS if t.get('bank')],key=lambda t:-t['bank']['n']))
_np = sum(len(t['problems']) for t in TOPICS); _nb = sum(t['bank']['n'] for t in TOPICS if t.get('bank')); _nt = sum(1 for t in TOPICS if t['problems'])
_SITES = [('https://eju.feather0.com/', '四科总入口'), ('https://math.eju.feather0.com/', 'EJU 数学コース2 网站'), ('https://eju.feather0.com/physics/', 'EJU 理科 物理 网站'), ('https://chemistry.eju.feather0.com/', 'EJU 理科 化学 网站')]
PREFACE = ('这是按 EJU 理科（生物）大纲整理的中文讲义，十二个专题合为六章：细胞与代谢、遗传信息、生殖与遗传、动物的反应与体内环境、植物的环境应答、生态与进化。'
           '建议先按章节读讲解和例题，再做练习；遗传比例、浓缩率等计算题用到的公式可以随时在附录里查。各页开头的出题频度来自 2005–2025 年试卷的统计，拿不准先看哪一章时可以参考它，也可以直接看本页最后的频度表。')
open('index.html','w').write(siteenv.with_banner(CFG, f'''<!doctype html><html lang="zh-Hans" data-site="{SITE}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="color-scheme" content="light dark">
{HEADJS}
<title>EJU 理科 生物 全专题讲解</title>{headmeta(SITE_NAME + " 全专题讲解", SITE_DESC, "", "")}
<link rel="stylesheet" href="assets/site.css"></head><body class="home contents">
<a class="skip" href="#chapters">跳到目次</a>
<div class="ct-wrap">
<header class="ct-head">
<div class="ct-top"><p class="ct-kicker"><a href="https://eju.feather0.com/">四科总入口</a> ／ EJU 理科 · 生物</p><button class="chip theme-btn" id="theme" type="button">深色</button></div>
<h1>生物<br>全专题讲解</h1>
<div class="ct-preface"><p>{PREFACE}</p>
<p class="ct-facts">共 {_nt} 个讲解专题、{_np} 道原创练习题、{_D["demo_count"]} 个互动演示；过去问 {_nb} 题已按专题归类。</p></div>
</header>
<main id="main">
<section id="chapters" aria-labelledby="h-chapters"><h2 id="h-chapters" class="ct-label">目次<span lang="ja">もくじ</span></h2>
<ol class="ct-parts">{"".join(_parts)}</ol></section>
<section id="map" aria-labelledby="h-map"><div class="ct-part"><p class="ct-no ct-no-a" aria-hidden="true">图</p><div class="ct-body">
<h2 id="h-map">知识导图<span class="ct-chja" lang="ja">知識マップ</span></h2>
<p class="ct-intro">中心「生物」分出六章，每章一色，外圈是各章的讲解专题和一条代表式；虚线弧标出专题之间的重要联系。点章节或专题可放大查看简介，再从说明卡进入对应页。</p></div>
<figure class="mp"><p class="mp-hint" id="mp-hint">点节点可放大查看简介。电脑上按住 Ctrl 或 ⌘ 滚动缩放；点进图中后可拖动。触屏用双指缩放。Esc 或「返回」还原。</p>
<div class="mp-scroll" role="region" aria-label="知识导图" aria-describedby="mp-hint">{MAPSVG}</div>
<figcaption id="mp-cap">生物知识导图：中心「生物」分出六章，各章外圈列讲解专题与代表式。虚线弧所示的联系：<ul class="mp-legend">{MAPLEGEND}</ul></figcaption></figure><script type="application/json" id="mp-data">{MAPDATA}</script></div></section>
<section id="appendix" aria-labelledby="h-appendix"><div class="ct-part"><p class="ct-no ct-no-a" aria-hidden="true">附</p><div class="ct-body">
<h2 id="h-appendix">资料・速查・工具<span class="ct-chja" lang="ja">資料・ツール</span></h2>
<p class="ct-intro">考前查典型数值、对公式与术语、找易错点；站内搜索覆盖题目、讲解、公式、术语与数据。</p>
<ol class="ct-list">{_appx}</ol></div></div></section>
<section id="ranking" aria-labelledby="h-rank"><div class="ct-part"><p class="ct-no ct-no-a" aria-hidden="true">表</p><div class="ct-body">
<h2 id="h-rank">过去问出题频度<span class="ct-chja" lang="ja">出題頻度</span></h2>
<p class="ct-intro">依据 2005–2025 年 38 份 EJU 试卷的按知识点分类原题册统计，按题数从多到少排列（各页开头另有详细的「出题频度」表）。</p>
<div class="tw"><table><thead><tr><th scope="col">专题页</th><th scope="col">原题册专题</th><th scope="col" class="num">题数</th><th scope="col">重要度</th></tr></thead><tbody>{RANKTBL}</tbody></table></div></div></div></section>
</main>
<footer class="ct-foot"><p class="ct-sites">相关课程：{"".join(f'<a href="{u}">{a}</a>' for u, a in _SITES)}</p><p>原创讲义与题目，非 JASSO 官方内容。按《日本留学試験 理科シラバス（生物）》编排。</p></footer>
</div>
{TOGGLEJS}<script src="assets/vendor/d3-eju.min.js"></script><script src="assets/map.js"></script><script src="assets/nav.js"></script></body></html>''', ''))
# 404：GitHub Pages 对任意深度的不存在路径都返回它，所以资源用站点绝对路径
open('404.html','w').write(siteenv.with_banner(CFG, f'''<!doctype html><html lang="zh-Hans" data-site="{SITE}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="color-scheme" content="light dark">
{HEADJS}<title>页面不存在 · {SITE_NAME}</title><meta name="robots" content="noindex"><link rel="icon" href="{SITE_PATH}assets/favicon.svg" type="image/svg+xml"><link rel="icon" href="{SITE_PATH}assets/favicon-32.png" sizes="32x32" type="image/png"><link rel="apple-touch-icon" href="{SITE_PATH}assets/apple-touch-icon.png">
<link rel="stylesheet" href="{SITE_PATH}assets/site.css"></head><body class="home nf"><main>
<div class="home-top"><p class="eyebrow">{SITE_NAME}</p><button class="chip theme-btn" id="theme" type="button">深色</button></div>
<p class="nf-code" aria-hidden="true">404</p><h1>页面不存在</h1><p>这个地址没有对应的页面：可能是链接写错了，或者页面已经移动。可以回到首页按专题查找，或用站内搜索。</p>
<p class="home-links"><a href="{SITE_PATH}">← 回到 {SITE_NAME} 首页</a><a href="{SITE_PATH}topics/search/">站内搜索</a></p></main>
{TOGGLEJS}</body></html>''', ''))
nav=open('assets/nav.js').read().split('\n')
T=[dict(n=t['n'],slug=t['slug'],zh=t['zh'],ja=t['ja'],ready=True) for t in TOPICS]
nav[0]='(function(){var T='+json.dumps(T,ensure_ascii=False)+';'
nav='\n'.join(nav).replace('EJU コース2 全部专题','EJU 生物 全部专题').replace("(t.n==19?'19–20':t.n)","t.n")
open('assets/nav.js','w').write(nav)
print(len(TOPICS),'topics',sum(len(t['problems']) for t in TOPICS),'problems')

from _x import build_index
print('search index entries:',build_index(TOPICS))

siteenv.write_robots(CFG)
