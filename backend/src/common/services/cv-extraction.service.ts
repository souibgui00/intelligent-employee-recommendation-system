import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as mammoth from 'mammoth';
import nlp from 'compromise';
import { SkillsService } from '../../skills/skills.service';

// PDF parsing handled dynamically in extractTextBuffer method

@Injectable()
export class CvExtractionService {
  private readonly logger = new Logger(CvExtractionService.name);

  constructor(private readonly skillsService: SkillsService) {}

  async extractTextBuffer(buffer: Buffer, mimetype: string): Promise<string> {
    try {
      if (mimetype.includes('pdf')) {
        this.logger.log('Processing PDF file...');

        // Try pdfreader approach (simpler and more reliable)
        try {
          const { PdfReader } = require('pdfreader');

          return new Promise((resolve, reject) => {
            const pdfReader = new PdfReader();
            const text: string[] = [];
            let lastY = -1;
            pdfReader.parseBuffer(buffer, (err: any, item: any) => {
              if (err) {
                reject(err);
                return;
              }

              if (!item) {
                const fullText = text.join('');
                this.logger.log(
                  `Successfully extracted ${fullText.length} characters from PDF using pdfreader`,
                );
                resolve(fullText);
                return;
              }

              if (item.text) {
                // If Y coordinate changes, it's likely a new line
                if (lastY !== -1 && Math.abs(item.y - lastY) > 0.05) {
                  text.push('\n');
                }
                text.push(item.text);
                lastY = item.y;
              }
            });
          });
        } catch (pdfjsError: any) {
          this.logger.error('pdfreader failed:', pdfjsError.message);

          // Fallback to pdf-parse approach
          try {
            let pdfParseModule: any;
            try {
              pdfParseModule = require('pdf-parse/lib/pdf-parse');
            } catch {
              pdfParseModule = require('pdf-parse');
            }

            const pdfParse = pdfParseModule.default || pdfParseModule;

            return new Promise((resolve, reject) => {
              pdfParse(buffer)
                .then((data: any) => {
                  const extractedText = data.text || '';
                  this.logger.log(
                    `Successfully extracted ${extractedText.length} characters from PDF using pdf-parse`,
                  );
                  resolve(extractedText);
                })
                .catch((error: any) => {
                  this.logger.error(
                    'pdf-parse fallback failed:',
                    error.message,
                  );
                  reject(error);
                });
            });
          } catch (fallbackError: any) {
            this.logger.error(
              'pdf-parse fallback failed:',
              fallbackError.message,
            );
            throw new Error('All PDF parsing methods failed');
          }
        }
      } else if (
        mimetype.includes('word') ||
        mimetype.includes('docx') ||
        mimetype.includes('document')
      ) {
        try {
          const result = await mammoth.extractRawText({ buffer });
          const text = result.value || '';
          this.logger.log(
            `Successfully extracted ${text.length} characters from Word document`,
          );
          return text;
        } catch (mammothError: any) {
          this.logger.error('Mammoth extraction failed:', mammothError.message);
          throw new Error(
            `Word document extraction failed: ${mammothError.message}`,
          );
        }
      } else {
        throw new Error(
          `Unsupported file type: ${mimetype}. Only PDFs and Word docs are supported.`,
        );
      }
    } catch (error: any) {
      this.logger.error(`Error extracting text from buffer: ${error.message}`);
      throw error;
    }
  }

