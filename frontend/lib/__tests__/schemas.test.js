import {
  employeeSchema,
  activitySchema,
  sessionSchema,
  skillSchema,
  enhancedSkillSchema,
  managerActivityEnrollmentSchema,
  managerSkillAssessmentSchema,
  managerPerformanceReviewSchema,
} from '../schemas';

describe('Zod Validation Schemas', () => {
  const expectValid = (schema, data) => {
    const result = schema.safeParse(data);
    expect(result.success).toBe(true);
    return result;
  };

  const expectInvalid = (schema, data) => {
    const result = schema.safeParse(data);
    expect(result.success).toBe(false);
    return result;
  };

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

      expectValid(employeeSchema, validEmployee);
    });

    it.each([
      ['invalid name (too short)', { name: 'J', email: 'john@example.com', department_id: '123', role: 'employee' }],
      ['invalid email', { name: 'John Doe', email: 'invalid-email', department_id: '123', role: 'employee' }],
      ['missing department_id', { name: 'John Doe', email: 'john@example.com', role: 'employee' }],
      ['invalid role', { name: 'John Doe', email: 'john@example.com', department_id: '123', role: 'invalid_role' }],
    ])('should reject employee with %s', (_, invalidEmployee) => {
      expectInvalid(employeeSchema, invalidEmployee);
    });

    it('should set default status to "active"', () => {
      const employee = {
        name: 'John Doe',
        email: 'john@example.com',
        department_id: '123',
        role: 'employee',
      };

      const result = expectValid(employeeSchema, employee);
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

      expectValid(activitySchema, validActivity);
    });

    it.each([
      ['title too short', { title: 'A', description: 'Learn React fundamentals and best practices', type: 'training', date: '2026-05-15', duration: '4 hours' }],
      ['description too short', { title: 'React Training', description: 'Short', type: 'training', date: '2026-05-15', duration: '4 hours' }],
      ['invalid activity type', { title: 'React Training', description: 'Learn React fundamentals and best practices', type: 'invalid_type', date: '2026-05-15', duration: '4 hours' }],
      ['capacity less than 1', { title: 'React Training', description: 'Learn React fundamentals and best practices', type: 'training', date: '2026-05-15', duration: '4 hours', capacity: 0 }],
    ])('should reject activity with %s', (_, invalidActivity) => {
      expectInvalid(activitySchema, invalidActivity);
    });

    it('should set default intent to "development"', () => {
      const activity = {
        title: 'React Training',
        description: 'Learn React fundamentals and best practices',
        type: 'training',
        date: '2026-05-15',
        duration: '4 hours',
      };

      const result = expectValid(activitySchema, activity);
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

      expectValid(skillSchema, validSkill);
    });

    it.each([
      ['name too short', { name: 'J', type: 'technique' }],
      ['invalid skill type', { name: 'React', type: 'invalid_type' }],
    ])('should reject skill with %s', (_, invalidSkill) => {
      expectInvalid(skillSchema, invalidSkill);
    });

    it('should validate auto_eval range (0-5)', () => {
      const skill = {
        name: 'React',
        type: 'technique',
        auto_eval: 4,
      };

      expectValid(skillSchema, skill);
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

      const result = expectValid(skillSchema, skill);
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

      expectValid(sessionSchema, validSession);
    });

    it.each([
      ['missing activityId', { date: '2026-05-15', location: 'Room 101', maxParticipants: 20 }],
      ['maxParticipants < 1', { activityId: 'activity-123', date: '2026-05-15', location: 'Room 101', maxParticipants: 0 }],
    ])('should reject session with %s', (_, invalidSession) => {
      expectInvalid(sessionSchema, invalidSession);
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

      expectValid(managerActivityEnrollmentSchema, validEnrollment);
    });

    it('should reject enrollment without selectedEmployees', () => {
      const invalidEnrollment = {
        activityId: 'activity-123',
        selectedEmployees: [],
      };

      expectInvalid(managerActivityEnrollmentSchema, invalidEnrollment);
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

      expectValid(managerSkillAssessmentSchema, validAssessment);
    });

    it.each([
      ['short scope', { skillCategory: 'Technical Skills', assessmentType: 'team', targetProficiency: 'intermediate', assessmentScope: 'short', evaluationCriteria: ['Problem solving'] }],
      ['missing criteria', { skillCategory: 'Technical Skills', assessmentType: 'team', targetProficiency: 'intermediate', assessmentScope: 'Evaluate current technical capabilities and identify gaps', evaluationCriteria: [] }],
    ])('should reject assessment with %s', (_, invalidAssessment) => {
      expectInvalid(managerSkillAssessmentSchema, invalidAssessment);
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

      expectValid(managerPerformanceReviewSchema, validReview);
    });

    it.each([
      ['invalid exceptional threshold', { reviewPeriod: 'Q2 2026', reviewType: 'quarterly', evaluationMetrics: ['Productivity'], performanceThresholds: { exceptional: 75, satisfactory: 70, improvement: 50 } }],
      ['invalid satisfactory threshold', { reviewPeriod: 'Q2 2026', reviewType: 'quarterly', evaluationMetrics: ['Productivity'], performanceThresholds: { exceptional: 85, satisfactory: 55, improvement: 50 } }],
    ])('should reject review with %s', (_, invalidReview) => {
      expectInvalid(managerPerformanceReviewSchema, invalidReview);
    });
  });

  describe('enhancedSkillSchema', () => {
    it('should be identical to skillSchema', () => {
      expect(enhancedSkillSchema).toEqual(skillSchema);
    });
  });
});
