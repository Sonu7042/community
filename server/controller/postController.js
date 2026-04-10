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
const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_COMMENT_LENGTH = 500;

const getRequestedUserId = (value) => {
  if (!value || !mongoose.Types.ObjectId.isValid(value)) {
    return null;
  }

  return value;
};

const serializePost = (post, requestedUserId = null) => {
  const postObject = post.toObject ? post.toObject() : post;
  const likedBy = Array.isArray(postObject.likedBy) ? postObject.likedBy : [];
  const isLiked = requestedUserId
    ? likedBy.some((likedUserId) => likedUserId.toString() === requestedUserId)
    : false;

  return {
    ...postObject,
    isLiked,
  };
};

const validateDiscussionPayload = ({ userId, username, avatar, message }, messageLabel) => {
  const errors = [];

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    errors.push('Valid user id is required');
  }

  if (!username || !username.trim()) {
    errors.push('Username is required');
  }

  if (!avatar || !avatar.trim()) {
    errors.push('Avatar is required');
  }

  if (!message || !message.trim()) {
    errors.push(`${messageLabel} is required`);
  } else if (message.trim().length > MAX_COMMENT_LENGTH) {
    errors.push(`${messageLabel} cannot be more than ${MAX_COMMENT_LENGTH} characters long`);
  }

  return errors;
};

const findCommentById = (comments, targetCommentId) => {
  for (const comment of comments) {
    if (comment._id.toString() === targetCommentId) {
      return comment;
    }

    if (comment.replies?.length) {
      const nestedMatch = findCommentById(comment.replies, targetCommentId);

      if (nestedMatch) {
        return nestedMatch;
      }
    }
  }

  return null;
};

const isCloudinaryUrl = (url = '') => url.includes('/res.cloudinary.com/');

const getDownloadFileName = (pdfName = 'document.pdf') => {
  const trimmedName = pdfName.trim() || 'document.pdf';
  return trimmedName.toLowerCase().endsWith('.pdf') ? trimmedName : `${trimmedName}.pdf`;
};

const getCloudinaryDownloadUrl = (url, pdfName = 'document.pdf') => {
  if (!isCloudinaryUrl(url) || !url.includes('/upload/')) {
    return url;
  }

  const fileName = encodeURIComponent(getDownloadFileName(pdfName));
  return url.replace('/upload/', `/upload/fl_attachment:${fileName}/`);
};

const getBase64ImageSizeInBytes = (image) => {
  if (!image?.startsWith('data:image/')) {
    return 0;
  }

  const base64Content = image.split(',')[1] || '';
  return Buffer.from(base64Content, 'base64').length;
};

const uploadPostAssetToCloudinary = async ({ asset, resourceType, folder, format }) => {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error(
      'Cloudinary configuration missing. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET'
    );
  }

  const uploadResponse = await cloudinary.uploader.upload(asset, {
    folder,
    resource_type: resourceType,
    format,
  });

  return uploadResponse.secure_url;
};

const validateCreatePostBody = ({ userId, username, avatar, title, description, image, pdf, pdfName }) => {
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

  if (
    pdf &&
    !/^(https?:\/\/.+)|(data:application\/pdf;base64,[A-Za-z0-9+/=]+)$/.test(pdf.trim())
  ) {
    errors.push('PDF must be a valid PDF URL or base64 PDF string');
  }

  if (image && image.startsWith('data:image/')) {
    const imageSize = getBase64ImageSizeInBytes(image.trim());

    if (imageSize > MAX_IMAGE_SIZE_BYTES) {
      errors.push('only upload 5mb img');
    }
  }

  if (pdf && pdf.startsWith('data:application/pdf')) {
    const pdfSize = getBase64ImageSizeInBytes(pdf.trim());

    if (pdfSize > MAX_PDF_SIZE_BYTES) {
      errors.push('only upload 10mb pdf');
    }
  }

  if (pdf && !pdfName?.trim()) {
    errors.push('PDF name is required');
  }

  return errors;
};

