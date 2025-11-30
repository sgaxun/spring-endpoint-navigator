# Repository Guidelines

## 项目结构与模块
- `src/extension.ts`：扩展入口，注册命令并初始化缓存/索引。
- `src/endpointCache.ts`、`springControllerParser.ts`：解析 Spring 控制器并缓存端点元数据。
- `src/fileIndex.ts`、`fileSearchProvider.ts`、`compositeSearchProvider.ts`：维护文件索引与搜索提供器，驱动复合搜索界面。
- `out/`：TypeScript 编译产物，勿直接修改。
- `test-spring-project/`：示例 Spring 项目，用于手动验证，尽量保持精简以免增大 VSIX。

## 构建、测试与开发命令
- `npm install`：安装依赖。
- `npm run compile`：严格 TypeScript 编译，输出到 `out/`。
- `npm run watch`：增量编译，F5 启动 VS Code Extension Host 进行调试。
- `npm run package`：使用 `vsce` 生成 `.vsix`（缺失时需全局安装 `vsce`）。
- `npm run publish` / `npm run publish:open-vsx`：发布到对应市场（需配置 token）。

## 代码风格与命名
- 语言：TypeScript，目标 ES2020，CommonJS，`strict` 开启。
- 格式：4 空格缩进；优先使用 `async/await`；日志仅限生命周期必要信息。
- 命名：类用 PascalCase（如 `EndpointCache`），变量/函数用 camelCase，命令 ID 统一前缀 `spring-endpoint-navigator.`。
- 结构：平台接入放在 `extension.ts`；解析、索引、UI 逻辑分层，避免耦合。

## 测试指引
- 当前无自动测试；用 `npm run compile` 捕获类型/语法问题。
- 手动验证：运行 `npm run watch`，按 F5 打开 Extension Host，依次测试命令（复合搜索、文件搜索、端点搜索、清理缓存），针对 `test-spring-project` 修改控制器确认端点/文件计数刷新。
- 发布前确认：缓存预热提示正常，搜索结果能跳转到控制器方法。

## 提交与 PR 规范
- 提交信息偏好简短现在时（中英文均可），示例：“优化启动时后台扫描”；尽量控制在 ~72 字符内。
- PR 需包含：改动概要、测试步骤或示例查询、UI 变更的截图/GIF；若调整默认配置（如缓存时长、include/exclude globs），在描述中说明，并关联相关 issue（如有）。

## Communication Style
- 回复尽量以中文进行，除非有特定要求需要使用英文。

## Code Compatibility
- 若无明确需求，避免为旧环境添加兼容代码，优先保持当前目标版本与配置的简洁性。
