import {
  cn,
  getSkillTypeLabel,
  getActivityTypeLabel,
  getStatusColor,
  getSkillLevelColor,
  getInitials,
} from '../utils';

describe('Utility Functions', () => {
  describe('cn - Tailwind class merging', () => {
    it('should merge Tailwind classes correctly', () => {
      const result = cn('px-2 py-1', 'px-3');
      expect(result).toContain('px-3');
      expect(result).toContain('py-1');
    });

    it('should handle conditional classes', () => {
      const result = cn('px-2', false && 'py-1', true && 'py-3');
      expect(result).toContain('px-2');
      expect(result).toContain('py-3');
      expect(result).not.toContain('py-1');
    });

    it('should filter out falsy values', () => {
      const result = cn('px-2', null, undefined, '', 'py-1');
      expect(result).toBe('px-2 py-1');
    });

    it('should handle arrays', () => {
      const result = cn(['px-2', 'py-1'], 'text-white');
      expect(result).toContain('px-2');
      expect(result).toContain('py-1');
      expect(result).toContain('text-white');
    });
  });

  describe('getSkillTypeLabel', () => {
    it('should return "Knowledge" for "knowledge" type', () => {
      expect(getSkillTypeLabel('knowledge')).toBe('Knowledge');
    });

    it('should return "Know-how" for "knowHow" type', () => {
      expect(getSkillTypeLabel('knowHow')).toBe('Know-how');
    });

    it('should return "Soft Skill" for "softSkill" type', () => {
      expect(getSkillTypeLabel('softSkill')).toBe('Soft Skill');
    });

    it('should return the type as-is for unknown types', () => {
      expect(getSkillTypeLabel('unknown')).toBe('unknown');
    });

    it('should handle null/undefined gracefully', () => {
      expect(getSkillTypeLabel(null)).toBe(null);
      expect(getSkillTypeLabel(undefined)).toBe(undefined);
    });
  });

  describe('getActivityTypeLabel', () => {
    it('should return "Training" for "training" type', () => {
      expect(getActivityTypeLabel('training')).toBe('Training');
    });

    it('should return "Workshop" for "workshop" type', () => {
      expect(getActivityTypeLabel('workshop')).toBe('Workshop');
    });

    it('should return "Mentoring" for "mentoring" type', () => {
      expect(getActivityTypeLabel('mentoring')).toBe('Mentoring');
    });

    it('should return "Webinar" for "webinar" type', () => {
      expect(getActivityTypeLabel('webinar')).toBe('Webinar');
    });

    it('should return the type as-is for unknown types', () => {
      expect(getActivityTypeLabel('conference')).toBe('conference');
    });
  });

  describe('getStatusColor', () => {
    it('should return amber color for "upcoming" status', () => {
      expect(getStatusColor('upcoming')).toBe('bg-amber-500/10 text-amber-500');
    });

    it('should return emerald color for "ongoing" status', () => {
      expect(getStatusColor('ongoing')).toBe('bg-emerald-500/10 text-emerald-500');
    });

    it('should return gray color for "completed" status', () => {
      expect(getStatusColor('completed')).toBe('bg-gray-100 text-gray-500');
    });

    it('should return default gray color for unknown status', () => {
      expect(getStatusColor('unknown')).toBe('bg-gray-100 text-gray-500');
    });
  });

  describe('getSkillLevelColor', () => {
    it('should return blue color for "beginner" level', () => {
      expect(getSkillLevelColor('beginner')).toBe('bg-blue-100 text-blue-700');
    });

    it('should return green color for "intermediate" level', () => {
      expect(getSkillLevelColor('intermediate')).toBe('bg-green-100 text-green-700');
    });

    it('should return orange color for "advanced" level', () => {
      expect(getSkillLevelColor('advanced')).toBe('bg-orange-100 text-orange-700');
    });

    it('should return purple color for "expert" level', () => {
      expect(getSkillLevelColor('expert')).toBe('bg-purple-100 text-purple-700');
    });

    it('should return default gray color for unknown level', () => {
      expect(getSkillLevelColor('unknown')).toBe('bg-gray-100 text-gray-700');
    });
  });

  describe('getInitials', () => {
    it('should return initials for two-word name', () => {
      expect(getInitials('John Doe')).toBe('JD');
    });

    it('should return initials for three-word name', () => {
      expect(getInitials('John Michael Doe')).toBe('JM');
    });

    it('should return first two letters for single-word name', () => {
      expect(getInitials('John')).toBe('JO');
    });

    it('should return "U" for empty name', () => {
      expect(getInitials('')).toBe('U');
    });

    it('should return "U" for null/undefined name', () => {
      expect(getInitials(null)).toBe('U');
      expect(getInitials(undefined)).toBe('U');
    });

    it('should handle names with extra spaces', () => {
      expect(getInitials('John  Doe')).toBe('JD');
    });

    it('should handle single letter names', () => {
      expect(getInitials('A')).toBe('A');
    });

    it('should convert to uppercase', () => {
      expect(getInitials('john doe')).toBe('JD');
    });
  });
});
