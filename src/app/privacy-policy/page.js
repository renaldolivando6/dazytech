// src/app/privacy-policy/page.js
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Mail, Phone, MapPin, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/dazytech-logo-circle.png" alt="Dazytech" width={36} height={36} className="h-9 w-auto" />
              <div className="flex flex-col -ml-0.5">
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 bg-clip-text text-transparent leading-none">
                  dazytech
                </span>
                <span className="text-[9px] font-bold tracking-[0.2em] text-gray-400 uppercase -mt-0.5">
                  SOLUTIONS
                </span>
              </div>
            </Link>
            <Link 
              href="/"
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                <Shield className="w-6 h-6 text-amber-700" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900">Privacy Policy</h1>
            </div>
            
            <p className="text-gray-600 mb-8">
              <strong>Effective Date:</strong> January 1, 2025<br />
              <strong>Last Updated:</strong> January 1, 2025
            </p>

            <div className="prose prose-lg max-w-none">
              {/* Introduction */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Dazytech Solutions (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  By accessing or using our services, you agree to the terms of this Privacy Policy. If you do not agree with the terms, please do not access our website or use our services.
                </p>
              </section>

              {/* Information We Collect */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-3">2.1 Personal Information</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We may collect personal information that you voluntarily provide to us when you:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>Contact us through our website or email</li>
                  <li>Request a consultation or quote</li>
                  <li>Sign up for our services</li>
                  <li>Participate in surveys or feedback forms</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mb-4">
                  This information may include:
                </p>
                <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
                  <li>Name and contact information (email, phone number, address)</li>
                  <li>Company name and business information</li>
                  <li>Project requirements and specifications</li>
                  <li>Payment and billing information</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 mb-3">2.2 Automatically Collected Information</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  When you visit our website, we may automatically collect certain information, including:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>IP address and browser type</li>
                  <li>Device information and operating system</li>
                  <li>Pages viewed and time spent on pages</li>
                  <li>Referring website addresses</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>
              </section>

              {/* How We Use Your Information */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We use the information we collect for the following purposes:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>To provide, operate, and maintain our services</li>
                  <li>To communicate with you about projects, updates, and inquiries</li>
                  <li>To process transactions and send related information</li>
                  <li>To improve our website and services</li>
                  <li>To send marketing communications (with your consent)</li>
                  <li>To detect, prevent, and address technical issues or fraud</li>
                  <li>To comply with legal obligations</li>
                </ul>
              </section>

              {/* Information Sharing */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Information Sharing and Disclosure</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We do not sell, trade, or rent your personal information to third parties. We may share your information in the following circumstances:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li><strong>Service Providers:</strong> We may share information with third-party vendors who perform services on our behalf (e.g., hosting, analytics, payment processing)</li>
                  <li><strong>Legal Requirements:</strong> We may disclose information if required by law or in response to valid legal requests</li>
                  <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred</li>
                  <li><strong>With Your Consent:</strong> We may share information with your explicit permission</li>
                </ul>
              </section>

              {/* Data Security */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Security</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>Encryption of sensitive data</li>
                  <li>Secure server infrastructure</li>
                  <li>Regular security assessments</li>
                  <li>Access controls and authentication</li>
                </ul>
                <p className="text-gray-700 leading-relaxed">
                  However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee its absolute security.
                </p>
              </section>

              {/* Cookies */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Cookies and Tracking Technologies</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We use cookies and similar tracking technologies to enhance your browsing experience. Cookies are small data files stored on your device that help us:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>Remember your preferences</li>
                  <li>Understand how you use our website</li>
                  <li>Improve website functionality</li>
                  <li>Provide personalized content</li>
                </ul>
                <p className="text-gray-700 leading-relaxed">
                  You can control cookies through your browser settings. However, disabling cookies may affect the functionality of our website.
                </p>
              </section>

              {/* Your Rights */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Your Rights</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  You have the following rights regarding your personal information:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
                  <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
                  <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                  <li><strong>Objection:</strong> Object to the processing of your information</li>
                  <li><strong>Data Portability:</strong> Request transfer of your data to another service</li>
                  <li><strong>Withdraw Consent:</strong> Withdraw consent for marketing communications at any time</li>
                </ul>
                <p className="text-gray-700 leading-relaxed">
                  To exercise these rights, please contact us using the information provided below.
                </p>
              </section>

              {/* Data Retention */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Data Retention</h2>
                <p className="text-gray-700 leading-relaxed">
                  We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. When we no longer need your information, we will securely delete or anonymize it.
                </p>
              </section>

              {/* Third-Party Links */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Third-Party Links</h2>
                <p className="text-gray-700 leading-relaxed">
                  Our website may contain links to third-party websites. We are not responsible for the privacy practices or content of these external sites. We encourage you to review the privacy policies of any third-party websites you visit.
                </p>
              </section>

              {/* Children's Privacy */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Children&apos;s Privacy</h2>
                <p className="text-gray-700 leading-relaxed">
                  Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
                </p>
              </section>

              {/* International Data Transfers */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">11. International Data Transfers</h2>
                <p className="text-gray-700 leading-relaxed">
                  Your information may be transferred to and processed in countries other than Indonesia. We ensure that appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
                </p>
              </section>

              {/* Changes to Policy */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Changes to This Privacy Policy</h2>
                <p className="text-gray-700 leading-relaxed">
                  We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last Updated&quot; date. You are advised to review this Privacy Policy periodically for any changes.
                </p>
              </section>

              {/* Contact */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Contact Us</h2>
                <p className="text-gray-700 leading-relaxed mb-6">
                  If you have any questions about this Privacy Policy or our data practices, please contact us:
                </p>
                <div className="bg-stone-50 rounded-2xl p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Email</p>
                      <a href="mailto:dazytechsolutions@gmail.com" className="text-amber-700 hover:text-amber-800">
                        dazytechsolutions@gmail.com
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Phone</p>
                      <a href="https://wa.me/6281310228482" className="text-amber-700 hover:text-amber-800">
                        +62 813 1022 8482
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Address</p>
                      <p className="text-gray-700">
                        Jl. Permata, Kalideres<br />
                        Jakarta Barat 11820<br />
                        Indonesia
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 px-6 bg-gray-900 text-gray-400 text-center text-sm">
        <p>© 2025 Dazytech Solutions. All rights reserved.</p>
      </footer>
    </div>
  );
}