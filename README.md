# DuLuo.

基于 Hexo 8 的中文个人技术博客，使用项目内的 Journal 主题。GitHub 保存源码，Netlify 构建和托管网页，Cloudflare 管理域名 DNS。

正式网站已上线：[https://duluo.link](https://duluo.link)。源码已上传 GitHub，网站由 Netlify 托管，Cloudflare DNS 已接入；HTTP 和 `www.duluo.link` 均以 301 跳转到 `https://duluo.link/`。

## 当前状态（2026-09-14 核验）

| 项目 | 当前配置 |
| --- | --- |
| GitHub 仓库 | [DuLuo-39/duluo-link](https://github.com/DuLuo-39/duluo-link) |
| 本地分支 / 远程分支 | `main` / `origin/main` |
| 正式网站 | [duluo.link](https://duluo.link) |
| Netlify 地址 | [luminous-chebakia-ff0a63.netlify.app](https://luminous-chebakia-ff0a63.netlify.app) |
| Netlify 团队 | [duluo-39](https://app.netlify.com/teams/duluo-39/projects) |
| Netlify Site ID | `16572910-7b2f-4ef4-b146-08fd038bfdec` |
| Cloudflare nameservers | `josh.ns.cloudflare.com`、`norah.ns.cloudflare.com` |
| `www` DNS | CNAME → `luminous-chebakia-ff0a63.netlify.app` |

首页、文章、关于我、归档、CSS、图标和 sitemap 可访问；不存在的地址返回自定义 404 页面。HTTPS 校验正常，页面 canonical 和 sitemap 使用正式域名。本次核验通过公网及 GitHub 进行，Netlify 后台的仓库关联和自动构建触发设置仍需在控制台确认。

主导航依次为 **首页、文章、项目、资源、友链、关于**。「文章」进入时间轴，可按年份、分类或标签查找。首页插画的 **Gallery ↗** 通往独立画廊。`source/_posts/hello-world.md` 是明确标注的排版示例；`source/_posts/hexo-github-netlify-cloudflare.md` 是四个平台分工与日常更新流程的建站笔记。

## 主题与阅读功能

- 站名、时钟、序号与英文眉标使用自托管的 JetBrains Mono Latin（500 / 700）。中文优先使用本机鸿蒙黑体，其次从 `fonts.googleapis.cn` 按需加载思源黑体 Noto Sans SC 切片，并备有系统黑体回退。
- 极光底色随插画配色变化。鼠标移动时，三层色斑产生视差，第四枚色团追光，近处的星尘粒子会轻微靠拢并连线。悬浮导航、画廊展框与近白阅读表面共用这片背景。来源与权利信息见 `themes/journal/ASSETS.md` 和网站“关于我”。
- 首页包含北京时间的分时问候、每秒更新的 `HH:MM:SS` 时钟和周一开始的当月日历。日期跨日或跨月自动更新，重新回到标签页时立即刷新。问候卡片下方是可配置的社交按钮。
- 右侧可以放一张本地音乐卡片。音频放在 `source/audio/`，单首建议压到 2～4 MB，再在 `themes/journal/_config.yml` 的 `music.tracks` 里登记 `title`、`artist` 和 `src: /audio/文件名.mp3`。列表为空时只显示空态，不会请求音频，也不会自动播放。将 `widgets.music` 设为 `false` 可关掉这张卡片。

- 画廊依作品比例分栏。多幅作品带有标签且有至少两种来源或标签可选时，顶部可筛选。悬停展框可预览该作配色，打开作品进入全屏灯箱。左右键、底部方向按钮或在画面上左右轻滑可浏览当前筛选结果，`Esc` 关闭。
- 随机推荐按需加载 `recommendations.json`，只包含已发布文章的标题、链接、日期和简介。多篇文章可切换且不连续重复，单篇隐藏按钮，零篇显示空状态；网络失败仍可阅读构建时显示的文章。
- 文章自动生成最多三级的目录、阅读时长和阅读进度。桌面目录跟随滚动，手机目录可折叠。
- 代码块提供高亮、语言标识和复制按钮，复制时保留换行。浏览器拒绝剪贴板访问时，选中代码并提示手动复制。
- 分类和标签页面随文章 front matter 自动生成，不需要手动建页面。
- 站内搜索按需加载 `search.json`，支持中文、标题、正文和标签，多关键词以空格分隔。点击搜索或按 `Ctrl/⌘ K` 打开，按 `Esc` 关闭。
- 搜索索引只使用 Hexo 发布集合，遵循草稿与未来文章配置，不依赖外部搜索服务。

插画、署名、六个主题配色和五个组件开关集中配置于 `themes/journal/_config.yml`。将 `widgets` 下的对应项设为 `false` 可关闭该组件。首页采用顶部浮岛导航和双栏主视觉，窄屏自动改为单列。在系统辅助功能中启用「减少动态效果」后，浏览器会通过 `prefers-reduced-motion` 关闭星尘循环、追光、3D 倾斜和脉冲动画。后台标签页暂停绘制与时钟，回到前台会立即校时。

社交链接写在同一份主题配置的 `socials` 里。关于页的「找到我」、页脚和首页的 GitHub 都读这份列表。GitHub 会优先使用 `key: github` 的 `url`，没有时再回退到 `github_url`。每一项填写 `url` 或 `copy` 之一；两者都留空时自动隐藏。

```yaml
socials:
  - key: github
    label: GitHub
    text: DuLuo-39
    url: https://github.com/DuLuo-39
  - key: qq
    label: QQ
    text: '1938865506'
    copy: '1938865506'
```

`url` 渲染为链接。`mailto:` 在当前页打开，`http` 与 `https` 外链新开页面。只有 `copy` 的项显示文字和复制按钮，不会生成链接。QQ 号这类纯数字请加引号，避免被解析成数字后被隐藏。

## 从 X (Twitter) 收藏并录入插画

1. 在画师的原推打开高清图，保存原始尺寸的图片。转成 WebP 时保留完整构图，将成品放在 `source/images/gallery/`，记录转换后的实际宽高。
2. 在 `source/_data/gallery.yml` 的 `items:` 下追加一条。下面用占位图名和账号演示格式，录入时换成该画师的署名、真实原推地址和实际尺寸。

```yaml
  - image: /images/gallery/night-crossing.webp
    width: 1200
    height: 1600
    title: 夜航
    platform: x
    artist_handle: '@artist_name'
    source_url: https://x.com/artist_name/status/1234567890
    alt: 蓝紫色暮光中的小船与水面倒影
    tags: ['夜色', '静谧']
    mood: ['#d9d3eb', '#c5d9e9', '#f2dce4']
    note: 收藏于暮色渐深时。
    featured: false
```

3. 用三个六位十六进制颜色填写 `mood`，颜色值保留引号。X 画师主页可从 `artist_handle` 推导，也可填写 `artist_url`。Pixiv 作品使用 `platform: pixiv`，分别填原作与画师主页地址。
4. 本地预览 `/gallery/`，检查画面比例、署名、原推链接和灯箱配色。设为 `featured: true` 可加入首页轮播。画廊缺少有效条目时使用主题配置中的 `artwork`。

## 本地预览

使用 Node.js 24。Windows PowerShell 如果限制执行 `npm.ps1`，将以下命令的 `npm` 写成 `npm.cmd`。

```sh
npm ci
npm run dev
```

打开 http://localhost:4000 。停止预览时在终端按 Ctrl+C。

```sh
npm run build
npm run check
node --test tooling/*.test.cjs
node tooling/check-publishing.cjs
```

构建结果位于 `public/`。检查会验证生成页面、内部链接、资源、基本元信息、目录锚点、搜索索引与 sitemap。

## 修改网站

| 内容 | 文件 |
| --- | --- |
| 名称、作者、描述 | `_config.yml` |
| 插画、配色、组件开关、社交链接、首页文字 | `themes/journal/_config.yml` |
| 关于我 | `source/about/index.md` |
| 推荐分享 | `source/_data/share.yml` |
| 我的项目 | `source/_data/projects.yml` |
| 优秀博客 | `source/_data/bloggers.yml` |
| 画廊作品、来源、标签与氛围色 | `source/_data/gallery.yml` |
| 文章 | `source/_posts/*.md` |
| 页面样式 | `themes/journal/source/css/style.css` |
| 搜索、代码复制与目录交互 | `themes/journal/source/js/site.js` |
| 时钟、日历、问候、随机推荐与音乐播放 | `themes/journal/source/js/desktop.js` |
| 分类标签生成、搜索索引与阅读时长 | `themes/journal/scripts/reading.js` |
| 角色与背景素材 | `themes/journal/source/images/` |

JetBrains Mono 字体文件与 SIL OFL 1.1 许可随主题发布，见 `themes/journal/source/fonts/NOTICE.txt`。当前 Netlify 会为线上页面注入平台工具条脚本，因此线上 HTML 比本地生成文件多出该脚本。

## 写文章

推荐用短英文文件名作为网址，再把文章里的 `title` 改成中文标题。例如：

```sh
npm run new -- "my-first-post"
```

编辑生成的 `source/_posts/my-first-post.md`：

```markdown
---
title: 我的第一篇文章
date: 2026-09-13 10:00:00
description: 用一句话介绍这篇文章。
cover: /images/cover.webp
cover_alt: 封面图说明。不写时使用文章标题。
categories:
  - 技术笔记
tags:
  - Hexo
---

开头段落。

<!-- more -->

## 正文标题

正文内容。
```

文章地址是 `/posts/my-first-post/`。修改标题不会改变这个地址，重命名文件会改变。日期使用上海时区，未来日期的文章不会生成；需要等到该日期后重新构建才会发布。`cover` 和 `cover_alt` 都可以省略。封面只接受站内路径（如 `/images/cover.webp`）或 `http`/`https` 地址；有封面时出现在文章页右侧目录上方，有 `description` 时同一侧栏显示「本篇摘要」。窄于 960px 时隐藏侧栏摘要，正文开头的简介仍然保留。

也可以先写草稿：

```sh
npx hexo new draft "my-next-post"
npx hexo publish "my-next-post"
```

草稿在 `source/_drafts/`，不会生成公开页面。源码仓库里的草稿仍然对拥有仓库访问权的人可见。图片放入 `source/images/`，在 Markdown 中使用 `![图片说明](/images/文件名.jpg)`。

## GitHub → Netlify

仓库和 Netlify 项目已存在，后续沿用它们。`netlify.toml` 中的构建设置为：

- Build command: `npm run build && npm run check`
- Publish directory: `public`
- Node.js: `24`
- 正式环境网址：`SITE_URL=https://duluo.link`

更新文章或主题后，在本地预览并检查，再提交到 `main`：

```sh
npm run build
npm run check
git status
git add <本次修改的文件>
git commit -m "描述本次更新"
git push origin main
```

`node_modules/`、`public/`、`.env` 和缓存已被忽略。提交源码和依赖锁文件，Netlify 的发布目录始终是构建生成的 `public/`。

在 Netlify 项目的持续部署设置中确认关联仓库为 `DuLuo-39/duluo-link`、生产分支为 `main`。确认关联后，向生产分支推送会触发新部署；在部署记录中核对对应的 Git 提交和成功状态，再检查正式网站。仅凭网页可以访问，不能证明自动构建关联已经配置。

无需开启 GitHub Pages，也无需配置 `hexo deploy`。构建脚本使用 `netlify.toml` 中的生产环境 `SITE_URL=https://duluo.link` 生成正式页面的绝对链接和 sitemap；部署预览使用 `DEPLOY_PRIME_URL`，并添加禁止搜索引擎收录的页面标记。

线上目前仍保留示例文章。关于页已写上近况和联系方式，后续可以继续换成更完整的介绍。

## 接入 duluo.link

域名绑定已完成，主域名为 `duluo.link`，`www.duluo.link` 会跳转到主域名。当前公共 DNS 中，根域返回 Netlify 地址 `75.2.60.5` 和 `99.83.231.61`，`www` 返回上述 Netlify 站点的 CNAME。

以下保留为迁移或排障时的标准配置参考，具体以 Netlify 项目的域名验证指引为准：

| 类型 | 名称 | 目标 | Cloudflare 代理 |
| --- | --- | --- | --- |
| CNAME | `@` | `apex-loadbalancer.netlify.com` | DNS only，灰云 |
| CNAME | `www` | `luminous-chebakia-ff0a63.netlify.app` | DNS only，灰云 |

Cloudflare 支持根域 CNAME flattening。不要给同一名称同时添加冲突的 A、AAAA 或 CNAME 记录。

`SITE_URL=https://duluo.link` 已写入 `netlify.toml`，`_config.yml` 也已同步。若以后更换主域名，应同时更新这两处，重新部署并检查 canonical、sitemap 和域名跳转。

默认让 Cloudflare 管理 DNS，Netlify 提供 HTTPS 与 CDN。灰云模式不需要配置 Cloudflare SSL/TLS 模式。若之后确实需要 Cloudflare 橙云代理能力，再单独评估缓存、证书和回源设置。

## 官方资料

- [Hexo 文档](https://hexo.io/docs/)
- [Netlify 从 Git 仓库部署](https://docs.netlify.com/start/quickstarts/deploy-from-repository/)
- [Netlify 外部 DNS 配置](https://docs.netlify.com/manage/domains/configure-domains/configure-external-dns/)
- [Netlify 关于 Cloudflare 代理的说明](https://answers.netlify.com/t/support-guide-what-problems-could-occur-when-using-cloudflare-in-front-of-netlify/138)
- [Cloudflare CNAME flattening](https://developers.cloudflare.com/dns/cname-flattening/set-up-cname-flattening/)
