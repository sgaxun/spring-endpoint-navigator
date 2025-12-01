# Spring 端点导航器 (Spring Endpoint Navigator)

[English](./README.md) | **简体中文**

一个强大的 VS Code 扩展，为 Spring Boot 端点和文件提供全面的搜索和导航功能。

## 功能特性

### 🔍 综合搜索（新功能）
- **多标签页界面**：混合搜索、文件搜索、端点搜索三个标签页
- **统一搜索体验**：同时搜索文件和端点
- **快速模式切换**：通过顶部按钮在搜索模式间切换

### 📁 文件搜索（新功能）
- **模糊搜索**：智能文件名匹配（例如：输入 `exampleers` 找到 `ExampleController.java`）
- **路径搜索**：浏览文件夹结构（例如：输入 `demo/Order` 找到 `OrderController.java`）
- **文件类型图标**：不同文件类型的可视化指示器
- **文件信息**：显示文件大小和相对路径

### 🌐 端点搜索
- **快速搜索**：使用 `Ctrl+Alt+E`（Mac 上为 `Cmd+Alt+E`）调出搜索界面
- **模糊匹配**：输入 URL 路径，智能显示匹配的端点并按相关性排序
- **通配符搜索**：使用 `*` 通配符一次匹配多个端点（例如：`/example/*/list`）
- **智能缓存**：控制器扫描一次后进行缓存，实现快速后续搜索
- **即时导航**：按 Enter 键直接跳转到控制器方法
- **支持所有 HTTP 方法**：支持 GET、POST、PUT、DELETE、PATCH 和自定义映射
- **类和方法级别映射**：理解类和方法级别的 `@RequestMapping`
- **JavaDoc 集成**：显示方法注释以提供更好的上下文

### ⚡ 性能优化
- **智能缓存**：文件索引和端点缓存，实现即时启动
- **后台更新**：文件更改时自动更新缓存
- **快速启动**：使用 `onStartupFinished` 事件实现立即激活

## 使用方法

### 快速开始
- **综合搜索**：按 `Ctrl+Alt+E`（Mac 上为 `Cmd+Alt+E`）- 选中的文本会自动填充到搜索框中
- **命令面板**：使用 `Ctrl+Shift+P` 并搜索 Spring 端点导航器命令

### 搜索示例

#### 文件搜索
- `exampleers` → 找到 `ExampleController.java`
- `demo/Order` → 找到 `OrderController.java`
- `service` → 找到所有服务类文件
- `UserCon` → 找到 `UserController.java`

#### 端点搜索
- `/api/users` - 精确匹配 `/api/users` 端点
- `/api/*/list` - 通配符搜索，匹配 `/api/users/list`、`/api/orders/list` 等
- `getUser` - 模糊搜索包含 `getUser` 的方法
- `/example/users/*` - `/example/users/` 下的所有端点

#### 综合搜索
- 输入任意查询同时搜索文件和端点
- 使用顶部按钮在搜索模式间切换
- 端点结果在混合结果中优先显示

### 命令
- `Spring Endpoint Navigator: Composite Search (Files & Endpoints)` - 主搜索界面
- `Spring Endpoint Navigator: Search Files` - 仅文件搜索
- `Spring Endpoint Navigator: Search Spring Endpoint` - 仅端点搜索
- `Spring Endpoint Navigator: Clear Cache and Rescan` - 清除缓存并重新扫描工作区

## 通配符搜索

该扩展支持强大的通配符模式，用于高级端点发现：

### 通配符模式
- `*` 匹配任意字符序列（包括 `/`）
- 支持多个通配符
- 大小写不敏感匹配

### 使用示例
- `/example/*/list` - 匹配 `/example/users/list`、`/example/products/list`、`/example/orders/list`
- `/api/*/detail/*` - 匹配 `/api/users/detail/{id}`、`/api/products/detail/{id}`
- `*/list` - 匹配所有以 `/list` 结尾的端点
- `/example/users/*` - 匹配 `/example/users/` 下的所有端点
- `/example/*/*` - 匹配 `/example/` 下所有二级路径的端点

### 使用技巧
- 以 `/` 开始进行精确路径匹配
- 使用通配符进行灵活的模式匹配
- 结合模糊搜索获得更广泛的结果

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

### v1.1.0
- 新增通配符搜索功能
- 支持 `*` 通配符进行模式匹配
- 改进搜索提示文本，展示通配符示例
- 添加更多测试端点用于功能验证

### v1.0.0
- 初始版本发布
- 支持基本的 Spring 控制器端点搜索
- 实现模糊搜索和缓存功能
- 添加方法注释提取和显示
- 支持所有主要的 HTTP 方法注解