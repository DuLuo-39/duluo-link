# DuLuo 的个人博客

基于 Hexo 8 的中文个人博客，使用自带的 Journal 主题。GitHub 保存源码，Netlify 自动构建和发布，Cloudflare 管理域名 DNS。

正式域名：`duluo.link`，已在 Cloudflare 注册。代码中的正式网址已配置为 `https://duluo.link`；GitHub 上传、Netlify 部署、域名绑定和 HTTPS 验证仍需完成。部署后将 `duluo.link` 设为 Netlify 主域名，让 `www.duluo.link` 自动跳转到主域名。

目前包含首页、文章、归档、关于我和 404 页面。首页和个人介绍是可替换的初始文案，`source/_posts/hello-world.md` 是明确标注的排版示例。

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

构建结果位于 `public/`。检查会验证生成页面、内部链接、资源、基本元信息及 sitemap。

## 修改网站

| 内容 | 文件 |
| --- | --- |
| 名称、作者、描述 | `_config.yml` |
| 首页标语与页脚文字 | `themes/journal/_config.yml` |
| 关于我 | `source/about/index.md` |
| 文章 | `source/_posts/*.md` |
| 页面样式 | `themes/journal/source/css/style.css` |

网站使用本地字体和资源，没有第三方统计、评论服务或外部字体请求。

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

1. 在 GitHub 创建一个空仓库（建议私有，例如 `personal-web`）。
2. 提交本项目的源码和 `package-lock.json`，并推送到仓库。`node_modules/`、`public/`、`.env` 和缓存已被忽略。
3. 注册并登录 Netlify，选择 **Add new project → Import an existing project → GitHub**。
4. 连接刚才的仓库，GitHub 授权时只选择这个仓库即可。
5. 选择要发布的分支。仓库里的 `netlify.toml` 已配置：
   - Build command: `npm run build && npm run check`
   - Publish directory: `public`
   - Node.js: `24`
6. 部署完成后，访问 Netlify 分配的 `https://站点名称.netlify.app`。之后每次向生产分支推送修改，Netlify 都会自动重新发布。

无需开启 GitHub Pages，也无需配置 `hexo deploy`。构建脚本使用 `netlify.toml` 中的生产环境 `SITE_URL=https://duluo.link` 生成正式页面的绝对链接和 sitemap；部署预览使用 `DEPLOY_PRIME_URL`，并添加禁止搜索引擎收录的页面标记。

首次发布前，替换示例文章，确认网站名称、作者、关于我和需要公开的内容。

## 接入 duluo.link

域名已在 Cloudflare 购买，下一步是创建 Netlify 项目并添加域名：

1. 在 Netlify 成功部署网站，记下它实际分配的 `*.netlify.app` 地址。
2. 在 Netlify **Domain management** 添加 `duluo.link` 和 `www.duluo.link`，将 `duluo.link` 设为主域名，按该项目实际显示的说明配置 DNS。
3. 标准 Netlify 配置通常如下（若控制台给出项目专属目标，以控制台为准）：

| 类型 | 名称 | 目标 | Cloudflare 代理 |
| --- | --- | --- | --- |
| CNAME | `@` | `apex-loadbalancer.netlify.com` | DNS only，灰云 |
| CNAME | `www` | 你的站点名称.netlify.app | DNS only，灰云 |

Cloudflare 支持根域 CNAME flattening。不要给同一名称同时添加冲突的 A、AAAA 或 CNAME 记录。

4. 在 Netlify 确认证书签发和 HTTPS 生效。
5. `SITE_URL=https://duluo.link` 已写入 `netlify.toml`，`_config.yml` 也已同步。绑定完成后验证首页、文章及 `www` 到主域名的跳转。

默认让 Cloudflare 管理 DNS，Netlify 提供 HTTPS 与 CDN。灰云模式不需要配置 Cloudflare SSL/TLS 模式。若之后确实需要 Cloudflare 橙云代理能力，再单独评估缓存、证书和回源设置。

## 官方资料

- [Hexo 文档](https://hexo.io/docs/)
- [Netlify 从 Git 仓库部署](https://docs.netlify.com/start/quickstarts/deploy-from-repository/)
- [Netlify 外部 DNS 配置](https://docs.netlify.com/manage/domains/configure-domains/configure-external-dns/)
- [Netlify 关于 Cloudflare 代理的说明](https://answers.netlify.com/t/support-guide-what-problems-could-occur-when-using-cloudflare-in-front-of-netlify/138)
- [Cloudflare CNAME flattening](https://developers.cloudflare.com/dns/cname-flattening/set-up-cname-flattening/)
