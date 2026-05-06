import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActivityResponsePanel } from '@/components/activities/ActivityResponsePanel';

jest.mock('@/lib/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

jest.mock('@/lib/auth-context', () => ({
  useAuth: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }) => (open ? <div>{children}</div> : null),
  DialogContent: ({ children }) => <div>{children}</div>,
  DialogHeader: ({ children }) => <div>{children}</div>,
  DialogTitle: ({ children }) => <h2>{children}</h2>,
  DialogDescription: ({ children }) => <p>{children}</p>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
}));

jest.mock('@/components/ui/textarea', () => ({
  Textarea: (props) => <textarea {...props} />,
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children }) => <span>{children}</span>,
}));

const { api } = require('@/lib/api');
const { useAuth } = require('@/lib/auth-context');
const { toast } = require('sonner');

describe('ActivityResponsePanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null for non-employees', () => {
    useAuth.mockReturnValue({ user: { role: 'manager' } });

    const { container } = render(<ActivityResponsePanel />);

    expect(container).toBeEmptyDOMElement();
    expect(api.get).not.toHaveBeenCalled();
  });

  it('renders pending participation cards for employees', async () => {
    useAuth.mockReturnValue({ user: { role: 'employee' } });
    api.get.mockResolvedValueOnce([
      {
        _id: 'p1',
        status: 'pending_response',
        activityId: {
          _id: 'a1',
          title: 'React Training',
          type: 'training',
          date: '2026-05-10T00:00:00.000Z',
          duration: '4h',
        },
      },
      {
        _id: 'p2',
        status: 'approved',
        activityId: { _id: 'a2', title: 'Ignored' },
      },
    ]);

    render(<ActivityResponsePanel />);

    expect(await screen.findByText(/action required/i)).toBeInTheDocument();
    expect(screen.getByText('React Training')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /accept/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /decline/i })).toBeInTheDocument();
  });

  it('accepts a pending participation', async () => {
    const user = userEvent.setup();
    useAuth.mockReturnValue({ user: { role: 'employee' } });
    api.get.mockResolvedValue([
      {
        _id: 'p1',
        status: 'pending_response',
        activityId: { _id: 'a1', title: 'React Training' },
      },
    ]);
    api.post.mockResolvedValue({});

    render(<ActivityResponsePanel />);

    await screen.findByText('React Training');
    await user.click(screen.getByRole('button', { name: /accept/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/participations/a1/respond', { accept: true });
      expect(toast.success).toHaveBeenCalledWith('Participation Confirmed', {
        description: 'You are now enrolled in "React Training".',
      });
    });
  });

  it('declines a participation with a reason', async () => {
    const user = userEvent.setup();
    useAuth.mockReturnValue({ user: { role: 'employee' } });
    api.get.mockResolvedValue([
      {
        _id: 'p1',
        status: 'pending_response',
        activityId: { _id: 'a1', title: 'React Training' },
      },
    ]);
    api.post.mockResolvedValue({});

    render(<ActivityResponsePanel />);

    await screen.findByText('React Training');
    await user.click(screen.getByRole('button', { name: /decline/i }));

    await user.type(screen.getByPlaceholderText(/please provide a reason/i), 'Schedule conflict');
    await user.click(screen.getByRole('button', { name: /confirm decline/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/participations/a1/respond', {
        accept: false,
        reason: 'Schedule conflict',
      });
      expect(toast.success).toHaveBeenCalledWith('Declination submitted', {
        description: 'Your manager has been notified of your decision for "React Training".',
      });
    });
  });
});