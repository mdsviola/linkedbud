"use client";

import { IdeasShowcase, Idea } from "@/components/ideas-showcase";

const sampleIdeas: Idea[] = [
  {
    title: "AI-powered Creativity",
    description:
      "Use AI to generate design ideas on demand. Transform your creative workflow with instant inspiration.",
  },
  {
    title: "Collaboration Space",
    description:
      "Build shared creative boards with live updates. Connect your team in real-time.",
  },
  {
    title: "Smart Automation",
    description:
      "Automate repetitive tasks and focus on what matters. Let technology handle the busy work.",
  },
  {
    title: "Data-Driven Insights",
    description:
      "Make informed decisions with real-time analytics. Turn data into actionable strategies.",
  },
  {
    title: "Seamless Integration",
    description:
      "Connect all your favorite tools in one place. Streamline your workflow effortlessly.",
  },
  {
    title: "Mobile-First Design",
    description:
      "Experience full functionality on any device. Work from anywhere, anytime.",
  },
  {
    title: "Advanced Security",
    description:
      "Enterprise-grade security to protect your data. Stay safe and compliant.",
  },
  {
    title: "Custom Workflows",
    description:
      "Tailor your experience to match your needs. Build workflows that work for you.",
  },
];

export default function IdeasShowcaseDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Ideas Showcase
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Watch bubbles burst to reveal creative ideas
          </p>
        </div>

        <IdeasShowcase
          ideas={sampleIdeas}
          burstInterval={3500}
          ideaDisplayDuration={2500}
          className="mb-12"
        />

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Customize the component by passing your own ideas array
          </p>
        </div>
      </div>
    </div>
  );
}
