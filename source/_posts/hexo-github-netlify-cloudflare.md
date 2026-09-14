---
title: 这间小栈是怎样搭起来的
date: 2026-09-14 00:00:00
description: 从一篇 Markdown 到一个可以访问的网站，理清 Hexo、GitHub、Netlify 与 Cloudflare 各自负责的事。
categories:
  - 建站笔记
tags:
  - Hexo
  - GitHub
  - Netlify
  - Cloudflare
---

一个博客为什么会用到四个平台？因为写作、保存源码、发布网页和管理域名，分别由不同的工具负责。

这篇笔记以 **duluo.link** 的配置为例，整理这间小栈的结构，也留下一份以后更新网站时能翻阅的备忘。

<!-- more -->

## 四个模块，各做一件事

| 模块 | 在这间小栈中负责什么 |
| --- | --- |
| Hexo | 把 Markdown 文章和主题模板生成 HTML、CSS 等静态文件 |
| GitHub | 保存文章、主题和配置的源码，记录每一次提交，方便查看和恢复历史版本 |
| Netlify | 构建和托管网页，提供网站访问、HTTPS 与内容分发 |
| Cloudflare | 管理购买的域名与 DNS，让 duluo.link 指向 Netlify |

[Hexo 的工作方式](https://hexo.io/docs/)很直接：输入文章和主题，输出一个静态网站。访客读到的是生成后的网页，所以浏览时不需要运行 Hexo，也不需要连接文章数据库。

### Cloudflare 和 Netlify 会重复吗

两者都有与网站加速相关的能力，但这里的分工是清楚的：**Cloudflare 管理域名解析，Netlify 托管网站并提供 HTTPS**。

在 Cloudflare 的 **DNS only（灰云）** 模式下，网页流量直接到达解析指向的服务，不经过 Cloudflare 的代理。橙云模式才会让 HTTP 流量通过 Cloudflare 的网络。详见 [Cloudflare 对代理状态的说明](https://developers.cloudflare.com/dns/proxy-status/)。

## 从写作到发布

配置好仓库关联后的更新过程是：

1. 在本地写 Markdown，调整文章和主题。
2. 用 Git 提交修改，并推送到 GitHub 的生产分支。
3. Netlify 检测到提交，安装依赖并运行构建命令。
4. 构建成功后发布生成文件，读者通过域名访问新版本。

> GitHub 上有源码、网站能访问，都不能单独证明自动部署已经接通。核实时需要在 Netlify 的部署记录里看到对应的 Git 提交和成功状态。

本站源码位于 [DuLuo-39/duluo-link](https://github.com/DuLuo-39/duluo-link)。仓库保留源码和依赖锁文件，生成的 `public/` 目录不需要手动提交。

## 本地写一篇文章

在项目目录运行：

```sh
npm run new -- "my-first-note"
npm run dev
```

然后编辑 `source/_posts/my-first-note.md`，在浏览器打开本地预览。

文章开头的配置可以这样写：

```yaml
---
title: 我的第一篇技术笔记
date: 2026-09-14 10:00:00
description: 记录一个问题，以及它的解决过程。
categories:
  - 技术笔记
tags:
  - Hexo
---
```

正文使用 `##` 和 `###` 组织标题，主题会自动生成文章目录。代码放在 Markdown 的代码围栏里，并标注语言，就能获得高亮和复制按钮。分类、标签和搜索索引也会在构建时自动更新。

文件名决定文章地址。例如 `my-first-note.md` 对应 `/posts/my-first-note/`，修改中文标题不会改变这个网址。

## 构建前，先检查一次

这间小栈提供了两条检查命令：

```sh
npm run build
npm run check
```

第一条生成网站，第二条检查页面、资源、内部链接和元信息。检查通过后再提交源码，可以减少部署后才发现链接失效的情况。

Windows PowerShell 如果阻止运行 `npm.ps1`，可以把命令中的 `npm` 换成 `npm.cmd`。

### Netlify 构建配置

仓库中的 `netlify.toml` 为 Netlify 指定构建命令和输出目录：

```toml
[build]
command = "npm run build && npm run check"
publish = "public"

[build.environment]
NODE_VERSION = "24"
```

在 Netlify 关联正确的 GitHub 仓库与生产分支后，后续推送就可以沿用这一配置。[Netlify 的仓库部署文档](https://docs.netlify.com/start/quickstarts/deploy-from-repository/)介绍了仓库授权与部署设置。

## 留给下一次更新的备忘

域名和文章地址尽量保持稳定；主题与内容一起纳入版本管理。每次修改之后，除了看首页，也打开一篇长文，在手机宽度下检查目录、代码块和导航。

工具的分工理顺以后，剩下的事情就简单了：把值得记录的内容，一篇一篇写下来。
