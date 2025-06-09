import mongoose from "mongoose";

export const userSchema = new mongoose.Schema({
    name: {
        type: 'String'
        , required: true

    },
    email: {
        type: 'String'
        , required: true
        , unique: true
    },
    password: {
        type: 'String', required: true
    },
    phoneNumber: {
        type: 'String'
        
    },
    profileImage: {
        type: 'String'
    },
    likedCourses: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course'
        }
    ],
    enrolledCourses: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course'
        }
    ],
    
    role: {
        type: String,
        enum: ['user', 'admin', 'instructor'],
        default: 'user'
    },
    completedCourses: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course'
        }
    ],
    certificates: [{
        courseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
        },
        courseName: {
            type: String,
            
        },
        instructorName: {
            type: String,
            
        },
        completionDate: {
            type: String,
        
        },
        certificatePreview: {
            type: String,
                
        },
        pdfData: {
            type: String, // Base64 encoded PDF
        },
        generatedAt: {
            type: Date,
            default: Date.now
        }
    }],
    resetPasswordToken: {
        type: String,
        default: null,
    },
    resetPasswordTokenExpires: {
        type: Date,
        default: null,
    },
    verificationToken: {
        type: String,
        default: null,
    },
    verificationTokenExpires: {
        type: Date,
        default: null,
    },
    isResetTokenVerified: {
        type: Boolean,
        default: false,
    }

}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User