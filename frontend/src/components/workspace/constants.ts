import type { CardId, CardDefinition, WorkspaceCardsState } from './types';

export const CARD_DEFINITIONS: Record<CardId, CardDefinition> = {
  todo: {
    id: 'todo',
    label: '待办事项',
    description: '管理任务、文件夹、优先级和标签。',
    size: 'md',
    iconBg: '#E8E0FF',
    iconColor: '#2D1F5E',
  },
  finance: {
    id: 'finance',
    label: '记账',
    description: '记录收入支出，查看月度收支。',
    size: 'md',
    iconBg: '#D1FAE5',
    iconColor: '#065F46',
  },
  monthly: {
    id: 'monthly',
    label: '本月记账',
    description: '月度收支概览与趋势图表。',
    size: 'lg',
    iconBg: '#FEF3C7',
    iconColor: '#92400E',
  },
  recent: {
    id: 'recent',
    label: '最近任务',
    description: '快速查看近期需要处理的任务。',
    size: 'md',
    iconBg: '#DBEAFE',
    iconColor: '#1E3A5F',
  },
  settings: {
    id: 'settings',
    label: '设置',
    description: '管理账号、外观和偏好。',
    size: 'sm',
    iconBg: 'action.hover',
    iconColor: 'text.secondary',
  },
  help: {
    id: 'help',
    label: '帮助',
    description: '查看功能文档和使用指南。',
    size: 'sm',
    iconBg: '#F3E8FF',
    iconColor: '#4C1D95',
  },
};

export const DEFAULT_CARD_STATE: WorkspaceCardsState = {
  order: ['todo', 'finance', 'monthly', 'recent', 'settings', 'help'],
  visible: ['todo', 'finance', 'monthly', 'recent', 'settings', 'help'],
};

export const STORAGE_KEY = 'toolweb-workspace-cards';
