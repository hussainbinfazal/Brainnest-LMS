'use client';

import React from 'react';
import { motion, useSpring, useScroll } from 'framer-motion'; // make sure you're importing from 'framer-motion'

const Scroller = () => {
  const { scrollYProgress } = useScroll();
  

  return (
    <motion.div
    style={{ scaleX: scrollYProgress }}
      className="h-[3px] bg-[#0077b6] rounded-sm dark:bg-[#ffff3f] fixed top-0 left-0 right-0 z-50 origin-left"
    />
  );
};

export default Scroller;
