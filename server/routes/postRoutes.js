const express = require('express');
const {
  createPost,
  getAllPosts,
  getPostById,
  getPostsByUser,
  toggleLikePost,
  addCommentToPost,
  addReplyToComment,
  incrementShareCount,
  downloadPostPdf,
} = require('../controller/postController');

const router = express.Router();

router.get('/', getAllPosts);
router.get('/user/:userId', getPostsByUser);
router.get('/:id/download', downloadPostPdf);
router.get('/:id', getPostById);
router.post('/', createPost);
router.patch('/:id/like', toggleLikePost);
router.patch('/:id/share', incrementShareCount);
router.post('/:id/comments', addCommentToPost);
router.post('/:id/comments/:commentId/replies', addReplyToComment);

module.exports = router;
