"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

export function MotionReveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={false}
      whileInView={shouldReduceMotion ? undefined : { opacity: [0.96, 1], y: [10, 0] }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
