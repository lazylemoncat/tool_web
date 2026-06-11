# changelog

## 2026-06-12

### feat

-   将记账分类,标签和预算管理的顺序调整改为拖拽排序,并继续通过现有 reorder API 持久化.
-   记账表单支持多选交易标签,支持上传多个附件并通过 `attachment_ids` 关联到交易.
-   交易详情抽屉展示已关联附件,可点击打开上传文件.
-   创建 Todo 子文件夹时,默认继承父文件夹的颜色或 emoji 标识.

### fix

-   修复记账移动端导航中选择账本后抽屉未关闭的问题.

### docs

-   在 `AGENTS.md` 增加变更必须同步写入 `changelog.md` 的规则,明确记录日期,变更类型,影响范围和关联文件.
-   完善 `project_flow/1_project_idea.md`,补充 Tool Web 的项目定位,目标用户,问题边界,替代方案和成功标准.
-   完善 `project_flow/2_architecture.md`,补充当前架构选择,模块划分,依赖方向,架构约束和未来扩展点.
-   完善 `project_flow/sprints/MVP_sprint.md` 和 `project_flow/sprints/sprint1.md`,补充迭代目标,核心用户路径,范围边界,技术边界和验收清单.
