import mongoose, { Model } from "mongoose";
import Lesson from "./lessonModel";
import Section from "./sectionModel";
import { ICourse } from "src/types";


const courseSchema = new mongoose.Schema<ICourse>({
  title: {
    type: String,
    required: true
  },
  topic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Topic",
    required: true,
    index: true
  },
  description:
  {
    type: String,

  }
  ,
  instructorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  price: {
    type: Number,
    required: true
  },

  averageRating: {
    type: Number,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  ratingDistribution: {
    1: Number,
    2: Number,
    3: Number,
    4: Number,
    5: Number
  },
  totalLessons: {
    type: Number,
    default: 0
  },
  coverImage: {
    type: String,
    required: true
  },

  tags: [
    {
      type: String,
      index: true
    }
  ],
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  },
  discount: {
    type: Number,
    default: 0
  },
  totalDurationInSeconds: {
    type: Number,

  },
  language: {
    type: String,
    default: 'English'
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'expert'],
    default: 'beginner'
  },
  totalEnrolledCount: {
    type: Number,
    default: 0
  },
  faq: [
    {
      question: String,
      answer: String
    }
  ],
  requirements: [
    {
      type: String
    }
  ],
  whatYouWillLearn: [
    {
      type: String
    }
  ],
  video: {
    type: String,

  },
  previewVideo: {
    type: String,

  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
    index: true
  },
  dripType: {
    type: String,
    enum: ['free', 'sequential', 'drip-by-date'],
    default: 'free'
  }



}, {
  timestamps: true,
  toJSON: {
    virtuals: true
  },
  toObject: {
    virtuals: true
  }
});
courseSchema.virtual("durationInHours").get(function (this: ICourse) {
  return Number(((this.totalDurationInSeconds ?? 0) / 3600).toFixed(2));
});
courseSchema.virtual("finalPrice").get(function (this: ICourse) {
  return Number(Math.round(this.price - (this.price * this.discount / 100)));
});
courseSchema.pre("findOneAndDelete", async function (next) {
  const course = await this.model.findOne(this.getQuery());
  if (course) {
    await Promise.all([
      Lesson.deleteMany({ courseId: course._id }),
      Section.deleteMany({ courseId: course._id })
    ]);
  }
 
})
courseSchema.index({ instructorId: 1, status: 1 });
courseSchema.index({ category: 1, status: 1, price: 1 });
courseSchema.index({ status: 1, averageRating: -1 });
courseSchema.index({ status: 1, totalEnrolledCount: -1 });
const Course: Model<ICourse> = mongoose.models.Course || mongoose.model<ICourse>('Course', courseSchema);
export default Course;
