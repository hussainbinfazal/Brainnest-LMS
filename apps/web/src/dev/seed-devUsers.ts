import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
import bcrypt from "bcryptjs";
import { connectDB, User } from "@repo/shared";

const DEV_USERS = [
    {
        name: "Dev Student",
        email: "dev.student@brainnest.local",
        password: "DevStudent@123",
        role: "student",
    },
    {
        name: "Dev Instructor",
        email: "dev.instructor@brainnest.local",
        password: "DevInstructor@123",
        role: "instructor",
    },
    {
        name: "Dev Admin",
        email: "dev.admin@brainnest.local",
        password: "DevAdmin@123",
        role: "admin",
    },
];

console.log("Environment Variavbles in Dev Directory:", process.env.MONGODB_URI!);

async function seedDevUsers() {
    try {
        await connectDB(process.env.MONGODB_URI!);

        console.log("Connected to MongoDB");

        for (const devUser of DEV_USERS) {
            const existingUser = await User.findOne({
                email: devUser.email,
            });

            if (existingUser) {
                console.log(
                    `✓ ${devUser.email} already exists`
                );
                continue;
            }

            const hashedPassword = await bcrypt.hash(
                devUser.password,
                12
            );

            await User.create({
                name: devUser.name,
                email: devUser.email,
                password: hashedPassword,
                role: devUser.role,
                isVerified: true,
                phoneNumber: "",
                profileImage: "",
            });

            console.log(
                `✓ Created ${devUser.role}: ${devUser.email}`
            );
        }

        console.log("\nDevelopment users seeded successfully.");
    } catch (error) {
        console.error("Failed to seed development users:", error);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

seedDevUsers();