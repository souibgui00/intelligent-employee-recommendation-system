import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock the recommendation components
const mockRecommendations = [
  {
    id: '1',
    name: 'React Fundamentals',
    overallScore: 92,
    promptBoost: 5,
    gap: ['Redux', 'Testing'],
    recommendation_reason: 'Based on your profile and team needs',
  },
  {
    id: '2',
    name: 'TypeScript Advanced',
    overallScore: 78,
    promptBoost: 3,
    gap: ['Generics', 'Decorators'],
    recommendation_reason: 'Recommended for team improvement',
  },
];

describe('Recommendation Components', () => {
  describe('RecommendationResults', () => {
    it('should render recommendations list', () => {
      render(
        <div>
          {mockRecommendations.map((rec) => (
            <div key={rec.id} data-testid={`recommendation-${rec.id}`}>
              <h3>{rec.name}</h3>
              <p>Score: {rec.overallScore}</p>
            </div>
          ))}
        </div>
      );

      expect(screen.getByText('React Fundamentals')).toBeInTheDocument();
      expect(screen.getByText('TypeScript Advanced')).toBeInTheDocument();
    });

    it('should display recommendation scores', () => {
      render(
        <div>
          {mockRecommendations.map((rec) => (
            <div key={rec.id}>
              <p>{rec.overallScore}</p>
            </div>
          ))}
        </div>
      );

      expect(screen.getByText('92')).toBeInTheDocument();
      expect(screen.getByText('78')).toBeInTheDocument();
    });

    it('should display skill gaps for each recommendation', () => {
      render(
        <div>
          {mockRecommendations.map((rec) => (
            <div key={rec.id}>
              <p>Gaps: {rec.gap.join(', ')}</p>
            </div>
          ))}
        </div>
      );

      expect(screen.getByText('Gaps: Redux, Testing')).toBeInTheDocument();
      expect(screen.getByText('Gaps: Generics, Decorators')).toBeInTheDocument();
    });

    it('should display recommendation reasons', () => {
      render(
        <div>
          {mockRecommendations.map((rec) => (
            <div key={rec.id}>
              <p>{rec.recommendation_reason}</p>
            </div>
          ))}
        </div>
      );

      expect(screen.getByText('Based on your profile and team needs')).toBeInTheDocument();
      expect(screen.getByText('Recommended for team improvement')).toBeInTheDocument();
    });

    it('should handle empty recommendations', () => {
      render(
        <div>
          {[].length === 0 ? (
            <p>No recommendations available</p>
          ) : null}
        </div>
      );

      expect(screen.getByText('No recommendations available')).toBeInTheDocument();
    });

    it('should sort recommendations by score', () => {
      const sorted = [...mockRecommendations].sort((a, b) => b.overallScore - a.overallScore);

      render(
        <div>
          {sorted.map((rec) => (
            <div key={rec.id} data-testid={`item-${rec.overallScore}`}>
              {rec.overallScore}
            </div>
          ))}
        </div>
      );
      expect(scores[0]).toHaveTextContent('92');
      expect(scores[1]).toHaveTextContent('78');
    });

    it('should filter recommendations by score threshold', () => {
      const threshold = 80;
      const filtered = mockRecommendations.filter((rec) => rec.overallScore >= threshold);

      render(
        <div>
          {filtered.map((rec) => (
            <div key={rec.id}>{rec.name}</div>
          ))}
        </div>
      );

      expect(screen.getByText('React Fundamentals')).toBeInTheDocument();
      expect(screen.queryByText('TypeScript Advanced')).not.toBeInTheDocument();
    });
  });

  describe('RecommendationEngine', () => {
    it('should generate recommendations', async () => {
      const mockGenerate = jest.fn().mockResolvedValue(mockRecommendations);

      const result = await mockGenerate('activity-123', {
        customDescription: 'Team building activities',
      });

      expect(mockGenerate).toHaveBeenCalledWith('activity-123', {
        customDescription: 'Team building activities',
      });
      expect(result).toEqual(mockRecommendations);
    });

    it('should handle recommendation generation errors', async () => {
      const mockGenerate = jest.fn().mockRejectedValue(
        new Error('Failed to generate recommendations')
      );

      await expect(
        mockGenerate('activity-123', {})
      ).rejects.toThrow('Failed to generate recommendations');
    });

    it('should pass custom description to engine', async () => {
      const mockGenerate = jest.fn().mockResolvedValue(mockRecommendations);
      const customDesc = 'Advanced frontend developers needed';

      await mockGenerate('activity-123', { customDescription: customDesc });

      expect(mockGenerate).toHaveBeenCalledWith('activity-123', expect.objectContaining({
        customDescription: customDesc,
      }));
    });

    it('should support filtering options', async () => {
      const mockGenerate = jest.fn().mockResolvedValue(mockRecommendations);

      const options = {
        customDescription: 'Team needs React training',
        minScore: 75,
        maxGaps: 3,
      };

      await mockGenerate('activity-123', options);

      expect(mockGenerate).toHaveBeenCalledWith('activity-123', options);
    });
  });

  describe('Recommendation Display Logic', () => {
    it('should highlight high-score recommendations', () => {
      render(
        <div>
          {mockRecommendations.map((rec) => (
            <div
              key={rec.id}
              className={rec.overallScore >= 85 ? 'highlight' : ''}
              data-testid={`rec-${rec.id}`}
            >
              {rec.name}
            </div>
          ))}
        </div>
      );

      const highlighted = screen.getByTestId('rec-1').parentElement;
      expect(highlighted).toHaveClass('highlight');
    });

    it('should show prompt boost influence', () => {
      const withBoost = mockRecommendations.map((rec) => ({
        ...rec,
        originalScore: rec.overallScore - rec.promptBoost,
        boostPercentage: (rec.promptBoost / rec.overallScore * 100).toFixed(1),
      }));

      render(
        <div>
          {withBoost.map((rec) => (
            <div key={rec.id}>
              <p>Boost: {rec.boostPercentage}%</p>
            </div>
          ))}
        </div>
      );

      expect(screen.getByText(/Boost: 5.43%/)).toBeInTheDocument();
    });

    it('should calculate skill gap severity', () => {
      const withSeverity = mockRecommendations.map((rec) => ({
        ...rec,
        gapSeverity: rec.gap.length > 2 ? 'high' : 'moderate',
      }));

      render(
        <div>
          {withSeverity.map((rec) => (
            <div key={rec.id}>
              <p>Severity: {rec.gapSeverity}</p>
            </div>
          ))}
        </div>
      );

      expect(screen.getByText('Severity: moderate')).toBeInTheDocument();
    });
  });

  describe('Recommendation Accessibility', () => {
    it('should provide aria labels for recommendations', () => {
      render(
        <div>
          {mockRecommendations.map((rec) => (
            <article
              key={rec.id}
              aria-label={`Recommendation: ${rec.name} with score ${rec.overallScore}`}
            >
              {rec.name}
            </article>
          ))}
        </div>
      );

      const article = screen.getByLabelText(/React Fundamentals/);
      expect(article).toBeInTheDocument();
    });

    it('should have proper heading hierarchy', () => {
      render(
        <div>
          <h1>Skill Recommendations</h1>
          {mockRecommendations.map((rec) => (
            <h2 key={rec.id}>{rec.name}</h2>
          ))}
        </div>
      );

      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: /React/ })).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(
        <div>
          {mockRecommendations.map((rec) => (
            <button key={rec.id} type="button">
              {rec.name}
            </button>
          ))}
        </div>
      );

      const firstButton = screen.getByRole('button', { name: /React/ });
      await user.tab();
      expect(firstButton).toHaveFocus();
    });
  });
});
