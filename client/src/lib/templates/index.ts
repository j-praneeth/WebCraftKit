import { Resume } from "@shared/schema";

export type ResumeContent = Resume['content'];

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
  category: "free" | "professional" | "enterprise";
  previewImage: string;
  styles: TemplateStyles;
  layout: {
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
}

// Modern template - Free tier
export const modernTemplate: TemplateDefinition = {
  id: "modern",
  name: "Modern Professional",
  description: "A clean and modern design with a focus on readability",
  category: "free",
  previewImage: "/templates/modern-preview.png",
  styles: {
    fontFamily: "'Inter', sans-serif",
    fontSize: "14px",
    lineHeight: "1.5",
    colors: {
      primary: "#2563eb",
      secondary: "#64748b",
      text: "#1e293b",
      background: "#ffffff",
      accent: "#e2e8f0"
    },
    spacing: {
      section: "1.5rem",
      item: "1rem"
    }
  },
  layout: {
    sections: [
      { id: "header", type: "header", gridArea: "header" },
      { id: "summary", type: "summary", gridArea: "summary" },
      { id: "experience", type: "experience", gridArea: "experience" },
      { id: "education", type: "education", gridArea: "education" },
      { id: "skills", type: "skills", gridArea: "skills" },
      { id: "certifications", type: "certifications", gridArea: "certifications" },
      { id: "projects", type: "projects", gridArea: "projects" }
    ],
    grid: {
      areas: [
        "header",
        "summary",
        "experience",
        "education",
        "skills",
        "certifications",
        "projects"
      ],
      columns: ["1fr"],
      rows: ["auto", "auto", "auto", "auto", "auto", "auto", "auto"]
    }
  }
};

// Executive template - Professional tier
export const executiveTemplate: TemplateDefinition = {
  id: "executive",
  name: "Executive Suite",
  description: "An elegant and sophisticated design for senior professionals",
  category: "professional",
  previewImage: "/templates/executive-preview.png",
  styles: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "14px",
    lineHeight: "1.6",
    colors: {
      primary: "#1e1e1e",
      secondary: "#666666",
      text: "#333333",
      background: "#ffffff",
      accent: "#f0f0f0"
    },
    spacing: {
      section: "2rem",
      item: "1.25rem"
    }
  },
  layout: {
    sections: [
      { id: "header", type: "header", gridArea: "header" },
      { id: "summary", type: "summary", gridArea: "summary" },
      {
        id: "sidebar",
        type: "skills",
        gridArea: "sidebar",
        styles: {
          colors: {
            primary: "#1e1e1e",
            secondary: "#666666",
            text: "#333333",
            background: "#f8f9fa",
            accent: "#f0f0f0"
          }
        }
      },
      { id: "experience", type: "experience", gridArea: "main" },
      { id: "education", type: "education", gridArea: "main" },
      { id: "certifications", type: "certifications", gridArea: "sidebar" },
      { id: "projects", type: "projects", gridArea: "main" }
    ],
    grid: {
      areas: [
        "header header",
        "summary summary",
        "main sidebar"
      ],
      columns: ["2fr", "1fr"],
      rows: ["auto", "auto", "1fr"]
    }
  }
};

// Creative template - Enterprise tier
export const creativeTemplate: TemplateDefinition = {
  id: "creative",
  name: "Creative Impact",
  description: "A bold and innovative design that stands out",
  category: "enterprise",
  previewImage: "/templates/creative-preview.png",
  styles: {
    fontFamily: "'Poppins', sans-serif",
    fontSize: "14px",
    lineHeight: "1.6",
    colors: {
      primary: "#6366f1",
      secondary: "#a855f7",
      text: "#1f2937",
      background: "#ffffff",
      accent: "#f3f4f6"
    },
    spacing: {
      section: "2.5rem",
      item: "1.5rem"
    }
  },
  layout: {
    sections: [
      {
        id: "header",
        type: "header",
        gridArea: "header",
        styles: {
          colors: {
            primary: "#6366f1",
            secondary: "#a855f7",
            text: "#ffffff",
            background: "#6366f1",
            accent: "#f3f4f6"
          }
        }
      },
      { id: "summary", type: "summary", gridArea: "summary" },
      { id: "experience", type: "experience", gridArea: "main" },
      { id: "skills", type: "skills", gridArea: "sidebar" },
      { id: "education", type: "education", gridArea: "main" },
      { id: "certifications", type: "certifications", gridArea: "sidebar" },
      { id: "projects", type: "projects", gridArea: "main" }
    ],
    grid: {
      areas: [
        "header header",
        "summary summary",
        "sidebar main"
      ],
      columns: ["1fr", "2fr"],
      rows: ["auto", "auto", "1fr"]
    }
  }
};

