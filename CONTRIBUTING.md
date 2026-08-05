# 团队协作与分支规范

## 分支模型

- `main`：唯一集成分支，始终保持可构建、可演示；不直接在此分支开发或提交。
- `dev/<github-id>`：每位成员的个人开发分支，例如 `dev/zzha0659`。
- `feature/<short-name>`：可选的短期功能分支；需要时从个人开发分支或最新 `main` 创建。

## 开发流程

1. 开始工作前更新本地 `main`：

   ```bash
   git switch main
   git pull --ff-only origin main
   ```

2. 切换到个人分支，并把最新 `main` 合入个人分支：

   ```bash
   git switch dev/<github-id>
   git merge main
   ```

3. 在 `code/` 中开发并运行质量检查：

   ```bash
   cd code
   pnpm install
   pnpm check
   ```

4. 提交并推送个人分支：

   ```bash
   git add --all
   git commit -m "feat: concise description"
   git push -u origin dev/<github-id>
   ```

5. 在 GitHub 创建 Pull Request，目标分支选择 `main`。至少一名其他成员 Review、自动检查通过且问题解决后再合并。

## Commit 建议

- `feat:` 新功能
- `fix:` 修复问题
- `docs:` 文档修改
- `test:` 测试修改
- `refactor:` 不改变行为的代码整理
- `chore:` 依赖、工具或工程维护

一次提交尽量只解决一个主题。禁止提交 `.env`、Token、AWS 凭据、`node_modules`、`dist` 或临时文件。

## Pull Request 要求

- 说明改了什么、为什么改。
- 标明对应的 User Story / Definition of Done。
- 提供测试结果；页面修改应附截图或录屏。
- 列出尚未完成或需要后续处理的事项。
- 不自行批准自己的 PR；由其他成员完成 Review。
