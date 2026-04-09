const express = require('express');
const {
  signupUser,
  loginUser,
  verifyEmailCode,
  resendVerificationCode,
} = require('../controller/authController');

const router = express.Router();

router.post('/signup', signupUser);
router.post('/login', loginUser);
router.post('/verify-email', verifyEmailCode);
router.post('/resend-verification-code', resendVerificationCode);

module.exports = router;
