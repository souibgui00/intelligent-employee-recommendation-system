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

  const renderForm = () => {
    render(
      <BrowserRouter>
        <ForgotPasswordForm />
      </BrowserRouter>
    );
  };

  const typeEmailAndSubmit = async (email, { submit = true, submitButtonName = /Send link/i } = {}) => {
    const user = userEvent.setup();
    renderForm();

    const emailInput = screen.getByLabelText(/Work email/i);
    await user.type(emailInput, email);

    if (!submit) {
      return { user, emailInput, submitButton: null };
    }

    const submitButton = screen.getByRole('button', { name: submitButtonName });
    await user.click(submitButton);

    return { user, emailInput, submitButton };
  };

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
    renderForm();

    expect(screen.getByText('Recover access')).toBeInTheDocument();
    expect(screen.getByLabelText(/Work email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send link/i })).toBeInTheDocument();
  });

  it('should have a back button to navigate to login', () => {
    renderForm();

    const backButton = screen.getByRole('button', { name: /Back to login/i });
    fireEvent.click(backButton);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('should accept email input', async () => {
    const user = userEvent.setup();
    renderForm();

    const emailInput = screen.getByLabelText(/Work email/i);
    await user.type(emailInput, 'test@example.com');
    expect(emailInput.value).toBe('test@example.com');
  });

  it('should be disabled without email', () => {
    renderForm();

    const submitButton = screen.getByRole('button', { name: /Send link/i });
    expect(submitButton).toBeDisabled();
  });

  it('should enable submit button with valid email', async () => {
    await typeEmailAndSubmit('test@example.com', { submit: false });

    const submitButton = screen.getByRole('button', { name: /Send link/i });
    expect(submitButton).not.toBeDisabled();
  });

  it('should handle successful forgot password request', async () => {
    mockForgotPassword.mockResolvedValue({ message: 'Email sent' });

    await typeEmailAndSubmit('test@example.com');

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Recovery Email Sent');
    });
  });

  it('should display success message after sending email', async () => {
    mockForgotPassword.mockResolvedValue({ message: 'Email sent' });

    await typeEmailAndSubmit('test@example.com');

    await waitFor(() => {
      expect(screen.getByText('Check your email')).toBeInTheDocument();
      expect(screen.getByText(/Reset link sent to/i)).toBeInTheDocument();
    });
  });

  it('should display email in success message', async () => {
    const testEmail = 'user@example.com';
    mockForgotPassword.mockResolvedValue({ message: 'Email sent' });

    await typeEmailAndSubmit(testEmail);

    await waitFor(() => {
      expect(screen.getByText(testEmail)).toBeInTheDocument();
    });
  });

  it('should have button to return to login from success screen', async () => {
    mockForgotPassword.mockResolvedValue({ message: 'Email sent' });

    await typeEmailAndSubmit('test@example.com');

    await waitFor(() => {
      const returnButton = screen.getByRole('button', { name: /Return to login/i });
      expect(returnButton).toBeInTheDocument();
    });
  });

  it('should navigate to login from success screen', async () => {
    mockForgotPassword.mockResolvedValue({ message: 'Email sent' });

    await typeEmailAndSubmit('test@example.com');

    await waitFor(() => {
      const returnButton = screen.getByRole('button', { name: /Return to login/i });
      fireEvent.click(returnButton);
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('should handle error when forgot password fails', async () => {
    const errorMessage = 'Email not found in system';
    mockForgotPassword.mockRejectedValue(new Error(errorMessage));

    await typeEmailAndSubmit('unknown@example.com');

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(errorMessage);
    });
  });

  it('should show loading state during submission', async () => {
    mockForgotPassword.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ message: 'Email sent' }), 100))
    );

    const { submitButton } = await typeEmailAndSubmit('test@example.com');

    expect(submitButton).not.toBeDisabled();

    // Button should be disabled during loading
    expect(submitButton).toBeDisabled();
  });

  it('should only allow text input in email field', async () => {
    render(
      <BrowserRouter>
        <ForgotPasswordForm />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText(/Work email/i) as HTMLInputElement;
    expect(emailInput.type).toBe('email');
  });
});
