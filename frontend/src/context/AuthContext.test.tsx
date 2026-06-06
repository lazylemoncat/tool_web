import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';

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
    getMe: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    verifyMfa: vi.fn(),
  };
});

vi.mock('@/lib/api', () => apiModule);

const user = {
  id: 1,
  username: 'rex',
  is_admin: false,
};

function Probe() {
  const auth = useAuth();
  return (
    <div>
      <div data-testid="loading">{String(auth.isLoading)}</div>
      <div data-testid="authenticated">{String(auth.isAuthenticated)}</div>
      <div data-testid="username">{auth.user?.username ?? 'none'}</div>
      <div data-testid="error">{auth.error ?? 'none'}</div>
      <button
        onClick={() => {
          void auth.login('rex', 'secret').catch(() => undefined);
        }}
      >
        login
      </button>
      <button
        onClick={() => {
          void auth.register('rex', 'secret').catch(() => undefined);
        }}
      >
        register
      </button>
      <button
        onClick={() => {
          void auth
            .verifyMfa('challenge', 'totp', '123456')
            .catch(() => undefined);
        }}
      >
        verify
      </button>
      <button
        onClick={() => {
          void auth.logout().catch(() => undefined);
        }}
      >
        logout
      </button>
    </div>
  );
}

function renderProvider() {
  return render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    apiModule.getMe.mockReset();
    apiModule.login.mockReset();
    apiModule.logout.mockReset();
    apiModule.register.mockReset();
    apiModule.verifyMfa.mockReset();
  });

  it('restores authenticated user during initial load', async () => {
    apiModule.getMe.mockResolvedValueOnce({ user });

    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
    expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    expect(screen.getByTestId('username')).toHaveTextContent('rex');
  });

  it('keeps anonymous state when getMe fails', async () => {
    apiModule.getMe.mockRejectedValueOnce(new Error('unauthenticated'));

    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('username')).toHaveTextContent('none');
  });

  it('sets user after successful login and clears user on logout', async () => {
    apiModule.getMe.mockRejectedValueOnce(new Error('unauthenticated'));
    apiModule.login.mockResolvedValueOnce({
      status: 'authenticated',
      user,
    });
    apiModule.logout.mockResolvedValueOnce(undefined);

    renderProvider();
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    await userEvent.click(screen.getByRole('button', { name: 'login' }));
    await waitFor(() => {
      expect(screen.getByTestId('username')).toHaveTextContent('rex');
    });

    await userEvent.click(screen.getByRole('button', { name: 'logout' }));
    await waitFor(() => {
      expect(screen.getByTestId('username')).toHaveTextContent('none');
    });
  });

  it('returns MFA challenge without authenticating the user', async () => {
    apiModule.getMe.mockRejectedValueOnce(new Error('unauthenticated'));
    apiModule.login.mockResolvedValueOnce({
      status: 'mfa_required',
      challenge_id: 'challenge',
      available_methods: ['totp'],
    });

    renderProvider();
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    await userEvent.click(screen.getByRole('button', { name: 'login' }));
    await waitFor(() => {
      expect(apiModule.login).toHaveBeenCalledWith({
        username: 'rex',
        password: 'secret',
      });
    });
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
  });

  it('sets user after successful registration', async () => {
    apiModule.getMe.mockRejectedValueOnce(new Error('unauthenticated'));
    apiModule.register.mockResolvedValueOnce({ user });

    renderProvider();
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    await userEvent.click(screen.getByRole('button', { name: 'register' }));
    await waitFor(() => {
      expect(screen.getByTestId('username')).toHaveTextContent('rex');
    });
    expect(apiModule.register).toHaveBeenCalledWith({
      username: 'rex',
      password: 'secret',
    });
  });

  it('sets user after successful MFA verification', async () => {
    apiModule.getMe.mockRejectedValueOnce(new Error('unauthenticated'));
    apiModule.verifyMfa.mockResolvedValueOnce({ user });

    renderProvider();
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    await userEvent.click(screen.getByRole('button', { name: 'verify' }));
    await waitFor(() => {
      expect(screen.getByTestId('username')).toHaveTextContent('rex');
    });
    expect(apiModule.verifyMfa).toHaveBeenCalledWith({
      challenge_id: 'challenge',
      method: 'totp',
      code: '123456',
    });
  });

  it('stores ApiError message when login fails', async () => {
    apiModule.getMe.mockRejectedValueOnce(new Error('unauthenticated'));
    apiModule.login.mockRejectedValueOnce(
      new apiModule.ApiError(401, 'Bad credentials'),
    );

    renderProvider();
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    await userEvent.click(screen.getByRole('button', { name: 'login' }));
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Bad credentials');
    });
  });
});
