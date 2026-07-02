# Tool Web 路线图

本文档是路线图的唯一事实来源 (SSOT). 近期 = 接下来主动投入的方向; 远期 = 保留方向但**不排期, 不分配工作量**. 条目完成后从本文档移除并登记 [`changelog.md`](../changelog.md); 具体条目随使用体验滚动补充.

## 近期重心 (按优先级)

### 1. 现有模块打磨

以自己的日常使用体验为准, 优先修真实痛点:

- Todo: Kanban 交互细节优化; 重复任务边界场景体验.
- Finance: 交易表单交互与统计页体验.
- Focus: 计时恢复与归档流程顺滑度.
- Calendar: 订阅来源 (subscription) 与节假日来源的真实数据接入 (当前仅保留入口, 见 [`calendar.md`](calendar.md)).

### 2. 代码质量与约定统一

条目详情, 优先级与验收标准见 [`tech-debt.md`](tech-debt.md):

- 前端 API 客户端收敛为单一组织方式 (TD-01), 类型定义收敛 (TD-02).
- 重复工具函数合并, 日期格式常量统一 (TD-05 / TD-06).
- 后端 Kanban URL 前缀规范统一 (TD-04).
- `routers/finance.py` 巨型文件拆分 (TD-07).
- Alembic 迁移编号规则落实 (TD-08).
- 限流器收敛 (TD-09).

原则: P1 条目在下次改动对应模块前先还清, 避免不一致继续扩散.

### 3. 测试与发布基础

- 前端 lint baseline 错误清零, CI 中 lint 从非阻塞转为阻塞 (见 [`testing.md`](testing.md)).
- 后端关键路径回归测试补齐 (Focus, Calendar, Kanban 等较新模块).
- CI 产出测试覆盖率.
- SQLite 备份策略: 定期备份 + 恢复演练, 并文档化.

## 远期 / 待定 (不排期)

### Agent-ready 方向

愿景与设计余地见 [`product.md`](product.md) §6. 保留但不投入:

- API Token / Personal Access Token (hash 存储, 过期, 吊销, scopes).
- MCP Server 风格接口.
- Webhook / DomainEvent / 审计日志 / 幂等键.
- 对外 API 引入 `public_id`, 不暴露自增整数 ID.

近期唯一约束: 新设计不得堵死上述方向 (API-first, 模块独立建模, 统一响应格式).

### 新模块与增强

- 联系人模块.
- 周期总结模块.
- 第三方登录, 2FA, CAPTCHA.
- 主题编辑器增强 / 主题市场.
- PWA 离线能力.
- 单币种专业复式记账 (Finance 升级, 领域规则见 [`product.md`](product.md) §7).
- PostgreSQL 可选支持.