const createPost = async (req, res) => {
  try {
    const { userId, username, avatar, title, description, image, pdf, pdfName } = req.body;

    const validationErrors = validateCreatePostBody({
      userId,
      username,
      avatar,
      title,
      description,
      image,
      pdf,
      pdfName,
    });

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors,
      });
    }

    let uploadedImageUrl = image?.trim() || '';
    let uploadedPdfUrl = pdf?.trim() || '';

    if (image?.trim()?.startsWith('data:image/')) {
      uploadedImageUrl = await uploadPostAssetToCloudinary({
        asset: image.trim(),
        resourceType: 'image',
        folder: 'mycommunity/posts/images',
      });
    }

    if (pdf?.trim()?.startsWith('data:application/pdf')) {
      uploadedPdfUrl = await uploadPostAssetToCloudinary({
        asset: pdf.trim(),
        resourceType: 'auto',
        folder: 'mycommunity/posts/pdfs',
      });
    }

    const post = await Post.create({
      author: {
        userId,
        username: username.trim(),
        avatar: avatar.trim(),
      },
      title: title.trim(),
      description: description.trim(),
      image: uploadedImageUrl,
      pdf: uploadedPdfUrl,
      pdfName: pdfName?.trim() || '',
    });

    return res.status(201).json({
      success: true,
      message: 'Post created successfully',
      post: serializePost(post),
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
    const requestedUserId = getRequestedUserId(req.query.userId);
    const posts = await Post.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: posts.length,
      posts: posts.map((post) => serializePost(post, requestedUserId)),
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
    const requestedUserId = getRequestedUserId(req.query.userId);

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
      post: serializePost(post, requestedUserId),
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
    const requestedUserId = getRequestedUserId(req.query.userId);

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
      posts: posts.map((post) => serializePost(post, requestedUserId)),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching user posts',
      error: error.message,
    });
  }
};

const toggleLikePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post id',
      });
    }

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid user id is required',
      });
    }

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    const userIdString = userId.toString();
    const existingLikeIndex = post.likedBy.findIndex(
      (likedUserId) => likedUserId.toString() === userIdString
    );

    let isLiked = false;

    if (existingLikeIndex >= 0) {
      post.likedBy.splice(existingLikeIndex, 1);
      post.likesCount = Math.max(0, post.likesCount - 1);
    } else {
      post.likedBy.push(userId);
      post.likesCount += 1;
      isLiked = true;
    }

    await post.save();

    return res.status(200).json({
      success: true,
      message: isLiked ? 'Post liked successfully' : 'Post unliked successfully',
      post: serializePost(post, userIdString),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while updating like',
      error: error.message,
    });
  }
};

const addCommentToPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, username, avatar, message } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post id',
      });
    }

    const validationErrors = validateDiscussionPayload(
      { userId, username, avatar, message },
      'Comment message'
    );

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors,
      });
    }

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    post.comments.push({
      author: {
        userId,
        username: username.trim(),
        avatar: avatar.trim(),
      },
      message: message.trim(),
    });
    post.commentsCount += 1;

    await post.save();

    return res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      post: serializePost(post),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while adding comment',
      error: error.message,
    });
  }
};

const addReplyToComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const { userId, username, avatar, message } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post id',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid comment id',
      });
    }

    const validationErrors = validateDiscussionPayload(
      { userId, username, avatar, message },
      'Reply message'
    );

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors,
      });
    }

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    const comment = findCommentById(post.comments, commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    comment.replies.push({
      author: {
        userId,
        username: username.trim(),
        avatar: avatar.trim(),
      },
      message: message.trim(),
    });
    post.commentsCount += 1;

    await post.save();

    return res.status(201).json({
      success: true,
      message: 'Reply added successfully',
      post: serializePost(post),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while adding reply',
      error: error.message,
    });
  }
};

const incrementShareCount = async (req, res) => {
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

    post.sharesCount += 1;
    await post.save();

    return res.status(200).json({
      success: true,
      message: 'Post shared successfully',
      post: serializePost(post),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while updating share count',
      error: error.message,
    });
  }
};

const downloadPostPdf = async (req, res) => {
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

    if (!post.pdf) {
      return res.status(404).json({
        success: false,
        message: 'PDF not found for this post',
      });
    }

    const downloadUrl = getCloudinaryDownloadUrl(post.pdf, post.pdfName);
    return res.redirect(downloadUrl);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while downloading PDF',
      error: error.message,
    });
  }
};

module.exports = {
  createPost,
  getAllPosts,
  getPostById,
  getPostsByUser,
  toggleLikePost,
  addCommentToPost,
  addReplyToComment,
  incrementShareCount,
  downloadPostPdf,
};