  async extractProfileFromBuffer(
    buffer: Buffer,
    mimetype: string,
  ): Promise<any> {
    try {
      this.logger.log(
        `Starting section-aware CV extraction for file type: ${mimetype}`,
      );
      const rawText = await this.extractTextBuffer(buffer, mimetype);
      if (!rawText || rawText.trim().length === 0) {
        this.logger.warn('No text extracted from CV file');
        return null;
      }

      // Cleanup text (unified spaces)
      const text = rawText.replace(/\s+/g, ' ');
      const sections = this.splitIntoSections(rawText); // use rawText for line-break preservation in splitting

      // Metadata extraction
      const headerText = sections.header || text.slice(0, 500);
      const email = this.extractEmail(headerText) || this.extractEmail(text);
      const telephone = this.extractPhone(text);

      // Improved Name Detection from Header
      const headerLines = (sections.header || '')
        .split('\n')
        .map((l) => l.trim())
        .filter(
          (l) =>
            l.length > 0 &&
            l.length < 50 &&
            !/^(cv|curriculum|vitae|profile|about|adresse|email|phone|tél|portable|tel|contact)/i.test(
              l,
            ),
        );

      const docHeader = nlp(headerLines.join(' '));
      const people = docHeader.people().out('array') as string[];
      const name = people.length > 0 ? people[0] : headerLines[0] || null;

      // Section-specific Skill Extraction
      // We prioritize Skills and Experience sections, and IGNORE Interests/Header noise
      const coreSkillsText = [
        sections.skills,
        sections.experience,
        sections.summary,
      ]
        .filter(Boolean)
        .join('\n');
      // If we found specific sections, we use them. If not, we fallback to the whole text but avoid 'hobbies' and 'languages'
      const skillExtractionText =
        coreSkillsText.length > 50
          ? coreSkillsText
          : rawText.replace(
              /(langues|languages|loisirs|hobbies|interests|intérêts)[\s\S]*/i,
              '',
            );

      const { matchedSkillIds, suggestions } = await this.findSkillsInText(
        skillExtractionText,
        { createMissing: false },
      );

      // Years of experience extraction (improved logic)
      let yearsOfExperience = this.extractYearsOfExperience(text);
      if (!yearsOfExperience && sections.experience) {
        // Fallback: estimate from career span if section exists
        // (Simple estimate for first version)
        const years = this.extractYearsFromSection(sections.experience);
        if (years.length >= 2) {
          yearsOfExperience = Math.max(...years) - Math.min(...years) || 1;
        }
      }

      const result = {
        name,
        email,
        telephone,
        yearsOfExperience,
        skillIds: matchedSkillIds,
        skillSuggestions: suggestions,
        sectionsFound: Object.keys(sections).filter(
          (k) => sections[k]?.length > 0,
        ),
      };

      this.logger.log(
        `Extraction complete. Sections: ${result.sectionsFound.join(', ')}. Found ${matchedSkillIds.length} skills.`,
      );
      return result;
    } catch (error: any) {
      this.logger.error(`CV extraction failed: ${error.message}`);
      throw error;
    }
  }

  private splitIntoSections(text: string): Record<string, string> {
    const lines = text.split('\n');
    const sections: Record<string, string> = { header: '' };
    let currentSection = 'header';

    const sectionDetectors: Record<string, RegExp> = {
      experience:
        /^(?:experience|work history|parcours|emplois|historique professionnel|professional experience)/i,
      skills:
        /^(?:skills|competencies|compétences|outils|technologies|hard skills|technical knowledge)/i,
      education:
        /^(?:education|formations|diplômes|academic background|studies|études)/i,
      summary:
        /^(?:summary|profile|about me|à propos|objectif|résumé|introduction)/i,
      languages: /^(?:languages|langues)/i,
    };

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.length === 0) continue;

      let found = false;
      for (const [section, regex] of Object.entries(sectionDetectors)) {
        if (regex.test(trimmedLine) && trimmedLine.length < 40) {
          currentSection = section;
          sections[currentSection] = sections[currentSection] || '';
          found = true;
          break;
        }
      }

