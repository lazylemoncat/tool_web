import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage from './page';
import { I18nProvider } from '@/context/I18nContext';

const authModule = vi.hoisted(() => ({
  login: vi.fn(),
  verifyMfa: vi.fn(),
}));

const themeModule = vi.hoisted(() => ({
  toggle: vi.fn(),
  setMode: vi.fn(),
}));

const apiModule = vi.hoisted(() => {
  class ApiError extends Error {
    status: number;
    detail?: unknown;

    constructor(status: number, message: string, detail?: unknown) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      this.detail = detail;
    }
  }

  return { ApiError, resetPassword: vi.fn() };
});

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    login: authModule.login,
    verifyMfa: authModule.verifyMfa,
  }),
}));

vi.mock('@/components/theme/ThemeRegistry', () => ({
  themePreferences: ['system', 'light', 'dark'],
  useThemeCtx: () => ({
    mode: 'light',
    preference: 'system',
    toggle: themeModule.toggle,
    setMode: themeModule.setMode,
  }),
}));

vi.mock('@/lib/api', () => apiModule);

function renderLoginPage() {
  return render(
    <I18nProvider>
      <LoginPage />
    </I18nProvider>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear();
    authModule.login.mockReset();
    authModule.verifyMfa.mockReset();
    themeModule.toggle.mockReset();
    themeModule.setMode.mockReset();
    apiModule.resetPassword.mockReset();
  });

  it('does not submit when required fields are empty', async () => {
    const { container } = renderLoginPage();
    const submit = container.querySelector('button[type="submit"]');
    expect(submit).not.toBeNull();

    await userEvent.click(submit as HTMLButtonElement);

    expect(authModule.login).not.toHaveBeenCalled();
  });

  it('shows ApiError message when login fails', async () => {
    authModule.login.mockRejectedValueOnce(
      new apiModule.ApiError(401, 'Invalid credentials'),
    );
    const { container } = renderLoginPage();

    const username = container.querySelector('#login-username');
    const password = container.querySelector('input[type="password"]');
    const submit = container.querySelector('button[type="submit"]');
    expect(username).not.toBeNull();
    expect(password).not.toBeNull();
    expect(submit).not.toBeNull();

    await userEvent.type(username as HTMLInputElement, ' rex ');
    await userEvent.type(password as HTMLInputElement, 'secret');
    await userEvent.click(submit as HTMLButtonElement);

    await waitFor(() => {
      expect(authModule.login).toHaveBeenCalledWith('rex', 'secret');
    });
    expect(screen.getByText('用户名或密码错误')).toBeInTheDocument();
  });

  it('selects a theme preference from the top-right chip', async () => {
    renderLoginPage();

    await userEvent.click(screen.getByRole('button', { name: /主题/ }));
    await userEvent.click(screen.getByRole('menuitem', { name: '深色' }));

    expect(themeModule.setMode).toHaveBeenCalledWith('dark');
  });

  it('switches login errors to English', async () => {
    authModule.login.mockRejectedValueOnce(
      new apiModule.ApiError(401, 'Invalid credentials'),
    );
    const { container } = renderLoginPage();

    await userEvent.click(screen.getByRole('button', { name: /语言/ }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'English' }));

    const username = container.querySelector('#login-username');
    const password = container.querySelector('input[type="password"]');
    const submit = container.querySelector('button[type="submit"]');
    expect(username).not.toBeNull();
    expect(password).not.toBeNull();
    expect(submit).not.toBeNull();

    await userEvent.type(username as HTMLInputElement, 'rex');
    await userEvent.type(password as HTMLInputElement, 'secret');
    await userEvent.click(submit as HTMLButtonElement);

    await waitFor(() => {
      expect(authModule.login).toHaveBeenCalledWith('rex', 'secret');
    });
    expect(screen.getByText('Invalid username or password')).toBeInTheDocument();
  });

  it('opens forgot password dialog and submits a 2FA reset', async () => {
    apiModule.resetPassword.mockResolvedValueOnce(undefined);
    renderLoginPage();

    await userEvent.click(screen.getByRole('link', { name: '忘记密码?' }));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();

    const username = dialog.querySelector('#reset-username');
    const code = dialog.querySelector('#reset-code');
    const passwordInputs = dialog.querySelectorAll('input[type="password"]');
    expect(username).not.toBeNull();
    expect(code).not.toBeNull();
    expect(passwordInputs.length).toBeGreaterThanOrEqual(2);

    await userEvent.type(username as HTMLInputElement, 'rex');
    await userEvent.type(code as HTMLInputElement, '123456');
    await userEvent.type(passwordInputs[0] as HTMLInputElement, 'newpass123');
    await userEvent.type(passwordInputs[1] as HTMLInputElement, 'newpass123');
    await userEvent.click(screen.getByRole('button', { name: '重置密码' }));

    await waitFor(() => {
      expect(apiModule.resetPassword).toHaveBeenCalledWith({
        username: 'rex',
        method: 'totp',
        code: '123456',
        new_password: 'newpass123',
      });
    });
    expect(screen.getByText('密码已重置, 请使用新密码登录')).toBeInTheDocument();
  });
});
