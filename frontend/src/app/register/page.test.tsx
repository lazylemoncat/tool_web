import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RegisterPage from './page';
import { I18nProvider } from '@/context/I18nContext';

const routerModule = vi.hoisted(() => ({
  push: vi.fn(),
}));

const authModule = vi.hoisted(() => ({
  register: vi.fn(),
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

  return {
    ApiError,
    checkUsernameAvailability: vi.fn(),
  };
});

vi.mock('next/navigation', () => ({
  useRouter: () => routerModule,
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    register: authModule.register,
  }),
}));

vi.mock('@/lib/api', () => apiModule);

function renderRegisterPage() {
  return render(
    <I18nProvider>
      <RegisterPage />
    </I18nProvider>,
  );
}

describe('RegisterPage', () => {
  beforeEach(() => {
    localStorage.clear();
    routerModule.push.mockReset();
    authModule.register.mockReset();
    apiModule.checkUsernameAvailability.mockReset();
    apiModule.checkUsernameAvailability.mockResolvedValue({
      username: 'rex',
      available: true,
    });
  });

  it('does not submit invalid form input', async () => {
    const { container } = renderRegisterPage();
    const submit = container.querySelector('button[type="submit"]');
    expect(submit).not.toBeNull();

    await userEvent.click(submit as HTMLButtonElement);

    expect(authModule.register).not.toHaveBeenCalled();
  });

  it('shows username availability while typing', async () => {
    apiModule.checkUsernameAvailability.mockResolvedValueOnce({
      username: 'rex',
      available: false,
    });
    const { container } = renderRegisterPage();
    const username = container.querySelector('#register-username');
    expect(username).not.toBeNull();

    await userEvent.type(username as HTMLInputElement, 'rex');

    await waitFor(() => {
      expect(apiModule.checkUsernameAvailability).toHaveBeenCalledWith('rex');
    });
    expect(screen.getByText('用户名已被使用')).toBeInTheDocument();
  });

  it('shows whether confirmation password matches', async () => {
    const { container } = renderRegisterPage();
    const passwordInputs = container.querySelectorAll('input[type="password"]');
    expect(passwordInputs).toHaveLength(2);

    await userEvent.type(passwordInputs[0] as HTMLInputElement, 'secret123');
    await userEvent.type(passwordInputs[1] as HTMLInputElement, 'secret124');
    expect(screen.getByText('两次密码不一致')).toBeInTheDocument();

    await userEvent.clear(passwordInputs[1] as HTMLInputElement);
    await userEvent.type(passwordInputs[1] as HTMLInputElement, 'secret123');
    expect(screen.getByText('两次密码一致')).toBeInTheDocument();
  });

  it('goes to home after successful registration', async () => {
    authModule.register.mockResolvedValueOnce({
      user: { id: 1, username: 'rex', is_admin: false },
    });
    const { container } = renderRegisterPage();

    const username = container.querySelector('#register-username');
    const passwordInputs = container.querySelectorAll('input[type="password"]');
    const submit = container.querySelector('button[type="submit"]');
    expect(username).not.toBeNull();
    expect(passwordInputs).toHaveLength(2);
    expect(submit).not.toBeNull();

    await userEvent.type(username as HTMLInputElement, 'rex');
    await waitFor(() => {
      expect(screen.getByText('用户名可用')).toBeInTheDocument();
    });
    await userEvent.type(passwordInputs[0] as HTMLInputElement, 'secret123');
    await userEvent.type(passwordInputs[1] as HTMLInputElement, 'secret123');
    await userEvent.click(submit as HTMLButtonElement);

    await waitFor(() => {
      expect(authModule.register).toHaveBeenCalledWith('rex', 'secret123');
    });
    expect(routerModule.push).toHaveBeenCalledWith('/');
  });

  it('shows backend duplicate username error', async () => {
    authModule.register.mockRejectedValueOnce(
      new apiModule.ApiError(409, 'Already exists'),
    );
    const { container } = renderRegisterPage();

    const username = container.querySelector('#register-username');
    const passwordInputs = container.querySelectorAll('input[type="password"]');
    const submit = container.querySelector('button[type="submit"]');
    expect(username).not.toBeNull();
    expect(passwordInputs).toHaveLength(2);
    expect(submit).not.toBeNull();

    await userEvent.type(username as HTMLInputElement, 'rex');
    await waitFor(() => {
      expect(screen.getByText('用户名可用')).toBeInTheDocument();
    });
    await userEvent.type(passwordInputs[0] as HTMLInputElement, 'secret123');
    await userEvent.type(passwordInputs[1] as HTMLInputElement, 'secret123');
    await userEvent.click(submit as HTMLButtonElement);

    await waitFor(() => {
      expect(authModule.register).toHaveBeenCalledWith('rex', 'secret123');
    });
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
