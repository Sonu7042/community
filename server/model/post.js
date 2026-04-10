const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    author: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Comment author id is required'],
      },
      username: {
        type: String,
        required: [true, 'Comment author username is required'],
        trim: true,
      },
      avatar: {
        type: String,
        required: [true, 'Comment author avatar is required'],
        trim: true,
      },
    },
    message: {
      type: String,
      required: [true, 'Comment message is required'],
      trim: true,
      minlength: [1, 'Comment message is required'],
      maxlength: [500, 'Comment message cannot be more than 500 characters long'],
    },
  },
  {
    timestamps: true,
  }
);

commentSchema.add({
  replies: {
    type: [commentSchema],
    default: [],
  },
});

const postSchema = new mongoose.Schema(
  {
    author: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Author id is required'],
      },
      username: {
        type: String,
        required: [true, 'Author username is required'],
        trim: true,
      },
      avatar: {
        type: String,
        required: [true, 'Author avatar is required'],
        trim: true,
      },
    },
    title: {
      type: String,
      required: [true, 'Post title is required'],
      trim: true,
      minlength: [3, 'Post title must be at least 3 characters long'],
      maxlength: [120, 'Post title cannot be more than 120 characters long'],
    },
    description: {
      type: String,
      required: [true, 'Post description is required'],
      trim: true,
      minlength: [10, 'Post description must be at least 10 characters long'],
      maxlength: [2000, 'Post description cannot be more than 2000 characters long'],
    },
    image: {
      type: String,
      trim: true,
      default: '',
      validate: {
        validator: (value) => !value || /^https?:\/\/.+/.test(value),
        message: 'Image must be a valid image URL',
      },
    },
    likesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    likedBy: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      ],
      default: [],
    },
    commentsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    comments: {
      type: [commentSchema],
      default: [],
    },
    sharesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

postSchema.index({ 'author.userId': 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ likedBy: 1 });

module.exports = mongoose.model('Post', postSchema);
