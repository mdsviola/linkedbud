import type { MotionProps, Transition, Variants } from "framer-motion";

// Shared motion helper utilities for marketing animations.

type FadeOptions = {
  delay?: number;
  duration?: number;
  distance?: number;
  once?: boolean;
  amount?: number;
};

type ScaleFadeOptions = FadeOptions & {
  scaleFrom?: number;
};

export const createStaggeredFadeVariants = ({
  duration = 0.6,
  distance = 24,
  ease = "easeOut",
}: {
  duration?: number;
  distance?: number;
  ease?: Transition["ease"];
} = {}): Variants => ({
  hidden: { opacity: 0, y: distance },
  visible: (index = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: index * 0.08, duration, ease },
  }),
});

export const fadeInUp = ({
  delay = 0,
  duration = 0.6,
  distance = 24,
  once = true,
  amount = 0.5,
}: FadeOptions = {}): MotionProps => ({
  initial: { opacity: 0, y: distance },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration, delay, ease: "easeOut" },
  viewport: { once, amount },
});

export const fadeIn = ({
  delay = 0,
  duration = 0.6,
  once = true,
  amount = 0.5,
}: FadeOptions = {}): MotionProps => ({
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  transition: { duration, delay, ease: "easeOut" },
  viewport: { once, amount },
});

export const scaleFadeIn = ({
  delay = 0,
  duration = 0.6,
  distance = 30,
  scaleFrom = 0.95,
  once = true,
  amount = 0.5,
}: ScaleFadeOptions = {}): MotionProps => ({
  initial: { opacity: 0, y: distance, scale: scaleFrom },
  whileInView: { opacity: 1, y: 0, scale: 1 },
  transition: { duration, delay, ease: "easeOut" },
  viewport: { once, amount },
});

export const slideInFromRight = ({
  delay = 0,
  duration = 0.6,
  distance = 40,
  once = true,
  amount = 0.5,
}: FadeOptions = {}): MotionProps => ({
  initial: { opacity: 0, x: distance },
  whileInView: { opacity: 1, x: 0 },
  transition: { duration, delay, ease: "easeOut" },
  viewport: { once, amount },
});

export const continuousRotate = ({
  duration = 40,
}: {
  duration?: number;
} = {}): MotionProps => ({
  animate: { rotate: 360 },
  transition: { repeat: Infinity, duration, ease: "linear" },
});
