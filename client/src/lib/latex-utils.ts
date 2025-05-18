// @ts-ignore
import katex from 'katex';

// LaTeX template configurations
export interface LaTeXTemplate {
  id: string;
  name: string;
  description: string;
  previewImage?: string;
  latexSource: string;
  category: 'free' | 'professional' | 'enterprise';
}

// Function to render LaTeX to HTML
export const renderLatexToHTML = (latex: string): string => {
  try {
    return katex.renderToString(latex, {
      throwOnError: false,
      displayMode: true,
      fleqn: true,
      strict: false
    });
  } catch (error) {
    console.error('LaTeX rendering error:', error);
    return '';
  }
};

// LaTeX template presets
export const latexTemplates: Record<string, LaTeXTemplate> = {
  minimal: {
    id: 'minimal',
    name: 'Minimal LaTeX',
    description: 'Clean and minimalist LaTeX-based resume template',
    category: 'free',
    latexSource: `\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[margin=1in]{geometry}
\\usepackage{hyperref}

\\begin{document}
\\name{[Full Name]}
\\contact{[Email] • [Phone] • [Location]}

\\section{Experience}
% Experience entries will go here

\\section{Education}
% Education entries will go here

\\section{Skills}
% Skills will go here

\\end{document}`
  },
  modern: {
    id: 'modern',
    name: 'Modern Professional',
    description: 'Modern LaTeX template with enhanced typography',
    category: 'professional',
    latexSource: `\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{fontspec}
\\usepackage{titlesec}
\\usepackage[margin=1in]{geometry}
\\usepackage{hyperref}
\\usepackage{fontawesome5}

\\begin{document}
\\header{[Full Name]}{[Professional Title]}

\\section{Professional Summary}
% Summary will go here

\\section{Experience}
% Experience entries will go here

\\section{Education}
% Education entries will go here

\\section{Skills}
% Skills will go here

\\end{document}`
  },
  executive: {
    id: 'executive',
    name: 'Executive Suite',
    description: 'Premium LaTeX template for executive-level professionals',
    category: 'enterprise',
    latexSource: `\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{fontspec}
\\usepackage{titlesec}
\\usepackage[margin=1in]{geometry}
\\usepackage{hyperref}
\\usepackage{fontawesome5}
\\usepackage{multicol}

\\begin{document}
\\executiveheader{[Full Name]}{[Executive Title]}

\\begin{multicols}{2}
\\section{Executive Summary}
% Executive summary will go here

\\section{Core Competencies}
% Core competencies will go here
\\end{multicols}

\\section{Leadership Experience}
% Leadership experience entries will go here

\\section{Board Positions}
% Board positions will go here

\\section{Education}
% Education entries will go here

\\end{document}`
  }
}; 