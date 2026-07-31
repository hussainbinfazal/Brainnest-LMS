/**
 * Brainnest — Database Seed Script
 * ---------------------------------
 * Seeds sample documents for: User, Category, Topic, Course, Section, Lesson,
 * Enrollment, Certificate, Progress, Review, UserToken, UserCourse, Payment,
 * Coupon, CouponUsage.
 *
 * ⚠️  KNOWN BUG IN YOUR SOURCE MODEL — fix before running this script:
 *   couponUsageModel.ts currently has:
 *     mongoose.models.Coupon || mongoose.model<ICouponUsage>('Coupon', couponUsageSchema)
 *   Both references say 'Coupon' instead of 'CouponUsage'. If the Coupon model
 *   is registered first, this line silently returns the Coupon model instead
 *   of a real CouponUsage model, corrupting anything written through it.
 *   Fix to:
 *     mongoose.models.CouponUsage || mongoose.model<ICouponUsage>('CouponUsage', couponUsageSchema)
 *
 * USAGE
 *   1. Set MONGODB_URI in your environment (or .env.local at repo root).
 *   2. Adjust the import paths below to match your monorepo structure
 *      (currently assumes models live under ../src/models relative to this file —
 *      change to `@repo/shared` or your actual path).
 *   3. Run with: npx tsx seed.ts   (or: npx ts-node seed.ts)
 *
 * SAFETY
 *   This script WIPES the collections it seeds before inserting fresh data.
 *   Do not point this at a production database. Set SEED_CONFIRM=yes to run.
 *
 * NOT SEEDED (no model shared / no obvious sample data yet):
 *   `Order` — CouponUsage.order is left unset since no Order model exists yet.
 */

import bcrypt from "bcryptjs";

// ---- Adjust these import paths to match your monorepo structure ----
import { CouponUsage, Coupon, Payment, userCourse as UserCourse, UserToken, Review, Progress, Enrollment, User, Category, Topic, Course, Section, Lesson, Certificate } from "../src/index";
import mongoose from "mongoose";

const SEED_CONFIRM = "yes"
const MONGODB_URI = "mongodb://localhost:27017/LMS"

