import React from 'react';
import { TemplateDefinition } from '@/lib/templates/index';
import { Resume } from '@shared/schema';
import styled from '@emotion/styled';
import { css } from '@emotion/react';

interface TemplateRendererProps {
  template: TemplateDefinition;
  resume: Resume;
  isPrintMode?: boolean;
}

interface StyledComponentProps {
  styles: TemplateDefinition['styles'];
  layout?: TemplateDefinition['layout'];
  gridArea?: string;
  sectionStyles?: {
    colors?: Partial<TemplateDefinition['styles']['colors']>;
  };
}

const ResumeContainer = styled.div<StyledComponentProps>`
  ${({ styles }) => css`
    font-family: ${styles.fontFamily};
    font-size: ${styles.fontSize};
    line-height: ${styles.lineHeight};
    color: ${styles.colors.text};
    background: ${styles.colors.background};
    width: 794px; /* 210mm */
    min-height: 1123px; /* 297mm */
    height: auto;
    padding: 40px 32px;
    box-sizing: border-box;
    position: relative;
    margin: 0 auto;

    &:not(.print-mode) {
      box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
    }

    @media print {
      width: 210mm;
      height: 297mm;
      padding: 20mm 15mm;
      margin: 0;
      box-shadow: none;
      border: none;
      border-radius: 0;
      background-color: white;

      /* Hide all preview elements */
      .preview-container,
      .preview-wrapper,
      h3:not([class*="resume-section"]),
      .border {
        display: none !important;
      }

      /* Reset any print margins and ensure clean output */
      @page {
        margin: 0;
        size: A4;
      }
    }
  `}
`;

const ResumeGrid = styled.div<StyledComponentProps>`
  ${({ layout }) => layout && css`
    display: grid;
    grid-template-areas: ${layout.grid.areas.map(area => `"${area}"`).join(' ')};
    grid-template-columns: ${layout.grid.columns.join(' ')};
    grid-template-rows: ${layout.grid.rows.join(' ')};
    gap: 1rem;
    height: 100%;
  `}
`;

const Section = styled.section<StyledComponentProps>`
  ${({ gridArea, sectionStyles, styles }) => css`
    margin-bottom: 1.25rem;
    
    &:last-child {
      margin-bottom: 0;
    }

    h2 {
      color: ${sectionStyles?.colors?.primary || styles.colors.primary};
      font-size: 1.125rem;
      font-weight: 700;
      margin-bottom: 0.75rem;
      border-bottom: 1px solid ${sectionStyles?.colors?.accent || styles.colors.accent};
      padding-bottom: 0.25rem;
      text-transform: uppercase;
    }

    h3 {
      color: ${sectionStyles?.colors?.secondary || styles.colors.secondary};
      font-size: 1.1em;
      margin-bottom: 0.5rem;
    }
  `}
`;

type ExperienceItem = {
  company: string;
  position: string;
  location?: string;
  startDate: string;
  endDate?: string;
  description: string;
};

type EducationItem = {
  institution: string;
  degree: string;
  field?: string;
  location?: string;
  startDate: string;
  endDate?: string;
  description?: string;
};

type CertificationItem = {
  name: string;
  issuer?: string;
  date?: string;
  description?: string;
};

type ProjectItem = {
  name: string;
  description: string;
  url?: string;
  technologies?: string[];
};

interface ResumeContent {
  personalInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    website?: string;
    summary?: string;
  };
  experience?: ExperienceItem[];
  education?: EducationItem[];
  skills?: string[];
  certifications?: CertificationItem[];
  projects?: ProjectItem[];
}

// Define the section type explicitly
type TemplateSectionType = NonNullable<TemplateDefinition['layout']>['sections'][0];

