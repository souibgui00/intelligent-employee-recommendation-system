import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthGuard } from '../auth-guard';

// Mock useAuth
jest.mock('@/lib/auth-context', () => ({
  useAuth: jest.fn(),
}));

// Mock useNavigate
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

const { useAuth } = require('@/lib/auth-context');
const { useNavigate } = require('react-router-dom');

describe('AuthGuard Component', () => {
  let mockNavigate;

  beforeEach(() => {
    mockNavigate = jest.fn();
    useNavigate.mockReturnValue(mockNavigate);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading spinner when not authenticated', () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
    });

    render(
      <BrowserRouter>
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      </BrowserRouter>
    );

    // Should show loading spinner instead of children
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should redirect to login when not authenticated', () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
    });

    render(
      <BrowserRouter>
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      </BrowserRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('should render children when authenticated and no role restrictions', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', role: 'employee', name: 'John Doe' },
    });

    render(
      <BrowserRouter>
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      </BrowserRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should allow access when user role is in allowedRoles', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', role: 'admin', name: 'Admin User' },
    });

    render(
      <BrowserRouter>
        <AuthGuard allowedRoles={['admin', 'hr']}>
          <div>Admin Content</div>
        </AuthGuard>
      </BrowserRouter>
    );

    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });

  it('should redirect to employee dashboard when user is employee but admin role required', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', role: 'employee', name: 'John Doe' },
    });

    render(
      <BrowserRouter>
        <AuthGuard allowedRoles={['admin']}>
          <div>Admin Content</div>
        </AuthGuard>
      </BrowserRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/employee');
  });

  it('should redirect to manager dashboard when user is manager but admin role required', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', role: 'manager', name: 'Manager User' },
    });

    render(
      <BrowserRouter>
        <AuthGuard allowedRoles={['admin']}>
          <div>Admin Content</div>
        </AuthGuard>
      </BrowserRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/manager');
  });

  it('should redirect to admin dashboard for unknown roles', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', role: 'superuser', name: 'Super User' },
    });

    render(
      <BrowserRouter>
        <AuthGuard allowedRoles={['admin']}>
          <div>Admin Content</div>
        </AuthGuard>
      </BrowserRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/admin');
  });

  it('should show loading spinner during role check', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', role: 'employee', name: 'John Doe' },
    });

    const { rerender } = render(
      <BrowserRouter>
        <AuthGuard allowedRoles={['admin']}>
          <div>Admin Content</div>
        </AuthGuard>
      </BrowserRouter>
    );

    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should handle null user gracefully', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: null,
    });

    render(
      <BrowserRouter>
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      </BrowserRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should handle case-insensitive role comparison', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', role: 'EMPLOYEE', name: 'John Doe' },
    });

    render(
      <BrowserRouter>
        <AuthGuard allowedRoles={['admin']}>
          <div>Admin Content</div>
        </AuthGuard>
      </BrowserRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/employee');
  });

  it('should recheck auth when dependencies change', () => {
    const { rerender } = render(
      <BrowserRouter>
        <AuthGuard>
          <div>Content</div>
        </AuthGuard>
      </BrowserRouter>
    );

    useAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
    });

    rerender(
      <BrowserRouter>
        <AuthGuard>
          <div>Content</div>
        </AuthGuard>
      </BrowserRouter>
    );

    // Should be called again when dependencies change
    expect(mockNavigate).toHaveBeenCalled();
  });
});
