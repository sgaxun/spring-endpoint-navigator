# 发布指南

## 发布到 Open VSX Registry

### 前提条件
- 已安装 Node.js 和 npm
- 已全局安装 `vsce` 工具：`npm install -g vsce`
- 已准备好 GitHub 仓库

### 发布步骤

#### 1. 编译项目
```bash
npm run compile
```

#### 2. 检查 package.json 配置
确保以下字段已正确配置：
- `name`: 扩展名称
- `displayName`: 显示名称
- `version`: 版本号（当前为 1.2.4）
- `publisher`: 发布者（已设置为 "sgaxun"）
- `repository`: Git 仓库 URL
- `description`: 扩展描述

#### 3. 生成 VSIX 包
```bash
npm run package
```
这会在项目根目录生成 `.vsix` 文件。

#### 4. 发布到 Open VSX Registry
```bash
npm run publish:open-vsx
```

或者使用：
```bash
vsce publish --baseContentUrl https://open-vsx.org/api/extend --baseImagesUrl https://open-vsx.org/api/extend
```

## 版本管理

### 版本号规则
- 遵循语义化版本控制（Semantic Versioning）
- 格式：`MAJOR.MINOR.PATCH`
- 例如：`1.1.0`

### 版本更新步骤
1. 更新 `package.json` 中的 `version` 字段
2. 更新 `CHANGELOG.md` 记录变更
3. 编译项目：`npm run compile`
4. 生成包：`npm run package`
5. 发布：`npm run publish:open-vsx`

## 发布后管理

### 更新扩展
- 修改代码后更新版本号
- 重新编译和发布

### 查看扩展
- Open VSX Registry: https://open-vsx.org
- 搜索 "Spring Endpoint Navigator" 或直接访问发布者页面

### 用户反馈
- 用户报告问题：GitHub Issues
- 功能请求：GitHub Issues

## 注意事项

1. **发布者账户**：确保使用正确的发布者账户 (`sgaxun`)
2. **版本控制**：每次发布都需要更新版本号
3. **测试**：发布前在本地充分测试
4. **依赖管理**：确保所有依赖都已正确配置
5. **许可证**：确保许可证信息正确（当前为 MIT）

## 故障排除

### 常见问题
1. **认证错误**：确保已登录正确的发布者账户
2. **版本冲突**：确保版本号没有重复使用
3. **权限问题**：检查仓库和发布权限

### 调试命令
```bash
# 详细输出
vsce publish --baseContentUrl https://open-vsx.org/api/extend --baseImagesUrl https://open-vsx.org/api/extend --logLevel debug

# 检查包内容
vsce ls
```

## 相关链接

- [Open VSX Registry](https://open-vsx.org)
- [VSCE 文档](https://github.com/microsoft/vscode-vsce)
- [VS Code 扩展 API](https://code.visualstudio.com/api)
