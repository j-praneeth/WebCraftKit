export interface TemplateStyles {
  fontFamily: string;
  fontSize: string;
  lineHeight: string;
  colors: {
    primary: string;
    secondary: string;
    text: string;
    background: string;
    accent: string;
  };
  spacing: {
    section: string;
    item: string;
  };
}

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  category: 'free' | 'professional' | 'enterprise';
  previewImage: string;
  styles: TemplateStyles;
  layout?: {
    sections: Array<{
      id: string;
      type: "header" | "summary" | "experience" | "education" | "skills" | "certifications" | "projects";
      gridArea?: string;
      styles?: Partial<TemplateStyles>;
    }>;
    grid: {
      areas: string[];
      columns: string[];
      rows: string[];
    };
  };
  latexSource?: boolean;
} 