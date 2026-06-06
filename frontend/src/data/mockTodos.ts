export type Priority = 'high' | 'medium' | 'low';

export interface Task {
  id: number;
  title: string;
  priority: Priority;
  folder: string;
  due: string;
  tags: string[];
  subtasks: number;
  doneSubtasks: number;
  completed: boolean;
  description: string;
  parentId?: number;
}

export interface Folder {
  id: string;
  name: string;
  color: string;
  parentId: string | null;
  level: number;
  count: number;
}

export interface ViewItem {
  id: string;
  label: string;
  icon: string;
  count: number;
}

export const VIEWS: ViewItem[] = [
  { id: 'all', label: '所有任务', icon: 'grid', count: 12 },
  { id: 'today', label: '今天', icon: 'sun', count: 4 },
  { id: 'upcoming', label: '即将到期', icon: 'calendar', count: 3 },
  { id: 'completed', label: '已完成', icon: 'check', count: 8 },
];

export const FOLDERS: Folder[] = [
  { id: 'work', name: '工作项目', color: '#6282E3', parentId: null, level: 0, count: 5 },
  { id: 'frontend', name: '前端项目', color: '#6282E3', parentId: 'work', level: 1, count: 3 },
  { id: 'personal', name: '个人生活', color: '#E3628C', parentId: null, level: 0, count: 3 },
  { id: 'study', name: '学习', color: '#62E3A0', parentId: null, level: 0, count: 4 },
  { id: 'rust', name: 'Rust 学习', color: '#62E3A0', parentId: 'study', level: 1, count: 1 },
];

export const TASKS: Task[] = [
  {
    id: 1,
    title: '优化首页加载性能',
    priority: 'high',
    folder: 'work',
    due: '2026-06-05',
    tags: ['前端', '性能优化'],
    subtasks: 3,
    doneSubtasks: 1,
    completed: false,
    description:
      '## 目标\n将首页 LCP 降低至 2.5s 以内。\n\n### 方案\n- 图片使用 WebP 格式并添加 loading="lazy"\n- 代码分割：首屏只加载关键 CSS/JS\n- 使用 next/image 组件',
  },
  {
    id: 2,
    title: '编写 Q2 产品路线图文档',
    priority: 'high',
    folder: 'work',
    due: '2026-06-03',
    tags: ['产品', '文档'],
    subtasks: 0,
    doneSubtasks: 0,
    completed: false,
    description: '编写 Q2 产品路线图，包括功能优先级排序和时间线规划。',
  },
  {
    id: 3,
    title: '重构用户模块',
    priority: 'medium',
    folder: 'work',
    due: '2026-06-20',
    tags: ['后端', '架构'],
    subtasks: 5,
    doneSubtasks: 2,
    completed: false,
    description:
      '## 重构计划\n1. 拆分 UserService\n2. 引入 Repository 模式\n3. 添加单元测试覆盖',
  },
  {
    id: 4,
    title: '订周末电影票',
    priority: 'low',
    folder: 'personal',
    due: '2026-06-07',
    tags: ['生活'],
    subtasks: 0,
    doneSubtasks: 0,
    completed: false,
    description: '查看万达影城排片，选一部想看的电影。',
  },
  {
    id: 5,
    title: '阅读《DDIA》第 6 章',
    priority: 'medium',
    folder: 'study',
    due: '2026-06-10',
    tags: ['读书', '技术'],
    subtasks: 0,
    doneSubtasks: 0,
    completed: false,
    description: '重点理解分布式共识算法的部分，做笔记。',
  },
  {
    id: 6,
    title: '更新个人网站作品集',
    priority: 'low',
    folder: 'personal',
    due: '2026-06-25',
    tags: ['前端', '设计'],
    subtasks: 2,
    doneSubtasks: 0,
    completed: false,
    description: '添加最近完成的几个项目案例。',
  },
  {
    id: 7,
    title: '整理前端技术分享 PPT',
    priority: 'medium',
    folder: 'work',
    due: '2026-06-01',
    tags: ['前端', '分享'],
    subtasks: 4,
    doneSubtasks: 4,
    completed: true,
    description: '已完成分享，可以归档了。',
  },
  {
    id: 8,
    title: '完成 LeetCode 每日一题',
    priority: 'low',
    folder: 'study',
    due: '2026-06-02',
    tags: ['算法'],
    subtasks: 0,
    doneSubtasks: 0,
    completed: false,
    description: '今日题目：动态规划 —— 最长回文子串',
  },
  {
    id: 9,
    title: '预约牙科检查',
    priority: 'high',
    folder: 'personal',
    due: '2026-05-28',
    tags: ['健康'],
    subtasks: 0,
    doneSubtasks: 0,
    completed: false,
    description: '已预约，记得带上医保卡。',
  },
  {
    id: 10,
    title: '学习 Rust 所有权系统',
    priority: 'medium',
    folder: 'study',
    due: '2026-06-15',
    tags: ['Rust', '学习'],
    subtasks: 3,
    doneSubtasks: 0,
    completed: false,
    description:
      '## 学习计划\n- 理解所有权规则\n- 掌握借用和引用\n- 完成 Rustlings 练习题',
  },
  {
    id: 11,
    title: '设计系统组件评审',
    priority: 'high',
    folder: 'work',
    due: '2026-06-04',
    tags: ['设计系统', '前端'],
    subtasks: 0,
    doneSubtasks: 0,
    completed: false,
    description: '评审新版 Button、Card、Dialog 组件方案。',
  },
  {
    id: 12,
    title: '跑步 5 公里',
    priority: 'low',
    folder: 'personal',
    due: '2026-06-03',
    tags: ['健康', '运动'],
    subtasks: 0,
    doneSubtasks: 0,
    completed: false,
    description: '傍晚去奥林匹克公园跑步。',
  },
];

export const SUBTASK_TEMPLATES = [
  '方案调研与评估',
  '开发实现',
  'Code Review',
  '测试验证',
  '上线部署',
];
