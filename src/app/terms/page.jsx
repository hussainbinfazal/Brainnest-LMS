"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  FileText,
  Shield,
  Users,
  BookOpen,
  AlertCircle,
  Mail,
} from "lucide-react";

const TermsPage = () => {
  const [expandedSection, setExpandedSection] = useState(null);

  const toggleSection = (sectionId) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  const sections = [
    {
      id: "acceptance",
      title: "Acceptance of Terms",
      icon: <FileText className="w-5 h-5" />,
      content: `By accessing and using Brainnest LMS ("the Platform"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.

These Terms of Service ("Terms") govern your use of our learning management system and related services. By creating an account or using our platform, you acknowledge that you have read, understood, and agree to be bound by these Terms.`,
    },
    {
      id: "definitions",
      title: "Definitions",
      icon: <BookOpen className="w-5 h-5" />,
      content: `"Platform" refers to the Brainnest LMS system, including all associated websites, applications, and services.

"User" refers to any individual who accesses or uses the Platform, including students, instructors, and administrators.

"Content" includes all text, graphics, images, music, software, audio, video, information, and other materials available on the Platform.

"Course Materials" refers to educational content, assignments, quizzes, and related resources provided through the Platform.

"Account" refers to the user profile and associated data created when registering for the Platform.`,
    },
    {
      id: "registration",
      title: "User Registration & Accounts",
      icon: <Users className="w-5 h-5" />,
      content: `To access certain features of the Platform, you must register for an account. You agree to:

• Provide accurate, current, and complete information during registration
• Maintain and promptly update your account information
• Keep your login credentials confidential and secure
• Accept responsibility for all activities under your account
• Notify us immediately of any unauthorized use of your account

You must be at least 13 years old to create an account. Users under 18 must have parental consent. We reserve the right to refuse registration or terminate accounts at our discretion.

Each user may maintain only one active account. Creating multiple accounts may result in suspension of all associated accounts.`,
    },
    {
      id: "acceptable-use",
      title: "Acceptable Use Policy",
      icon: <Shield className="w-5 h-5" />,
      content: `You agree to use the Platform only for lawful purposes and in accordance with these Terms. You agree NOT to:

• Violate any applicable laws or regulations
• Infringe upon intellectual property rights of others
• Upload or share inappropriate, offensive, or harmful content
• Attempt to gain unauthorized access to the Platform or other accounts
• Interfere with or disrupt the Platform's operation
• Use the Platform for commercial purposes without authorization
• Share account credentials with others
• Engage in harassment, bullying, or discriminatory behavior
• Post spam, malware, or malicious code
• Attempt to reverse engineer or copy the Platform's functionality

Violations may result in immediate account suspension or termination.`,
    },
    {
      id: "content",
      title: "Content & Intellectual Property",
      icon: <FileText className="w-5 h-5" />,
      content: `All content on the Platform, including course materials, software, design elements, and documentation, is protected by intellectual property laws and owned by Brainnest or its licensors.

User-Generated Content:
• You retain ownership of content you create and upload
• You grant us a license to use, display, and distribute your content on the Platform
• You represent that you have the right to share any content you upload
• We may remove content that violates these Terms

Course Materials:
• Access is granted for personal, educational use only
• You may not redistribute, sell, or share course materials
• Instructors retain rights to their original course content
• Some materials may be subject to additional licensing terms

We respect intellectual property rights and will respond to valid DMCA takedown notices.`,
    },
    {
      id: "privacy",
      title: "Privacy & Data Protection",
      icon: <Shield className="w-5 h-5" />,
      content: `Your privacy is important to us. Our Privacy Policy, which is incorporated into these Terms, explains how we collect, use, and protect your information.

Key points:
• We collect information necessary to provide our services
• We use industry-standard security measures to protect your data
• We do not sell personal information to third parties
• You can request access to, correction of, or deletion of your personal data
• We comply with applicable data protection regulations (GDPR, CCPA, etc.)

By using the Platform, you consent to our data practices as described in our Privacy Policy.`,
    },
    {
      id: "payments",
      title: "Payment Terms",
      icon: <AlertCircle className="w-5 h-5" />,
      content: `For paid services and courses:

• All fees are stated in USD unless otherwise specified
• Payment is due at the time of enrollment or subscription
• We accept major credit cards and approved payment methods
• Subscription fees are billed automatically on a recurring basis
• You authorize us to charge your selected payment method

Refunds:
• Course refunds are subject to our Refund Policy
• Subscription refunds are prorated for unused periods
• Processing fees may apply to refunds
• Refund requests must be submitted within specified timeframes

We reserve the right to change pricing with 30 days' notice to existing subscribers.`,
    },
    {
      id: "termination",
      title: "Account Termination",
      icon: <Users className="w-5 h-5" />,
      content: `You may terminate your account at any time by contacting our support team or using account settings.

We may terminate or suspend your account if you:
• Violate these Terms of Service
• Engage in fraudulent or illegal activities
• Fail to pay required fees
• Remain inactive for an extended period

Upon termination:
• Your access to the Platform will be immediately suspended
• We may delete your account data after a reasonable period
• Certain provisions of these Terms will survive termination
• You remain liable for any outstanding obligations

We will provide reasonable notice before termination unless immediate action is required for security or legal reasons.`,
    },
    {
      id: "disclaimers",
      title: "Disclaimers & Limitations",
      icon: <AlertCircle className="w-5 h-5" />,
      content: `The Platform is provided "as is" without warranties of any kind. We disclaim all warranties, express or implied, including:

• Merchantability and fitness for a particular purpose
• Accuracy, completeness, or reliability of content
• Uninterrupted or error-free operation
• Security of data transmission

Limitation of Liability:
To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or other intangible losses.

Our total liability for any claim shall not exceed the amount paid by you for the service in the 12 months preceding the claim.`,
    },
    {
      id: "changes",
      title: "Changes to Terms",
      icon: <FileText className="w-5 h-5" />,
      content: `We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting to the Platform.

We will notify users of material changes through:
• Email notification to registered users
• Prominent notice on the Platform
• In-app notifications

Your continued use of the Platform after changes constitutes acceptance of the modified Terms. If you do not agree to the changes, you must discontinue use of the Platform.

We encourage you to review these Terms periodically to stay informed of any updates.`,
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl mb-6 shadow-2xl">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold dark:text-white text-black mb-4">
            Terms of Service
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Please read these terms carefully before using Brainnest LMS. These
            terms govern your use of our platform and services.
          </p>
          <div className="mt-6 text-sm text-gray-400">
            Last updated:{" "}
            {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>

        {/* Quick Overview */}
        <div className="bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-2xl p-6 mb-8 border-l-4 border-blue-500 border dark:border-gray-700/50">
          <h2 className="text-xl font-semibold text-black dark:text-white mb-3">
            Quick Overview
          </h2>
          <p className="text-gray-300">
            By using Brainnest LMS, you agree to these terms. Key points include
            respecting intellectual property, using the platform appropriately,
            protecting your account, and understanding our policies on content,
            privacy, and payments. Click on each section below for detailed
            information.
          </p>
        </div>

        {/* Terms Sections */}
        <div className="space-y-4">
          {sections.map((section) => (
            <div
              key={section.id}
              className="bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-2xl overflow-hidden hover:shadow-3xl transition-all duration-200 border border-gray-700/50 dark:hover:border-gray-600/50 hover:border-gray-100/50"
            >
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-700/50 transition-colors duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-blue-400">{section.icon}</div>
                  <h3 className="text-lg font-semibold text-black dark:text-white">
                    {section.title}
                  </h3>
                </div>
                {expandedSection === section.id ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>
              {expandedSection === section.id && (
                <div className="px-6 pb-6 pt-2">
                  <div className="prose max-w-none text-gray-300 leading-relaxed whitespace-pre-line">
                    {section.content}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact Information */}
        <div className="mt-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl shadow-2xl p-8 text-white border border-gray-700/30">
          <div className="flex items-center justify-center mb-4">
            <Mail className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-center mb-4">
            Questions About These Terms?
          </h2>
          <p className="text-center text-blue-100 mb-6">
            If you have any questions about these Terms of Service, please don't
            hesitate to contact us.
          </p>
          <div className="text-center space-y-2">
            <p className="font-semibold">Email: legal@Brainnest.com</p>
            <p className="font-semibold">
              Address: 123 Education St, Learning City, LC 12345
            </p>
            <p className="text-blue-100 text-sm mt-4">
              We typically respond to inquiries within 2-3 business days.
            </p>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center text-sm text-gray-400">
          <p>
            These terms are effective as of the date listed above and will
            remain in effect except with respect to any changes in their
            provisions in the future.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
