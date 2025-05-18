// Remove imports and define types locally
type SectionType = "header" | "summary" | "experience" | "education" | "skills" | "certifications" | "projects";

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

export interface TemplateLayout {
  sections: Array<{
    id: string;
    type: SectionType;
    gridArea?: string;
    styles?: Partial<TemplateStyles>;
  }>;
  grid: {
    areas: string[];
    columns: string[];
    rows: string[];
  };
}

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  category: "free" | "professional" | "enterprise";
  previewImage: string;
  styles: TemplateStyles;
  layout?: TemplateLayout;
  latexSource?: boolean;
}

const defaultStyles: TemplateStyles = {
  fontFamily: "'Arial', 'Helvetica', sans-serif",
  fontSize: "14px",
  lineHeight: "1.6",
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
};

const defaultLayout = {
  sections: [
    { id: "header", type: "header" as SectionType, gridArea: "header" },
    { id: "summary", type: "summary" as SectionType, gridArea: "summary" },
    { id: "experience", type: "experience" as SectionType, gridArea: "main" },
    { id: "education", type: "education" as SectionType, gridArea: "sidebar" },
    { id: "skills", type: "skills" as SectionType, gridArea: "sidebar" },
    { id: "certifications", type: "certifications" as SectionType, gridArea: "sidebar" },
    { id: "projects", type: "projects" as SectionType, gridArea: "main" }
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
};

const atsBaseLayout = {
  sections: [
    { id: "header", type: "header" as SectionType, gridArea: "header" },
    { id: "summary", type: "summary" as SectionType, gridArea: "summary" },
    { id: "experience", type: "experience" as SectionType, gridArea: "experience" },
    { id: "education", type: "education" as SectionType, gridArea: "education" },
    { id: "skills", type: "skills" as SectionType, gridArea: "skills" },
    { id: "certifications", type: "certifications" as SectionType, gridArea: "certifications" },
    { id: "projects", type: "projects" as SectionType, gridArea: "projects" }
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
};

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
    ...atsBaseLayout,
    sections: atsBaseLayout.sections.map(section => ({
      ...section,
      styles: {
        colors: {
          primary: "#2563eb",
          secondary: "#64748b",
          text: "#1e293b",
          background: "#ffffff",
          accent: "#e2e8f0"
        }
      }
    }))
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
    ...atsBaseLayout,
    sections: atsBaseLayout.sections.map(section => ({
      ...section,
        styles: {
          colors: {
            primary: "#1e1e1e",
            secondary: "#666666",
            text: "#333333",
          background: "#ffffff",
            accent: "#f0f0f0"
          }
        }
    }))
  }
};

