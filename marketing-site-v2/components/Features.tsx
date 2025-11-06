'use client';

import { Command, Star, FileImage, Lock } from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

export default function Features() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-25%' });

  const features = [
    {
      icon: <Command className="w-8 h-8" />,
      title: 'Global shortcut',
      description: 'Press ⌘⇧V to instantly access your clipboard history from anywhere. No need to switch apps.',
    },
    {
      icon: <Star className="w-8 h-8" />,
      title: 'Save your favorites',
      description: 'Star items to keep them forever. Unstarred items automatically clean up after 25 entries.',
    },
    {
      icon: <FileImage className="w-8 h-8" />,
      title: 'All content types',
      description: 'Text, images, files, audio, video—Clipp handles everything. Clearly labeled so you know what you\'re pasting.',
    },
    {
      icon: <Lock className="w-8 h-8" />,
      title: '100% local storage',
      description: 'Your clipboard history never leaves your Mac. No cloud, no servers, no tracking. Complete privacy.',
    },
  ];

  return (
    <section ref={ref} id="features" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 space-y-4"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900">
            Key Features
          </h2>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={isInView ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }}
                transition={{ duration: 0.5, delay: 0.2 + 0.1 * index, type: 'spring', stiffness: 150 }}
                className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-4"
              >
                {feature.icon}
              </motion.div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
