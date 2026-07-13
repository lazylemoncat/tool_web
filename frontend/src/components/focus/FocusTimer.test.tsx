// FocusTimer 计时恢复与归档流程测试.
// 覆盖: 恢复横幅展示会话详情; 离线完成的番茄钟恢复后清理 localStorage;
// 归档弹窗取消后可通过"归档记录"按钮重新打开, 不丢失待归档数据.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FocusTimer from './FocusTimer';

vi.mock('@/lib/api/focus', () => ({
  createFocusSession: vi.fn().mockResolvedValue({}),
}));

const STORAGE_KEY = 'toolweb-focus-timer-state';

function seedSavedState(overrides: Record<string, unknown> = {}) {
  const saved = {
    mode: 'pomodoro',
    status: 'counting',
    plannedSeconds: 1500,
    remainingSeconds: 10,
    elapsedSeconds: 1490,
    pauseCount: 1,
    pauseSeconds: 30,
    startedAt: new Date(Date.now() - 1_500_000).toISOString(),
    lastTick: Date.now() - 60_000,
    pauseStartedAt: null,
    name: '写周报',
    folderId: null,
    tagIds: [],
    autoRest: false,
    ...overrides,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
}

function renderTimer() {
  return render(
    <FocusTimer
      folders={[]}
      tags={[]}
      onSessionSaved={vi.fn()}
      onCreateTag={vi.fn()}
    />,
  );
}

describe('FocusTimer 计时恢复', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('恢复横幅展示会话名称与模式详情', () => {
    seedSavedState();
    renderTimer();
    const banner = screen.getByRole('alert');
    expect(banner).toHaveTextContent('检测到未完成的计时');
    expect(banner).toHaveTextContent('写周报');
    expect(banner).toHaveTextContent('番茄钟');
  });

  it('离线期间完成的番茄钟: 恢复后打开归档弹窗并清理本地状态', async () => {
    const user = userEvent.setup();
    seedSavedState();
    renderTimer();

    await user.click(screen.getByRole('button', { name: '继续' }));

    expect(await screen.findByText('归档本次专注')).toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('归档弹窗取消后可通过"归档记录"按钮重新打开', async () => {
    const user = userEvent.setup();
    seedSavedState();
    renderTimer();

    await user.click(screen.getByRole('button', { name: '继续' }));
    expect(await screen.findByText('归档本次专注')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '取消' }));

    const reopenButton = await screen.findByRole('button', { name: /归档记录/ });
    await user.click(reopenButton);
    expect(await screen.findByText('归档本次专注')).toBeInTheDocument();
  });
});
