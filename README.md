# RSS阅读器 & 可视化分析系统

一个基于Web的RSS阅读器，支持RSS源采集、智能过滤、专题管理和数据可视化分析。所有数据存储在浏览器本地，无需服务器，部署在GitHub Pages上。

## 功能特性

### 1. RSS源管理
- ✅ 添加、编辑、删除RSS源
- ✅ 自动采集RSS源的文章
- ✅ 显示采集状态和最后更新时间
- ✅ 支持单个源或全部源刷新
- ✅ CORS代理支持，解决跨域问题

### 2. 专题管理与智能过滤
- ✅ 创建多个专题，每个专题可关联多个RSS源
- ✅ 强大的过滤规则系统：
  - 支持多关键词AND/OR组合
  - 支持标题、内容或两者同时搜索
  - 支持大小写敏感/不敏感
  - 支持排除模式（NOT逻辑）
- ✅ 实时过滤文章列表

### 3. 文章展示
- ✅ 显示所有采集的文章
- ✅ 按专题或来源过滤文章
- ✅ 标记文章为已读/未读
- ✅ 直接跳转到原文链接
- ✅ 显示文章发布时间、来源、分类等信息

### 4. 可视化分析报告
- ✅ 基于专题生成数据分析报告
- ✅ 交互式折线图展示趋势
- ✅ 自动提取文章中的数值数据（如爆仓金额等）
- ✅ 按时间范围筛选（预设或自定义）
- ✅ 统计汇总（总计、平均、最大值等）
- ✅ 支持导出CSV数据

### 5. 数据存储
- ✅ 所有数据存储在浏览器localStorage
- ✅ 无需服务器，完全离线可用
- ✅ 支持数据导出和备份

## 技术栈

- **前端框架**: React 19 + TypeScript
- **构建工具**: Vite 7
- **状态管理**: Zustand
- **样式**: Tailwind CSS 4
- **图表**: ECharts
- **RSS解析**: rss-parser
- **日期处理**: date-fns
- **图标**: Lucide React

## 本地开发

### 前置要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

应用将在 `http://localhost:5173` 运行。

### 构建生产版本

```bash
npm run build
```

构建产物将输出到 `dist` 目录。

### 预览生产构建

```bash
npm run preview
```

## 部署到GitHub Pages

### 自动部署

项目已配置好GitHub Pages部署脚本：

```bash
npm run deploy
```

这将：
1. 自动构建项目
2. 将构建产物推送到 `gh-pages` 分支
3. GitHub Pages将自动部署

### 手动配置GitHub Pages

1. 在GitHub仓库的Settings中找到Pages设置
2. Source选择 `gh-pages` 分支
3. 等待部署完成

部署后访问地址：`https://calvinoshaw.github.io/btcget`

## 使用指南

### 1. 添加RSS源

1. 点击导航栏的"RSS源管理"
2. 点击"添加新源"按钮
3. 输入源名称（如"链捕手"）和RSS URL
4. 点击"保存"

**示例RSS源：**
- 链捕手: `https://www.lieyunwang.com/newrss/lieshou.xml`
- 36氪: `https://36kr.com/feed`
- TechCrunch: `https://techcrunch.com/feed/`

### 2. 采集文章

- 点击RSS源卡片上的"采集"按钮采集单个源
- 点击导航栏右上角的"刷新全部"采集所有源

### 3. 创建专题

1. 点击"专题管理"
2. 点击"创建专题"
3. 输入专题名称（如"爆仓数据分析"）
4. 选择要关联的RSS源
5. 添加过滤规则：
   - 输入关键词（用逗号分隔，如"数据：, 爆仓"）
   - 选择匹配模式（AND表示所有关键词都要匹配）
   - 选择搜索范围（标题、内容或两者）
6. 点击"保存"

### 4. 查看过滤后的文章

1. 点击"文章列表"
2. 在"按专题过滤"下拉菜单中选择刚创建的专题
3. 查看符合过滤条件的文章

### 5. 生成分析报告

1. 点击"分析报告"
2. 选择要分析的专题
3. 选择时间范围（最近7天、30天或自定义）
4. 查看自动生成的折线图和统计数据
5. 点击"导出CSV"下载数据

## 数据提取说明

系统会自动从文章中提取结构化数据，例如：

**爆仓数据提取：**
- 金额：识别"100万美元"、"1.5亿美元"等格式
- 类型：识别"多单"、"空单"、"总体"等
- 币种：识别"比特币"、"BTC"、"ETH"等

提取的数据将在分析报告中以图表形式展示。

## 项目结构

```
btcget/
├── src/
│   ├── components/        # React组件
│   │   └── Navbar.tsx     # 导航栏
│   ├── pages/             # 页面组件
│   │   ├── SourcesPage.tsx      # RSS源管理页面
│   │   ├── TopicsPage.tsx       # 专题管理页面
│   │   ├── ArticlesPage.tsx     # 文章列表页面
│   │   └── AnalysisPage.tsx     # 分析报告页面
│   ├── store/             # 状态管理
│   │   └── useStore.ts    # Zustand store
│   ├── types/             # TypeScript类型定义
│   │   └── index.ts
│   ├── utils/             # 工具函数
│   │   ├── rssParser.ts         # RSS解析
│   │   ├── filter.ts            # 过滤逻辑
│   │   ├── storage.ts           # 本地存储
│   │   └── dataExtraction.ts   # 数据提取和聚合
│   ├── App.tsx            # 主应用组件
│   ├── main.tsx           # 入口文件
│   └── index.css          # 全局样式
├── public/                # 静态资源
├── index.html             # HTML模板
├── package.json           # 项目配置
├── vite.config.ts         # Vite配置
├── tailwind.config.js     # Tailwind配置
├── tsconfig.json          # TypeScript配置
└── README.md              # 项目文档
```

## 常见问题

### 1. RSS采集失败

**原因：** CORS跨域限制

**解决方案：**
- 项目已内置CORS代理（allorigins.win）
- 如果仍然失败，可能是RSS源本身无法访问
- 尝试直接在浏览器中访问RSS URL验证

### 2. 过滤规则不生效

**检查：**
- 确保关键词拼写正确
- 检查是否选择了正确的搜索范围
- 确认匹配模式（AND需要所有关键词都匹配）
- 检查是否误开启了"区分大小写"

### 3. 分析报告无数据

**原因：**
- 文章内容中没有可提取的数据
- 数据格式不匹配提取规则

**解决方案：**
- 检查专题的过滤规则是否正确
- 确保选择的时间范围内有文章
- 查看文章原文确认是否包含数值数据

### 4. localStorage空间不足

**解决方案：**
- 定期清理旧文章
- 删除不需要的RSS源
- 使用导出功能备份后清空数据

## 浏览器兼容性

- Chrome/Edge >= 90
- Firefox >= 88
- Safari >= 14

## 数据隐私

- 所有数据仅存储在您的浏览器本地
- 不会上传到任何服务器
- 清除浏览器数据会同时清除应用数据

## 开发计划

- [ ] 支持OPML导入/导出
- [ ] 文章全文阅读模式
- [ ] 自定义数据提取规则
- [ ] 深色主题
- [ ] 移动端优化
- [ ] PWA支持（离线可用）
- [ ] 多设备同步（GitHub Gist）

## 许可证

MIT

## 贡献

欢迎提交Issue和Pull Request！

## 联系方式

如有问题或建议，请在GitHub Issues中提出。
