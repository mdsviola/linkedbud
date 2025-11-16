import type { Testimonial, WorkflowStep } from "@/marketing/types/marketing";

export const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    accent: "Listen",
    title: "Capture and curate",
    description:
      "linkedbud continuously watches LinkedIn, newsletters, and RSS feeds in your industry to surface only what your audience cares about.",
  },
  {
    accent: "Create",
    title: "Compose with context",
    description:
      "Blend AI-assisted drafting with your brand voice controls. Pull in research, inject personality, and ship threads or singles without the blank-page stress.",
  },
  {
    accent: "Grow",
    title: "Schedule and learn",
    description:
      "Auto-publish with smart timing, measure engagement, and let our insight engine recommend your next move with confidence.",
  },
];

export const WORKFLOW_TESTIMONIAL: Testimonial = {
  quote:
    "linkedbud turned our leadership team into consistent LinkedIn storytellers. We repurpose news instantly and keep a month of content ready to go.",
  author: "Marissa Hope",
  role: "VP Marketing, Northbeam Capital",
};
