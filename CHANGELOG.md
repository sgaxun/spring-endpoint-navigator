# Changelog

## 1.2.3
- 新增 `CHANGELOG.md`，发布到 Open VSX 后可在 “Changes” 看到版本说明

## 1.2.2
- 综合搜索支持自动填充选中文字，便于快速搜索
- 完善文件监听与增量刷新逻辑，文档同步更新
- 发布到 Open VSX Registry

## 1.2.1
- 调整 LICENSE 文件命名与格式，符合 OSI MIT 模板，便于 Registry 检测
- `package.json` 增加 licenseKeywords，确保 Open VSX 合规
- 修订许可证相关文档后发布补丁版

## 1.2.0
- 新增“综合搜索”命令，统一搜索文件与 Spring 端点
- 新增文件搜索与缓存刷新命令，完善命令面板入口
- 启动后自动激活（onStartupFinished），提升首次使用体验
- 发布到 Open VSX Registry

## 1.1.0
- 新增通配符搜索能力，支持更多示例与泛化路径
- 搜索输入框支持中英文标题与占位提示
- 优化启动性能，后台智能扫描
- 增补中文 README 与示例 URL（通用化替换）

## 1.0.0
- 首次发布：按 URL 路径搜索并跳转 Spring Controller 端点，提供缓存清理命令与快捷键