const renderSection = (
  section: TemplateSectionType,
  content: ResumeContent,
  baseStyles: TemplateDefinition['styles']
) => {
  const sectionContent = content[section.type as keyof ResumeContent];
  
  return (
    <Section
      key={section.id}
      gridArea={section.gridArea || section.id}
      sectionStyles={section.styles}
      styles={baseStyles}
    >
      {section.type === 'header' && content.personalInfo && (
        <div className="text-center mb-6"> {/* Reduced top margin */}
          <h1 className="text-2xl font-bold mb-1">{content.personalInfo.name}</h1>
          <div className="flex justify-center items-center gap-2 text-sm"> {/* Reduced gap */}
            {content.personalInfo.location && <span>{content.personalInfo.location}</span>}
            {content.personalInfo.email && <span>•</span>}
            {content.personalInfo.email && <span>{content.personalInfo.email}</span>}
            {content.personalInfo.phone && <span>•</span>}
            {content.personalInfo.phone && <span>{content.personalInfo.phone}</span>}
            {content.personalInfo.website && <span>•</span>}
            {content.personalInfo.website && <span>{content.personalInfo.website}</span>}
          </div>
        </div>
      )}

      {section.type === 'summary' && content.personalInfo?.summary && (
        <div className="mb-5"> {/* Adjusted spacing */}
          <h2 className="text-[14px] font-bold uppercase mb-2">Professional Summary</h2>
          <p className="text-sm leading-relaxed">{content.personalInfo.summary}</p>
        </div>
      )}

      {section.type === 'experience' && content.experience && (
        <div className="mb-5"> {/* Adjusted spacing */}
          <h2 className="text-[14px] font-bold uppercase mb-2">Professional Experience</h2>
          {content.experience?.map((exp: ExperienceItem, i: number) => (
            <div key={i} className="mb-3"> {/* Reduced spacing between items */}
              <div className="flex justify-between items-start mb-0.5">
                <div>
                  <h3 className="font-bold text-sm">{exp.position}</h3>
                  <div className="text-sm">
                    <span className="font-medium">{exp.company}</span>
                    {exp.location && <span className="ml-1">{exp.location}</span>}
                  </div>
                </div>
                <div className="text-sm text-right">
                  {exp.startDate} — {exp.endDate || 'Present'}
                </div>
              </div>
              <p className="text-sm mt-1 whitespace-pre-line">{exp.description}</p>
            </div>
          ))}
        </div>
      )}

      {section.type === 'education' && content.education && (
        <div className="mb-5"> {/* Adjusted spacing */}
          <h2 className="text-[14px] font-bold uppercase mb-2">Education</h2>
          {content.education?.map((edu: EducationItem, i: number) => (
            <div key={i} className="mb-2"> {/* Reduced spacing between items */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-sm">{edu.degree}</h3>
                  <div className="text-sm">
                    <span className="font-medium">{edu.institution}</span>
                    {edu.location && <span className="ml-1">{edu.location}</span>}
                  </div>
                </div>
                <div className="text-sm text-right">
                  {edu.startDate} — {edu.endDate || 'Present'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {section.type === 'skills' && content.skills && content.skills.length > 0 && (
        <div className="mb-5"> {/* Adjusted spacing */}
          <h2 className="text-[14px] font-bold uppercase mb-2">Expert-Level Skills</h2>
          <div className="text-sm">
            {content.skills.filter(Boolean).map((skill, i, arr) => (
              <span key={i}>
                {skill}
                {i < arr.length - 1 && ', '}
              </span>
            ))}
          </div>
        </div>
      )}

      {section.type === 'certifications' && content.certifications && (
        <div className="mb-5"> {/* Adjusted spacing */}
          <h2 className="text-[14px] font-bold uppercase mb-2">Certifications</h2>
          {content.certifications.map((cert, i) => (
            <div key={i} className="mb-2"> {/* Reduced spacing between items */}
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-sm">{cert.name}</h3>
                {cert.date && <span className="text-sm">{cert.date}</span>}
              </div>
              {cert.issuer && <div className="text-sm">{cert.issuer}</div>}
              {cert.description && (
                <p className="text-sm mt-1">{cert.description}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {section.type === 'projects' && content.projects && (
        <div className="mb-5"> {/* Adjusted spacing */}
          <h2 className="text-[14px] font-bold uppercase mb-2">Projects</h2>
          {content.projects?.map((project: ProjectItem, i: number) => (
            <div key={i} className="mb-3"> {/* Reduced spacing between items */}
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-sm">{project.name}</h3>
                {project.url && (
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View Project
                  </a>
                )}
              </div>
              <p className="text-sm mt-1">{project.description}</p>
              {project.technologies && project.technologies.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {project.technologies.map((tech, techIndex) => (
                    <span
                      key={techIndex}
                      className="text-xs px-1.5 py-0.5 bg-gray-100 rounded"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Section>
  );
};

interface ResumeSectionProps {
  section: {
    id: string;
    type: "header" | "summary" | "experience" | "education" | "skills" | "certifications" | "projects";
    gridArea?: string;
    styles?: Partial<TemplateDefinition['styles']>;
  };
  content: ResumeContent;
  styles: TemplateDefinition['styles'];
}

const ResumeSection: React.FC<ResumeSectionProps> = ({ section, content, styles }) => {
  const sectionStyles = {
    ...styles,
    ...(section.styles || {}),
    gridArea: section.gridArea,
  };

  return (
    <div style={{ gridArea: section.gridArea }}>
      {renderSection(section, content, sectionStyles)}
    </div>
  );
};

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border border-red-200 rounded bg-red-50">
          <h3 className="text-red-800 font-medium">Error rendering template</h3>
          <p className="text-red-600 text-sm mt-1">
            There was an error rendering the resume template. Please try selecting a different template.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export const TemplateRenderer: React.FC<TemplateRendererProps> = ({ template, resume, isPrintMode = false }) => {
  const content = resume.content as ResumeContent;
  
  if (!template.layout) {
    return (
      <div className="p-4 border border-yellow-200 rounded bg-yellow-50">
        <p className="text-yellow-800">Template layout not found</p>
      </div>
    );
  }

  const { sections } = template.layout;

  // Core resume content
  const resumeContent = (
    <ResumeContainer 
      styles={template.styles} 
      className={`resume-content ${isPrintMode ? 'print-mode' : ''}`}
      data-printmode={isPrintMode}
    >
      {sections.map((section) => (
        <ResumeSection
          key={section.id}
          section={section}
          content={content}
          styles={template.styles}
        />
      ))}
    </ResumeContainer>
  );

  // For PDF generation/print, return only the content
  if (isPrintMode) {
    return resumeContent;
  }

  // For preview mode
  return (
    <ErrorBoundary>
      <div className="preview-container print:hidden">
        {resumeContent}
      </div>
    </ErrorBoundary>
  );
};