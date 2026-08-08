'use client';

import React, { JSX } from 'react';
import { motion, useSpring, useScroll } from 'framer-motion'; // make sure you're importing from 'framer-motion'
import { cn } from '@/lib/utils';

const Scroller = ({className}: {className?: string}): JSX.Element => {
  const { scrollYProgress } = useScroll();


  return (
    <motion.div
      style={{ scaleX: scrollYProgress }}
      className={cn("h-0.75 bg-[#0077b6] rounded-sm dark:bg-[#ffff3f] fixed top-0 left-0 right-0 z-50 origin-left", className)}
    />
  );
};

export default Scroller;
