# Spring 端点导航器 (Spring Endpoint Navigator)

[English](./README.md) | **简体中文**

一个帮助您快速搜索和导航 Spring Boot 控制器端点的 VS Code 扩展，通过 URL 路径进行查找。

## 功能特性

- **快速搜索**：使用 `Ctrl+Alt+E`（Mac 上为 `Cmd+Alt+E`）调出搜索界面
- **模糊匹配**：输入 URL 路径，智能显示匹配的端点并按相关性排序
- **智能缓存**：控制器扫描一次后进行缓存，实现快速后续搜索
- **即时导航**：按 Enter 键直接跳转到控制器方法
- **支持所有 HTTP 方法**：支持 GET、POST、PUT、DELETE、PATCH 和自定义映射
- **类和方法级别映射**：理解类和方法级别的 `@RequestMapping`

## 使用方法

1. **打开搜索**：按 `Ctrl+Alt+E`（Mac 上为 `Cmd+Alt+E`）或使用命令面板（`Ctrl+Shift+P`）并搜索 "Search Spring Endpoint"

2. **输入 URL**：输入您要查找的 URL 路径，例如：
   - `/api/users` - 精确匹配此路径的端点
   - `users` - 也会匹配 `/api/users` 等类似路径
   - `user` - 模糊匹配任何包含 "user" 的端点

3. **选择和导航**：使用方向键浏览结果，按 Enter 键导航到选定的端点

## 支持的注解

该扩展识别以下 Spring 注解：

- `@RestController` 和 `@Controller`
- `@GetMapping`、`@PostMapping`、`@PutMapping`、`@DeleteMapping`、`@PatchMapping`
- `@RequestMapping`（类级别和方法级别）

## 配置

您可以通过 VS Code 设置配置该扩展：

- `springEndpointNavigator.cacheTimeout`：缓存超时时间（毫秒）（默认：300000 = 5 分钟）
- `springEndpointNavigator.includeFiles`：包含在 Spring 控制器搜索中的文件模式（默认：`["**/*.java"]`）
- `springEndpointNavigator.excludeFiles`：从搜索中排除的文件模式（默认：`["**/node_modules/**", "**/target/**", "**/build/**"]`）

## 示例

给定以下 Spring 控制器：

```java
@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    @GetMapping
    public List<User> getAllUsers() { ... }

    @GetMapping("/{id}")
    public User getUserById(@PathVariable Long id) { ... }

    @PostMapping
    public User createUser(@RequestBody User user) { ... }

    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable Long id) { ... }
}
```

该扩展将索引这些端点：
- `GET /api/v1/users`
- `GET /api/v1/users/{id}`
- `POST /api/v1/users`
- `DELETE /api/v1/users/{id}`

## 搜索技巧

### 模糊搜索
- 输入部分路径：`user` 可以匹配 `/api/users`、`/api/v1/users` 等
- 使用关键字：`list` 可以匹配 `/api/users/list`、`/api/products/list` 等

### 精确搜索
- 输入完整路径：`/api/users` 只会精确匹配该路径
- 包含参数：`/{id}` 可以匹配 `GET /api/users/{id}`

### 多方法支持
- 搜索结果会显示 HTTP 方法（GET、POST、PUT、DELETE 等）
- 同一路径的不同方法会分别列出，方便选择

## 方法注释支持

该扩展会提取并显示方法的 JavaDoc 注释：

```java
/**
 * 获取用户列表
 * 返回所有用户的信息
 */
@GetMapping("/list")
public List<User> getUserList() { ... }
```

搜索结果中会显示："获取用户列表 返回所有用户的信息"

## 安装

1. 下载扩展包
2. 打开 VS Code
3. 转到扩展（Ctrl+Shift+X）
4. 点击 "..." 菜单并选择 "从 VSIX 安装..."
5. 选择下载的扩展文件

## 开发

构建扩展：

```bash
npm install
npm run compile
```

以开发模式运行：

```bash
npm run watch
```

然后在 VS Code 中按 F5 启动新的扩展开发主机窗口。

## 测试项目

项目包含一个测试 Spring 项目，位于 `test-spring-project/` 目录，包含多个示例控制器：

- **UserController**：用户管理相关端点
- **ProductController**：产品管理相关端点
- **OrderController**：订单管理相关端点

您可以使用这些控制器来测试扩展的搜索功能。

## 常见问题

### Q: 扫描不到控制器怎么办？
A: 确保您的项目包含 Java 文件，并且控制器使用了正确的 Spring 注解（`@RestController` 或 `@Controller`）。

### Q: 搜索结果不准确？
A: 扩展使用模糊搜索算法，按以下优先级排序：
1. URL 路径匹配度
2. HTTP 方法匹配
3. 类名和方法名匹配
4. 注释内容匹配

### Q: 如何刷新端点缓存？
A: 使用命令面板搜索 "Clear Cache and Rescan" 或等待缓存超时（默认 5 分钟）。

## 系统要求

- VS Code 1.74.0 或更高版本
- 包含 Java 文件的 Spring Boot 项目

## 许可证

MIT 许可证

## 问题反馈

如果您遇到任何问题或有功能建议，请在仓库中提交 issue。

## 贡献

欢迎提交 Pull Request 来改进该扩展！请确保：
1. 代码符合项目的编码规范
2. 添加适当的测试
3. 更新相关文档

## 更新日志

### v1.0.0
- 初始版本发布
- 支持基本的 Spring 控制器端点搜索
- 实现模糊搜索和缓存功能
- 添加方法注释提取和显示
- 支持所有主要的 HTTP 方法注解