type CompanyValue = {
  title: string;
  description: string;
};

type CompanyMilestone = {
  year: string;
  title: string;
  description: string;
};

export const COMPANY_VALUES: CompanyValue[] = [
  {
    title: "Craft clarity",
    description:
      "We translate complex ideas into narratives people want to share. Every pixel and every word should feel intentional.",
  },
  {
    title: "Stay LinkedIn-native",
    description:
      "Platform focus matters. We obsess over LinkedIn patterns so our customers don’t have to retrofit generic playbooks.",
  },
  {
    title: "Ship with heart",
    description:
      "Automation should amplify human voices, not replace them. Linkedbud keeps creators in the loop and celebrates their POV.",
  },
];

export const COMPANY_MILESTONES: CompanyMilestone[] = [
  {
    year: "2025",
    title: "Building the foundation",
    description:
      "We started building Linkedbud to solve the challenge of creating consistent, high-quality LinkedIn content. Our team began developing AI-assisted workflows that keep your voice at the center while automating the tedious parts of content creation.",
  },
  {
    year: "2026",
    title: "Linkedbud today",
    description:
      "We're expanding the platform so distributed teams can ideate, approve, and schedule content in rhythm with the conversations happening on LinkedIn right now. Early users are already seeing how AI-powered tools amplify their storytelling.",
  },
];
