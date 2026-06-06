import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import PasswordInput from './PasswordInput';

describe('PasswordInput', () => {
  it('toggles password visibility without changing the input value', async () => {
    const onChange = vi.fn();
    const { container } = render(
      <PasswordInput
        id="password"
        label="Password"
        value="secret"
        onChange={onChange}
      />,
    );
    const input = container.querySelector('input');
    expect(input).toHaveAttribute('type', 'password');
    expect(input).toHaveValue('secret');

    await userEvent.click(screen.getByRole('button'));
    expect(input).toHaveAttribute('type', 'text');

    await userEvent.click(screen.getByRole('button'));
    expect(input).toHaveAttribute('type', 'password');
  });
});
