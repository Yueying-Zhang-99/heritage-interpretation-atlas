# Heritage Interpretation Knowledge Atlas

遗产阐释知识图谱：用于博士研究的文献库、研究编码与交互可视化工具。

## 1. Project Overview

研究课题：**面向历史场所多元叙事的公众阐释设计研究——基于游戏化与混合现实**。

采用 HTML5、CSS、Vanilla JavaScript、D3.js 7.9.0 和 JSON。阅读无需账户、npm、构建、数据库或外部 CDN；从网页发布修改到 GitHub 时需要一个仅限此仓库的授权令牌。D3 已放入本地 `assets/vendor/`，许可见同目录。

- Timeline：按年份排列的文献记录，展示年份、机构/作者、英中标题及重点概括；点大小为 1–3 级初步理论贡献编码，虚线圈表示待精读。
- Cluster：研究编码聚类，D3 force 定位；多值条目在各组重复显示。
- Network：Document / Person / Concept 以方形、菱形、圆形区分；有向关系、线型、关系筛选、节点拖动。
- Matrix / Library：11列结构化表格，所有列可排序，全局搜索与多选筛选。
- 颜色按条目类型区分：宪章/政策、理论著作、研究论文、研究主题。
- Detail：摘要、经过核对的短篇原文摘录及定位、理论转向、意义、博士关联、笔记、相关节点与来源。

**数据说明：当前数据库有22个展示条目与8个辅助节点。新加入的《伦敦宪章》等6个条目为虚线占位，正式阅读与研究编码尚待完成。原有条目的贡献度为研究者初步判断，不代表引用量或客观影响力；摘要、编码与关系需对原文逐条校核后才能作为论文证据。**

“2010s Participatory Heritage”和“2020s Plural Narratives”作为 concept 分类，以2015和2020作为显示锚点，不能视作单篇文献或思想起点。《国际文化遗产旅游宪章》采用正式新版年份2022，区别于2021草案。巴拉宪章1979为首次通过年份，具体引文需注明实际阅读的版本。

## 2. File Structure

```text
index.html                 首页与面板结构
.nojekyll                  GitHub Pages 静态发布标志
css/style.css              视觉、排版、响应式
js/core.js                 数据验证、状态、共用辅助函数
js/app.js                  加载、搜索、筛选、视图协调
js/timeline.js             理论谱系时间轴
js/cluster.js              多值编码聚类
js/network.js              概念关系网络
js/matrix.js               可排序文献表
js/detail.js               文献、人物、概念详情
js/editor.js               网页编辑器、浏览器草稿与 GitHub 发布
data/knowledge.json        正式数据源，后续主要编辑此文件
data/knowledge-snapshot.js 双击HTML时使用的离线预览快照
assets/vendor/             D3.js 与许可证
documents/                 手动放置 PDF
tools/serve.cjs            可选的本地静态服务器
tools/sync-snapshot.cjs    可选的离线快照同步工具
tools/check.cjs            数据与文件检查
```

## 3. How to run locally

### 直接双击 index.html

可立即离线使用全部视图。由于浏览器对 `file://` 的 JSON fetch 限制，默认加载明确标注的离线快照。

修改 `data/knowledge.json` 后，点击页面下方 **打开本地 JSON** 并选择该文件，即可使用新数据。文件只在本机读取；网页编辑后可保存浏览器草稿或导出 JSON。可选运行 `node tools/sync-snapshot.cjs` 来同步默认快照。

### 持续研究编辑：建议使用本地服务

在 VS Code 安装 Live Server，右键 `index.html` → Open with Live Server。或安装了 Node.js 时，在项目目录运行：

```sh
node tools/serve.cjs
```

访问 `http://127.0.0.1:4173`。使用本地 HTTP 服务或 GitHub Pages 时，页面**只以 knowledge.json 为数据源**；编辑 JSON 后刷新即可，无需更新快照或运行构建。HTTP 数据损坏会显示错误，不会静默退回过期快照。

