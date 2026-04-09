const mongoose = require('mongoose');
const { v2: cloudinary } = require('cloudinary');
const Post = require('../model/post');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const formatValidationErrors = (error) =>
  Object.values(error.errors).map((item) => item.message);
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const getBase64ImageSizeInBytes = (image) => {
  if (!image?.startsWith('data:image/')) {
    return 0;
  }

  const base64Content = image.split(',')[1] || '';
  return Buffer.from(base64Content, 'base64').length;
};

const uploadPostImageToCloudinary = async (image) => {
  if (!image) {
    return '';
  }

  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error(
      'Cloudinary configuration missing. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET'
    );
  }

  const uploadResponse = await cloudinary.uploader.upload(image, {
    folder: 'mycommunity/posts',
    resource_type: 'image',
  });

  return uploadResponse.secure_url;
};

const validateCreatePostBody = ({ userId, username, avatar, title, description, image }) => {
  const errors = [];

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    errors.push('Valid author id is required');
  }

  if (!username || !username.trim()) {
    errors.push('Author username is required');
  }

  if (!avatar || !avatar.trim()) {
    errors.push('Author avatar is required');
  }

  if (!title || !title.trim()) {
    errors.push('Post title is required');
  } else if (title.trim().length < 3 || title.trim().length > 120) {
    errors.push('Post title must be between 3 and 120 characters');
  }

  if (!description || !description.trim()) {
    errors.push('Post description is required');
  } else if (description.trim().length < 10 || description.trim().length > 2000) {
    errors.push('Post description must be between 10 and 2000 characters');
  }

  if (
    image &&
    !/^(https?:\/\/.+)|(data:image\/[a-zA-Z]+;base64,[A-Za-z0-9+/=]+)$/.test(image.trim())
  ) {
    errors.push('Image must be a valid image URL or base64 image string');
  }

  if (image && image.startsWith('data:image/')) {
    const imageSize = getBase64ImageSizeInBytes(image.trim());

    if (imageSize > MAX_IMAGE_SIZE_BYTES) {
      errors.push('only upload 5mb img');
    }
  }

  return errors;
};

const createPost = async (req, res) => {
  try {
    const { userId, username, avatar, title, description, image } = req.body;

    const validationErrors = validateCreatePostBody({
      userId,
      username,
      avatar,
      title,
      description,
      image,
    });

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors,
      });
    }

    const uploadedImageUrl = await uploadPostImageToCloudinary(image?.trim());

    const post = await Post.create({
      author: {
        userId,
        username: username.trim(),
        avatar: avatar.trim(),
      },
      title: title.trim(),
      description: description.trim(),
      image: uploadedImageUrl,
    });

    return res.status(201).json({
      success: true,
      message: 'Post created successfully',
      post,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: formatValidationErrors(error),
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Server error while creating post',
      error: error.message,
    });
  }
};

const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: posts.length,
      posts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching posts',
      error: error.message,
    });
  }
};

const getPostById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post id',
      });
    }

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    return res.status(200).json({
      success: true,
      post,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching post',
      error: error.message,
    });
  }
};

const getPostsByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user id',
      });
    }

    const posts = await Post.find({ 'author.userId': userId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: posts.length,
      posts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching user posts',
      error: error.message,
    });
  }
};

module.exports = {
  createPost,
  getAllPosts,
  getPostById,
  getPostsByUser,
};
