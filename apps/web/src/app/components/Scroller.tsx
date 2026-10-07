'use client';

import type { JSX } from 'react';
import { motion, useScroll } from 'framer-motion';
import { cn } from '@/lib/utils';


export const Scroller = ({ progress, className }: { progress?: number, className?: string }): JSX.Element => {
  const { scrollYProgress } = useScroll();


  return (
    <motion.div
      style={{ scaleX: scrollYProgress }}
      className={cn("h-0.75 bg-[#0077b6] rounded-sm dark:bg-[#ffff3f] fixed top-0 left-0 right-0 z-50 origin-left", className)}
    />
  );
};
export const ProgressScroller = ({ progress = 0, className }: { progress?: number, className?: string }): JSX.Element => {
  const percentage = Number.isFinite(progress) ? Math.min(100, Math.max(0, progress)) : 0;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        role="progressbar"
        aria-label="Upload progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentage}
        className="h-2 min-w-0 flex-1 overflow-hidden rounded-sm bg-gray-200 dark:bg-neutral-800"
      >
        <motion.div
          style={{ scaleX: percentage / 100 }}
          className="h-full w-full origin-left rounded-sm bg-[#0077b6] dark:bg-[#ffff3f]"
        />
      </div>
      <span className="min-w-10 text-right text-xs tabular-nums text-gray-600 dark:text-gray-300">
        {Math.round(percentage)}%
      </span>
    </div>
  );
};

;
