# weibo-test

仿微博的测试版个人微博客，纯前端静态站点，通过 GitHub Pages 部署。

在线访问：https://kemmy-du.github.io/weibo-test

## 功能

- 发布微博（140 字限制、字数统计、Ctrl/Cmd + Enter 快捷发布）
- 话题（`#话题#` 高亮）、表情、图片链接
- 信息流：全部 / 原创 / 热门 切换，搜索过滤
- 转发（可带转发理由）、评论、点赞、删除
- 响应式布局，数据保存在浏览器 localStorage

## 本地文件

| 文件 | 说明 |
| --- | --- |
| `index.html` | 页面结构 |
| `style.css` | 微博风格样式 |
| `app.js` | 交互逻辑（无后端依赖） |
