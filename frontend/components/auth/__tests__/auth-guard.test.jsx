import React from 'react';
import { render, screen } from '@testing-library/react';
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

  const renderGuard = ({ children = <div>Protected Content</div>, allowedRoles } = {}) => {
    render(
      <BrowserRouter>
        <AuthGuard allowedRoles={allowedRoles}>
          {children}
        </AuthGuard>
      </BrowserRouter>
    );
  };

  const mockAuth = (state) => {
    useAuth.mockReturnValue(state);
  };

  beforeEach(() => {
    mockNavigate = jest.fn();
    useNavigate.mockReturnValue(mockNavigate);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading spinner when not authenticated', () => {
    mockAuth({
      isAuthenticated: false,
      user: null,
    });

    renderGuard();

    // Should show loading spinner instead of children
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should redirect to login when not authenticated', () => {
    mockAuth({
      isAuthenticated: false,
      user: null,
    });

    renderGuard();

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('should render children when authenticated and no role restrictions', () => {
    mockAuth({
      isAuthenticated: true,
      user: { id: '1', role: 'employee', name: 'John Doe' },
    });

    renderGuard();

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should allow access when user role is in allowedRoles', () => {
    mockAuth({
      isAuthenticated: true,
      user: { id: '1', role: 'admin', name: 'Admin User' },
    });

    renderGuard({ children: <div>Admin Content</div>, allowedRoles: ['admin', 'hr'] });

    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });

  it.each([
    ['employee', '/employee'],
    ['manager', '/manager'],
    ['superuser', '/admin'],
  ])('should redirect %s users to the right dashboard when admin role is required', (role, expectedPath) => {
    mockAuth({
      isAuthenticated: true,
      user: { id: '1', role, name: 'Test User' },
    });

    renderGuard({ children: <div>Admin Content</div>, allowedRoles: ['admin'] });

    expect(mockNavigate).toHaveBeenCalledWith(expectedPath);
  });

  it('should show loading spinner during role check', () => {
    mockAuth({
      isAuthenticated: true,
      user: { id: '1', role: 'employee', name: 'John Doe' },
    });

    renderGuard({ children: <div>Admin Content</div>, allowedRoles: ['admin'] });

    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should handle null user gracefully', () => {
    mockAuth({
      isAuthenticated: true,
      user: null,
    });

    renderGuard();

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should handle case-insensitive role comparison', () => {
    mockAuth({
      isAuthenticated: true,
      user: { id: '1', role: 'EMPLOYEE', name: 'John Doe' },
    });

    renderGuard({ children: <div>Admin Content</div>, allowedRoles: ['admin'] });

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

    mockAuth({
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
