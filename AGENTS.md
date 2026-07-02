## 对话规范

1. 每段对话前需要称呼用户 Rex.
2. 使用中文回复,标点符号使用英文标点符号.

## git flow 规范

1. 项目使用 git 进行版本管理, 使用 git flow 分支管理模型.命名规则为:主分支为 `main` , 开发分支为 `develop` , 修复 bug 分支为 `fix_*`, feature 分支为 `feature_*`, 准备发布新版本方便测试和发布分支为 `release_*`.每个 main 分支和 release 节点都需要打上对应的版本 Tag(如 `V1.0.1`).定位 bug 时可使用 `git log` 和 `git diff` 获取更多信息以及精准定位.
2. 所有 Git 操作和代码修改，都必须服从于 Vincent Driessen 的 Git Flow 规范.
3. 只读类 Git 命令可在不授权时执行.
4. 任何涉及分支创建,合并,删除,打标签的动作,都必须在获得明确用户指令后才能执行.你不得主动发起这些操作.
5. 在接到任务时,只完成当前任务范围内的工作,不要扩展开启新功能或修正无关缺陷,除非用户明确要求.
6. 不得自主执行提交或推送,除非用户事先授权(例如"允许你在当前分支自主 commit 并推送").
7. feature 分支上开发的新功能中发现的 bug 直接在当前 feature 分支修复.在 feature 分支上发现其他功能遗留的 bug,通知用户请求在 develop分支创建 fix 分支修复.在 develop 集成后发现的 bug 创建 fix 分支修复.在 release 分支发现的 bug 需通知用户请求在当前 release 分支修复.main 分支发现 bug 在 fix 分支修复并打上 hotfix_V* 标签合并回 main 分支和 develop 分支.
8. commit 使用 Conventional Commits 规范并使用 semantic-release 工具自动生成 `changelog.md`.
9. Conventional Commits 必须使用：
   - `feat`：新功能
   - `fix`：bug 修复
   - `chore`：工具/配置变更
   - `docs`：文档变更
   - `refactor`：重构，不修复 bug、不新增功能
10. 严禁直接在 `main`、`release` 等长期或发布分支上直接修改代码.
11. 除非用户明确要求,否则 commit 信息中不添加共同创作者(如 `Co-Authored-By`)或其他署名信息.

## 编码规范

1. 原则上不允许硬编码,数据与代码分离或由调用函数传入.
2. 修改代码时必须精准修改,绝对不允许使用 `replaceAll`、`sed` 或任何其他会不加区分地替换所有匹配项的函数或命令.即使在单一文件中, 也不得使用全局替换模式.修改完成后, 必须利用 `git diff` (或其他 diff 工具) 核对差异, 确认只有预期的代码行被修改, 不得有任何连带改动.
3. 前端所有日期选择控件必须使用 MUI X `DatePicker`, 禁止使用原生 `input type="date"` 或 MUI `TextField type="date"` 作为日期选择器.输入框内日期显示格式必须通过 `DatePicker` 的 `format` 属性控制, 且优先复用项目内共享日期格式常量.
4. 后端语言默认为 `Python`.后端代码必须使用 `mypy` 进行静态类型检查,并使用 `ruff` 进行代码检查和格式规范校验,确保符合 PEP 8 规范.
5. 文件夹和标签默认按业务模块独立建模,独立 API,独立前端类型和状态管理.除非需求或设计文档明确说明共享,不得让新模块复用其他模块的文件夹或标签表,接口,状态或组件数据源.

## 文件夹与文档规范

1. 前端与后端文件结构均使用 `src` 布局.单体项目在项目根目录下使用 `src` 文件夹存放代码文件;前后端分离项目分别在前端目录和后端目录下使用 `src` 文件夹存放代码文件.
2. 同一项目下各系统与模块间除`main.py`,`server.py`等主文件或`export.py`等脚本文件,使用文件夹隔开和分级.
3. 项目级文档记录各个系统和模块的功能和位置,放在根目录下,根据任务要求访问,不读取多余文件.
4. 模块和功能级文档放在各个模块和功能目录下,记录功能的描述和位置或具体脚本的作用和位置.
5. 同一文件夹下存放同一作用的文件,禁止不相关的代码文件放在同一文件夹中.
6. 各个代码文件头部详细说明该文件的作用以及类与函数的描述和位置,方便精准定位.
7. 每次修改代码后必须同步更新相关文档.
8. 每次发生代码,配置,文档或流程变更后,必须同步写入根目录 `changelog.md`,记录日期,变更类型,影响范围和关联文件.若 `changelog.md` 不存在,必须先创建.

## CodeGraph 代码索引规范

1. 后续进行代码查找、影响分析、定位调用关系前, 优先使用 CodeGraph.
2. 如果项目根目录不存在 `.codegraph/`, 或索引可能过期, 先执行 `codegraph init -i` 或 `codegraph sync` 建立/同步索引.
3. 查找符号、文件、入口点时优先使用 `codegraph query`, `codegraph context`, `codegraph callers`, `codegraph callees`, `codegraph impact`.
4. CodeGraph 没有命中或需要确认最新文件内容时, 再配合 `rg` 和直接读取文件.
5. `.codegraph/` 是本地索引目录, 不提交到 git.

## 生成 UML

```
当被要求生成 UML 或架构图时，请使用 `universal-uml-diagrammerr` 技能,并阅读其中的readme文件。
```
