# 🎓 Advanced Learning Management System (LMS)

A comprehensive full-stack Learning Management System built with modern web technologies, featuring real-time communication, payment integration, and advanced analytics.

## 🌟 Project Overview

This LMS platform provides a complete e-learning solution with unique features like pay-per-message instructor consultations, comprehensive analytics dashboards, and real-time communication capabilities. The system caters to both instructors and learners with role-based access control and a seamless user experience.

## ✨ Key Features

### 🎯 Core LMS Functionality
- **Course Management**: Complete CRUD operations for courses
- **Content Creation**: Rich course content creation and editing tools
- **Progress Tracking**: Student progress monitoring and completion tracking
- **Certificate Generation**: Automated certificate issuance upon course completion

### 💬 Real-Time Communication System
- **Pay-Per-Message Chat**: Innovative monetization model for instructor consultations
- **Live Chat Integration**: Real-time messaging using Socket.IO
- **Online Status Detection**: Shows when instructors and students are online
- **Message Limits**: Plan-based message quotas for structured communication

### 💰 Payment & Monetization
- **Secure Payment Processing**: Integrated payment gateway for course purchases
- **Flexible Pricing Plans**: Multiple subscription tiers with different message limits
- **Coupon Management**: Create, edit, and manage discount coupons
- **Revenue Analytics**: Comprehensive payment and earnings analysis

### 📊 Analytics Dashboard
- **Payment Analytics**: Detailed revenue tracking and financial insights
- **Chat Statistics**: Message usage and engagement metrics
- **Course Performance**: Enrollment and completion rate analysis
- **User Engagement**: Student activity and participation tracking

### 🔐 Security & Authentication
- **Auth.js v5 Integration**: Modern authentication with Google, GitHub, and credentials providers
- **JWT Session Management**: Secure token-based authentication with 30-day sessions
- **OAuth Integration**: Seamless social login with automatic user creation
- **Role-Based Access Control**: Separate permissions for instructors, students, and admins
- **Secure API Endpoints**: Protected routes with proper authorization
- **Data Encryption**: Secure handling of sensitive user information

### ⭐ User Experience
- **Review System**: Course rating and feedback mechanism
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Intuitive UI/UX**: Clean and professional interface design
- **Search & Filtering**: Advanced course discovery features

## 🛠️ Technology Stack

### Frontend
- **Next.js** - React framework for production-ready applications
- **React** - Component-based UI library
- **Tailwind CSS** - Utility-first CSS framework

### Backend
- **Next.js API Routes** - Server-side API endpoints
- **Socket.IO** - Real-time bidirectional communication
- **Auth.js v5** - Modern authentication framework with multiple providers
- **JWT Sessions** - Secure token-based session management
- **OAuth Providers** - Google and GitHub social authentication
- **bcryptjs** - Password hashing for credentials authentication

### Database & Storage
- **Database**: MongoDB
- **File Storage**: Secure file upload and management system

### Payment Integration
- **Payment Gateway**: Secure payment processing with razorpay
- **Subscription Management**: Recurring payment handling with razorpay subscription model

## 🏗️ Architecture Highlights

### Real-Time Communication
```
Client ↔ Socket.IO Server ↔ Database
     ↓
Payment Gateway ↔ Message Quota System
```

### Authentication Flow
```
User Login → Auth.js Provider → Database Sync → JWT Token → Session Creation → Protected Routes
                ↓
    OAuth (Google/GitHub) or Credentials → User Creation/Update → Role Assignment
```

### Payment Processing
```
Course/Chat Purchase → Payment Gateway → Database Update → Feature Unlock
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager
- Database setup
- Auth.js v5 providers configuration (Google OAuth, GitHub OAuth)
- MongoDB database for user management
- Payment gateway credentials

### Installation

1. **Clone the repository**
   ```bash
   git clone [https://github.com/hussainbinfazal/Brainnest-LMS]
   cd lms-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```
   Configure your environment variables:
   - Database connection strings
   - Auth.js provider credentials:
  - `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`
  - `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET`
  - `NEXTAUTH_SECRET` for JWT signing
  - `NEXTAUTH_URL` for callback URLs
   - Payment gateway credentials
   - JWT secrets
   - Socket.IO configuration

4. **Database Setup**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

Visit `http://localhost:3000` to see the application.

## 📱 Core User Flows

### For Students
1. **Registration/Login** → Browse Courses → Purchase Course → Access Content
2. **Chat with Instructor** → Select Plan → Make Payment → Start Messaging
3. **Track Progress** → View Analytics → Earn Certificates

### For Instructors
1. **Create Profile** → Build Courses → Set Pricing → Manage Content
2. **Monitor Analytics** → Track Earnings → Engage with Students
3. **Manage Chats** → Respond to Messages → View Chat Statistics

### For Administrators
1. **Platform Overview** → User Management → Revenue Tracking
2. **Coupon Management** → System Analytics → Platform Maintenance

## 🎯 Unique Selling Points

1. **Innovative Monetization**: Pay-per-message model creates new revenue streams for instructors
2. **Real-Time Engagement**: Socket.IO integration ensures immediate communication
3. **Comprehensive Analytics**: Detailed insights into user behavior and financial performance
4. **Scalable Architecture**: Built with modern technologies for growth and maintenance
5. **Security First**: Multiple layers of authentication and authorization

## 📈 Business Impact

- **Revenue Generation**: Multiple monetization channels (courses + consultations)
- **User Retention**: Real-time communication increases engagement
- **Scalability**: Architecture supports thousands of concurrent users
- **Analytics-Driven**: Data insights enable informed business decisions

## 🔮 Future Enhancements

- Video conferencing integration
- Mobile application development
- AI-powered course recommendations
- Advanced analytics with machine learning
- Multi-language support
- Blockchain-based certificates

## 🤝 Contributing

This project showcases modern full-stack development practices and would benefit from community contributions. Areas for improvement include:
- Performance optimizations
- Additional payment gateway integrations
- Enhanced UI/UX features
- Mobile responsiveness improvements

## 📄 License

This project is part of a professional portfolio demonstrating full-stack development capabilities.

---

## 💼 About This Project

This LMS platform represents a comprehensive full-stack development project showcasing:
- **Complex System Architecture**: Integration of multiple services and real-time features
- **Modern Development Practices**: TypeScript, component-based architecture, and secure authentication
- **Business Logic Implementation**: Payment processing, role management, and analytics
- **User Experience Focus**: Intuitive design and responsive interface
- **Scalable Solutions**: Built for growth and maintainability

**Perfect for demonstrating to potential employers**: The project combines technical complexity with real-world business applications, showing both coding skills and understanding of commercial software development.

---

🙏 Thank You!
Thank you for taking the time to explore this project!
Your interest in my work means a lot. I hope this LMS platform demonstrates my passion for creating innovative solutions and my commitment to clean, scalable code.

---
⭐ If you found this project interesting, please consider giving it a star!


*Built with ❤️ using Next.js, Socket.IO, and modern web technologies*