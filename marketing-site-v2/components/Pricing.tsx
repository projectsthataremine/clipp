'use client';

import { Check, Download } from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { getPricing, formatPrice, getAnnualMonthlyRate, getAnnualSavings, type PricingConfig } from '@/lib/config';

export default function Pricing() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-25%' });
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly');
  const [pricingData, setPricingData] = useState<PricingConfig>({ monthly_price: 2, annual_price: 18 });

  useEffect(() => {
    getPricing().then(setPricingData);
  }, []);

  const features = [
    'Unlimited clipboard history',
    'Save favorites forever',
    'Text, images, files & media',
    'Global keyboard shortcut',
    '100% local storage',
    'One-click copy',
  ];

  const annualMonthlyRate = getAnnualMonthlyRate(pricingData);
  const annualSavings = getAnnualSavings(pricingData);

  const pricing = {
    monthly: {
      price: formatPrice(pricingData.monthly_price),
      period: '/month',
      total: `${formatPrice(pricingData.monthly_price)}/month`
    },
    annual: {
      price: formatPrice(pricingData.annual_price),
      period: '/year',
      total: `${formatPrice(annualMonthlyRate)}/month`,
      savings: `Save ${formatPrice(annualSavings)}/year`
    },
  };

  return (
    <section ref={ref} id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 space-y-4"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900">
            Simple pricing per machine
          </h2>
          <p className="text-xl text-gray-600">
            Cancel anytime. No hidden fees.
          </p>

          {/* Billing Toggle */}
          <div className="flex justify-center mt-8">
            <div className="bg-white rounded-lg p-1 shadow-sm border border-gray-200">
              <button
                onClick={() => setBillingInterval('monthly')}
                className={`px-6 py-2 rounded-md font-medium transition-all ${
                  billingInterval === 'monthly'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingInterval('annual')}
                className={`px-6 py-2 rounded-md font-medium transition-all ${
                  billingInterval === 'annual'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Annual
              </button>
            </div>
          </div>
        </motion.div>

        {/* Pricing Card */}
        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-2xl shadow-xl border-2 border-blue-200 overflow-hidden relative"
          >
            {/* Shimmer effect */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={isInView ? { x: '200%' } : { x: '-100%' }}
              transition={{ duration: 1.5, delay: 0.5, ease: 'easeInOut' }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
              style={{ transform: 'skewX(-20deg)' }}
            />

            {/* Card Header */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-8 py-10 text-center text-white relative">
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-bold">{pricing[billingInterval].price}</span>
                <span className="text-xl text-blue-100">{pricing[billingInterval].period}</span>
              </div>
              <p className="mt-2 text-blue-100">
                {billingInterval === 'annual' && pricing.annual.savings}
                {billingInterval === 'annual' && ' • '}
                {billingInterval === 'annual' ? pricing.annual.total : '1 machine'} • 7-day free trial
              </p>
            </div>

            {/* Card Body */}
            <div className="px-8 py-10">
              {/* Features List */}
              <ul className="space-y-4 mb-8">
                {features.map((feature, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                    transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={isInView ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }}
                      transition={{ duration: 0.4, delay: 0.5 + index * 0.1, type: 'spring', stiffness: 200 }}
                      className="flex-shrink-0 w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mt-0.5"
                    >
                      <Check size={14} className="text-blue-600" />
                    </motion.div>
                    <span className="text-gray-700">{feature}</span>
                  </motion.li>
                ))}
              </ul>

              {/* CTA Button */}
              <motion.a
                href="/download"
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: 1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full hidden md:inline-flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-lg"
              >
                <Download size={20} />
                Download Free
              </motion.a>

              {/* Fine Print */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.5, delay: 1.2 }}
                className="mt-4 text-sm text-center text-gray-500"
              >
                No credit card required for trial
              </motion.p>
            </div>
          </motion.div>

          {/* Bottom Note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.6, delay: 1.4 }}
            className="mt-8 text-center"
          >
            <p className="text-gray-600">
              Updates and improvements included
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