// Minimalist template - Free tier
export const minimalistTemplate: TemplateDefinition = {
  id: "minimalist",
  name: "Clean Minimalist",
  description: "A simple and elegant design that lets your content shine",
  category: "free",
  previewImage: "/templates/minimalist-preview.png",
  styles: {
    fontFamily: "'Roboto', sans-serif",
    fontSize: "14px",
    lineHeight: "1.5",
    colors: {
      primary: "#2d3748",
      secondary: "#718096",
      text: "#4a5568",
      background: "#ffffff",
      accent: "#edf2f7"
    },
    spacing: {
      section: "1.25rem",
      item: "1rem"
    }
  },
  layout: {
    sections: [
      { id: "header", type: "header", gridArea: "header" },
      { id: "summary", type: "summary", gridArea: "summary" },
      { id: "experience", type: "experience", gridArea: "main" },
      { id: "education", type: "education", gridArea: "main" },
      { id: "skills", type: "skills", gridArea: "sidebar" },
      { id: "certifications", type: "certifications", gridArea: "sidebar" },
      { id: "projects", type: "projects", gridArea: "main" }
    ],
    grid: {
      areas: [
        "header header",
        "summary summary",
        "main sidebar"
      ],
      columns: ["2fr", "1fr"],
      rows: ["auto", "auto", "1fr"]
    }
  }
};

// Professional template - Free tier
export const professionalTemplate: TemplateDefinition = {
  id: "professional",
  name: "Professional Classic",
  description: "A traditional design perfect for corporate roles",
  category: "free",
  previewImage: "/templates/professional-preview.png",
  styles: {
    fontFamily: "'Source Sans Pro', sans-serif",
    fontSize: "14px",
    lineHeight: "1.6",
    colors: {
      primary: "#1a365d",
      secondary: "#2c5282",
      text: "#2d3748",
      background: "#ffffff",
      accent: "#e2e8f0"
    },
    spacing: {
      section: "1.75rem",
      item: "1.25rem"
    }
  },
  layout: {
    sections: [
      { id: "header", type: "header", gridArea: "header" },
      { id: "summary", type: "summary", gridArea: "summary" },
      { id: "skills", type: "skills", gridArea: "skills" },
      { id: "experience", type: "experience", gridArea: "experience" },
      { id: "education", type: "education", gridArea: "education" },
      { id: "certifications", type: "certifications", gridArea: "certifications" },
      { id: "projects", type: "projects", gridArea: "projects" }
    ],
    grid: {
      areas: [
        "header",
        "summary",
        "skills",
        "experience",
        "education",
        "certifications",
        "projects"
      ],
      columns: ["1fr"],
      rows: ["auto", "auto", "auto", "auto", "auto", "auto", "auto"]
    }
  }
};

// Tech template - Professional tier
export const techTemplate: TemplateDefinition = {
  id: "tech",
  name: "Tech Innovator",
  description: "A modern design for tech professionals",
  category: "professional",
  previewImage: "/templates/tech-preview.png",
  styles: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "14px",
    lineHeight: "1.6",
    colors: {
      primary: "#0f172a",
      secondary: "#334155",
      text: "#1e293b",
      background: "#ffffff",
      accent: "#f1f5f9"
    },
    spacing: {
      section: "2rem",
      item: "1.5rem"
    }
  },
  layout: {
    sections: [
      {
        id: "header",
        type: "header",
        gridArea: "header",
        styles: {
          colors: {
            primary: "#0f172a",
            secondary: "#334155",
            text: "#f8fafc",
            background: "#0f172a",
            accent: "#1e293b"
          }
        }
      },
      { id: "summary", type: "summary", gridArea: "summary" },
      { id: "skills", type: "skills", gridArea: "sidebar" },
      { id: "experience", type: "experience", gridArea: "main" },
      { id: "projects", type: "projects", gridArea: "main" },
      { id: "education", type: "education", gridArea: "sidebar" },
      { id: "certifications", type: "certifications", gridArea: "sidebar" }
    ],
    grid: {
      areas: [
        "header header",
        "summary summary",
        "main sidebar"
      ],
      columns: ["2fr", "1fr"],
      rows: ["auto", "auto", "1fr"]
    }
  }
};

