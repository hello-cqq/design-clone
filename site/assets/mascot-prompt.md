# Mascot 生图档案（M60）

管线：`scripts/genimg.mjs --style pixar-3d`（pollinations flux 免费档，sha1 缓存）。
选定 seed=22（/tmp/mascot-s22.png → site/assets/mascot.png，裁掉底部水印带；头部裁切 → mascot-head.png / favicon.png）。

Prompt（原创 Q 版设计师，零 IP 参照）：
> adorable chibi toddler-proportioned designer mascot child, big head small body, mint/yellow knitted beanie with pom pom, vivid hoodie, holding oversized stylus wand, one palm raised casting a clone spell, laughing open mouth, blush cheeks, huge glossy eyes, full body dynamic jumping pose one leg kicked up, 3d pixar render, fluffy clay texture, studio light, plain uniform background, no text, no watermark

后处理：ffmpeg crop 去水印带 + 头部方裁；分身层=CSS `hue-rotate+saturate+opacity` 薄荷虚影（同源同姿）。
抠像尝试：colorkey 会洗掉角色同色系衣物 → 弃，改"原图+CSS 分身层+SVG 烟雾/星点+接地投影"装配。


## M61 更新
位图吉祥物（M60）已下线：首页改为 **SVG 水镜微电影**（圆框眼镜设计师：抱膝坐→镜头缓移→躺下→水面镜像，水天一色=克隆隐喻），单 14s master timeline；favicon/导航=静态头像 `logo-head.svg`。位图仅存于此档案与 git 历史。
