# DuLuo 的小栈

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

目前包含首页、文章、归档、分类、标签、关于我和 404 页面，以及站内搜索。`source/_posts/hello-world.md` 是明确标注的排版示例；`source/_posts/hexo-github-netlify-cloudflare.md` 是四个平台分工与日常更新流程的建站笔记。

## 主题与阅读功能

- 清透蓝白布局，首页使用《你的名字。》官方天空背景与诹访雫官方透明立绘；侧栏头像使用官网的雫笑脸原画。来源与权利信息见 `themes/journal/ASSETS.md` 和网站“关于我”。
- 文章自动生成最多三级的目录、阅读时长和阅读进度。桌面目录跟随滚动，手机目录可折叠。
- 代码块提供高亮、语言标识和复制按钮，复制时保留换行。浏览器拒绝剪贴板访问时，选中代码并提示手动复制。
- 分类和标签页面随文章 front matter 自动生成，不需要手动建页面。
- 站内搜索按需加载 `search.json`，支持中文、标题、正文和标签，多关键词以空格分隔。点击搜索或按 `Ctrl/⌘ K` 打开，按 `Esc` 关闭。
- 搜索索引只使用 Hexo 发布集合，遵循草稿与未来文章配置，不依赖外部搜索服务。

OP 表情画面尚未选定；当前头像来自角色页，不是 OP 截帧。

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
```

构建结果位于 `public/`。检查会验证生成页面、内部链接、资源、基本元信息、目录锚点、搜索索引与 sitemap。

## 修改网站

| 内容 | 文件 |
| --- | --- |
| 名称、作者、描述 | `_config.yml` |
| 首页标语与页脚文字 | `themes/journal/_config.yml` |
| 关于我 | `source/about/index.md` |
| 文章 | `source/_posts/*.md` |
| 页面样式 | `themes/journal/source/css/style.css` |
| 搜索、代码复制与目录交互 | `themes/journal/source/js/site.js` |
| 分类标签生成、搜索索引与阅读时长 | `themes/journal/scripts/reading.js` |
| 角色与背景素材 | `themes/journal/source/images/` |

主题使用本地字体和资源，未配置第三方统计、评论服务或外部字体请求。当前 Netlify 会为线上页面注入平台工具条脚本，因此线上 HTML 比本地生成文件多出该脚本。

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

文章地址是 `/posts/my-first-post/`。修改标题不会改变这个地址，重命名文件会改变。日期使用上海时区，未来日期的文章不会生成；需要等到该日期后重新构建才会发布。

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

线上目前仍保留示例文章和待完善的个人介绍，后续可直接替换为正式内容。

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
