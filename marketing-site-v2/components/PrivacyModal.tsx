'use client';

import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrivacyModal({ isOpen, onClose }: PrivacyModalProps) {
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
                <h2 className="text-3xl font-bold text-gray-900">Privacy Policy</h2>
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

                  <h3 className="text-xl font-bold mt-8 mb-4">1. Introduction</h3>
                  <p>
                    Vizcreator LLC ("we," "us," or "our") operates Clipp, a macOS clipboard history manager. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our desktop application and website (collectively, the "Service").
                  </p>
                  <p>
                    By using the Service, you agree to the collection and use of information in accordance with this Privacy Policy. If you do not agree with the terms of this Privacy Policy, please do not use the Service.
                  </p>

                  <h3 className="text-xl font-bold mt-8 mb-4">2. Information We Collect</h3>

                  <h4 className="text-lg font-semibold mt-6 mb-3">2.1 Personal Information</h4>
                  <p>
                    When you create an account or use the Service, we may collect the following personal information:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Email Address:</strong> Collected when you sign in via Google or email authentication</li>
                    <li><strong>Google Profile Information:</strong> If you authenticate with Google, we receive your name, email address, and profile picture from your Google account</li>
                    <li><strong>Payment Information:</strong> Payment details are processed by Stripe; we do not store your complete credit card information on our servers</li>
                  </ul>

                  <h4 className="text-lg font-semibold mt-6 mb-3">2.2 Clipboard Data</h4>
                  <p>
                    <strong>Important:</strong> Your clipboard history (text, images, files, and audio) is stored <strong>locally on your device</strong>. We do not access, collect, transmit, or store your clipboard content on our servers. Your clipboard data remains private and under your control.
                  </p>

                  <h4 className="text-lg font-semibold mt-6 mb-3">2.3 Technical Information</h4>
                  <p>
                    We may automatically collect certain technical information, including:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Machine Identifier:</strong> A unique identifier for your device used for license activation and validation</li>
                    <li><strong>Operating System Information:</strong> macOS version and system architecture (ARM64 or Intel)</li>
                    <li><strong>Application Version:</strong> The version of Clipp you are using</li>
                    <li><strong>Usage Statistics:</strong> Anonymous data about how you use the application (e.g., feature usage, frequency)</li>
                    <li><strong>Crash Reports:</strong> Technical information about application errors to help us improve stability</li>
                  </ul>

                  <h4 className="text-lg font-semibold mt-6 mb-3">2.4 Website Usage Data</h4>
                  <p>
                    When you visit our website, we may collect:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>IP address</li>
                    <li>Browser type and version</li>
                    <li>Pages visited and time spent on pages</li>
                    <li>Referring website</li>
                    <li>Device information</li>
                  </ul>

                  <h3 className="text-xl font-bold mt-8 mb-4">3. How We Use Your Information</h3>
                  <p>
                    We use the collected information for the following purposes:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Account Management:</strong> To create and manage your account</li>
                    <li><strong>Authentication:</strong> To verify your identity when you sign in</li>
                    <li><strong>License Validation:</strong> To activate and validate your subscription license on your devices</li>
                    <li><strong>Payment Processing:</strong> To process subscription payments and manage billing</li>
                    <li><strong>Customer Support:</strong> To respond to your inquiries and provide technical support</li>
                    <li><strong>Service Improvement:</strong> To analyze usage patterns and improve the Service</li>
                    <li><strong>Updates:</strong> To provide software updates and notifications about your subscription</li>
                    <li><strong>Security:</strong> To detect and prevent fraud, abuse, and security incidents</li>
                    <li><strong>Legal Compliance:</strong> To comply with legal obligations</li>
                  </ul>

                  <h3 className="text-xl font-bold mt-8 mb-4">4. How We Share Your Information</h3>
                  <p>
                    We do not sell, trade, or rent your personal information to third parties. We may share your information in the following circumstances:
                  </p>

                  <h4 className="text-lg font-semibold mt-6 mb-3">4.1 Service Providers</h4>
                  <p>
                    We work with third-party service providers who assist us in operating the Service:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Supabase:</strong> Backend infrastructure, authentication, and database services</li>
                    <li><strong>Stripe:</strong> Payment processing</li>
                    <li><strong>Google:</strong> Authentication services</li>
                  </ul>
                  <p>
                    These providers have access to your information only to perform specific tasks on our behalf and are obligated to protect your information.
                  </p>

                  <h4 className="text-lg font-semibold mt-6 mb-3">4.2 Legal Requirements</h4>
                  <p>
                    We may disclose your information if required to do so by law or in response to valid requests by public authorities (e.g., court orders, subpoenas).
                  </p>

                  <h4 className="text-lg font-semibold mt-6 mb-3">4.3 Business Transfers</h4>
                  <p>
                    If we are involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction. We will notify you before your information becomes subject to a different privacy policy.
                  </p>

                  <h3 className="text-xl font-bold mt-8 mb-4">5. Data Storage and Security</h3>

                  <h4 className="text-lg font-semibold mt-6 mb-3">5.1 Where Your Data Is Stored</h4>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Clipboard Data:</strong> Stored locally on your device only</li>
                    <li><strong>Account Data:</strong> Stored on secure servers provided by Supabase (United States)</li>
                    <li><strong>Payment Data:</strong> Processed and stored by Stripe</li>
                  </ul>

                  <h4 className="text-lg font-semibold mt-6 mb-3">5.2 Security Measures</h4>
                  <p>
                    We implement industry-standard security measures to protect your information, including:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Encryption of data in transit using HTTPS/TLS</li>
                    <li>Encryption of sensitive data at rest</li>
                    <li>Ed25519 cryptographic signatures for license validation</li>
                    <li>Regular security assessments and updates</li>
                    <li>Access controls and authentication mechanisms</li>
                  </ul>
                  <p>
                    However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
                  </p>

                  <h3 className="text-xl font-bold mt-8 mb-4">6. Your Privacy Rights</h3>
                  <p>
                    Depending on your location, you may have the following rights regarding your personal information:
                  </p>

                  <h4 className="text-lg font-semibold mt-6 mb-3">6.1 Access and Portability</h4>
                  <p>
                    You have the right to request access to the personal information we hold about you and to receive it in a portable format.
                  </p>

                  <h4 className="text-lg font-semibold mt-6 mb-3">6.2 Correction</h4>
                  <p>
                    You can update your account information at any time through the Service or by contacting us.
                  </p>

                  <h4 className="text-lg font-semibold mt-6 mb-3">6.3 Deletion</h4>
                  <p>
                    You may request deletion of your account and personal information by contacting us at tryclipp@gmail.com. Note that we may retain certain information as required by law or for legitimate business purposes.
                  </p>

                  <h4 className="text-lg font-semibold mt-6 mb-3">6.4 Opt-Out</h4>
                  <p>
                    You can opt out of receiving promotional emails by following the unsubscribe link in those emails. You cannot opt out of service-related communications (e.g., account verification, subscription confirmations).
                  </p>

                  <h4 className="text-lg font-semibold mt-6 mb-3">6.5 Do Not Track</h4>
                  <p>
                    Our Service does not currently respond to "Do Not Track" browser signals.
                  </p>

                  <h3 className="text-xl font-bold mt-8 mb-4">7. Data Retention</h3>
                  <p>
                    We retain your personal information for as long as necessary to:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Provide the Service to you</li>
                    <li>Comply with legal obligations</li>
                    <li>Resolve disputes</li>
                    <li>Enforce our agreements</li>
                  </ul>
                  <p>
                    When you delete your account, we will delete or anonymize your personal information within a reasonable timeframe, except where we are required to retain it by law.
                  </p>

                  <h3 className="text-xl font-bold mt-8 mb-4">8. Children's Privacy</h3>
                  <p>
                    The Service is not intended for use by children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately at tryclipp@gmail.com.
                  </p>

                  <h3 className="text-xl font-bold mt-8 mb-4">9. International Data Transfers</h3>
                  <p>
                    Your information may be transferred to and processed in the United States or other countries where our service providers operate. These countries may have different data protection laws than your country of residence.
                  </p>
                  <p>
                    By using the Service, you consent to the transfer of your information to the United States and other countries.
                  </p>

                  <h3 className="text-xl font-bold mt-8 mb-4">10. Third-Party Links</h3>
                  <p>
                    Our Service may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties. We encourage you to review their privacy policies before providing any information to them.
                  </p>

                  <h3 className="text-xl font-bold mt-8 mb-4">11. Changes to This Privacy Policy</h3>
                  <p>
                    We may update this Privacy Policy from time to time. We will notify you of any material changes by:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Posting the updated Privacy Policy on our website</li>
                    <li>Updating the "Last Updated" date at the top of this policy</li>
                    <li>Sending you an email notification (for material changes)</li>
                  </ul>
                  <p>
                    Your continued use of the Service after any changes constitutes your acceptance of the updated Privacy Policy.
                  </p>

                  <h3 className="text-xl font-bold mt-8 mb-4">12. California Privacy Rights</h3>
                  <p>
                    If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Right to know what personal information is collected, used, and shared</li>
                    <li>Right to delete personal information</li>
                    <li>Right to opt out of the sale of personal information (we do not sell your information)</li>
                    <li>Right to non-discrimination for exercising your CCPA rights</li>
                  </ul>
                  <p>
                    To exercise these rights, please contact us at tryclipp@gmail.com.
                  </p>

                  <h3 className="text-xl font-bold mt-8 mb-4">13. European Union Users (GDPR)</h3>
                  <p>
                    If you are located in the European Union, you have rights under the General Data Protection Regulation (GDPR), including:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Right of access to your personal data</li>
                    <li>Right to rectification of inaccurate data</li>
                    <li>Right to erasure ("right to be forgotten")</li>
                    <li>Right to restrict processing</li>
                    <li>Right to data portability</li>
                    <li>Right to object to processing</li>
                    <li>Right to withdraw consent</li>
                  </ul>
                  <p>
                    Our legal basis for processing your personal data includes:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Performance of a contract (providing the Service)</li>
                    <li>Legitimate interests (improving the Service, security)</li>
                    <li>Legal obligations</li>
                    <li>Your consent (where applicable)</li>
                  </ul>

                  <h3 className="text-xl font-bold mt-8 mb-4">14. Contact Us</h3>
                  <p>
                    If you have questions or concerns about this Privacy Policy or our data practices, please contact us at:
                  </p>
                  <p className="mt-4">
                    <strong>Email:</strong> tryclipp@gmail.com<br />
                    <strong>Company:</strong> Vizcreator LLC
                  </p>

                  <h3 className="text-xl font-bold mt-8 mb-4">15. Consent</h3>
                  <p>
                    By using the Service, you consent to this Privacy Policy and agree to its terms.
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
