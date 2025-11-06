'use client';

import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import ContactModal from './ContactModal';
import TermsModal from './TermsModal';
import PrivacyModal from './PrivacyModal';

export default function Footer() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-25%' });
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  const sections = [
    {
      title: 'Product',
      links: [
        { name: 'Features', href: '#features' },
        { name: 'Pricing', href: '#pricing' },
        { name: 'Download', href: '#download' },
      ],
    },
    {
      title: 'Company',
      links: [
        { name: 'Contact', href: '#contact', onClick: () => setIsContactModalOpen(true) },
      ],
    },
    {
      title: 'Legal',
      links: [
        { name: 'Terms of Service', href: '#terms', onClick: () => setIsTermsModalOpen(true) },
        { name: 'Privacy Policy', href: '#privacy', onClick: () => setIsPrivacyModalOpen(true) },
      ],
    },
  ];

  return (
    <footer ref={ref} className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3">
              <img
                src="/icon-trans.png"
                alt="Clipp Icon"
                className="h-8 w-8"
              />
            </div>
            <p className="text-sm">
              Simple clipboard history for Mac. Everything you need, nothing you don't.
            </p>
          </motion.div>

          {/* Links Sections */}
          {sections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.1 * (index + 1) }}
            >
              <h4 className="font-semibold text-white mb-4">{section.title}</h4>
              <ul className="space-y-2 text-sm">
                {section.links.map((link) => (
                  <li key={link.name}>
                    {link.onClick ? (
                      <button
                        onClick={link.onClick}
                        className="hover:text-white transition-colors"
                      >
                        {link.name}
                      </button>
                    ) : (
                      <Link
                        href={link.href}
                        className="hover:text-white transition-colors"
                      >
                        {link.name}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm"
        >
          <p>&copy; {new Date().getFullYear()} Clipp. All rights reserved.</p>
          <p className="text-gray-500">
            Made with care for Mac users
          </p>
        </motion.div>
      </div>

      {/* Modals */}
      <ContactModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} />
      <TermsModal isOpen={isTermsModalOpen} onClose={() => setIsTermsModalOpen(false)} />
      <PrivacyModal isOpen={isPrivacyModalOpen} onClose={() => setIsPrivacyModalOpen(false)} />
    </footer>
  );
}
