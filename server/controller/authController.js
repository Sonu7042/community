const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../model/user');

const usernamePattern = /^[a-zA-Z0-9_.]{3,30}$/;
const emailPattern = /^\S+@\S+\.\S+$/;
const passwordPattern =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_.\-])[A-Za-z\d@$!%*?&_.\-]{8,64}$/;

const formatValidationErrors = (error) =>
  Object.values(error.errors).map((item) => item.message);

const VERIFICATION_CODE_MINUTES = 10;

const generateVerificationCode = () =>
  crypto.randomInt(100000, 1000000).toString();

const hashVerificationCode = (code) =>
  crypto.createHash('sha256').update(code).digest('hex');

const getTransporter = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
    throw new Error(
      'SMTP configuration missing. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM'
    );
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
};

const sendVerificationEmail = async (email, code) => {
  const transporter = getTransporter();

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: 'MyCommunity email verification code',
    text: `Your MyCommunity verification code is ${code}. It will expire in ${VERIFICATION_CODE_MINUTES} minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 24px; color: #111827;">
        <h2 style="margin-bottom: 16px;">Verify your email</h2>
        <p style="margin-bottom: 16px;">
          Your MyCommunity verification code is:
        </p>
        <div style="font-size: 28px; font-weight: bold; letter-spacing: 6px; margin-bottom: 16px;">
          ${code}
        </div>
        <p>This code will expire in ${VERIFICATION_CODE_MINUTES} minutes.</p>
      </div>
    `,
  });
};

const validateSignupBody = ({ username, email, password }) => {
  const errors = [];

  if (!username || !username.trim()) {
    errors.push('Username is required');
  } else if (!usernamePattern.test(username.trim())) {
    errors.push(
      'Username must be 3-30 characters and use only letters, numbers, underscores, or periods'
    );
  }

  if (!email || !email.trim()) {
    errors.push('Email is required');
  } else if (!emailPattern.test(email.trim().toLowerCase())) {
    errors.push('Please provide a valid email address');
  }

  if (!password) {
    errors.push('Password is required');
  } else if (!passwordPattern.test(password)) {
    errors.push(
      'Password must be 8-64 characters and include uppercase, lowercase, number, and special character'
    );
  }

  return errors;
};

const validateLoginBody = ({ email, password }) => {
  const errors = [];

  if (!email || !email.trim()) {
    errors.push('Email is required');
  } else if (!emailPattern.test(email.trim().toLowerCase())) {
    errors.push('Please provide a valid email address');
  }

  if (!password) {
    errors.push('Password is required');
  }

  return errors;
};

const validateEmailBody = ({ email }) => {
  const errors = [];

  if (!email || !email.trim()) {
    errors.push('Email is required');
  } else if (!emailPattern.test(email.trim().toLowerCase())) {
    errors.push('Please provide a valid email address');
  }

  return errors;
};

const validateVerificationBody = ({ email, code }) => {
  const errors = [];

  if (!email || !email.trim()) {
    errors.push('Email is required');
  } else if (!emailPattern.test(email.trim().toLowerCase())) {
    errors.push('Please provide a valid email address');
  }

  if (!code || !code.trim()) {
    errors.push('Verification code is required');
  } else if (!/^\d{6}$/.test(code.trim())) {
    errors.push('Verification code must be 6 digits');
  }

  return errors;
};

const issueVerificationCode = async (user) => {
  const code = generateVerificationCode();
  user.emailVerificationCodeHash = hashVerificationCode(code);
  user.emailVerificationCodeExpires = new Date(
    Date.now() + VERIFICATION_CODE_MINUTES * 60 * 1000
  );
  user.emailVerified = false;
  user.emailVerifiedAt = null;
  await sendVerificationEmail(user.email, code);
  await user.save();
};

const signupUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const validationErrors = validateSignupBody({ username, email, password });

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors,
      });
    }

    const normalizedUsername = username.trim();
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      $or: [{ username: normalizedUsername }, { email: normalizedEmail }],
    });

    if (existingUser) {
      const duplicateField =
        existingUser.email === normalizedEmail ? 'Email already exists' : 'Username already exists';

      return res.status(409).json({
        success: false,
        message: duplicateField,
      });
    }

    const user = new User({
      username: normalizedUsername,
      email: normalizedEmail,
      password,
      emailVerified: false,
    });

    await issueVerificationCode(user);

    return res.status(201).json({
      success: true,
      message: 'User created successfully. Verification code sent to email',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: formatValidationErrors(error),
      });
    }

    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `${duplicateField} already exists`,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Server error while creating user',
      error: error.message,
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const validationErrors = validateLoginBody({ email, password });

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors,
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before login',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while logging in',
      error: error.message,
    });
  }
};

const verifyEmailCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    const validationErrors = validateVerificationBody({ email, code });

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors,
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select(
      '+emailVerificationCodeHash +emailVerificationCodeExpires'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.emailVerified) {
      return res.status(200).json({
        success: true,
        message: 'Email is already verified',
      });
    }

    if (
      !user.emailVerificationCodeHash ||
      !user.emailVerificationCodeExpires ||
      user.emailVerificationCodeExpires < new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Verification code expired. Please request a new code',
      });
    }

    const incomingCodeHash = hashVerificationCode(code.trim());

    if (incomingCodeHash !== user.emailVerificationCodeHash) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code',
      });
    }

    user.emailVerified = true;
    user.emailVerifiedAt = new Date();
    user.emailVerificationCodeHash = null;
    user.emailVerificationCodeExpires = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while verifying email',
      error: error.message,
    });
  }
};

const resendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;
    const validationErrors = validateEmailBody({ email });

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors,
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select(
      '+emailVerificationCodeHash +emailVerificationCodeExpires'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified',
      });
    }

    await issueVerificationCode(user);

    return res.status(200).json({
      success: true,
      message: 'Verification code sent successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while sending verification code',
      error: error.message,
    });
  }
};

module.exports = {
  signupUser,
  loginUser,
  verifyEmailCode,
  resendVerificationCode,
};
