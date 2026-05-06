import {
  employeeSchema,
  activitySchema,
  sessionSchema,
  skillSchema,
  enhancedSkillSchema,
  managerActivityEnrollmentSchema,
  managerAssignmentConfirmationSchema,
  managerSkillAssessmentSchema,
  managerPerformanceReviewSchema,
} from '../schemas';

describe('Zod Validation Schemas', () => {
  describe('employeeSchema', () => {
    it('should validate a valid employee object', () => {
      const validEmployee = {
        name: 'John Doe',
        email: 'john@example.com',
        telephone: '123-456-7890',
        department_id: '123',
        role: 'employee',
        position: 'Developer',
        yearsOfExperience: 5,
      };

      const result = employeeSchema.safeParse(validEmployee);
      expect(result.success).toBe(true);
    });

    it('should reject employee with invalid name (too short)', () => {
      const invalidEmployee = {
        name: 'J',
        email: 'john@example.com',
        department_id: '123',
        role: 'employee',
      };

      const result = employeeSchema.safeParse(invalidEmployee);
      expect(result.success).toBe(false);
    });

    it('should reject employee with invalid email', () => {
      const invalidEmployee = {
        name: 'John Doe',
        email: 'invalid-email',
        department_id: '123',
        role: 'employee',
      };

      const result = employeeSchema.safeParse(invalidEmployee);
      expect(result.success).toBe(false);
    });

    it('should reject employee without department_id', () => {
      const invalidEmployee = {
        name: 'John Doe',
        email: 'john@example.com',
        role: 'employee',
      };

      const result = employeeSchema.safeParse(invalidEmployee);
      expect(result.success).toBe(false);
    });

    it('should reject invalid role', () => {
      const invalidEmployee = {
        name: 'John Doe',
        email: 'john@example.com',
        department_id: '123',
        role: 'invalid_role',
      };

      const result = employeeSchema.safeParse(invalidEmployee);
      expect(result.success).toBe(false);
    });

    it('should set default status to "active"', () => {
      const employee = {
        name: 'John Doe',
        email: 'john@example.com',
        department_id: '123',
        role: 'employee',
      };

      const result = employeeSchema.safeParse(employee);
      expect(result.data.status).toBe('active');
    });
  });

  describe('activitySchema', () => {
    it('should validate a valid activity object', () => {
      const validActivity = {
        title: 'React Training',
        description: 'Learn React fundamentals and best practices',
        type: 'training',
        date: '2026-05-15',
        duration: '4 hours',
        capacity: 30,
        status: 'open',
        skillsCovered: ['React', 'JavaScript'],
        level: 'beginner',
      };

      const result = activitySchema.safeParse(validActivity);
      expect(result.success).toBe(true);
    });

    it('should reject activity with title too short', () => {
      const invalidActivity = {
        title: 'A',
        description: 'Learn React fundamentals and best practices',
        type: 'training',
        date: '2026-05-15',
        duration: '4 hours',
      };

      const result = activitySchema.safeParse(invalidActivity);
      expect(result.success).toBe(false);
    });

    it('should reject activity with description too short', () => {
      const invalidActivity = {
        title: 'React Training',
        description: 'Short',
        type: 'training',
        date: '2026-05-15',
        duration: '4 hours',
      };

      const result = activitySchema.safeParse(invalidActivity);
      expect(result.success).toBe(false);
    });

    it('should reject invalid activity type', () => {
      const invalidActivity = {
        title: 'React Training',
        description: 'Learn React fundamentals and best practices',
        type: 'invalid_type',
        date: '2026-05-15',
        duration: '4 hours',
      };

      const result = activitySchema.safeParse(invalidActivity);
      expect(result.success).toBe(false);
    });

    it('should reject capacity less than 1', () => {
      const invalidActivity = {
        title: 'React Training',
        description: 'Learn React fundamentals and best practices',
        type: 'training',
        date: '2026-05-15',
        duration: '4 hours',
        capacity: 0,
      };

      const result = activitySchema.safeParse(invalidActivity);
      expect(result.success).toBe(false);
    });

    it('should set default intent to "development"', () => {
      const activity = {
        title: 'React Training',
        description: 'Learn React fundamentals and best practices',
        type: 'training',
        date: '2026-05-15',
        duration: '4 hours',
      };

      const result = activitySchema.safeParse(activity);
      expect(result.data.intent).toBe('development');
    });
  });

  describe('skillSchema', () => {
    it('should validate a valid skill object', () => {
      const validSkill = {
        name: 'React',
        category: 'Frontend',
        type: 'technique',
        description: 'JavaScript library for building UIs',
      };

      const result = skillSchema.safeParse(validSkill);
      expect(result.success).toBe(true);
    });

    it('should reject skill with name too short', () => {
      const invalidSkill = {
        name: 'J',
        type: 'technique',
      };

      const result = skillSchema.safeParse(invalidSkill);
      expect(result.success).toBe(false);
    });

    it('should reject invalid skill type', () => {
      const invalidSkill = {
        name: 'React',
        type: 'invalid_type',
      };

      const result = skillSchema.safeParse(invalidSkill);
      expect(result.success).toBe(false);
    });

    it('should validate auto_eval range (0-5)', () => {
      const skill = {
        name: 'React',
        type: 'technique',
        auto_eval: 4,
      };

      const result = skillSchema.safeParse(skill);
      expect(result.success).toBe(true);
    });

    it('should reject auto_eval outside range', () => {
      const invalidSkill = {
        name: 'React',
        type: 'technique',
        auto_eval: 10,
      };

      const result = skillSchema.safeParse(invalidSkill);
      expect(result.success).toBe(false);
    });

    it('should set default etat to "draft"', () => {
      const skill = {
        name: 'React',
        type: 'technique',
      };

      const result = skillSchema.safeParse(skill);
      expect(result.data.etat).toBe('draft');
    });
  });

  describe('sessionSchema', () => {
    it('should validate a valid session object', () => {
      const validSession = {
        activityId: 'activity-123',
        date: '2026-05-15',
        location: 'Room 101',
        maxParticipants: 20,
      };

      const result = sessionSchema.safeParse(validSession);
      expect(result.success).toBe(true);
    });

    it('should reject session without activityId', () => {
      const invalidSession = {
        date: '2026-05-15',
        location: 'Room 101',
        maxParticipants: 20,
      };

      const result = sessionSchema.safeParse(invalidSession);
      expect(result.success).toBe(false);
    });

    it('should reject session with maxParticipants < 1', () => {
      const invalidSession = {
        activityId: 'activity-123',
        date: '2026-05-15',
        location: 'Room 101',
        maxParticipants: 0,
      };

      const result = sessionSchema.safeParse(invalidSession);
      expect(result.success).toBe(false);
    });
  });

  describe('managerActivityEnrollmentSchema', () => {
    it('should validate a valid enrollment', () => {
      const validEnrollment = {
        activityId: 'activity-123',
        selectedEmployees: ['emp-1', 'emp-2'],
        enrollmentNotes: 'Mandatory training',
        priorityLevel: 'high',
      };

      const result = managerActivityEnrollmentSchema.safeParse(validEnrollment);
      expect(result.success).toBe(true);
    });

    it('should reject enrollment without selectedEmployees', () => {
      const invalidEnrollment = {
        activityId: 'activity-123',
        selectedEmployees: [],
      };

      const result = managerActivityEnrollmentSchema.safeParse(invalidEnrollment);
      expect(result.success).toBe(false);
    });
  });

  describe('managerSkillAssessmentSchema', () => {
    it('should validate a valid assessment', () => {
      const validAssessment = {
        skillCategory: 'Technical Skills',
        assessmentType: 'team',
        targetProficiency: 'intermediate',
        assessmentScope: 'Evaluate current technical capabilities and identify gaps',
        evaluationCriteria: ['Problem solving', 'Code quality', 'Documentation'],
      };

      const result = managerSkillAssessmentSchema.safeParse(validAssessment);
      expect(result.success).toBe(true);
    });

    it('should reject assessment with short scope', () => {
      const invalidAssessment = {
        skillCategory: 'Technical Skills',
        assessmentType: 'team',
        targetProficiency: 'intermediate',
        assessmentScope: 'short',
        evaluationCriteria: ['Problem solving'],
      };

      const result = managerSkillAssessmentSchema.safeParse(invalidAssessment);
      expect(result.success).toBe(false);
    });

    it('should reject assessment without criteria', () => {
      const invalidAssessment = {
        skillCategory: 'Technical Skills',
        assessmentType: 'team',
        targetProficiency: 'intermediate',
        assessmentScope: 'Evaluate current technical capabilities and identify gaps',
        evaluationCriteria: [],
      };

      const result = managerSkillAssessmentSchema.safeParse(invalidAssessment);
      expect(result.success).toBe(false);
    });
  });

  describe('managerPerformanceReviewSchema', () => {
    it('should validate a valid performance review', () => {
      const validReview = {
        reviewPeriod: 'Q2 2026',
        reviewType: 'quarterly',
        evaluationMetrics: ['Productivity', 'Quality', 'Collaboration'],
        performanceThresholds: {
          exceptional: 85,
          satisfactory: 70,
          improvement: 50,
        },
      };

      const result = managerPerformanceReviewSchema.safeParse(validReview);
      expect(result.success).toBe(true);
    });

    it('should reject with invalid exceptional threshold', () => {
      const invalidReview = {
        reviewPeriod: 'Q2 2026',
        reviewType: 'quarterly',
        evaluationMetrics: ['Productivity'],
        performanceThresholds: {
          exceptional: 75, // Too low
          satisfactory: 70,
          improvement: 50,
        },
      };

      const result = managerPerformanceReviewSchema.safeParse(invalidReview);
      expect(result.success).toBe(false);
    });

    it('should reject with invalid satisfactory threshold', () => {
      const invalidReview = {
        reviewPeriod: 'Q2 2026',
        reviewType: 'quarterly',
        evaluationMetrics: ['Productivity'],
        performanceThresholds: {
          exceptional: 85,
          satisfactory: 55, // Too low
          improvement: 50,
        },
      };

      const result = managerPerformanceReviewSchema.safeParse(invalidReview);
      expect(result.success).toBe(false);
    });
  });

  describe('enhancedSkillSchema', () => {
    it('should be identical to skillSchema', () => {
      expect(enhancedSkillSchema).toEqual(skillSchema);
    });
  });
});
