import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import ForgotPasswordForm from '../ForgotPasswordForm';

// Mock dependencies
jest.mock('@/lib/auth-context', () => ({
  useAuth: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

const { useAuth } = require('@/lib/auth-context');
const { useNavigate } = require('react-router-dom');
const { toast } = require('sonner');

describe('ForgotPasswordForm Component', () => {
  let mockNavigate;
  let mockForgotPassword;

  beforeEach(() => {
    mockNavigate = jest.fn();
    mockForgotPassword = jest.fn();
    useNavigate.mockReturnValue(mockNavigate);
    useAuth.mockReturnValue({
      forgotPassword: mockForgotPassword,
    });
    jest.clearAllMocks();
  });

  it('should render the forgot password form', () => {
    render(
      <BrowserRouter>
        <ForgotPasswordForm />
      </BrowserRouter>
    );

    expect(screen.getByText('Recover access')).toBeInTheDocument();
    expect(screen.getByLabelText(/Work email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send link/i })).toBeInTheDocument();
  });

  it('should have a back button to navigate to login', () => {
    render(
      <BrowserRouter>
        <ForgotPasswordForm />
      </BrowserRouter>
    );

    const backButton = screen.getByRole('button', { name: /Back to login/i });
    fireEvent.click(backButton);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('should accept email input', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <ForgotPasswordForm />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText(/Work email/i);
    await user.type(emailInput, 'test@example.com');
    expect(emailInput.value).toBe('test@example.com');
  });

  it('should be disabled without email', () => {
    render(
      <BrowserRouter>
        <ForgotPasswordForm />
      </BrowserRouter>
    );

    const submitButton = screen.getByRole('button', { name: /Send link/i });
    expect(submitButton).toBeDisabled();
  });

  it('should enable submit button with valid email', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <ForgotPasswordForm />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText(/Work email/i);
    await user.type(emailInput, 'test@example.com');

    const submitButton = screen.getByRole('button', { name: /Send link/i });
    expect(submitButton).not.toBeDisabled();
  });

  it('should handle successful forgot password request', async () => {
    const user = userEvent.setup();
    mockForgotPassword.mockResolvedValue({ message: 'Email sent' });

    render(
      <BrowserRouter>
        <ForgotPasswordForm />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText(/Work email/i);
    await user.type(emailInput, 'test@example.com');

    const submitButton = screen.getByRole('button', { name: /Send link/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Recovery Email Sent');
    });
  });

  it('should display success message after sending email', async () => {
    const user = userEvent.setup();
    mockForgotPassword.mockResolvedValue({ message: 'Email sent' });

    render(
      <BrowserRouter>
        <ForgotPasswordForm />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText(/Work email/i);
    await user.type(emailInput, 'test@example.com');

    const submitButton = screen.getByRole('button', { name: /Send link/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Check your email')).toBeInTheDocument();
      expect(screen.getByText(/Reset link sent to/i)).toBeInTheDocument();
    });
  });

  it('should display email in success message', async () => {
    const user = userEvent.setup();
    const testEmail = 'user@example.com';
    mockForgotPassword.mockResolvedValue({ message: 'Email sent' });

    render(
      <BrowserRouter>
        <ForgotPasswordForm />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText(/Work email/i);
    await user.type(emailInput, testEmail);

    const submitButton = screen.getByRole('button', { name: /Send link/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(testEmail)).toBeInTheDocument();
    });
  });

  it('should have button to return to login from success screen', async () => {
    const user = userEvent.setup();
    mockForgotPassword.mockResolvedValue({ message: 'Email sent' });

    render(
      <BrowserRouter>
        <ForgotPasswordForm />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText(/Work email/i);
    await user.type(emailInput, 'test@example.com');

    const submitButton = screen.getByRole('button', { name: /Send link/i });
    await user.click(submitButton);

    await waitFor(() => {
      const returnButton = screen.getByRole('button', { name: /Return to login/i });
      expect(returnButton).toBeInTheDocument();
    });
  });

  it('should navigate to login from success screen', async () => {
    const user = userEvent.setup();
    mockForgotPassword.mockResolvedValue({ message: 'Email sent' });

    render(
      <BrowserRouter>
        <ForgotPasswordForm />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText(/Work email/i);
    await user.type(emailInput, 'test@example.com');

    const submitButton = screen.getByRole('button', { name: /Send link/i });
    await user.click(submitButton);

    await waitFor(() => {
      const returnButton = screen.getByRole('button', { name: /Return to login/i });
      fireEvent.click(returnButton);
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('should handle error when forgot password fails', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Email not found in system';
    mockForgotPassword.mockRejectedValue(new Error(errorMessage));

    render(
      <BrowserRouter>
        <ForgotPasswordForm />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText(/Work email/i);
    await user.type(emailInput, 'unknown@example.com');

    const submitButton = screen.getByRole('button', { name: /Send link/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(errorMessage);
    });
  });

  it('should show loading state during submission', async () => {
    const user = userEvent.setup();
    mockForgotPassword.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ message: 'Email sent' }), 100))
    );

    render(
      <BrowserRouter>
        <ForgotPasswordForm />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText(/Work email/i);
    await user.type(emailInput, 'test@example.com');

    const submitButton = screen.getByRole('button', { name: /Send link/i });
    expect(submitButton).not.toBeDisabled();

    await user.click(submitButton);

    // Button should be disabled during loading
    expect(submitButton).toBeDisabled();
  });

  it('should only allow text input in email field', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <ForgotPasswordForm />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText(/Work email/i) as HTMLInputElement;
    expect(emailInput.type).toBe('email');
  });
});
