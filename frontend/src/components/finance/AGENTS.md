# Finance 模块组件

## 表单组件

### BudgetForm
- 文件: `BudgetForm.tsx`
- 创建/编辑预算 Modal
- 使用 FormFooter 统一提交区 (取消/确认)
- 字段: name, amount, currency, rrule, filters (category/tag/event), rollover, alertThreshold

### EventForm
- 文件: `EventForm.tsx`
- 创建/编辑事件 Modal
- 使用 FormFooter 统一提交区
- 字段: name, description, startAt, endAt, color (7 色预设)

### TransactionForm
- 文件: `TransactionForm.tsx`
- 记账表单 Modal, Tab 切分 (basic/extended/linked)
- Props: `mode` (standalone|child), `parentTxId`, `ledgerId`, `onChildRefresh`
- mode=child: 隐藏 extended Tab 内拆单区, 禁止嵌套子单
- parentTxId: 非空时提交 payload 包含 parent_transaction_id
- Footer 使用 FormFooter 组件

### SubTxDrawer
- 文件: `SubTxDrawer.tsx`
- 子账单表单 Drawer (右侧, stackLevel=1)
- 复用 TransactionForm (mode=child)
- 子单字段与父单完全一致 (金额/账户/分类/时间/备注/标签/附件/Todo 关联/事件关联)
- 独立 CRUD: 直接调 API (POST/PUT), onSuccess 回调刷新父单

## 列表/卡片组件

### TxCard
- 文件: `TxCard.tsx`
- 单笔交易卡片 (移动端)
- 父单: children.length > 0 时金额行追加子单数量 chip
- 子单: parent_transaction_id 非空时左上角 ↳ 标识 + 左侧加粗边框

### TxFilterBar
- 文件: `TxFilterBar.tsx`
- 交易过滤栏 (移动端底部 Drawer)

### TxSplitSection
- 文件: `transactionForm/TxSplitSection.tsx`
- 子账单列表, 显示父单下所有 child transactions
- 新增/编辑走 SubTxDrawer, 删除走 confirm dialog + DELETE API
- 父单新建态: "新增子单"按钮 disabled + tooltip "先保存父账单"

## 详情组件

### TransactionDetail
- 文件: `TransactionDetail.tsx`
- 交易详情 Modal (手动实现, 非 Modal 组件)
- 子单列表: 每行可编辑/删除, 顶部"新增子单"按钮
- Footer: FormFooter + 删除按钮 (extraLeft)

## 管理组件

### CategoryManager / TagManager
- 内联树状/芯片管理, 无 Modal
- 使用内联 btn-submit/btn-cancel 按钮对

## 父子账单规则

1. 嵌套深度: 1 层 (父→子), 子不可再嵌套
2. 后端校验: POST/PUT /transactions 检查 parent_transaction_id 链深度
3. 子单创建: 独立 API 调用 (POST /transactions + parent_transaction_id)
4. 子单编辑: PUT /transactions/{id}, 字段与父单一致
5. 子单删除: DELETE /transactions/{id}
6. SplitItem (金额拆单) 与 child transaction 是两套独立机制