// Startup template - Professional tier
export const startupTemplate: TemplateDefinition = {
  id: "startup",
  name: "Startup Innovator",
  description: "A dynamic design for startup and entrepreneurial roles",
  category: "professional",
  previewImage: "/templates/startup-preview.png",
  styles: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "14px",
    lineHeight: "1.6",
    colors: {
      primary: "#6366f1",
      secondary: "#4f46e5",
      text: "#111827",
      background: "#ffffff",
      accent: "#e0e7ff"
    },
    spacing: {
      section: "2rem",
      item: "1.5rem"
    }
  },
  layout: {
    sections: [
      { id: "header", type: "header", gridArea: "header" },
      { id: "summary", type: "summary", gridArea: "summary" },
      { id: "experience", type: "experience", gridArea: "main" },
      { id: "projects", type: "projects", gridArea: "main" },
      { id: "skills", type: "skills", gridArea: "sidebar" },
      { id: "education", type: "education", gridArea: "sidebar" },
      { id: "certifications", type: "certifications", gridArea: "sidebar" }
    ],
    grid: {
      areas: [
        "header header",
        "summary summary",
        "main sidebar"
      ],
      columns: ["2fr", "1fr"],
      rows: ["auto", "auto", "1fr"]
    }
  }
};

// Designer template - Enterprise tier
export const designerTemplate: TemplateDefinition = {
  id: "designer",
  name: "Creative Designer",
  description: "A visually striking design for creative professionals",
  category: "enterprise",
  previewImage: "/templates/designer-preview.png",
  styles: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: "14px",
    lineHeight: "1.6",
    colors: {
      primary: "#ec4899",
      secondary: "#f472b6",
      text: "#18181b",
      background: "#ffffff",
      accent: "#fce7f3"
    },
    spacing: {
      section: "2.5rem",
      item: "1.75rem"
    }
  },
  layout: {
    sections: [
      {
        id: "header",
        type: "header",
        gridArea: "header",
        styles: {
          colors: {
            primary: "#ec4899",
            secondary: "#f472b6",
            text: "#ffffff",
            background: "#ec4899",
            accent: "#fce7f3"
          }
        }
      },
      { id: "summary", type: "summary", gridArea: "summary" },
      { id: "experience", type: "experience", gridArea: "main" },
      { id: "projects", type: "projects", gridArea: "main" },
      { id: "skills", type: "skills", gridArea: "sidebar" },
      { id: "education", type: "education", gridArea: "sidebar" },
      { id: "certifications", type: "certifications", gridArea: "sidebar" }
    ],
    grid: {
      areas: [
        "header header",
        "summary summary",
        "main sidebar"
      ],
      columns: ["2fr", "1fr"],
      rows: ["auto", "auto", "1fr"]
    }
  }
};

export const templates = {
  modern: modernTemplate,
  minimalist: minimalistTemplate,
  professional: professionalTemplate,
  executive: executiveTemplate,
  tech: techTemplate,
  startup: startupTemplate,
  creative: creativeTemplate,
  designer: designerTemplate
};

export const getTemplatesByPlan = (plan: "free" | "professional" | "enterprise"): TemplateDefinition[] => {
  const templateList = Object.values(templates);
  
  switch (plan) {
    case "enterprise":
      return templateList;
    case "professional":
      return templateList.filter(t => t.category !== "enterprise");
    case "free":
    default:
      return templateList.filter(t => t.category === "free");
  }
};