### 直接在网页编辑并发布

在页面下方点击 **管理内容 / 编辑与发布**。可新增、修改、删除条目，也可在“分类标签”中新增、改名或删除标签。条目中的多值标签每行填写一个。点击“保存到草稿”后，变更会保留在当前浏览器；建议使用“导出 JSON 备份”另存一份。

要让所有访问者看到修改，请在 GitHub 创建一个 **fine-grained personal access token**，Repository access 仅选择 `Yueying-Zhang-99/heritage-interpretation-atlas`，Repository permissions → **Contents: Read and write**。在网页编辑器底部粘贴令牌，点击 **发布到 GitHub**。网页直接调用 GitHub Contents API 更新 `data/knowledge.json`，会先检查仓库中的版本，防止覆盖别人刚发布的改动。令牌只在当前页面输入框里使用，不写入本地草稿或仓库，关闭编辑器后会清空。GitHub Pages 的自动部署通常需要片刻。

ChatGPT 与 GitHub 的连接不会自动授权公开网页；因此在网页内发布必须单独输入令牌。请勿将令牌写进条目、JSON 文件或分享给他人。

## 4. How to add a document

在 `data/knowledge.json` 的 `documents` 数组中复制一个对象，修改后保存。必填：唯一字符串 `id`、非空字符串 `title`、整数 `year`；其他字段可省略或为空。

```json
{
  "id": "my-document-2024",
  "title": "Original title of the document",
  "title_zh": "文献中文名",
  "year": 2024,
  "node_type": "document",
  "author": ["Author name"],
  "organization": "",
  "type": "Article",
  "stream": "B",
  "paradigm": ["Interpretation"],
  "themes": ["Public interpretation"],
  "concepts": ["Meaning-making"],
  "heritage_conception": ["Site"],
  "interpretation_model": ["Meaning-making"],
  "authority_structure": ["Multi-stakeholder"],
  "public_role": ["Participant", "Contributor"],
  "narrative_structure": ["Multiple Narratives"],
  "media": ["MR", "Game"],
  "public_actions": ["Explore", "Discuss"],
  "summary": "原文内容摘要，建议记录页码。",
  "paradigm_shift": "相对于此前研究的变化。",
  "significance": "文献的重要性与适用边界。",
  "phd_relevance": "与博士课题的关联。",
  "my_notes": "我的阅读笔记，可用换行。",
  "coding_status": "待校核",
  "relations": [],
  "source_url": "",
  "pdf": "",
  "annotations": [],
  "importance": null,
  "citation_count": null,
  "relevance": null
}
```

新对象之间用逗号分隔，最后一项不能有多余逗号。数组字段支持多个值，避免将不同值拼成一个带逗号的字符串。`stream` 为 A（保护范式）、B（阐释理论）、C（参与与多元叙事）；缺省条目显示在 Unassigned，不会丢失。

顶层也支持直接使用条目数组，但建议保留 `{ "meta": {}, "vocabulary": {}, "documents": [], "nodes": [] }` 格式。替换为正式数据库时设置 `meta.is_sample: false`。

`my_notes` 和 `annotations` 从 JSON 读取，当前界面为只读，不会自动把网页内容写回文件。标注示例：

```json
[{ "type": "quote", "text": "摘录内容", "page": 12, "tags": ["authenticity"] }]
```

## 5. How to add a PDF

将 PDF 复制到 `documents/`，在条目填 `"pdf": "documents/example.pdf"`，刷新即可出现 Open PDF。相对路径兼容 GitHub Pages 项目子路径；文件名大小写必须匹配。不要使用电脑上的绝对路径。仅公开您有权传播的全文，或使用 `source_url` 链接到合法来源。

## 6. How relations work

关系写在起点条目的 `relations` 数组中：

```json
[{ "target": "nara", "type": "extends", "evidence": "研究者分析；补充原文条款或页码。" }]
```

