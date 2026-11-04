from _x import *
TOP = others(14)
F = [
('cell',r'micro',r'测微尺','ミクロメーター',[(r'\text{目镜测微尺 1 格}=\frac{\text{物镜测微尺格数}\times10\,\mu\mathrm m}{\text{目镜测微尺格数}}',r'两尺刻度重合的区间内计数；物镜测微尺 1 格通常 10 μm（题目会给出）。'),(r'\text{倍率}\times k\ \Rightarrow\ \text{1 格代表的长度}\times\frac1k',r'换物镜倍率后要重新换算；目镜测微尺本身的刻度不变。')]),
('cell',r'mol',r'肽键数','ペプチド結合の数',[(r'\text{肽键数}=\text{脱水数}=\text{氨基酸数}-\text{肽链数}',r'链状多肽；环状肽时肽键数 = 氨基酸数。')]),
('metabolism',r'resp',r'呼吸与发酵','呼吸と発酵',[(r'\mathrm{C_6H_{12}O_6+6O_2+6H_2O\to6CO_2+12H_2O}',r'有氧呼吸（教科书写法，两边都写水）；最多约 38 ATP（旧教科书值，现代估计约 30–32）。'),(r'\mathrm{C_6H_{12}O_6\to2C_2H_5OH+2CO_2}',r'酒精发酵：2 ATP（底物水平磷酸化）。乳酸发酵：$\mathrm{C_6H_{12}O_6\to2C_3H_6O_3}$。')]),
('metabolism',r'rq',r'呼吸商','呼吸商',[(r'\mathrm{RQ}=\frac{\text{放出的 }\mathrm{CO_2}\text{ 体积}}{\text{吸收的 }\mathrm{O_2}\text{ 体积}}',r'同温同压的体积（或 mol）之比。糖类约 1.0，蛋白质约 0.8，脂肪约 0.7。')]),
('metabolism',r'ps',r'光合作用','光合成',[(r'\mathrm{6CO_2+12H_2O\to C_6H_{12}O_6+6O_2+6H_2O}',r'放出的 O₂ 全部来自 H₂O。')]),
('metabolism',r'curve',r'光合速度','光合成速度',[(r'\text{真光合速度}=\text{净光合速度}+\text{呼吸速度}',r'净光合速度 = 光下测得的 CO₂ 吸收速度；呼吸速度 = 暗处 CO₂ 释放速度（假定光下呼吸不变）。'),(r'\text{一日积累量}=\text{净光合}\times t_{\text{明}}-\text{呼吸}\times t_{\text{暗}}',r'光补偿点：净光合 = 0。')]),
('dna',r'str',r'沙加夫法则','シャルガフの規則',[(r'A=T,\ G=C,\quad A+G=50\%',r'双链 DNA；单链（RNA、单链 DNA）不成立。某一条链的 (A+T)% 等于整个双链的 (A+T)%。')]),
('dna',r'rep',r'半保留复制','半保存的複製',[(r'n\text{ 次复制后：中间密度 }(^{15}\mathrm N/^{14}\mathrm N)=\frac{2}{2^n}',r'从 ¹⁵N/¹⁵N DNA 1 分子开始，在 ¹⁴N 中复制；$n\ge1$。其余为轻 DNA。'),(r'\text{PCR：}2^n\ \text{倍}',r'理想条件下 $n$ 个循环，$2^{10}\approx1000$。')]),
('dna',r'exp',r'密码子','コドン',[(r'\text{mRNA 碱基数}\ge3\times\text{氨基酸数}\ (+3\ \text{终止密码子})',r'$4^3=64$ 种密码子，61 种对应氨基酸，3 种终止。'),(r'\text{模板链 }3^{\prime}\text{-TAC-}5^{\prime}\to\text{mRNA }5^{\prime}\text{-AUG-}3^{\prime}',r'互补且反向平行；RNA 用 U 代替 T。')]),
('division',r'cycle',r'各期时间','各期の長さ',[(r't_{\text{某期}}=T\times\frac{\text{该期细胞数}}{\text{观察的总细胞数}}',r'细胞分裂不同步、各期细胞比例稳定的群体（如根尖）。')]),
('division',r'mei',r'减数分裂','減数分裂',[(r'\text{配子染色体组合}=2^n\quad(2n\text{ 个染色体})',r'不考虑交叉（交换）时。'),(r'\text{DNA 量：}G_1=2\to G_2=4\to\text{第一次分裂后}=2\to\text{配子}=1',r'以 G₁ 期为 2 的相对量。')]),
('development',r'cleave',r'卵裂','卵割',[(r'\text{细胞数}=2^n',r'$n$ 次同步卵割；卵割期间细胞不生长，每个细胞变小。')]),
('genetics',r'law',r'分离比','分離比',[(r'Aa\times Aa\to AA:Aa:aa=1:2:1,\ \text{显:隐}=3:1',r'完全显性。'),(r'AaBb\times AaBb\to9:3:3:1',r'两对基因位于不同染色体（独立遗传）。$n$ 对独立：全显性比例 $(3/4)^n$。')]),
('genetics',r'link',r'组换价','組換え価',[(r'\text{组换价}=\frac{\text{重组型个体数}}{\text{总个体数}}\times100\%',r'用测交（与 aabb 交配）的结果计算；重组型是数量少的两类。'),(r'AB/ab\ (\text{组换价 }r)\Rightarrow AB=ab=\frac{1-r}{2},\ Ab=aB=\frac r2',r'组换价 ≤ 50%；三点试验中最远的两基因间组换价最大。')]),
('nerve',r'calc',r'传导速度','伝導速度',[(r'v=\frac{\Delta x}{\Delta t}',r'两点刺激的距离差 ÷ 收缩时间差；差值消去了突触传递和肌肉收缩的潜伏时间。')]),
('homeostasis',r'conc',r'浓缩率・原尿量','濃縮率・原尿量',[(r'\text{浓缩率}=\frac{\text{尿中浓度}}{\text{血浆中浓度}}',r''),(r'\text{原尿量}=\text{尿量}\times\text{菊粉浓缩率}',r'菊粉（イヌリン）完全过滤、不被重吸收也不分泌。'),(r'\text{重吸收量}=\text{原尿中的量}-\text{尿中的量}',r'原尿中浓度 ≈ 血浆中浓度（蛋白质除外）。')]),
('homeostasis',r'o2',r'氧解离','酸素解離',[(r'\text{在组织中释放的比例}=\frac{\text{肺中氧合Hb\%}-\text{组织中氧合Hb\%}}{\text{肺中氧合Hb\%}}',r'问“占全部 Hb 的比例”时分母不除。CO₂ 分压高、pH 低、温度高时曲线右移（玻尔效应）。')]),
('ecology',r'pop',r'标志重捕法','標識再捕法',[(r'N=\frac{M\times n}{m}',r'$M$ 首次标记数，$n$ 第二次捕获数，$m$ 其中有标记数。假定标记不脱落、个体自由混合、期间无出生死亡迁移。')]),
('ecology',r'budget',r'物质生产','物質生産',[(r'\text{净生产量}=\text{总生产量}-\text{呼吸量}',r'生产者。'),(r'\text{成长量}=\text{净生产量}-(\text{被食量}+\text{枯死量})',r''),(r'\text{同化量}=\text{摄食量}-\text{不消化排出量}',r'消费者。'),(r'\text{能量效率}=\frac{\text{该营养级同化量}}{\text{前一营养级同化量}}\times100\%',r'生产者一栏用总生产量。')]),
('evolution',r'hw',r'哈迪–温伯格定律','ハーディ・ワインベルグの法則',[(r'p+q=1,\quad AA:Aa:aa=p^2:2pq:q^2',r'条件：大种群、随机交配、无突变、无迁移、无自然选择。由 aa 的比例求 $q=\sqrt{aa}$。')]),
]
TOPIC=dict(n=14,slug='formulas',area='速查',zh='公式速查',ja='公式集',sub='计算题公式与成立条件',
lead='生物计算题常用的关系式（测微尺、光合与呼吸、遗传比、组换价、浓缩率、生态系统的物质生产、哈迪–温伯格等），和成立条件放在一起。',
hero=[r'p^2+2pq+q^2=1',r'\mathrm{RQ}=\frac{CO_2}{O_2}'],sections=formula_sections(TOP,F),examples=[],problems=[],terms=[])
