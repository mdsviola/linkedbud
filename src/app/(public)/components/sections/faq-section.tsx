"use client";

import { Accordion } from "@/components/ui/accordion";

import { Container } from "@/marketing/components/common";
import { FAQItem, SectionHeader } from "@/marketing/components/ui";
import { FAQ_ITEMS } from "@/marketing/data/faq";

type FAQSectionProps = {
  className?: string;
};

// FAQSection renders the accordion of marketing FAQs with consistent styling.
export function FAQSection({ className = "" }: FAQSectionProps) {
  return (
    <section className={`py-20 ${className}`}>
      <Container width="narrow" className="text-center">
        <SectionHeader
          align="center"
          title="Frequently asked questions"
          description="Everything you need to know about how linkedbud helps you show up consistently on LinkedIn."
        />
      </Container>

      <Container width="narrow" className="mt-12">
        <Accordion className="space-y-4">
          {FAQ_ITEMS.map((faq, index) => (
            <FAQItem key={faq.question} defaultOpen={index === 0} {...faq} />
          ))}
        </Accordion>
      </Container>
    </section>
  );
}

