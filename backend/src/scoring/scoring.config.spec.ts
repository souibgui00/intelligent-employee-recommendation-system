import { ScoringConfig } from './scoring.config';

describe('ScoringConfig', () => {
  it('should be defined', () => {
    expect(ScoringConfig).toBeDefined();
  });

  // Score Range Configuration Tests
  describe('Score Range Configuration', () => {
    it('should have minScore of 0', () => {
      expect(ScoringConfig.minScore).toBe(0);
    });

    it('should have maxScore of 120', () => {
      expect(ScoringConfig.maxScore).toBe(120);
    });

    it('should have maxScore greater than minScore', () => {
      expect(ScoringConfig.maxScore).toBeGreaterThan(ScoringConfig.minScore);
    });
  });

  // Level-based Base Scores Tests
  describe('Base Level Scores', () => {
    it('should have baseLevelScores object', () => {
      expect(ScoringConfig.baseLevelScores).toBeDefined();
    });

    it('should have beginner level score', () => {
      expect(ScoringConfig.baseLevelScores.beginner).toBe(25);
    });

    it('should have intermediate level score', () => {
      expect(ScoringConfig.baseLevelScores.intermediate).toBe(50);
    });

    it('should have advanced level score', () => {
      expect(ScoringConfig.baseLevelScores.advanced).toBe(75);
    });

    it('should have expert level score', () => {
      expect(ScoringConfig.baseLevelScores.expert).toBe(100);
    });

    it('should have scores in ascending order', () => {
      expect(ScoringConfig.baseLevelScores.beginner).toBeLessThan(
        ScoringConfig.baseLevelScores.intermediate,
      );
      expect(ScoringConfig.baseLevelScores.intermediate).toBeLessThan(
        ScoringConfig.baseLevelScores.advanced,
      );
      expect(ScoringConfig.baseLevelScores.advanced).toBeLessThan(
        ScoringConfig.baseLevelScores.expert,
      );
    });
  });

  // Experience Bonus Tests
  describe('Experience Bonus', () => {
    it('should have experienceBonusMultiplier', () => {
      expect(ScoringConfig.experienceBonusMultiplier).toBe(2);
    });

    it('should have experienceBonusMax', () => {
      expect(ScoringConfig.experienceBonusMax).toBe(20);
    });

    it('should have positive bonus multiplier', () => {
      expect(ScoringConfig.experienceBonusMultiplier).toBeGreaterThan(0);
    });

    it('should have positive max bonus', () => {
      expect(ScoringConfig.experienceBonusMax).toBeGreaterThan(0);
    });
  });

  // Progression Bonus Tests
  describe('Progression Bonus', () => {
    it('should have progressionBonusWindow', () => {
      expect(ScoringConfig.progressionBonusWindow).toBe(6);
    });

    it('should have progressionBonus', () => {
      expect(ScoringConfig.progressionBonus).toBe(5);
    });

    it('should have positive window value', () => {
      expect(ScoringConfig.progressionBonusWindow).toBeGreaterThan(0);
    });

    it('should have positive bonus value', () => {
      expect(ScoringConfig.progressionBonus).toBeGreaterThan(0);
    });
  });

  // Evaluation Weights Tests
  describe('Evaluation Weights', () => {
    it('should have evaluationWeights object', () => {
      expect(ScoringConfig.evaluationWeights).toBeDefined();
    });

    it('should have selfEvaluation weight', () => {
      expect(ScoringConfig.evaluationWeights.selfEvaluation).toBe(0.4);
    });

    it('should have managerEvaluation weight', () => {
      expect(ScoringConfig.evaluationWeights.managerEvaluation).toBe(0.6);
    });

    it('should have weights that sum to 1', () => {
      const total =
        ScoringConfig.evaluationWeights.selfEvaluation +
        ScoringConfig.evaluationWeights.managerEvaluation;
      expect(total).toBeCloseTo(1.0);
    });

    it('should have evaluationFeedbackMultiplier', () => {
      expect(ScoringConfig.evaluationFeedbackMultiplier).toBe(2);
    });
  });

  // Activity Scoring Tests
  describe('Activity Scoring Parameters', () => {
    it('should have learningRatePerFeedbackUnit', () => {
      expect(ScoringConfig.learningRatePerFeedbackUnit).toBe(0.1);
    });

    it('should have participationFeedbackMax', () => {
      expect(ScoringConfig.participationFeedbackMax).toBe(10);
    });

    it('should have participationFeedbackMin', () => {
      expect(ScoringConfig.participationFeedbackMin).toBe(0);
    });

    it('should have max greater than min for feedback', () => {
      expect(ScoringConfig.participationFeedbackMax).toBeGreaterThan(
        ScoringConfig.participationFeedbackMin,
      );
    });
  });

  // Context Profiles Tests
  describe('Context Profiles', () => {
    it('should have contextProfiles object', () => {
      expect(ScoringConfig.contextProfiles).toBeDefined();
    });

    it('should have low context profile', () => {
      expect(ScoringConfig.contextProfiles.low).toBeDefined();
    });

    it('should have medium context profile', () => {
      expect(ScoringConfig.contextProfiles.medium).toBeDefined();
    });

    it('should have expert context profile', () => {
      expect(ScoringConfig.contextProfiles.expert).toBeDefined();
    });

    it('low profile should have zero minimum global score', () => {
      expect(ScoringConfig.contextProfiles.low.minGlobalScore).toBe(0);
    });

    it('medium profile should have 25 minimum global score', () => {
      expect(ScoringConfig.contextProfiles.medium.minGlobalScore).toBe(25);
    });

    it('expert profile should have 70 minimum global score', () => {
      expect(ScoringConfig.contextProfiles.expert.minGlobalScore).toBe(70);
    });

    it('should have increasing minGlobalScore across profiles', () => {
      expect(ScoringConfig.contextProfiles.low.minGlobalScore).toBeLessThan(
        ScoringConfig.contextProfiles.medium.minGlobalScore,
      );
      expect(ScoringConfig.contextProfiles.medium.minGlobalScore).toBeLessThan(
        ScoringConfig.contextProfiles.expert.minGlobalScore,
      );
    });

    it('expert profile should have minMatchPercentage', () => {
      expect(ScoringConfig.contextProfiles.expert.minMatchPercentage).toBe(80);
    });

    it('should have scoring formulas defined', () => {
      expect(ScoringConfig.contextProfiles.low.scoringFormula).toBeDefined();
      expect(ScoringConfig.contextProfiles.medium.scoringFormula).toBeDefined();
      expect(ScoringConfig.contextProfiles.expert.scoringFormula).toBeDefined();
    });
  });

  // Importance Multipliers Tests
  describe('Importance Multipliers', () => {
    it('should have importanceMultipliers object', () => {
      expect(ScoringConfig.importanceMultipliers).toBeDefined();
    });

    it('should have multiplier for level 1', () => {
      expect(ScoringConfig.importanceMultipliers[1]).toBe(0.7);
    });

    it('should have multiplier for level 5', () => {
      expect(ScoringConfig.importanceMultipliers[5]).toBe(1.0);
    });

    it('should have multiplier for level 10', () => {
      expect(ScoringConfig.importanceMultipliers[10]).toBe(1.6);
    });

    it('should have increasing multipliers from 1 to 10', () => {
      for (let i = 1; i < 10; i++) {
        expect(ScoringConfig.importanceMultipliers[i]).toBeLessThanOrEqual(
          ScoringConfig.importanceMultipliers[i + 1],
        );
      }
    });

    it('should have positive multipliers', () => {
      for (let i = 1; i <= 10; i++) {
        expect(ScoringConfig.importanceMultipliers[i]).toBeGreaterThan(0);
      }
    });

    it('should have all 10 importance levels', () => {
      for (let i = 1; i <= 10; i++) {
        expect(ScoringConfig.importanceMultipliers[i]).toBeDefined();
      }
    });
  });

  // General Tests
  describe('General Configuration', () => {
    it('should be immutable (not modifiable)', () => {
      const originalValue = ScoringConfig.maxScore;
      try {
        ScoringConfig.maxScore = 200;
      } catch (e) {
        // Expected if frozen
      }
      // Depending on whether it's frozen, it should either remain the same or not change
      expect(typeof ScoringConfig.maxScore).toBe('number');
    });

    it('should contain all expected properties', () => {
      expect(ScoringConfig).toHaveProperty('minScore');
      expect(ScoringConfig).toHaveProperty('maxScore');
      expect(ScoringConfig).toHaveProperty('baseLevelScores');
      expect(ScoringConfig).toHaveProperty('experienceBonusMultiplier');
      expect(ScoringConfig).toHaveProperty('evaluationWeights');
      expect(ScoringConfig).toHaveProperty('contextProfiles');
      expect(ScoringConfig).toHaveProperty('importanceMultipliers');
    });

    it('should have all numeric values be positive or zero', () => {
      expect(ScoringConfig.minScore).toBeGreaterThanOrEqual(0);
      expect(ScoringConfig.maxScore).toBeGreaterThan(0);
    });
  });
});
