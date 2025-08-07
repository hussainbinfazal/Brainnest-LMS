import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  topics: [
    {
      topic: {
        type: String,
        required: true
      },
      description: {
        type: String,
        required: true
      }
    }
  ],
  description:
  {
    type: String,

  }
  ,
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  price: {
    type: Number,
    required: true
  },

  rating: {
    type: Number,
    default: 0
  },
  enrolledStudents: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      enrolledAt: {
        type: Date,
        default: Date.now,
      },
    }
  ],
  lessons: [
    {
      name: {
        type: String,
        required: true
      },
      video: {
        type: String,
        required: true
      },
      description: {
        type: String,
        required: true
      },
      duration: {
        type: Number,
        required: true

      },
      createdAt: {
        type: Date,
        default: Date.now
      },
      updatedAt: {
        type: Date,
        default: Date.now
      },
      _id: {
        type: String,
      },
      status: {
        type: String,
        enum: ["completed", "incomplete"],
        default: "incomplete"
      }

    }
  ],
  reviews: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      _id: {
        type: String
      },
      rating: Number,
      comment: String,
      createdAt: {
        type: Date,
        default: Date.now
      },
      updatedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  coverImage: {
    type: String,
    required: true
  },

  tags: [
    {
      type: String
    }
  ],
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  discount: {
    type: Number,
    default: 0
  },
  duration: {
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
  certificate: {
    type: Boolean,
    default: false
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
    name: {
      type: String,
      required: true
    },
    subCategories: [
      {
        type: String,
        required: true
      }
    ]
  },
 


}, { 
  timestamps: true,
  strictPopulate: false 
});

const Course = mongoose.models.Course || mongoose.model('Course', courseSchema);
export default Course;
