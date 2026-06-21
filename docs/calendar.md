# Calendar Module

## 功能概述

日历模块位于 `frontend/src/components/calendar/`,路由入口为 `frontend/src/app/calendar/page.tsx`,导航入口为 `/calendar`.

当前实现以原型目录中的日历设计为基础,提供月视图,周视图,日视图和日程列表视图.月视图按原型还原为连续月份滚动布局,sticky 月份工具条,大号日期格,真实节假日标签和事件色条.周视图还原为周概览卡片,周统计卡片和选中日期日程卡片.日视图还原为单日卡片,全天分区和带时间列/圆点/连接线的时间轴.日程视图还原为未来事件按日期分组的列表卡片.日期详情与筛选来源使用右侧抽屉呈现.

数据层已接入后端 `/api/v1/calendar/*` API.手动日历事件写入 `calendar_events` 表并按当前用户隔离持久化,任务来源读取真实 Todo `due_date/due_time`,记账来源读取真实 Finance 交易和记账事件.日历不再加载 `calendarMockData.ts`,也不再使用硬编码节假日或伪农历标签.

## 目录结构

```text
frontend/src/components/calendar/
├── CalendarEventDialog.tsx  # 新建/编辑事件弹窗,日期字段使用 MUI X DatePicker
├── CalendarPage.tsx         # 日历主页面,连续月份滚动,右侧抽屉,视图切换,筛选,来源管理
├── calendarService.ts       # 日历 API 调用,后端响应映射,本地筛选和来源可见性处理
├── calendarTypes.ts         # 日历事件,来源,筛选和订阅类型
└── dateUtils.ts             # 月/周网格,日期格式化和事件排序工具
```

```text
backend/src/
├── models/calendar.py       # calendar_events 持久化模型
├── routers/calendar.py      # 日历聚合 API 和手动事件 CRUD
└── schemas/calendar.py      # 日历来源,订阅,事件请求与响应 schema
```

## 交互说明

- 顶部 sticky 工具条支持 `月`, `周`, `日`, `日程` 视图切换.
- 周视图包含 7 日期概览,来源统计和选中日期时间轴,点击周内日期会刷新下方日程卡片.
- 日视图包含全天事件区和时间线事件区,时间线使用时间列,事件圆点和纵向连接线.
- 日程视图按日期分组展示未来事件,日期头包含今天/节假日徽标和事件数量.
- 事件筛选支持来源类型开关,来源显示开关,订阅同步入口和关键词搜索.
- 月视图点击日期打开右侧详情抽屉,双击日期区域可新建事件.
- 月视图和周视图的周末日期不做额外淡化,只对非当前月份日期保留弱化显示.
- 手动日历来源可新建/编辑/删除并持久化,任务/记账/节假日/订阅来源为只读展示.
- Todo 任务仅设置截止日期时同步为全天事件; 同时设置截止时间时同步为带时间的非全天事件.
- 新建/编辑事件弹窗使用 MUI X `DatePicker`,显示格式复用 `frontend/src/lib/dateFormats.ts` 的 `DATE_PICKER_DISPLAY_FORMAT`.

## 后端 API

- `GET /api/v1/calendar/events?start=YYYY-MM-DD&end=YYYY-MM-DD`: 返回指定日期闭区间内的聚合事件.
- `POST /api/v1/calendar/events`: 创建手动日历事件.
- `PUT /api/v1/calendar/events/{id}`: 更新手动日历事件,`id` 支持 `cal-{id}`.
- `DELETE /api/v1/calendar/events/{id}`: 删除手动日历事件.
- `GET /api/v1/calendar/sources`: 返回日历来源配置.
- `GET /api/v1/calendar/subscriptions`: 返回订阅列表,当前未接入外部订阅时为空数组.

## 数据来源

- `manual`: `calendar_events` 表,可由日历模块创建,编辑和删除.
- `todo`: `todos.due_date` + 可选 `todos.due_time`,只读展示,状态由 `is_completed`,到期日和到期时间计算.
- `finance_income` / `finance_expense`: `transactions.occurred_at`,只展示收入和支出交易,时间来自记账表单的发生日期和发生时间.
- `finance_event`: `events.start_at` / `events.end_at`,只读展示记账模块事件,时间来自事件表单的开始/结束日期和可选时间.
- `holiday` / `subscription`: 保留来源入口,没有真实数据时不展示伪造事件.