      if (!found) {
        sections[currentSection] += line + '\n';
      }
    }

    return sections;
  }

  async extractDataFromCV(filePath: string): Promise<string[]> {
    try {
      this.logger.log(`Extracting skills from file path: ${filePath}`);
      const dataBuffer = fs.readFileSync(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const mimetype =
        ext === '.pdf'
          ? 'application/pdf'
          : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

      const text = await this.extractTextBuffer(dataBuffer, mimetype);

      // 1) Call Python NLP Service with real MongoDB skill vocabulary
      let nlpSkills: string[] = [];
      try {
        // Fetch real skill names from MongoDB to use as dynamic vocabulary
        const availableSkills = await this.skillsService.findAll();
        const knownSkills = availableSkills
          .map((s: any) => s.name)
          .filter(Boolean);

        const response = await fetch('http://localhost:8000/extract-skills', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description: text,
            title: 'CV Extraction',
            knownSkills: knownSkills.length > 0 ? knownSkills : undefined,
          }),
        });
        if (response.ok) {
          const data = await response.json();
          nlpSkills = data.extractedSkills || [];
          this.logger.log(
            `Python NLP extraction matched: ${nlpSkills.join(', ')} (vocabulary: ${knownSkills.length} skills)`,
          );
        } else {
          this.logger.warn(`Python NLP returned status: ${response.status}`);
        }
      } catch (err: any) {
        this.logger.error(
          `Failed to reach Python NLP at localhost:8000: ${err.message}`,
        );
      }

      // 2) Fuse with the internal matching to guarantee MongoDB skill linking
      const combinedText = text + '\n\n' + nlpSkills.join(' ');
      const { matchedSkillIds } = await this.findSkillsInText(combinedText, {
        createMissing: true,
      });

      return matchedSkillIds;
    } catch (error: any) {
      this.logger.error(
        `Failed to extract data via local NLP: ${error.message}`,
      );
      return [];
    }
  }

  private extractSkillsSection(text: string): string {
    const lines = text.split('\n');
    const captured: string[] = [];
    let isCapturing = false;

    for (const line of lines) {
      const trimmed = line.trim();
      const normalized = trimmed.toLowerCase();

      if (!isCapturing) {
        if (
          normalized === 'skills' ||
          normalized.startsWith('skills:') ||
          normalized === 'compétences' ||
          normalized.startsWith('compétences:')
        ) {
          isCapturing = true;
        }
        continue;
      }

      if (
        normalized === 'experience' ||
        normalized.startsWith('experience:') ||
        normalized === 'education' ||
        normalized.startsWith('education:') ||
        normalized === 'projects' ||
        normalized.startsWith('projects:') ||
        normalized === 'formation' ||
        normalized.startsWith('formation:')
      ) {
        break;
      }

      if (trimmed.length > 0) {
        captured.push(line);
      }
    }

    const skillsSection = captured.join('\n').trim();
    if (skillsSection.length > 30) {
      this.logger.log('Targeting skills section for extraction');
      return skillsSection;
    }

    return text;
  }

  private extractEmail(text: string): string | null {
    const candidates = text.split(/\s+/);

    for (const candidate of candidates) {
      const trimmed = candidate.replace(/^[<([{"'`]+|[>)]},;:\"'`]+$/g, '');
      const atIndex = trimmed.indexOf('@');
      if (atIndex <= 0 || atIndex !== trimmed.lastIndexOf('@')) continue;

      const localPart = trimmed.slice(0, atIndex);
      const domainPart = trimmed.slice(atIndex + 1);
      if (!localPart || !domainPart.includes('.')) continue;
      if (domainPart.startsWith('.') || domainPart.endsWith('.')) continue;
      if (localPart.length > 64 || domainPart.length > 255) continue;

      if (this.isEmailPart(localPart) && this.isEmailDomain(domainPart)) {
        return trimmed;
      }
    }

    return null;
  }

  private extractPhone(text: string): string | null {
    let current = '';

    const flush = (): string | null => {
      if (this.countDigits(current) >= 7) {
        return current.trim();
      }
      current = '';
      return null;
    };

    for (const char of text) {
      if (this.isPhoneChar(char)) {
        current += char;
        continue;
      }

      const value = flush();
      if (value) return value;
    }

    return flush();
  }

  private extractYearsOfExperience(text: string): number {
    const normalized = text.toLowerCase().replace(/[\r\n\t]+/g, ' ');
    const tokens = normalized.split(' ').filter(Boolean);

    for (let index = 0; index < tokens.length; index += 1) {
      const token = tokens[index].replace(/[^0-9+]/g, '');
      if (!token) continue;

      const numericPart = token.endsWith('+') ? token.slice(0, -1) : token;
      if (!this.isReasonableExperienceNumber(numericPart)) continue;

      const lookAhead = tokens.slice(index + 1, index + 6).join(' ');
      if (this.containsExperiencePhrase(lookAhead)) {
        return parseInt(numericPart, 10);
      }
    }

    return 0;
  }

  private extractYearsFromSection(sectionText: string): number[] {
    const years: number[] = [];
    let buffer = '';

    const pushBuffer = () => {
      if (buffer.length === 4) {
        const prefix = buffer.slice(0, 2);
        if ((prefix === '19' || prefix === '20') && this.isAllDigits(buffer)) {
          years.push(parseInt(buffer, 10));
        }
      }
      buffer = '';
    };

    for (const char of sectionText) {
      if (char >= '0' && char <= '9') {
        buffer += char;
        if (buffer.length > 4) {
          buffer = char;
        }
        continue;
      }

      pushBuffer();
    }

    pushBuffer();
    return years;
  }

  private containsExperiencePhrase(text: string): boolean {
    return (
      text.includes('years of experience') ||
      text.includes('year of experience') ||
      text.includes('years experience') ||
      text.includes('experience') ||
      text.includes('ans d expérience') ||
      text.includes('ans dexpérience') ||
      text.includes('ans experience')
    );
  }

  private isPhoneChar(char: string): boolean {
    return (
      (char >= '0' && char <= '9') ||
      char === '+' ||
      char === ' ' ||
      char === '-' ||
      char === '(' ||
      char === ')' ||
      char === '.'
    );
  }

  private countDigits(text: string): number {
    let count = 0;
    for (const char of text) {
      if (char >= '0' && char <= '9') {
        count += 1;
      }
    }
    return count;
  }

  private isReasonableExperienceNumber(value: string): boolean {
    if (value.length < 1 || value.length > 2) return false;
    return this.isAllDigits(value);
  }

  private isAllDigits(value: string): boolean {
    if (value.length === 0) return false;
    for (const char of value) {
      if (char < '0' || char > '9') return false;
    }
    return true;
  }

  private isEmailPart(value: string): boolean {
    if (value.length === 0) return false;
    for (const char of value) {
      const isLetter =
        (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z');
      const isDigit = char >= '0' && char <= '9';
      const isSymbol = '._%+-'.includes(char);
      if (!isLetter && !isDigit && !isSymbol) return false;
    }
    return true;
  }

  private isEmailDomain(value: string): boolean {
    if (value.length === 0) return false;
    for (const char of value) {
      const isLetter =
        (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z');
      const isDigit = char >= '0' && char <= '9';
      const isSymbol = '.-'.includes(char);
      if (!isLetter && !isDigit && !isSymbol) return false;
    }
    return true;
  }

  private async findSkillsInText(
    text: string,
    options: { createMissing?: boolean } = {},
  ): Promise<{ matchedSkillIds: string[]; suggestions: string[] }> {
    if (!text || text.trim().length === 0) {
      return { matchedSkillIds: [], suggestions: [] };
    }

    try {
      const availableSkills = await this.skillsService.findAll();
      const targetText = this.extractSkillsSection(text);
      const rawTextLower = targetText.toLowerCase();
      const doc = nlp(rawTextLower);
      const cvTerms = doc.terms().out('array') as string[];

      const matchedSkillIds: Set<string> = new Set();
      const suggestions: Set<string> = new Set();
      const normalizedCvText = this.normalizeForMatching(rawTextLower);

      // Pass 1: Match against existing DB skills
      this.matchSkillsAgainstDatabase(
        availableSkills,
        rawTextLower,
        normalizedCvText,
        cvTerms,
        matchedSkillIds,
      );

      // Pass 2: Dictionary-based discovery
      await this.matchSkillsAgainstDictionaries(
        availableSkills,
        rawTextLower,
        cvTerms,
        matchedSkillIds,
        suggestions,
        options,
      );

      return {
        matchedSkillIds: Array.from(matchedSkillIds),
        suggestions: Array.from(suggestions),
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to extract skills via local NLP: ${error.message}`,
      );
      return { matchedSkillIds: [], suggestions: [] };
    }
  }

  /**
   * Match skills from database against CV text (Pass 1)
   */
  private matchSkillsAgainstDatabase(
    availableSkills: any[],
    rawTextLower: string,
    normalizedCvText: string,
    cvTerms: string[],
    matchedSkillIds: Set<string>,
  ): void {
    for (const skill of availableSkills) {
      const skillNameLower = skill.name.toLowerCase();
      const normalizedSkillName = this.normalizeForMatching(skillNameLower);

      // Exact match
      const escaped = this.escapeRegExp(skillNameLower);
      const regex = new RegExp(`(?:^|\\W)${escaped}(?:$|\\W)`, 'i');

      if (
        regex.test(rawTextLower) ||
        normalizedCvText.includes(normalizedSkillName)
      ) {
        matchedSkillIds.add(skill._id.toString());
        continue;
      }

      // Fuzzy match
      if (this.fuzzyMatchTermInCvTerms(skillNameLower, cvTerms)) {
        matchedSkillIds.add(skill._id.toString());
      }
    }
  }

  /**
   * Fuzzy match skill against CV terms using Levenshtein distance
   */
  private fuzzyMatchTermInCvTerms(skillName: string, cvTerms: string[]): boolean {
    if (skillName.length < 5) return false;

    for (const term of cvTerms) {
      const t = term.toLowerCase();
      if (t.length >= 4 && this.calculateLevenshtein(t, skillName) <= 1) {
        return true;
      }
    }
    return false;
  }

  /**
   * Match skills from dictionaries against CV text (Pass 2)
   */
  private async matchSkillsAgainstDictionaries(
    availableSkills: any[],
    rawTextLower: string,
    cvTerms: string[],
    matchedSkillIds: Set<string>,
    suggestions: Set<string>,
    options: { createMissing?: boolean },
  ): Promise<void> {
    const skillDictionaries = this.getSkillDictionaries();
    const dbSkillNamesLower = new Set(
      availableSkills.map((s) => s.name.toLowerCase()),
    );

    const context = {
      rawTextLower,
      cvTerms,
      dbSkillNamesLower,
      availableSkills,
      matchedSkillIds,
      suggestions,
      options,
    };

    for (const [skillType, techList] of Object.entries(skillDictionaries)) {
      for (const tech of techList) {
        await this.processSkillFromDictionary(tech, skillType, context);
      }
    }
  }

  /**
   * Process a single skill from dictionary
   */
  private async processSkillFromDictionary(
    tech: string,
    skillType: string,
    context: {
      rawTextLower: string;
      cvTerms: string[];
      dbSkillNamesLower: Set<string>;
      availableSkills: any[];
      matchedSkillIds: Set<string>;
      suggestions: Set<string>;
      options: { createMissing?: boolean };
    },
  ): Promise<void> {
    const techLower = tech.toLowerCase();

    if (context.dbSkillNamesLower.has(techLower)) return;

    const escaped = this.escapeRegExp(techLower);
    const regex = new RegExp(`(?<=^|\\W)${escaped}(?=$|\\W)`, 'i');

    if (regex.test(context.rawTextLower) || context.cvTerms.includes(techLower)) {
      if (context.options.createMissing) {
        await this.autoCreateSkill(
          tech,
          skillType,
          context.availableSkills,
          context.matchedSkillIds,
        );
      } else {
        context.suggestions.add(tech);
      }
    }
  }

  /**
   * Auto-create a missing skill
   */
  private async autoCreateSkill(
    techName: string,
    skillType: string,
    availableSkills: any[],
    matchedSkillIds: Set<string>,
  ): Promise<void> {
    try {
      this.logger.log(`Auto-creating missing skill: ${techName}`);
      const newSkill = await this.skillsService.create({
        name: techName,
        category: 'Auto-Discovered',
        type: skillType,
      });
      matchedSkillIds.add(newSkill._id.toString());
      availableSkills.push(newSkill);
    } catch (err: any) {
      this.logger.error(
        `Failed to auto-create ${techName}: ${err.message}`,
      );
    }
  }

  /**
   * Get skill dictionaries
   */
  private getSkillDictionaries(): Record<string, string[]> {
    return {
      knowHow: [
        'Java',
        'C++',
        'C#',
        'Python',
        'JavaScript',
        'TypeScript',
        'HTML',
        'CSS',
        'PHP',
        'Ruby',
        'Swift',
        'Kotlin',
        'Go',
        'Rust',
        'React',
        'Angular',
        'Vue',
        'Svelte',
        'Next.js',
        'NestJS',
        'Express',
        'Django',
        'Flask',
        'Spring Boot',
        'Laravel',
        'Symfony',
        'ASP.NET',
        'MySQL',
        'PostgreSQL',
        'MongoDB',
        'Oracle',
        'SQL Server',
        'Redis',
        'Cassandra',
        'Elasticsearch',
        'Git',
        'Docker',
        'Kubernetes',
        'Firebase',
        'AWS',
        'Azure',
        'GCP',
        'Jenkins',
        'Terraform',
        'Ansible',
        'Linux',
        'Unix',
        'Bash',
        'PowerShell',
        'Jira',
        'Confluence',
        'Trello',
        'Selenium',
        'Cypress',
        'Jest',
        'Mocha',
        'Excel',
        'QuickBooks',
        'SAP',
        'Oracle Financials',
        'Xero',
        'Tableau',
        'Power BI',
        'SPSS',
        'Bloomberg Terminal',
        'Google Analytics',
        'HubSpot',
        'Salesforce',
        'Mailchimp',
        'Hootsuite',
        'WordPress',
        'Figma',
        'Canva',
        'Workday',
        'BambooHR',
        'ADP',
        'Greenhouse',
        'Lever',
        'LinkedIn Recruiter',
      ],
      knowledge: [
        'Agile',
        'Scrum',
        'Kanban',
        'OOP',
        'Algorithms',
        'Data Structures',
        'System Design',
        'Machine Learning',
        'Data Science',
        'AI',
        'NLP',
        'Computer Vision',
        'REST API',
        'GraphQL',
        'Microservices',
        'CI/CD',
        'TDD',
        'BDD',
        'Talent Acquisition',
        'Employee Relations',
        'Performance Management',
        'Compensation',
        'Benefits Administration',
        'Onboarding',
        'Labor Law',
        'Diversity',
        'Inclusion',
        'Organizational Development',
        'SEO',
        'SEM',
        'Content Marketing',
        'Digital Marketing',
        'Social Media Marketing',
        'B2B Sales',
        'B2C Sales',
        'Market Research',
        'Brand Management',
        'Copywriting',
        'Public Relations',
        'Lead Generation',
        'Accounting',
        'Financial Analysis',
        'Budgeting',
        'Forecasting',
        'Auditing',
        'Taxation',
        'IFRS',
        'GAAP',
        'Risk Management',
        'Corporate Finance',
        'Payroll',
        'Underwriting',
        'Claims Management',
        'Actuarial Science',
        'Regulatory Compliance',
        'Policy Administration',
        'Quality Assurance',
      ],
      softSkill: [
        'Leadership',
        'Communication',
        'Teamwork',
        'Problem Solving',
        'Critical Thinking',
        'Time Management',
        'Adaptability',
        'Creativity',
        'Emotional Intelligence',
        'Negotiation',
        'Conflict Resolution',
        'Project Management',
        'Customer Service',
        'Presentation Skills',
        'Active Listening',
        'Decision Making',
        'Work Ethic',
      ],
    };
  }

  private normalizeForMatching(text: string): string {
    return text
      .toLowerCase()
      .replace(/[.\-\s]/g, '') // remove dots, hyphens, spaces: React.js -> reactjs
      .replace(/[^a-z0-9]/g, ''); // alphanumeric only
  }

  private calculateLevenshtein(a: string, b: string): number {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1, // deletion
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  private escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
