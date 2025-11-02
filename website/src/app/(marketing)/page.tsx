"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import "./home.scss";

export default function HomePage() {
  return (
    <section className="hero">
      <motion.div
        className="hero-image"
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          opacity: { duration: 0.4, ease: "easeOut" },
          scale: {
            type: "spring",
            stiffness: 200,
            damping: 14,
          },
        }}
      >
        <Image
          src="/hero.png"
          alt="Clipp screenshot"
          priority
          width={1200}
          height={800}
          style={{ width: "100%", height: "auto" }}
        />
      </motion.div>

      <motion.h1
        className="hero-title"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          opacity: { duration: 0.4, ease: "easeOut", delay: 0.5 },
          y: {
            type: "spring",
            stiffness: 60,
            damping: 12,
            delay: 0.5,
          },
        }}
      >
        Clipboard history, made simple
      </motion.h1>

      <motion.p
        className="hero-subtitle"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          opacity: { duration: 0.4, ease: "easeOut", delay: 0.6 },
          y: {
            type: "spring",
            stiffness: 60,
            damping: 12,
            delay: 0.6,
          },
        }}
      >
        Built for people who don’t need the extras — just simple clipboard
        history
      </motion.p>
    </section>
  );
}
