import React from 'react';
import { TemplateDefinition } from '@/lib/templates';
import { Resume } from '@shared/schema';
import styled from '@emotion/styled';
import { css } from '@emotion/react';

interface TemplateRendererProps {
  template: TemplateDefinition;
  resume: Resume;
  scale?: number;
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
    width: 8.5in;
    height: 11in;
    padding: 0.5in;
    box-sizing: border-box;
    position: relative;
    overflow: hidden;
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
    grid-area: ${gridArea};
    padding: ${styles.spacing.section};
    background: ${sectionStyles?.colors?.background || styles.colors.background};
    color: ${sectionStyles?.colors?.text || styles.colors.text};

    h2 {
      color: ${sectionStyles?.colors?.primary || styles.colors.primary};
      font-size: 1.25em;
      margin-bottom: 1rem;
      border-bottom: 2px solid ${sectionStyles?.colors?.accent || styles.colors.accent};
      padding-bottom: 0.5rem;
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

const renderSection = (
  section: TemplateDefinition['layout']['sections'][0],
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
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">{content.personalInfo.name}</h1>
          <div className="flex justify-center gap-4 text-sm">
            {content.personalInfo.email && <span>{content.personalInfo.email}</span>}
            {content.personalInfo.phone && <span>{content.personalInfo.phone}</span>}
            {content.personalInfo.location && <span>{content.personalInfo.location}</span>}
          </div>
          {content.personalInfo.website && (
            <div className="mt-1 text-sm">{content.personalInfo.website}</div>
          )}
        </div>
      )}

      {section.type === 'summary' && content.personalInfo?.summary && (
        <div>
          <h2>Professional Summary</h2>
          <p>{content.personalInfo.summary}</p>
        </div>
      )}

      {section.type === 'experience' && content.experience && (
        <div>
          <h2>Experience</h2>
          {content.experience?.map((exp: ExperienceItem, i: number) => (
            <div key={i} className="mb-4">
              <h3>{exp.position}</h3>
              <div className="flex justify-between text-sm">
                <span>{exp.company}</span>
                <span>{exp.startDate} - {exp.endDate || 'Present'}</span>
              </div>
              {exp.location && (
                <div className="text-sm text-gray-600">{exp.location}</div>
              )}
              <p className="mt-2 text-sm">{exp.description}</p>
            </div>
          ))}
        </div>
      )}

      {section.type === 'education' && content.education && (
        <div>
          <h2>Education</h2>
          {content.education?.map((edu: NonNullable<ResumeContent['education']>[number], i: number) => (
            <div key={i} className="mb-4">
              <h3>{edu.degree}</h3>
              <div className="flex justify-between text-sm">
                <span>{edu.institution}</span>
                <span>{edu.startDate} - {edu.endDate || 'Present'}</span>
              </div>
              {edu.location && (
                <div className="text-sm text-gray-600">{edu.location}</div>
              )}
              {edu.description && (
                <p className="mt-2 text-sm">{edu.description}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {section.type === 'skills' && content.skills && (
        <div>
          <h2>Skills</h2>
          <div className="flex flex-wrap gap-2">
            {content.skills?.map((skill: string, i: number) => (
              <span
                key={i}
                className="px-2 py-1 bg-gray-100 rounded text-sm"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {section.type === 'certifications' && content.certifications && (
        <div>
          <h2>Certifications</h2>
          {content.certifications.map((cert, i) => (
            <div key={i} className="mb-3">
              <h3>{cert.name}</h3>
              <div className="flex justify-between text-sm">
                <span>{cert.issuer}</span>
                {cert.date && <span>{cert.date}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {section.type === 'projects' && content.projects && (
        <div>
          <h2>Projects</h2>
          {content.projects?.map((project: ProjectItem, i: number) => (
            <div key={i} className="mb-4">
              <h3>{project.name}</h3>
              <p className="mt-1 text-sm">{project.description}</p>
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
          ))}
        </div>
      )}
    </Section>
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

export const TemplateRenderer: React.FC<TemplateRendererProps> = ({
  template,
  resume,
  scale = 1
}) => {
  if (!template || !resume) {
    return (
      <div className="p-4 border border-yellow-200 rounded bg-yellow-50">
        <p className="text-yellow-800">Loading template...</p>
      </div>
    );
  }

  const content = resume.content as ResumeContent;
  
  return (
    <ErrorBoundary>
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        <ResumeContainer styles={template.styles}>
          <ResumeGrid layout={template.layout} styles={template.styles}>
            {template.layout.sections.map(section =>
              renderSection(section, content, template.styles)
            )}
          </ResumeGrid>
        </ResumeContainer>
      </div>
    </ErrorBoundary>
  );
};