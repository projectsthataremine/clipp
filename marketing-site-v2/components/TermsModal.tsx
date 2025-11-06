'use client';

import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TermsModal({ isOpen, onClose }: TermsModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="px-8 py-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                <h2 className="text-3xl font-bold text-gray-900">Terms of Service</h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Content */}
              <div className="px-8 py-6 overflow-y-auto">
                <div className="prose prose-sm max-w-none text-gray-900">
                  <p className="text-gray-600 text-sm mb-6">
                    <strong>Last Updated:</strong> January 5, 2025
                  </p>

                  <h3 className="text-xl font-bold mt-8 mb-4">1. Acceptance of Terms</h3>
                  <p>
                    These Terms of Service ("Terms") constitute a legally binding agreement between you and Vizcreator LLC, a Delaware limited liability company ("Vizcreator," "we," "us," or "our"), regarding your use of Clipp, including our desktop application and website located at https://tryclipp.com (collectively, the "Service").
                  </p>
                  <p>
                    By downloading, installing, or using Clipp, you agree to be bound by these Terms. If you do not agree to these Terms, do not use the Service.
                  </p>

                  <h3 className="text-xl font-bold mt-8 mb-4">2. Description of Service</h3>
                  <p>
                    Clipp is a macOS clipboard history manager that monitors and stores clipboard history, providing users with quick access to previously copied content including text, images, files, and audio.
                  </p>

                  <h3 className="text-xl font-bold mt-8 mb-4">3. Account Registration</h3>
                  <p>
                    To access certain features of the Service, you must create an account by signing in through Google authentication or email. You agree to:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Provide accurate and complete information during registration</li>
                    <li>Maintain the security of your account credentials</li>
                    <li>Notify us immediately of any unauthorized access to your account</li>
                    <li>Accept responsibility for all activities under your account</li>
                  </ul>
                  <p>
                    We collect and process your email address and certain profile information from your Google account in accordance with our Privacy Policy.
                  </p>

                  <h3 className="text-xl font-bold mt-8 mb-4">4. Subscription and Payment</h3>

                  <h4 className="text-lg font-semibold mt-6 mb-3">4.1 Free Trial</h4>
                  <p>
                    Clipp offers a free trial period. During the trial, you may access the Service without payment. At the end of the trial period, your access will be limited unless you subscribe to a paid plan.
                  </p>

                  <h4 className="text-lg font-semibold mt-6 mb-3">4.2 Subscription Plans</h4>
                  <p>
                    Following the trial period, continued use of Clipp requires a paid subscription. Subscription fees are billed on a recurring basis (monthly or annually, depending on the plan selected).
                  </p>

                  <h4 className="text-lg font-semibold mt-6 mb-3">4.3 Billing and Renewal</h4>
                  <p>
                    By subscribing, you authorize us to charge your payment method for the subscription fee plus any applicable taxes. Your subscription will automatically renew at the end of each billing period unless you cancel before the renewal date.
                  </p>

                  <h4 className="text-lg font-semibold mt-6 mb-3">4.4 Cancellation</h4>
                  <p>
                    You may cancel your subscription at any time through the Service. Cancellation will take effect at the end of your current billing period. You will retain access to the Service until the end of the paid period.
                  </p>

                  <h4 className="text-lg font-semibold mt-6 mb-3">4.5 No Refunds</h4>
                  <p className="font-semibold">
                    All subscription fees are non-refundable. We do not provide refunds or credits for partial subscription periods, including if you cancel your subscription before the end of a billing period.
                  </p>

                  <h3 className="text-xl font-bold mt-8 mb-4">5. License</h3>
                  <p>
                    Subject to your compliance with these Terms and payment of applicable fees, we grant you a limited, non-exclusive, non-transferable, revocable license to:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Download and install the Clipp desktop application on devices you own or control</li>
                    <li>Access and use the Service for your personal, non-commercial use</li>
                  </ul>
                  <p>
                    This license is tied to your machine through a machine-specific identifier. Each license may only be activated on one machine at a time.
                  </p>

                  <h3 className="text-xl font-bold mt-8 mb-4">6. Restrictions</h3>
                  <p>You agree not to:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Reverse engineer, decompile, or disassemble the Service</li>
                    <li>Attempt to circumvent any license validation or security mechanisms</li>
                    <li>Rent, lease, sell, or sublicense access to the Service</li>
                    <li>Use the Service for any unlawful purpose</li>
                    <li>Remove or modify any proprietary notices or labels</li>
                    <li>Use the Service in any manner that could damage, disable, or impair our servers or networks</li>
                    <li>Attempt to gain unauthorized access to any portion of the Service</li>
                  </ul>

                  <h3 className="text-xl font-bold mt-8 mb-4">7. Intellectual Property</h3>
                  <p>
                    The Service, including all software, designs, text, graphics, logos, and other content, is owned by Vizcreator LLC and is protected by United States and international copyright, trademark, and other intellectual property laws. All rights not expressly granted to you are reserved by Vizcreator.
                  </p>

                  <h3 className="text-xl font-bold mt-8 mb-4">8. Data and Privacy</h3>

                  <h4 className="text-lg font-semibold mt-6 mb-3">8.1 Clipboard Data</h4>
                  <p>
                    Clipp stores clipboard history locally on your device. We do not access, collect, or transmit your clipboard content to our servers, except as necessary to provide cloud backup features if you explicitly enable them.
                  </p>

                  <h4 className="text-lg font-semibold mt-6 mb-3">8.2 Authentication Data</h4>
                  <p>
                    When you sign in through Google or email, we collect and store your email address and basic profile information to manage your account and subscription.
                  </p>

                  <h4 className="text-lg font-semibold mt-6 mb-3">8.3 Usage Data</h4>
                  <p>
                    We may collect anonymous usage statistics and crash reports to improve the Service.
                  </p>

                  <h3 className="text-xl font-bold mt-8 mb-4">9. Third-Party Services</h3>
                  <p>
                    The Service integrates with third-party services, including:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Google (for authentication)</li>
                    <li>Stripe (for payment processing)</li>
                    <li>Supabase (for backend services)</li>
                  </ul>
                  <p>
                    Your use of these third-party services is subject to their respective terms of service and privacy policies. We are not responsible for the practices or content of third-party services.
                  </p>

                  <h3 className="text-xl font-bold mt-8 mb-4">10. Updates and Modifications</h3>
                  <p>
                    We may update, modify, or discontinue the Service (or any part thereof) at any time with or without notice. We may also update these Terms from time to time. If we make material changes, we will notify you by email or through the Service. Your continued use of the Service after such changes constitutes acceptance of the updated Terms.
                  </p>

                  <h3 className="text-xl font-bold mt-8 mb-4">11. Termination</h3>

                  <h4 className="text-lg font-semibold mt-6 mb-3">11.1 By You</h4>
                  <p>
                    You may terminate your account at any time by canceling your subscription and ceasing use of the Service.
                  </p>

                  <h4 className="text-lg font-semibold mt-6 mb-3">11.2 By Us</h4>
                  <p>
                    We reserve the right to suspend or terminate your account and access to the Service at any time, with or without notice, for:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Violation of these Terms</li>
                    <li>Fraudulent or illegal activity</li>
                    <li>Non-payment of fees</li>
                    <li>Any other reason we deem appropriate</li>
                  </ul>

                  <h4 className="text-lg font-semibold mt-6 mb-3">11.3 Effect of Termination</h4>
                  <p>
                    Upon termination, your license to use the Service will immediately cease. Termination does not entitle you to a refund of any fees paid.
                  </p>

                  <h3 className="text-xl font-bold mt-8 mb-4">12. Disclaimers</h3>
                  <p className="font-semibold uppercase">
                    The Service is provided "as is" and "as available" without warranties of any kind, either express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement.
                  </p>
                  <p className="font-semibold uppercase">
                    We do not warrant that the Service will be uninterrupted, error-free, or secure. We do not warrant that any defects will be corrected or that the Service will meet your requirements.
                  </p>
                  <p className="font-semibold uppercase">
                    You use the Service at your own risk. We are not responsible for any loss of data, including clipboard content, that may occur through your use of the Service.
                  </p>

                  <h3 className="text-xl font-bold mt-8 mb-4">13. Limitation of Liability</h3>
                  <p className="font-semibold uppercase">
                    To the maximum extent permitted by law, Vizcreator LLC and its officers, directors, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, use, or goodwill, arising out of or related to your use of the Service, whether based on warranty, contract, tort (including negligence), or any other legal theory, even if we have been advised of the possibility of such damages.
                  </p>
                  <p className="font-semibold uppercase">
                    Our total liability to you for all claims arising out of or related to these Terms or the Service shall not exceed the amount you paid to us in the twelve (12) months preceding the event giving rise to liability, or one hundred dollars ($100), whichever is greater.
                  </p>
                  <p className="text-sm">
                    Some jurisdictions do not allow the exclusion or limitation of certain warranties or liabilities, so some of the above limitations may not apply to you.
                  </p>

                  <h3 className="text-xl font-bold mt-8 mb-4">14. Indemnification</h3>
                  <p>
                    You agree to indemnify, defend, and hold harmless Vizcreator LLC and its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, costs, or expenses (including reasonable attorneys' fees) arising out of or related to:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Your use of the Service</li>
                    <li>Your violation of these Terms</li>
                    <li>Your violation of any rights of another party</li>
                    <li>Any content you submit through the Service</li>
                  </ul>

                  <h3 className="text-xl font-bold mt-8 mb-4">15. Dispute Resolution</h3>

                  <h4 className="text-lg font-semibold mt-6 mb-3">15.1 Governing Law</h4>
                  <p>
                    These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to its conflict of law provisions.
                  </p>

                  <h4 className="text-lg font-semibold mt-6 mb-3">15.2 Arbitration</h4>
                  <p>
                    Any dispute, controversy, or claim arising out of or relating to these Terms or the Service shall be resolved through binding arbitration administered by the American Arbitration Association ("AAA") in accordance with its Commercial Arbitration Rules. The arbitration shall take place in Delaware. The arbitrator's decision shall be final and binding, and judgment on the award may be entered in any court of competent jurisdiction.
                  </p>

                  <h4 className="text-lg font-semibold mt-6 mb-3">15.3 Exceptions</h4>
                  <p>
                    Notwithstanding the arbitration provision, either party may seek injunctive or other equitable relief in any court of competent jurisdiction to prevent the actual or threatened infringement, misappropriation, or violation of intellectual property rights.
                  </p>

                  <h4 className="text-lg font-semibold mt-6 mb-3">15.4 Class Action Waiver</h4>
                  <p>
                    You agree that any arbitration or proceeding shall be limited to the dispute between you and Vizcreator LLC individually. You waive any right to participate in a class action, collective action, or representative action.
                  </p>

                  <h3 className="text-xl font-bold mt-8 mb-4">16. International Use</h3>
                  <p>
                    The Service is controlled and operated from the United States. We make no representation that the Service is appropriate or available for use outside the United States. If you use the Service from other locations, you are responsible for compliance with local laws.
                  </p>

                  <h3 className="text-xl font-bold mt-8 mb-4">17. Miscellaneous</h3>

                  <h4 className="text-lg font-semibold mt-6 mb-3">17.1 Entire Agreement</h4>
                  <p>
                    These Terms, together with our Privacy Policy, constitute the entire agreement between you and Vizcreator LLC regarding the Service.
                  </p>

                  <h4 className="text-lg font-semibold mt-6 mb-3">17.2 Severability</h4>
                  <p>
                    If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.
                  </p>

                  <h4 className="text-lg font-semibold mt-6 mb-3">17.3 Waiver</h4>
                  <p>
                    Our failure to enforce any provision of these Terms shall not constitute a waiver of that provision or any other provision.
                  </p>

                  <h4 className="text-lg font-semibold mt-6 mb-3">17.4 Assignment</h4>
                  <p>
                    You may not assign or transfer these Terms or your rights under these Terms without our prior written consent. We may assign these Terms without restriction.
                  </p>

                  <h4 className="text-lg font-semibold mt-6 mb-3">17.5 No Agency</h4>
                  <p>
                    No agency, partnership, joint venture, or employment relationship is created between you and Vizcreator LLC by these Terms.
                  </p>

                  <h3 className="text-xl font-bold mt-8 mb-4">18. Contact Information</h3>
                  <p>
                    For questions about these Terms or the Service, please contact us at:
                  </p>
                  <p className="mt-4">
                    <strong>Email:</strong> tryclipp@gmail.com<br />
                    <strong>Company:</strong> Vizcreator LLC
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