`target` 必须对应现存且唯一的 id。支持 `influences`、`extends`、`critiques`、`related_to`、`supports`、`shifts_toward`。箭头由起点指向 target；应明确写出主语和宾语，勿仅凭年代先后断言影响。

无年份的概念与人物放入顶层 `nodes` 数组，`node_type` 取 `concept` 或 `person`；它们不计入文献筛选结果数量，只在网络和相关详情中出现。示例：

```json
{ "id": "concept-example", "title": "Example concept", "node_type": "concept", "relations": [] }
```

Timeline 按时间顺序显示筛选后的条目，不根据未经校核的关系画线。Network 保留筛选结果及其相邻辅助节点，不会通过连线重新引入被筛掉的文献。未连接的文献仍显示为孤立节点。关系下拉菜单控制连线类型；悬停连线可见证据说明。

## 7. How controlled vocabulary works

预设词表存放在 JSON 的 `vocabulary` 中，包含需求中的 Heritage Conception、Interpretation Model、Authority Structure、Public Role、Narrative Structure、Media 和 Public Action 全部选项。

筛选器显示预设词表和实际条目值的并集，支持后续扩展。词表用于保持编码一致，并非禁止研究者增加新值。各维度内部是 OR，不同维度之间是 AND；搜索和年份同时生效。零结果显示清空入口。

所有展示视图按条目类型着色。Cluster 的分组维度独立于类型颜色。贡献度按 1（背景参考）、2（领域发展）、3（直接理论转向）进行初步研究编码；编辑器可修改评分和依据。颜色及大小均不代表引用量。

## 8. How to deploy to GitHub Pages

1. 创建或使用一个 GitHub 仓库，将本目录的网站文件上传至仓库根目录，确保 `index.html` 位于根目录。
2. 进入仓库 **Settings → Pages**。
3. 在 **Build and deployment → Source** 选择 **Deploy from a branch**。
4. 选择保存这些文件的分支（通常为 `main`）以及 `/(root)`，点击 Save。
5. 等待 GitHub 显示发布完成，访问其提供的 Pages URL。

项目使用相对路径，不依赖网站域名根路径，因此适用于 `https://用户名.github.io/仓库名/`。无需 npm build、Actions 工作流或服务端。`.nojekyll` 应保留。发布后编辑并提交 `data/knowledge.json` 即可更新数据，等待 Pages 更新后刷新页面。

当前仓库已于 2026-09-25 部署到 GitHub Pages：<https://yueying-zhang-99.github.io/heritage-interpretation-atlas/>。请注意公开网站的 JSON、笔记和 PDF 均可被访客读取。

发布设置参考：[GitHub Pages 官方说明](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)。本次实际检查记录见 [VALIDATION.md](VALIDATION.md)。

## 9. Future Development

- Web-based document upload
- Supabase / Firebase
- Automatic metadata extraction
- AI-assisted coding（保留人工审核、页码和证据）
- PDF annotation
- Zotero import
- Citation network
- Semantic search

## Validation and limitations

运行 `node tools/check.cjs` 检查数据结构、唯一 ID、关系目标、本地引用及脚本语法。无需安装依赖。

建议在新增数据后检查四个视图、搜索、筛选、详情与 PDF。当前布局面向数十至数百条目的个人研究库；大型网络后续需要分层加载或按中心节点展开。主题年代、受控词表和关系均是可修订的研究工具，不应代替文献证据。

现代桌面浏览器支持最佳；移动端图谱与表格可横向滚动。支持键盘 Tab / Enter 访问节点、Esc 关闭原生对话框。D3 无网络依赖。可选 WebMCP 搜索工具仅在浏览器支持时注册，不影响普通浏览器使用。

Timeline 使用横轴年份、纵轴可编辑的研究主题分类（`timeline_topic`）。四个主题只是当前样本的工作性归类，不代表经文献分析验证的理论流；条目可在管理界面调整所属主题。