async function seed() {
    if (!MONGODB_URI) {
        throw new Error("MONGODB_URI is not set. Add it to your environment before running the seed script.");
    }

    if (SEED_CONFIRM !== "yes") {
        console.error(
            '\n⚠️  Refusing to run: this script deletes existing documents in the seeded collections.\n' +
            '   If you are SURE this is a dev/test database, re-run with:\n\n' +
            '   SEED_CONFIRM=yes npx tsx seed.ts\n'
        );
        process.exit(1);
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected.");

    console.log("Clearing existing seeded collections...");
    await Promise.all([
        User.deleteMany({}),
        Category.deleteMany({}),
        Topic.deleteMany({}),
        Course.deleteMany({}),
        Section.deleteMany({}),
        Lesson.deleteMany({}),
        Enrollment.deleteMany({}),
        Certificate.deleteMany({}),
        Progress.deleteMany({}),
        Review.deleteMany({}),
        UserToken.deleteMany({}),
        UserCourse.deleteMany({}),
        Payment.deleteMany({}),
        Coupon.deleteMany({}),
        CouponUsage.deleteMany({}),
    ]);

    // ---------------------------------------------------------------------
    // 1. Users
    // ---------------------------------------------------------------------
    console.log("Seeding users...");
    const passwordHash = await bcrypt.hash("Password123!", 10);

    const [admin, instructor1, instructor2, student1, student2] = await User.create([
        {
            name: "Ayesha Khan",
            email: "admin@brainnest.dev",
            password: passwordHash,
            role: "admin",
            isVerified: true,
            phoneNumber: "+911234567890",
        },
        {
            name: "Rohan Mehta",
            email: "rohan.instructor@brainnest.dev",
            password: passwordHash,
            role: "instructor",
            isVerified: true,
            phoneNumber: "+911234567891",
        },
        {
            name: "Priya Nair",
            email: "priya.instructor@brainnest.dev",
            password: passwordHash,
            role: "instructor",
            isVerified: true,
            phoneNumber: "+911234567892",
        },
        {
            name: "Aman Verma",
            email: "aman.student@brainnest.dev",
            password: passwordHash,
            role: "student",
            isVerified: true,
            phoneNumber: "+911234567893",
        },
        {
            name: "Sara Iyer",
            email: "sara.student@brainnest.dev",
            password: passwordHash,
            role: "student",
            isVerified: false,
            phoneNumber: "+911234567894",
        },
    ]);

    // ---------------------------------------------------------------------
    // 2. Categories (parent + children, self-referential)
    // ---------------------------------------------------------------------
    console.log("Seeding categories...");

    const categoryList: string[] = [
        "academics",
        "business",
        "design",
        "development",
        "finance",
        "fitness",
        "lifestyle",
        "marketing",
        "music",
        "personal-development",
        "photography",
        "productivity",
        "technology",
    ];

    // NOTE: "productivity" appears both as a top-level category and as a
    // subcategory under "lifestyle" in the source data. `categorySchema.slug`
    // is globally unique, so the nested one is renamed to avoid a duplicate-key
    // error on insert. If you'd rather allow same-slug-under-different-parent,
    // that requires a compound unique index ({ slug: 1, parent: 1 }) on the
    // schema instead of a single-field unique index.
    const categoryToSubcategories: Record<string, string[]> = {
        academics: ["math", "science", "history"],
        business: ["entrepreneurship", "management", "sales"],
        design: ["ui", "ux", "graphic-design"],
        development: ["web", "mobile", "game"],
        finance: ["investing", "accounting", "crypto"],
        fitness: ["yoga", "cardio", "strength"],
        lifestyle: ["travel", "food", "productivity-lifestyle"], // renamed, see note above
        marketing: ["seo", "content", "ads"],
        music: ["production", "instrument", "theory"],
        "personal-development": ["mindfulness", "habits", "communication"],
        photography: ["editing", "gear", "composition"],
        productivity: ["time-management", "tools", "automation"],
        technology: ["ai", "cloud", "iot"],
    };

    const toName = (slug: string) =>
        slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

    // Create all top-level (parent) categories first.
    const categoryDocs: Record<string, InstanceType<typeof Category>> = { };
    for (const slug of categoryList) {
        categoryDocs[slug] = await Category.create({ name: toName(slug), slug, parent: null });
    }

    // Then create all subcategories, referencing their parent's real _id.
    const subCategoryDocs: Record<string,  InstanceType<typeof Category>> = {};
    for (const [parentSlug, subSlugs] of Object.entries(categoryToSubcategories)) {
        const parent = categoryDocs[parentSlug];
        for (const subSlug of subSlugs) {
            subCategoryDocs[subSlug] = await Category.create({
                name: toName(subSlug),
                slug: subSlug,
                parent: parent?._id
            });
        }
    }

    console.log(
        `  -> ${Object.keys(categoryDocs).length} parent categories, ${Object.keys(subCategoryDocs).length} subcategories`
    );

    // ---------------------------------------------------------------------
    // 3. Topics
    // ---------------------------------------------------------------------
    console.log("Seeding topics...");
    const [jsTopic, reactTopic, figmaTopic] = await Topic.create([
        { name: "JavaScript Fundamentals", slug: "javascript-fundamentals", description: "Core JS concepts", isActive: true },
        { name: "React Essentials", slug: "react-essentials", description: "Building UIs with React", isActive: true },
        { name: "Figma for Beginners", slug: "figma-for-beginners", description: "UI design basics in Figma", isActive: true },
    ]);

    // ---------------------------------------------------------------------
    // 4. Courses
    // ---------------------------------------------------------------------
    console.log("Seeding courses...");
    const [course1, course2] = await Course.create([
        {
            title: "Modern JavaScript from Scratch",
            topic: jsTopic._id,
            description: "A complete guide to modern JavaScript, from variables to async/await.",
            instructorId: instructor1._id,
            price: 1999,
            averageRating: 4.5,
            totalReviews: 2,
            totalLessons: 4,
            coverImage: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
            tags: ["javascript", "web-development", "beginner"],
            status: "published",
            discount: 10,
            totalDurationInSeconds: 7200,
            language: "English",
            level: "beginner",
            totalEnrolledCount: 1,
            faq: [
                { question: "Do I need prior experience?", answer: "No, this course starts from the basics." },
            ],
            requirements: ["A computer with internet access", "No prior coding experience needed"],
            whatYouWillLearn: ["Core JS syntax", "DOM manipulation", "Async/await and Promises"],
            previewVideo: "https://res.cloudinary.com/demo/video/upload/sample.mp4",
            category: subCategoryDocs.web._id,
            dripType: "free",
        },
        {
            title: "UI Design with Figma",
            topic: figmaTopic._id,
            description: "Learn to design clean, modern interfaces using Figma.",
            instructorId: instructor2._id,
            price: 2499,
            averageRating: 4.8,
            totalReviews: 1,
            totalLessons: 3,
            coverImage: "https://res.cloudinary.com/demo/image/upload/sample2.jpg",
            tags: ["design", "figma", "ui"],
            status: "published",
            discount: 0,
            totalDurationInSeconds: 5400,
            language: "English",
            level: "beginner",
            totalEnrolledCount: 1,
            faq: [],
            requirements: ["Figma account (free tier is fine)"],
            whatYouWillLearn: ["Frames and auto layout", "Components and variants", "Basic prototyping"],
            previewVideo: "https://res.cloudinary.com/demo/video/upload/sample2.mp4",
            category: subCategoryDocs.ui._id,
            dripType: "sequential",
        },
    ]);

    // ---------------------------------------------------------------------
    // 5. Sections
    // ---------------------------------------------------------------------
    console.log("Seeding sections...");
    const [course1Section1, course1Section2] = await Section.create([
        { courseId: course1._id, title: "Getting Started", description: "Setup and JS basics", order: 1 },
        { courseId: course1._id, title: "Async JavaScript", description: "Promises and async/await", order: 2 },
    ]);

    const [course2Section1] = await Section.create([
        { courseId: course2._id, title: "Figma Basics", description: "Interface tour and first frame", order: 1 },
    ]);

    // ---------------------------------------------------------------------
    // 6. Lessons
    // ---------------------------------------------------------------------
    console.log("Seeding lessons...");
    const [
        c1s1Lesson1,
        c1s1Lesson2,
        c1s2Lesson1,
        c1s2Lesson2,
        c2s1Lesson1,
        c2s1Lesson2,
    ] = await Lesson.create([
        {
            courseId: course1._id,
            sectionId: course1Section1._id,
            name: "Variables and Data Types",
            videoUrl: "https://res.cloudinary.com/demo/video/upload/lesson1.mp4",
            description: "let, const, and primitive types",
            durationInSeconds: 600,
            isPreview: true,
            isPreviewVideo: "true",
            order: 1,
        },
        {
            courseId: course1._id,
            sectionId: course1Section1._id,
            name: "Functions and Scope",
            videoUrl: "https://res.cloudinary.com/demo/video/upload/lesson2.mp4",
            description: "Function declarations, expressions, and closures",
            durationInSeconds: 900,
            isPreview: false,
            isPreviewVideo: "false",
            order: 2,
        },
        {
            courseId: course1._id,
            sectionId: course1Section2._id,
            name: "Promises Deep Dive",
            videoUrl: "https://res.cloudinary.com/demo/video/upload/lesson3.mp4",
            description: "Understanding the Promise lifecycle",
            durationInSeconds: 1200,
            isPreview: false,
            isPreviewVideo: "false",
            order: 3,
        },
        {
            courseId: course1._id,
            sectionId: course1Section2._id,
            name: "Async/Await Patterns",
            videoUrl: "https://res.cloudinary.com/demo/video/upload/lesson4.mp4",
            description: "Writing clean async code",
            durationInSeconds: 1500,
            isPreview: false,
            isPreviewVideo: "false",
            order: 4,
        },
        {
            courseId: course2._id,
            sectionId: course2Section1._id,
            name: "Touring the Figma Interface",
            videoUrl: "https://res.cloudinary.com/demo/video/upload/lesson5.mp4",
            description: "Panels, toolbars, and shortcuts",
            durationInSeconds: 480,
            isPreview: true,
            isPreviewVideo: "true",
            order: 6,
        },
        {
            courseId: course2._id,
            sectionId: course2Section1._id,
            name: "Your First Frame",
            videoUrl: "https://res.cloudinary.com/demo/video/upload/lesson6.mp4",
            description: "Creating and organizing frames",
            durationInSeconds: 720,
            isPreview: false,
            isPreviewVideo: "false",
            order: 7,
        },
    ]);

    // ---------------------------------------------------------------------
    // 7. Payments (created first so Enrollment.paymentId can reference them)
    // ---------------------------------------------------------------------
    console.log("Seeding payments...");
    const [payment1, payment2] = await Payment.create([
        {
            amount: course1.price,
            paymentId: "pay_sample_0001",
            paymentAt: new Date(),
            paymentBy: student1._id,
            paymentOf: course1._id,
            paymentOnModel: "Course",
            paymentStatus: "Completed",
        },
        {
            amount: course2.price,
            paymentId: "pay_sample_0002",
            paymentAt: new Date(),
            paymentBy: student2._id,
            paymentOf: course2._id,
            paymentOnModel: "Course",
            paymentStatus: "Completed",
        },
    ]);

    // ---------------------------------------------------------------------
    // 8. Enrollments
    // ---------------------------------------------------------------------
    console.log("Seeding enrollments...");
    await Enrollment.create([
        {
            courseId: course1._id,
            userId: student1._id,
            paymentId: payment1._id,
            price: course1.price,
            status: "Completed",
            enrolledAt: new Date(),
        },
        {
            courseId: course2._id,
            userId: student2._id,
            paymentId: payment2._id,
            price: course2.price,
            status: "Completed",
            enrolledAt: new Date(),
        },
    ]);

    // ---------------------------------------------------------------------
    // 9. Certificates
    // ---------------------------------------------------------------------
    console.log("Seeding certificates...");
    await Certificate.create([
        {
            userId: student1._id,
            courseId: course1._id,
            courseName: course1.title,
            instructorName: instructor1.name,
            completionDate: new Date(),
            pdfUrl: "https://res.cloudinary.com/demo/raw/upload/certificate1.pdf",
            certificatePreview: "https://res.cloudinary.com/demo/image/upload/certificate1.jpg",
            verificationCode: "BRNST-CERT-0001",
            isRevoked: false,
        },
    ]);

    // ---------------------------------------------------------------------
    // 10. Progress (per-user, per-course lesson completion tracking)
    // ---------------------------------------------------------------------
    console.log("Seeding progress...");
    await Progress.create([
        {
            userId: student1._id,
            courseId: course1._id,
            completedLessons: [
                { lessonId: c1s1Lesson1._id, progress: 100, isCompleted: true },
                { lessonId: c1s1Lesson2._id, progress: 60, isCompleted: false },
                { lessonId: c1s2Lesson1._id, progress: 0, isCompleted: false },
                { lessonId: c1s2Lesson2._id, progress: 0, isCompleted: false },
            ],
            completedLessonsCount: 1,
            percentageCompleted: 25,
            lastAccessedAt: new Date(),
        },
        {
            userId: student2._id,
            courseId: course2._id,
            completedLessons: [
                { lessonId: c2s1Lesson1._id, progress: 100, isCompleted: true },
                { lessonId: c2s1Lesson2._id, progress: 100, isCompleted: true },
            ],
            completedLessonsCount: 2,
            percentageCompleted: 100,
            lastAccessedAt: new Date(),
        },
    ]);

    // ---------------------------------------------------------------------
    // 11. Reviews
    // ---------------------------------------------------------------------
    console.log("Seeding reviews...");
    await Review.create([
        {
            course: course1._id,
            user: student1._id,
            rating: 5,
            comment: "Clear explanations, moved at a good pace.",
            spamScore: 0,
            status: "clean",
            ipAdress: "203.0.113.10",
            score: 5,
        },
        {
            course: course2._id,
            user: student2._id,
            rating: 4,
            comment: "Great intro to Figma, would like more advanced content.",
            spamScore: 0,
            status: "clean",
            ipAdress: "203.0.113.11",
            score: 4,
        },
    ]);

    // ---------------------------------------------------------------------
    // 12. UserCourse (like/enroll/completion state per user-course pair)
    // ---------------------------------------------------------------------
    console.log("Seeding user-course states...");
    await UserCourse.create([
        {
            userId: student1._id,
            courseId: course1._id,
            isLiked: true,
            isEnrolled: true,
            isCompleted: false,
            progress: 25,
            likedAt: new Date(),
            enrolledAt: new Date(),
        },
        {
            userId: student2._id,
            courseId: course2._id,
            isLiked: true,
            isEnrolled: true,
            isCompleted: true,
            progress: 100,
            likedAt: new Date(),
            enrolledAt: new Date(),
            completedAt: new Date(),
        },
    ]);

    // ---------------------------------------------------------------------
    // 13. UserTokens (e.g. email verification / password reset samples)
    // ---------------------------------------------------------------------
    console.log("Seeding user tokens...");
    await UserToken.create([
        {
            userId: student2._id,
            type: "verification",
            token: "sample-verification-token-0001",
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // +24h
            isVerified: false,
            isUsed: false,
        },
        {
            userId: student1._id,
            type: "refresh",
            token: "sample-refresh-token-0001",
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // +7d
            isVerified: true,
            isUsed: false,
        },
    ]);

    // ---------------------------------------------------------------------
    // 14. Coupons + CouponUsage
    // ---------------------------------------------------------------------
    console.log("Seeding coupons...");
    const [welcomeCoupon] = await Coupon.create([
        {
            code: "WELCOME10",
            discountValue: 10,
            discountType: "percentage",
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // +30d
            maxUses: 100,
            usedCount: 1,
            isActive: true,
            createdBy: admin._id,
        },
    ]);

    console.log("Seeding coupon usage...");
    await CouponUsage.create([
        {
            coupon: welcomeCoupon._id,
            user: student1._id,
            usedAt: new Date(),
            // `order` is left unset — no Order model was provided/seeded.
            // Add an `order` reference here once that model exists.
        },
    ]);

    console.log("\n✅ Seed complete.");
    console.log({
        users: 5,
        categories: 52, // 13 parent + 39 subcategories
        topics: 3,
        courses: 2,
        sections: 3,
        lessons: 6,
        payments: 2,
        enrollments: 2,
        certificates: 1,
        progressRecords: 2,
        reviews: 2,
        userCourseRecords: 2,
        userTokens: 2,
        coupons: 1,
        couponUsages: 1,
    });

    await mongoose.disconnect();
    process.exit(0);
}

seed().catch(async (err: unknown) => {
    console.error("❌ Seed failed:", err);
    await mongoose.disconnect().catch(() => { });
    process.exit(1);
});