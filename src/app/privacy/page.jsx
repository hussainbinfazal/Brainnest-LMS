"use client";

import React, { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  Shield,
  Eye,
  Lock,
  Database,
  Users,
  Globe,
  Settings,
  Mail,
  Sun,
  Moon,
} from "lucide-react";

const PrivacyPage = () => {
  const [expandedSection, setExpandedSection] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check if user has a theme preference or system preference
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    if (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);

    if (newTheme) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const toggleSection = (sectionId) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  const sections = [
    {
      id: "information-collection",
      title: "Information We Collect",
      icon: <Database className="w-5 h-5" />,
      content: `We collect information to provide better services to our users. The types of information we collect include:

Personal Information:
• Name, email address, and contact details when you register
• Profile information including photo, bio, and educational background
• Payment information for course purchases (processed securely by third-party providers)
• Communication preferences and settings

Usage Information:
• Course progress, completion rates, and learning analytics
• Time spent on platform, pages visited, and feature usage
• Quiz scores, assignment submissions, and academic performance
• Device information, IP address, and browser type
• Log files and cookies for platform functionality

Educational Content:
• Course materials you create, upload, or share
• Discussion forum posts and peer interactions
• Assignment submissions and project files
• Feedback and ratings provided to courses

We only collect information that is necessary to provide our educational services and improve your learning experience.`,
    },
    {
      id: "how-we-use",
      title: "How We Use Your Information",
      icon: <Settings className="w-5 h-5" />,
      content: `We use the information we collect for the following purposes:

Service Provision:
• Create and manage your account
• Process course enrollments and payments
• Deliver educational content and track progress
• Provide customer support and technical assistance
• Send important service-related notifications

Platform Improvement:
• Analyze usage patterns to enhance user experience
• Develop new features and educational tools
• Personalize content recommendations
• Optimize platform performance and security

Communication:
• Send course updates and educational content
• Notify you of new features or policy changes
• Respond to your inquiries and feedback
• Send marketing communications (with your consent)

Legal and Safety:
• Ensure platform security and prevent fraud
• Comply with legal obligations and regulations
• Protect intellectual property rights
• Enforce our Terms of Service

We will never sell your personal information to third parties for their marketing purposes.`,
    },
    {
      id: "information-sharing",
      title: "Information Sharing & Disclosure",
      icon: <Users className="w-5 h-5" />,
      content: `We may share your information in the following limited circumstances:

With Your Consent:
• When you explicitly authorize us to share information
• For features that require information sharing (e.g., public profiles)
• When participating in collaborative learning activities

Service Providers:
• Third-party vendors who help operate our platform
• Payment processors for transaction handling
• Cloud storage and hosting providers
• Analytics and marketing service providers
All service providers are contractually required to protect your information.

Educational Institutions:
• Course completion data with affiliated schools or employers
• Academic records for credit transfer purposes
• Progress reports to authorized education officials
Only with proper authorization and legitimate educational interest.

Legal Requirements:
• To comply with applicable laws and regulations
• In response to valid legal processes or government requests
• To protect our rights, property, or safety
• To prevent fraud or security threats

Business Transfers:
• In connection with mergers, acquisitions, or asset sales
Your information would remain subject to privacy protections.`,
    },
    {
      id: "data-security",
      title: "Data Security & Protection",
      icon: <Lock className="w-5 h-5" />,
      content: `We implement comprehensive security measures to protect your information:

Technical Safeguards:
• End-to-end encryption for sensitive data transmission
• Secure server infrastructure with regular security updates
• Multi-factor authentication options for account protection
• Regular security audits and vulnerability assessments
• Automated backup systems with encryption at rest

Access Controls:
• Role-based access limitations for our employees
• Regular access reviews and permission updates
• Secure authentication systems for internal access
• Monitoring and logging of data access activities

Physical Security:
• Secure data centers with restricted access
• Environmental controls and monitoring systems
• Redundant systems for business continuity
• Regular physical security assessments

Incident Response:
• 24/7 security monitoring and threat detection
• Incident response procedures and notification protocols
• Regular security training for all personnel
• Immediate action plans for potential breaches

While we implement strong security measures, no system is 100% secure. We continuously work to improve our security practices and will notify you of any significant security incidents affecting your data.`,
    },
    {
      id: "cookies-tracking",
      title: "Cookies & Tracking Technologies",
      icon: <Eye className="w-5 h-5" />,
      content: `We use cookies and similar technologies to enhance your experience:

Types of Cookies:
• Essential cookies: Required for basic platform functionality
• Performance cookies: Help us analyze and improve site performance
• Functional cookies: Remember your preferences and settings
• Marketing cookies: Used for personalized advertising (with consent)

How We Use Cookies:
• Keep you logged in during your session
• Remember your language and display preferences
• Analyze site traffic and user behavior patterns
• Provide personalized content recommendations
• Measure advertising effectiveness

Third-Party Cookies:
• Google Analytics for usage statistics
• Social media plugins for content sharing
• Payment processors for transaction security
• Customer support chat systems

Your Cookie Choices:
• You can control cookies through your browser settings
• Disable non-essential cookies through our preference center
• Opt out of marketing cookies at any time
• Use browser privacy modes to limit tracking

Note that disabling certain cookies may affect platform functionality and your user experience.`,
    },
    {
      id: "your-rights",
      title: "Your Privacy Rights",
      icon: <Shield className="w-5 h-5" />,
      content: `You have important rights regarding your personal information:

Access Rights:
• Request a copy of all personal information we have about you
• Receive information about how we process your data
• Get details about data sharing with third parties
• Access your data in a portable format

Correction Rights:
• Update or correct inaccurate personal information
• Complete incomplete data in your profile
• Modify your communication preferences
• Change account settings and privacy controls

Deletion Rights:
• Request deletion of your personal information
• Close your account and remove associated data
• Withdraw consent for data processing
• Request removal from marketing communications

Control Rights:
• Object to certain types of data processing
• Restrict how we use your information
• Opt out of automated decision-making
• Control what information is publicly visible

How to Exercise Your Rights:
• Use account settings for immediate changes
• Contact our privacy team for complex requests
• Submit requests through our privacy portal
• Email us at privacy@Brainnest.com

We will respond to your requests within 30 days and may require identity verification for security purposes.`,
    },
    {
      id: "international-transfers",
      title: "International Data Transfers",
      icon: <Globe className="w-5 h-5" />,
      content: `Our services may involve international data transfers:

Where We Transfer Data:
• Our primary servers are located in the United States
• We use cloud providers with global infrastructure
• Some service providers may be located internationally
• Data may be processed in countries where we operate

Legal Protections:
• We comply with applicable data transfer regulations
• Use Standard Contractual Clauses for EU data transfers
• Implement Privacy Shield principles where applicable
• Ensure adequate protection levels in destination countries

Safeguards in Place:
• Contractual protections with all international partners
• Regular compliance audits and assessments
• Data minimization practices for international transfers
• Encryption requirements for data in transit and at rest

Your Rights:
• You can object to international transfers
• Request information about specific transfer mechanisms
• File complaints with relevant data protection authorities
• Receive copies of transfer agreements upon request

We continuously monitor international data protection developments and update our practices accordingly.`,
    },
    {
      id: "children-privacy",
      title: "Children's Privacy",
      icon: <Users className="w-5 h-5" />,
      content: `We take special care to protect children's privacy:

Age Requirements:
• Users must be at least 13 years old to create an account
• Users under 18 require parental consent
• We verify age during registration process
• Special protections apply to users under 16 in the EU

Parental Controls:
• Parents can review their child's account information
• Request deletion of child's personal information
• Control communication and sharing settings
• Receive notifications about account activities

Limited Data Collection:
• We collect minimal information from children
• No behavioral advertising for users under 13
• Restricted data sharing for educational accounts
• Enhanced security measures for young users

Educational Context:
• School-sponsored accounts have additional protections
• Teachers cannot access personal communications
• Parents maintain control over educational data
• Clear policies for classroom technology use

If we learn that we have collected information from a child under 13 without parental consent, we will delete that information immediately.`,
    },
    {
      id: "retention-deletion",
      title: "Data Retention & Deletion",
      icon: <Database className="w-5 h-5" />,
      content: `We retain your information only as long as necessary:

Retention Periods:
• Account information: Until account deletion plus 30 days
• Course progress data: 7 years for academic record purposes
• Payment information: As required by law and payment processors
• Support communications: 3 years for quality assurance
• Marketing data: Until you opt out or withdraw consent

Automatic Deletion:
• Inactive accounts after 2 years of no login
• Temporary files and cache data regularly cleared
• Expired session tokens and authentication data
• Old backup files beyond retention requirements

Manual Deletion:
• You can request immediate account deletion
• Specific data types can be deleted upon request
• Bulk deletion options available in account settings
• Export your data before deletion if needed

Legal Retention:
• Some data must be retained for legal compliance
• Tax and financial records kept as required by law
• Data subject to legal holds preserved longer
• Anonymous analytics data may be retained indefinitely

After deletion, some information may remain in backup systems for up to 90 days but will not be accessible for normal operations.`,
    },
    {
      id: "policy-updates",
      title: "Policy Updates & Changes",
      icon: <Settings className="w-5 h-5" />,
      content: `We may update this Privacy Policy from time to time:

When We Update:
• Changes in our data practices or services
• New legal requirements or regulations
• User feedback and privacy best practices
• Security improvements and technical updates

How We Notify You:
• Email notification to all registered users
• Prominent notice on the platform homepage
• In-app notifications for significant changes
• Updates to this page with revision dates

Your Continued Use:
• Continued use after changes means acceptance
• You can review changes before they take effect
• Option to close account if you disagree with updates
• Previous versions available upon request

Material Changes:
• We will provide 30 days notice for major changes
• Additional consent may be required for sensitive data
• Opt-in required for new marketing communications
• Special notification for changes affecting children

We encourage you to review this Privacy Policy periodically to stay informed about how we protect your information.`,
    },
  ];

  return (
    <div className="min-h-screen  dark:bg-black bg-white  transition-colors duration-300">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 rounded-xl shadow-lg dark:shadow-2xl mr-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Your privacy is important to us. This policy explains how we
            collect, use, and protect your personal information when you use
            Brainnest LMS.
          </p>
          <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
            Last updated:{" "}
            {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>

        {/* Quick Summary */}
        <div className="bg-white dark:bg-gray-800/80 dark:backdrop-blur-sm rounded-xl shadow-lg dark:shadow-2xl p-6 mb-8 border-l-4 dark:border-blue-500 border border-gray-100 ">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Privacy at a Glance
          </h2>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
              <p className="font-medium text-gray-900 dark:text-white">
                Secure Collection
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                We collect only necessary information
              </p>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Lock className="w-6 h-6 text-green-600 dark:text-green-400 mx-auto mb-2" />
              <p className="font-medium text-gray-900 dark:text-white">
                Strong Protection
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                Enterprise-grade security measures
              </p>
            </div>
            <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
              <p className="font-medium text-gray-900 dark:text-white">
                Your Control
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                Full control over your data
              </p>
            </div>
          </div>
        </div>

        {/* Privacy Sections */}
        <div className="space-y-4">
          {sections.map((section) => (
            <div
              key={section.id}
              className="bg-white dark:bg-gray-800/80 dark:backdrop-blur-sm rounded-xl shadow-md dark:shadow-2xl overflow-hidden hover:shadow-lg dark:hover:shadow-3xl transition-all duration-200 border border-gray-100 dark:border-gray-700/50 hover:border-gray-200 dark:hover:border-gray-600/50"
            >
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-blue-600 dark:text-blue-400">
                    {section.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {section.title}
                  </h3>
                </div>
                {expandedSection === section.id ? (
                  <ChevronUp className="w-5 h-5 text-gray-400 dark:text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400 dark:text-gray-400" />
                )}
              </button>
              {expandedSection === section.id && (
                <div className="px-6 pb-6 pt-2 border-t border-gray-100 dark:border-gray-700/50">
                  <div className="prose max-w-none text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                    {section.content}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact Information */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 rounded-xl shadow-lg dark:shadow-2xl p-8 text-white border border-gray-200/20 dark:border-gray-700/30">
          <div className="flex items-center justify-center mb-4">
            <Mail className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-center mb-4">
            Privacy Questions or Concerns?
          </h2>
          <p className="text-center text-blue-100 mb-6">
            Our privacy team is here to help. Contact us with any questions
            about your data or this policy.
          </p>
          <div className="text-center space-y-2">
            <p className="font-semibold">
              Privacy Officer: privacy@Brainnest.com
            </p>
            <p className="font-semibold">
              Data Protection Officer: dpo@Brainnest.com
            </p>
            <p className="font-semibold">
              Address: 123 Education St, Learning City, LC 12345
            </p>
            <p className="text-blue-100 text-sm mt-4">
              We respond to privacy inquiries within 72 hours.
            </p>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p className="mb-2">
            This Privacy Policy is effective as of the date listed above and
            governs our collection and use of your information.
          </p>
          <p>
            For questions about our privacy practices or to exercise your
            rights, please contact our privacy team using the information above.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
