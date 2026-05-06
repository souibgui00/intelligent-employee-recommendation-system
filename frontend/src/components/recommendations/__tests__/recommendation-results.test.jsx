import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RecommendationResults from '@/components/recommendations/recommendation-results';

jest.mock('@/lib/data-store', () => ({
  useData: jest.fn(),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children }) => <span>{children}</span>,
}));

jest.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children }) => <div>{children}</div>,
  AvatarFallback: ({ children }) => <span>{children}</span>,
  AvatarImage: () => <span />,
}));

jest.mock('@/components/ui/progress', () => ({
  Progress: () => <div />,
}));

jest.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange }) => (
    <input
      type="checkbox"
      aria-label="select employee"
      checked={!!checked}
      onChange={() => onCheckedChange?.(!checked)}
      readOnly={false}
    />
  ),
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children }) => <div>{children}</div>,
  CardContent: ({ children }) => <div>{children}</div>,
  CardHeader: ({ children }) => <div>{children}</div>,
  CardTitle: ({ children }) => <h2>{children}</h2>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
}));

const { useData } = require('@/lib/data-store');

const activity = { id: 'activity-1', title: 'React Training' };
const recommendations = [
  {
    id: 'emp-1',
    name: 'Alice Smith',
    role: 'EMPLOYEE',
    overallScore: 92,
    recommendation_reason: 'Strong match for the activity',
    skillGaps: [{ skillId: 'redux' }, { skillId: 'testing' }],
  },
  {
    id: 'emp-2',
    name: 'Bob Jones',
    role: 'MANAGER',
    overallScore: 76,
    skillGaps: [],
  },
];

describe('RecommendationResults', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useData.mockReturnValue({ skills: [] });
  });

  it('shows loading and error states', () => {
    const { rerender } = render(
      <RecommendationResults
        activity={activity}
        recommendations={[]}
        isLoading
        error={null}
        hasGenerated={false}
        onForwardToManager={jest.fn()}
        isForwarding={false}
        isForwarded={false}
      />,
    );

    expect(screen.getByText(/looking at the team/i)).toBeInTheDocument();

    rerender(
      <RecommendationResults
        activity={activity}
        recommendations={[]}
        isLoading={false}
        error="Failed to load"
        hasGenerated={false}
        onForwardToManager={jest.fn()}
        isForwarding={false}
        isForwarded={false}
      />,
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
  });

  it('shows empty and no-match states', () => {
    const { rerender } = render(
      <RecommendationResults
        activity={null}
        recommendations={[]}
        isLoading={false}
        error={null}
        hasGenerated={false}
        onForwardToManager={jest.fn()}
        isForwarding={false}
        isForwarded={false}
      />,
    );

    expect(screen.getByText(/find the right people/i)).toBeInTheDocument();

    rerender(
      <RecommendationResults
        activity={activity}
        recommendations={[]}
        isLoading={false}
        error={null}
        hasGenerated
        onForwardToManager={jest.fn()}
        isForwarding={false}
        isForwarded={false}
      />,
    );

    expect(screen.getByText(/no matches found/i)).toBeInTheDocument();
  });

  it('renders recommendation cards and toggles selection', async () => {
    const user = userEvent.setup();

    render(
      <RecommendationResults
        activity={activity}
        recommendations={recommendations}
        isLoading={false}
        error={null}
        hasGenerated
        onForwardToManager={jest.fn()}
        isForwarding={false}
        isForwarded={false}
      />,
    );

    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('Strong match for the activity')).toBeInTheDocument();
    expect(screen.getByText('92% Score')).toBeInTheDocument();

    await user.click(screen.getAllByRole('checkbox')[0]);

    expect(screen.getByText('1 SELECTED')).toBeInTheDocument();
  });

  it('clears selected employees when activity changes', async () => {
    const user = userEvent.setup();

    const { rerender } = render(
      <RecommendationResults
        activity={activity}
        recommendations={recommendations}
        isLoading={false}
        error={null}
        hasGenerated
        onForwardToManager={jest.fn()}
        isForwarding={false}
        isForwarded={false}
      />,
    );

    await user.click(screen.getAllByRole('checkbox')[0]);
    expect(screen.getByText('1 SELECTED')).toBeInTheDocument();

    rerender(
      <RecommendationResults
        activity={{ id: 'activity-2', title: 'Advanced React' }}
        recommendations={recommendations}
        isLoading={false}
        error={null}
        hasGenerated
        onForwardToManager={jest.fn()}
        isForwarding={false}
        isForwarded={false}
      />,
    );

    await waitFor(() => {
      expect(screen.queryByText('1 SELECTED')).not.toBeInTheDocument();
    });
  });
});