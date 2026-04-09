const express = require('express');
const {
  createPost,
  getAllPosts,
  getPostById,
  getPostsByUser,
} = require('../controller/postController');

const router = express.Router();

router.get('/', getAllPosts);
router.get('/user/:userId', getPostsByUser);
router.get('/:id', getPostById);
router.post('/', createPost);

module.exports = router;
