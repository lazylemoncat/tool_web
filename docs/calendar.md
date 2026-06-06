# Calendar Module

## 功能概述

日历模块位于 `frontend/src/components/calendar/`,路由入口为 `frontend/src/app/calendar/page.tsx`,导航入口为 `/calendar`.

当前实现以原型目录中的日历设计为基础,提供月视图,周视图,日视图和日程列表视图.月视图按原型还原为连续月份滚动布局,sticky 月份工具条,大号日期格,农历/节假日标签和事件色条.周视图还原为周概览卡片,周统计卡片和选中日期日程卡片.日视图还原为单日卡片,全天分区和带时间列/圆点/连接线的时间轴.日程视图还原为未来事件按日期分组的列表卡片.日期详情与筛选来源使用右侧抽屉呈现.事件来源包含手动日程,任务,记账收入/支出,账单提醒,节假日和订阅日历.当前数据层使用前端内存 mock service,尚未接入后端持久化 API.

## 目录结构

```text
frontend/src/components/calendar/
├── CalendarEventDialog.tsx  # 新建/编辑事件弹窗,日期字段使用 MUI X DatePicker
├── CalendarPage.tsx         # 日历主页面,连续月份滚动,右侧抽屉,视图切换,筛选,来源管理
├── calendarMockData.ts      # 原型 mock 数据与来源颜色
├── calendarService.ts       # 前端内存 CRUD,筛选,来源可见性和订阅同步 stub
├── calendarTypes.ts         # 日历事件,来源,筛选和订阅类型
└── dateUtils.ts             # 月/周网格,日期格式化和事件排序工具
```

## 交互说明

- 顶部 sticky 工具条支持 `月`, `周`, `日`, `日程` 视图切换.
- 周视图包含 7 日期概览,来源统计和选中日期时间轴,点击周内日期会刷新下方日程卡片.
- 日视图包含全天事件区和时间线事件区,时间线使用时间列,事件圆点和纵向连接线.
- 日程视图按日期分组展示未来事件,日期头包含今天/节假日徽标和事件数量.
- 事件筛选支持来源类型开关,来源显示开关,订阅同步 stub 和关键词搜索.
- 月视图点击日期打开右侧详情抽屉,双击日期区域可新建事件.
- 手动日历和账单提醒来源可新建/编辑,任务/记账/节假日/订阅来源为只读展示.
- 新建/编辑事件弹窗使用 MUI X `DatePicker`,显示格式复用 `frontend/src/lib/dateFormats.ts` 的 `DATE_PICKER_DISPLAY_FORMAT`.

## 后续 API 对接建议

后续若接入后端,可将 `calendarService.ts` 的内存状态替换为 API 调用:

- `GET /api/v1/calendar/events`
- `POST /api/v1/calendar/events`
- `PUT /api/v1/calendar/events/{id}`
- `DELETE /api/v1/calendar/events/{id}`
- `GET /api/v1/calendar/sources`
- `POST /api/v1/calendar/subscriptions`
- `PUT /api/v1/calendar/subscriptions/{id}/sync`