// Creative template - Enterprise tier
export const creativeTemplate: TemplateDefinition = {
  id: "creative",
  name: "Creative Impact",
  description: "A bold and innovative design that stands out while maintaining ATS compatibility",
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
      section: "2rem",
      item: "1.5rem"
    }
  },
  layout: {
    ...atsBaseLayout,
    sections: atsBaseLayout.sections.map(section => ({
      ...section,
        styles: {
          colors: {
            primary: "#6366f1",
            secondary: "#a855f7",
          text: "#1f2937",
          background: "#ffffff",
            accent: "#f3f4f6"
          }
        }
    }))
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
      { id: "header", type: "header" as SectionType, gridArea: "header" },
      { id: "summary", type: "summary" as SectionType, gridArea: "summary" },
      { id: "experience", type: "experience" as SectionType, gridArea: "main" },
      { id: "education", type: "education" as SectionType, gridArea: "main" },
      { id: "skills", type: "skills" as SectionType, gridArea: "sidebar" },
      { id: "certifications", type: "certifications" as SectionType, gridArea: "sidebar" },
      { id: "projects", type: "projects" as SectionType, gridArea: "main" }
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
      { id: "header", type: "header" as SectionType, gridArea: "header" },
      { id: "summary", type: "summary" as SectionType, gridArea: "summary" },
      { id: "skills", type: "skills" as SectionType, gridArea: "skills" },
      { id: "experience", type: "experience" as SectionType, gridArea: "experience" },
      { id: "education", type: "education" as SectionType, gridArea: "education" },
      { id: "certifications", type: "certifications" as SectionType, gridArea: "certifications" },
      { id: "projects", type: "projects" as SectionType, gridArea: "projects" }
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
        type: "header" as SectionType,
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
      { id: "summary", type: "summary" as SectionType, gridArea: "summary" },
      { id: "skills", type: "skills" as SectionType, gridArea: "sidebar" },
      { id: "experience", type: "experience" as SectionType, gridArea: "main" },
      { id: "projects", type: "projects" as SectionType, gridArea: "main" },
      { id: "education", type: "education" as SectionType, gridArea: "sidebar" },
      { id: "certifications", type: "certifications" as SectionType, gridArea: "sidebar" }
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
    fontFamily: "'Calibri', 'Arial', sans-serif",
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
      { id: "header", type: "header" as SectionType, gridArea: "header" },
      { id: "summary", type: "summary" as SectionType, gridArea: "summary" },
      { id: "experience", type: "experience" as SectionType, gridArea: "main" },
      { id: "projects", type: "projects" as SectionType, gridArea: "main" },
      { id: "skills", type: "skills" as SectionType, gridArea: "sidebar" },
      { id: "education", type: "education" as SectionType, gridArea: "sidebar" },
      { id: "certifications", type: "certifications" as SectionType, gridArea: "sidebar" }
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
        type: "header" as SectionType,
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
      { id: "summary", type: "summary" as SectionType, gridArea: "summary" },
      { id: "experience", type: "experience" as SectionType, gridArea: "main" },
      { id: "projects", type: "projects" as SectionType, gridArea: "main" },
      { id: "skills", type: "skills" as SectionType, gridArea: "sidebar" },
      { id: "education", type: "education" as SectionType, gridArea: "sidebar" },
      { id: "certifications", type: "certifications" as SectionType, gridArea: "sidebar" }
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

export const templates: Record<string, TemplateDefinition> = {
  // Free templates (10)
  modern: modernTemplate,
  minimalist: {
    ...minimalistTemplate,
    layout: {
      ...atsBaseLayout,
      sections: atsBaseLayout.sections.map(section => ({
        ...section,
        styles: {
          colors: {
            primary: "#2d3748",
            secondary: "#718096",
            text: "#4a5568",
            background: "#ffffff",
            accent: "#edf2f7"
          }
        }
      }))
    }
  },
  tech_minimal: {
    id: "tech_minimal",
    name: "Tech Minimal",
    description: "Clean, minimalist design for tech professionals",
    category: "free",
    previewImage: "/templates/tech-minimal-preview.png",
    latexSource: true,
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
        section: "1.5rem",
        item: "1rem"
      }
    },
    layout: {
      ...atsBaseLayout,
      sections: atsBaseLayout.sections.map(section => ({
        ...section,
        styles: {
          colors: {
            primary: "#0f172a",
            secondary: "#334155",
            text: "#1e293b",
            background: "#ffffff",
            accent: "#f1f5f9"
          }
        }
      }))
    }
  },
  startup_modern: {
    id: "startup_modern",
    name: "Startup Modern",
    description: "Contemporary design for startup and tech roles",
    category: "free",
    previewImage: "/templates/startup-modern-preview.png",
    styles: {
      fontFamily: "'Calibri', 'Arial', sans-serif",
      fontSize: "14px",
      lineHeight: "1.6",
      colors: {
        primary: "#6366F1",
        secondary: "#818CF8",
        text: "#111827",
        background: "#ffffff",
        accent: "#E0E7FF"
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
              primary: "#6366F1",
              secondary: "#818CF8",
              text: "#ffffff",
              background: "linear-gradient(135deg, #6366F1, #818CF8)",
              accent: "#E0E7FF"
            }
          }
        },
        { id: "summary", type: "summary", gridArea: "summary" },
        { id: "skills", type: "skills", gridArea: "skills" },
        { id: "experience", type: "experience", gridArea: "main" },
        { id: "projects", type: "projects", gridArea: "main" },
        { id: "education", type: "education", gridArea: "sidebar" },
        { id: "certifications", type: "certifications", gridArea: "sidebar" }
      ],
      grid: {
        areas: [
          "header header",
          "summary summary",
          "skills skills",
          "main sidebar"
        ],
        columns: ["2fr", "1fr"],
        rows: ["auto", "auto", "auto", "1fr"]
      }
    }
  },
  academic_basic: {
    id: "academic_basic",
    name: "Academic Basic",
    description: "Simple academic CV template with clean typography",
    category: "free",
    previewImage: "/templates/academic-basic-preview.png",
    styles: {
      fontFamily: "'Times New Roman', 'Georgia', serif",
      fontSize: "14px",
      lineHeight: "1.8",
      colors: {
        primary: "#8B0000",
        secondary: "#4A4F55",
        text: "#2C3338",
        background: "#FFFFFF",
        accent: "#F5F5F5"
      },
      spacing: {
        section: "2.5rem",
        item: "1.75rem"
      }
    },
    layout: {
      sections: [
        { id: "header", type: "header", gridArea: "header" },
        { id: "summary", type: "summary", gridArea: "summary" },
        { id: "education", type: "education", gridArea: "education" },
        { id: "experience", type: "experience", gridArea: "experience" },
        { id: "projects", type: "projects", gridArea: "publications" },
        { id: "skills", type: "skills", gridArea: "skills" },
        { id: "certifications", type: "certifications", gridArea: "certifications" }
      ],
      grid: {
        areas: [
          "header",
          "summary",
          "education",
          "experience",
          "projects",
          "skills",
          "certifications"
        ],
        columns: ["1fr"],
        rows: ["auto", "auto", "auto", "auto", "auto", "auto", "auto"]
      }
    }
  },
  fresh_grad: {
    id: "fresh_grad",
    name: "Fresh Graduate",
    description: "Perfect for recent graduates and entry-level positions",
    category: "free",
    previewImage: "/templates/fresh-grad-preview.png",
    styles: {
      fontFamily: "'Arial', 'Helvetica', sans-serif",
      fontSize: "14px",
      lineHeight: "1.6",
      colors: {
        primary: "#003366",
        secondary: "#004080",
        text: "#111827",
        background: "#FFFFFF",
        accent: "#E6EEF4"
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
              primary: "#003366",
              secondary: "#004080",
              text: "#ffffff",
              background: "linear-gradient(135deg, #003366 0%, #003366 100%)",
              accent: "#E6EEF4"
            }
          }
        },
        { id: "summary", type: "summary", gridArea: "summary" },
        { id: "education", type: "education", gridArea: "education" },
        { id: "experience", type: "experience", gridArea: "experience" },
        { id: "skills", type: "skills", gridArea: "skills" },
        { id: "projects", type: "projects", gridArea: "projects" },
        { id: "certifications", type: "certifications", gridArea: "certifications" }
      ],
      grid: {
        areas: [
          "header",
          "summary",
          "education",
          "experience",
          "skills",
          "projects",
          "certifications"
        ],
        columns: ["1fr"],
        rows: ["auto", "auto", "auto", "auto", "auto", "auto", "auto"]
      }
    }
  },
  classic_clean: {
    id: "classic_clean",
    name: "Classic Clean",
    description: "Timeless design with perfect readability",
    category: "free",
    previewImage: "/templates/classic-clean-preview.png",
    styles: {
      fontFamily: "'Georgia', 'Times New Roman', serif",
      fontSize: "14px",
      lineHeight: "1.6",
      colors: {
        primary: "#14181B",
        secondary: "#4B5563",
        text: "#1F2937",
        background: "#FFFFFF",
        accent: "#E5E7EB"
      },
      spacing: {
        section: "2rem",
        item: "1.5rem"
      }
    },
    layout: {
      sections: [
        { id: "header", type: "header", gridArea: "header" },
        { id: "summary", type: "summary", gridArea: "left" },
        { id: "experience", type: "experience", gridArea: "left" },
        { id: "education", type: "education", gridArea: "left" },
        { id: "skills", type: "skills", gridArea: "right" },
        { id: "certifications", type: "certifications", gridArea: "right" },
        { id: "projects", type: "projects", gridArea: "right" }
      ],
      grid: {
        areas: [
          "header header",
          "left right"
        ],
        columns: ["65%", "35%"],
        rows: ["auto", "1fr"]
      }
    }
  },
  compact_modern: {
    id: "compact_modern",
    name: "Compact Modern",
    description: "Space-efficient design for comprehensive resumes",
    category: "free",
    previewImage: "/templates/compact-modern-preview.png",
    styles: {
      fontFamily: "'Helvetica', 'Arial', sans-serif",
      fontSize: "13px",
      lineHeight: "1.4",
      colors: {
        primary: "#000000",
        secondary: "#666666",
        text: "#333333",
        background: "#FFFFFF",
        accent: "#F5F5F5"
      },
      spacing: {
        section: "1.25rem",
        item: "1rem"
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
              primary: "#000000",
              secondary: "#666666",
              text: "#FFFFFF",
              background: "#000000",
              accent: "#F5F5F5"
            }
          }
        },
        { id: "summary", type: "summary", gridArea: "summary" },
        { id: "experience", type: "experience", gridArea: "col1" },
        { id: "education", type: "education", gridArea: "col1" },
        { id: "skills", type: "skills", gridArea: "col2" },
        { id: "certifications", type: "certifications", gridArea: "col2" },
        { id: "projects", type: "projects", gridArea: "col2" }
      ],
      grid: {
        areas: [
          "header header",
          "summary summary",
          "col1 col2"
        ],
        columns: ["60%", "40%"],
        rows: ["auto", "auto", "1fr"]
      }
    }
  },
  basic_professional: {
    id: "basic_professional",
    name: "Basic Professional",
    description: "Professional template for traditional industries",
    category: "free",
    previewImage: "/templates/basic-professional-preview.png",
    styles: {
      fontFamily: "'Garamond', 'Times New Roman', serif",
      fontSize: "14px",
      lineHeight: "1.6",
      colors: {
        primary: "#14181B",
        secondary: "#4B5563",
        text: "#2F3437",
        background: "#FFFFFF",
        accent: "#D1D5DB"
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
        { id: "experience", type: "experience", gridArea: "experience" },
        { id: "education", type: "education", gridArea: "education" },
        { id: "skills", type: "skills", gridArea: "skills" },
        { id: "certifications", type: "certifications", gridArea: "certifications" }
      ],
      grid: {
        areas: [
          "header",
          "summary",
          "experience",
          "education",
          "skills",
          "certifications"
        ],
        columns: ["1fr"],
        rows: ["auto", "auto", "auto", "auto", "auto", "auto"]
      }
    }
  },
  simple_elegant: {
    id: "simple_elegant",
    name: "Simple Elegant",
    description: "Clean and elegant design for all professionals",
    category: "free",
    previewImage: "/templates/simple-elegant-preview.png",
    styles: {
      fontFamily: "'Times New Roman', 'Georgia', serif",
      fontSize: "14px",
      lineHeight: "1.6",
      colors: {
        primary: "#6A5ACD",
        secondary: "#5B4DBE",
        text: "#333333",
        background: "#FFFFFF",
        accent: "#F8F8FF"
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
              primary: "#6A5ACD",
              secondary: "#5B4DBE",
              text: "#FFFFFF",
              background: "#6A5ACD",
              accent: "#F8F8FF"
            }
          }
        },
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
  },

  // Professional templates (10)
  tech_pro: {
    id: "tech_pro",
    name: "Tech Pro",
    description: "Advanced template for tech professionals",
    category: "professional",
    previewImage: "/templates/tech-pro-preview.png",
    latexSource: true,
    styles: defaultStyles,
    layout: defaultLayout
  },
  executive_pro: {
    id: "executive_pro",
    name: "Executive Pro",
    description: "Professional template for executives",
    category: "professional",
    previewImage: "/templates/executive-pro-preview.png",
    latexSource: true,
    styles: defaultStyles,
    layout: defaultLayout
  },
  creative_pro: {
    id: "creative_pro",
    name: "Creative Pro",
    description: "Professional template for creative roles",
    category: "professional",
    previewImage: "/templates/creative-pro-preview.png",
    latexSource: true,
    styles: defaultStyles,
    layout: defaultLayout
  },
  modern_pro: {
    id: "modern_pro",
    name: "Modern Pro",
    description: "Professional modern template",
    category: "professional",
    previewImage: "/templates/modern-pro-preview.png",
    latexSource: true,
    styles: defaultStyles,
    layout: defaultLayout
  },
  academic_pro: {
    id: "academic_pro",
    name: "Academic Pro",
    description: "Advanced academic CV template",
    category: "professional",
    previewImage: "/templates/academic-pro-preview.png",
    latexSource: true,
    styles: defaultStyles,
    layout: defaultLayout
  },
  consultant_pro: {
    id: "consultant_pro",
    name: "Consultant Pro",
    description: "Professional template for consultants",
    category: "professional",
    previewImage: "/templates/consultant-pro-preview.png",
    latexSource: true,
    styles: defaultStyles,
    layout: defaultLayout
  },
  research_pro: {
    id: "research_pro",
    name: "Research Pro",
    description: "Advanced template for researchers",
    category: "professional",
    previewImage: "/templates/research-pro-preview.png",
    latexSource: true,
    styles: defaultStyles,
    layout: defaultLayout
  },
  business_pro: {
    id: "business_pro",
    name: "Business Pro",
    description: "Professional template for business roles",
    category: "professional",
    previewImage: "/templates/business-pro-preview.png",
    latexSource: true,
    styles: defaultStyles,
    layout: defaultLayout
  },
  modern_executive: {
    id: "modern_executive",
    name: "Modern Executive",
    description: "Contemporary executive template",
    category: "professional",
    previewImage: "/templates/modern-executive-preview.png",
    latexSource: true,
    styles: defaultStyles,
    layout: defaultLayout
  },

  // Enterprise templates (10)
  enterprise_executive: {
    id: "enterprise_executive",
    name: "Enterprise Executive",
    description: "Premium executive template",
    category: "enterprise",
    previewImage: "/templates/enterprise-executive-preview.png",
    latexSource: true,
    styles: defaultStyles,
    layout: defaultLayout
  },
  enterprise_creative: {
    id: "enterprise_creative",
    name: "Enterprise Creative",
    description: "Premium creative template",
    category: "enterprise",
    previewImage: "/templates/enterprise-creative-preview.png",
    latexSource: true,
    styles: defaultStyles,
    layout: defaultLayout
  },
  board_member: {
    id: "board_member",
    name: "Board Member",
    description: "Exclusive template for board positions",
    category: "enterprise",
    previewImage: "/templates/board-member-preview.png",
    latexSource: true,
    styles: defaultStyles,
    layout: defaultLayout
  },
  investor_ready: {
    id: "investor_ready",
    name: "Investor Ready",
    description: "Premium template for investment professionals",
    category: "enterprise",
    previewImage: "/templates/investor-ready-preview.png",
    latexSource: true,
    styles: defaultStyles,
    layout: defaultLayout
  },
  global_executive: {
    id: "global_executive",
    name: "Global Executive",
    description: "Premium template for international executives",
    category: "enterprise",
    previewImage: "/templates/global-executive-preview.png",
    latexSource: true,
    styles: defaultStyles,
    layout: defaultLayout
  },
  startup_founder: {
    id: "startup_founder",
    name: "Startup Founder",
    description: "Premium template for founders and entrepreneurs",
    category: "enterprise",
    previewImage: "/templates/startup-founder-preview.png",
    latexSource: true,
    styles: defaultStyles,
    layout: defaultLayout
  },
  venture_capital: {
    id: "venture_capital",
    name: "Venture Capital",
    description: "Premium template for VC professionals",
    category: "enterprise",
    previewImage: "/templates/venture-capital-preview.png",
    latexSource: true,
    styles: defaultStyles,
    layout: defaultLayout
  },
  cto_special: {
    id: "cto_special",
    name: "CTO Special",
    description: "Premium template for technical executives",
    category: "enterprise",
    previewImage: "/templates/cto-special-preview.png",
    latexSource: true,
    styles: defaultStyles,
    layout: defaultLayout
  },
  executive_board: {
    id: "executive_board",
    name: "Executive Board",
    description: "Premium template for board executives",
    category: "enterprise",
    previewImage: "/templates/executive-board-preview.png",
    latexSource: true,
    styles: defaultStyles,
    layout: defaultLayout
  }
};

export const getTemplatesByPlan = (plan: "free" | "professional" | "enterprise"): TemplateDefinition[] => {
  const allTemplates = Object.values(templates).map(template => ({
    ...template,
    layout: template.layout || atsBaseLayout // Ensure all templates have the ATS-friendly layout
  }));
  
  switch (plan) {
    case 'enterprise':
      return allTemplates;
    case 'professional':
      return allTemplates.filter(template => template.category !== 'enterprise');
    default:
      return allTemplates.filter(template => template.category === 'free');
  }
};