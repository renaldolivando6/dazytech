// src/app/terms-of-service/page.js
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Mail, Phone, MapPin, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function TermsOfService() {
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
                <FileText className="w-6 h-6 text-amber-700" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900">Terms of Service</h1>
            </div>
            
            <p className="text-gray-600 mb-8">
              <strong>Effective Date:</strong> January 1, 2025<br />
              <strong>Last Updated:</strong> January 1, 2025
            </p>

            <div className="prose prose-lg max-w-none">
              {/* Introduction */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Welcome to Dazytech Solutions. By accessing or using our website and services, you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, please do not use our services.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  These Terms apply to all visitors, users, and others who access or use our services. We reserve the right to modify these Terms at any time, and such modifications will be effective immediately upon posting.
                </p>
              </section>

              {/* Services Description */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Services Description</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Dazytech Solutions provides custom software development services, including but not limited to:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>Enterprise Resource Planning (ERP) systems</li>
                  <li>Supply chain management solutions</li>
                  <li>Financial automation software</li>
                  <li>API development and system integration</li>
                  <li>Web and mobile application development</li>
                  <li>Digital transformation consulting</li>
                </ul>
                <p className="text-gray-700 leading-relaxed">
                  The specific scope, deliverables, timeline, and pricing for each project will be outlined in a separate Service Agreement or Statement of Work (SOW).
                </p>
              </section>

              {/* User Obligations */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Obligations</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  When using our services, you agree to:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>Provide accurate, current, and complete information</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Notify us immediately of any unauthorized access</li>
                  <li>Use our services only for lawful purposes</li>
                  <li>Not interfere with or disrupt our services or servers</li>
                  <li>Not attempt to gain unauthorized access to our systems</li>
                  <li>Comply with all applicable laws and regulations</li>
                </ul>
              </section>

              {/* Intellectual Property */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Intellectual Property Rights</h2>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-3">4.1 Our Intellectual Property</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  All content on our website, including but not limited to text, graphics, logos, images, software, and design, is the property of Dazytech Solutions and is protected by Indonesian and international copyright, trademark, and other intellectual property laws.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mb-3">4.2 Custom Development Projects</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  For custom software development projects:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li><strong>Client Ownership:</strong> Upon full payment, the client receives ownership rights to the custom-developed software as specified in the Service Agreement</li>
                  <li><strong>Pre-existing Components:</strong> Any pre-existing code, frameworks, libraries, or components remain the property of their respective owners</li>
                  <li><strong>Portfolio Rights:</strong> We reserve the right to showcase the project in our portfolio unless otherwise agreed in writing</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 mb-3">4.3 Client Materials</h3>
                <p className="text-gray-700 leading-relaxed">
                  You retain ownership of any materials, content, or data you provide to us. By providing such materials, you grant us a license to use them solely for the purpose of delivering our services.
                </p>
              </section>

              {/* Payment Terms */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Payment Terms</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Payment terms will be specified in the Service Agreement or SOW. General payment conditions include:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>Payment schedule (e.g., milestone-based, monthly subscription)</li>
                  <li>Accepted payment methods</li>
                  <li>Late payment penalties (if applicable)</li>
                  <li>Refund policy (as specified per project)</li>
                </ul>
                <p className="text-gray-700 leading-relaxed">
                  All prices are quoted in Indonesian Rupiah (IDR) or US Dollars (USD) unless otherwise specified. Prices do not include applicable taxes, which will be added to invoices as required by law.
                </p>
              </section>

              {/* Project Delivery */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Project Delivery and Timelines</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We strive to deliver projects according to agreed timelines. However:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>Timelines are estimates and may be subject to change based on project complexity and client feedback</li>
                  <li>Delays caused by client-side factors (e.g., delayed feedback, content provision) may extend delivery timelines</li>
                  <li>We will communicate any anticipated delays promptly</li>
                  <li>Acceptance testing and approval processes will be outlined in the Service Agreement</li>
                </ul>
              </section>

              {/* Warranties and Disclaimers */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Warranties and Disclaimers</h2>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-3">7.1 Service Warranty</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We warrant that our services will be performed in a professional and workmanlike manner. Any warranty period and bug-fix support will be specified in the Service Agreement.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mb-3">7.2 Disclaimer</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Except as expressly stated in a Service Agreement:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>Our services are provided &quot;as is&quot; without warranties of any kind</li>
                  <li>We do not warrant that services will be uninterrupted or error-free</li>
                  <li>We do not guarantee specific results or outcomes</li>
                  <li>Third-party integrations are subject to the availability and policies of those third parties</li>
                </ul>
              </section>

              {/* Limitation of Liability */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Limitation of Liability</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  To the maximum extent permitted by law:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>Dazytech Solutions shall not be liable for any indirect, incidental, special, consequential, or punitive damages</li>
                  <li>Our total liability shall not exceed the amount paid by the client for the specific service giving rise to the claim</li>
                  <li>We are not liable for any loss of data, profits, revenue, or business opportunities</li>
                  <li>These limitations apply even if we have been advised of the possibility of such damages</li>
                </ul>
              </section>

              {/* Confidentiality */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Confidentiality</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We respect the confidentiality of your business information. We agree to:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>Keep confidential any proprietary information shared during the project</li>
                  <li>Use confidential information solely for the purpose of delivering services</li>
                  <li>Not disclose confidential information to third parties without consent</li>
                  <li>Sign a separate Non-Disclosure Agreement (NDA) if requested</li>
                </ul>
              </section>

              {/* Termination */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Termination</h2>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-3">10.1 Termination by Client</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  You may terminate services by providing written notice as specified in the Service Agreement. Early termination may be subject to fees for work completed.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mb-3">10.2 Termination by Us</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We reserve the right to terminate services if:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>Payment terms are not met</li>
                  <li>The client breaches these Terms</li>
                  <li>The client engages in abusive or unethical behavior</li>
                  <li>Continuing the project becomes impractical</li>
                </ul>
              </section>

              {/* Indemnification */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Indemnification</h2>
                <p className="text-gray-700 leading-relaxed">
                  You agree to indemnify and hold harmless Dazytech Solutions from any claims, damages, losses, or expenses (including legal fees) arising from your use of our services, violation of these Terms, or infringement of any third-party rights.
                </p>
              </section>

              {/* Governing Law */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Governing Law and Dispute Resolution</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  These Terms shall be governed by and construed in accordance with the laws of the Republic of Indonesia. Any disputes arising from these Terms or our services shall be resolved through:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li><strong>Negotiation:</strong> Good faith discussions between the parties</li>
                  <li><strong>Mediation:</strong> If negotiation fails, mediation by a mutually agreed mediator</li>
                  <li><strong>Arbitration or Court:</strong> As a last resort, through arbitration or the courts of Jakarta, Indonesia</li>
                </ul>
              </section>

              {/* Force Majeure */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Force Majeure</h2>
                <p className="text-gray-700 leading-relaxed">
                  Neither party shall be liable for failure to perform due to circumstances beyond reasonable control, including natural disasters, war, terrorism, labor disputes, or government actions. In such cases, timelines may be extended accordingly.
                </p>
              </section>

              {/* Changes to Terms */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Changes to These Terms</h2>
                <p className="text-gray-700 leading-relaxed">
                  We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting on our website. Your continued use of our services after changes constitutes acceptance of the modified Terms. We encourage you to review these Terms periodically.
                </p>
              </section>

              {/* Severability */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Severability</h2>
                <p className="text-gray-700 leading-relaxed">
                  If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.
                </p>
              </section>

              {/* Entire Agreement */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">16. Entire Agreement</h2>
                <p className="text-gray-700 leading-relaxed">
                  These Terms, together with any Service Agreement or SOW, constitute the entire agreement between you and Dazytech Solutions regarding our services and supersede all prior agreements and understandings.
                </p>
              </section>

              {/* Contact */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">17. Contact Information</h2>
                <p className="text-gray-700 leading-relaxed mb-6">
                  If you have any questions about these Terms of Service, please contact us:
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