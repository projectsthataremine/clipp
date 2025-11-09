'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import ContactModal from './ContactModal';
import { getPricing, formatPrice, type PricingConfig } from '@/lib/config';

export default function FAQ() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-25%' });
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [pricingData, setPricingData] = useState<PricingConfig>({ monthly_price: 2, annual_price: 18 });

  useEffect(() => {
    getPricing().then(setPricingData);
  }, []);

  const faqs = [
    {
      question: 'How does Clipp work?',
      answer: "Clipp runs in the background and monitors your clipboard. Press ⌘⇧V to open a sidebar showing your complete clipboard history. Click any item to copy it again instantly.",
    },
    {
      question: 'What can Clipp save?',
      answer: "Everything! Text, images, files, audio, video—Clipp handles all content types. Each item is clearly labeled so you always know what you're copying.",
    },
    {
      question: 'Is my data private?',
      answer: "Absolutely. Your clipboard history is stored 100% locally on your Mac. Nothing is ever sent to the cloud or our servers. Turn off your Wi-Fi and Clipp still works perfectly.",
    },
    {
      question: 'Can I try before I pay?',
      answer: `Yes! 7-day free trial, no credit card required. Download and start using it immediately. After the trial, it's just ${formatPrice(pricingData.monthly_price)}/month.`,
    },
    {
      question: 'How do favorites work?',
      answer: "Star any item to save it forever. Regular items automatically clean up after 25 entries, but favorites never get deleted. Perfect for frequently-used snippets.",
    },
    {
      question: 'Which Macs are supported?',
      answer: 'Both Apple Silicon (M1/M2/M3/M4) and Intel Macs running macOS 11.0 or later. We have separate downloads for each chip type.',
    },
  ];

  return (
    <section ref={ref} id="faq" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 space-y-4"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900">
            Questions?
          </h2>
          <p className="text-xl text-gray-600">
            Everything you need to know
          </p>
        </motion.div>

        {/* FAQ List */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
            >
              <FAQItem question={faq.question} answer={faq.answer} />
            </motion.div>
          ))}
        </div>

        {/* Contact Note */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12 text-center p-6 bg-blue-50 rounded-xl border border-blue-100"
        >
          <p className="text-gray-700">
            Still have questions?{' '}
            <button
              onClick={() => setIsContactModalOpen(true)}
              className="text-blue-600 hover:text-blue-700 font-semibold underline"
            >
              Get in touch
            </button>
          </p>
        </motion.div>
      </div>

      {/* Contact Modal */}
      <ContactModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} />
    </section>
  );
}

interface FAQItemProps {
  question: string;
  answer: string;
}

function FAQItem({ question, answer }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ backgroundColor: 'rgb(249, 250, 251)' }}
        className="w-full px-6 py-4 flex items-center justify-between text-left transition-colors"
      >
        <span className="font-semibold text-gray-900">{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown size={20} className="text-gray-400" />
        </motion.div>
      </motion.button>
      <motion.div
        initial={false}
        animate={{
          height: isOpen ? 'auto' : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="overflow-hidden"
      >
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <p className="text-gray-700 leading-relaxed">{answer}</p>
        </div>
      </motion.div>
    </div>
  );
}
