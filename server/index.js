require('dotenv').config();

const cors = require('cors');
const express = require('express');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');

const app = express();

const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.use((error, req, res, next) => {
  console.error('Server error:', error);

  if (error?.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'only upload 5mb img',
    });
  }

  if (error?.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'Origin not allowed by CORS',
    });
  }

  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    error:
      process.env.NODE_ENV === 'production'
        ? undefined
        : error?.message || 'Unknown server error',
  });
});

if (require.main === module) {
  const port = process.env.PORT || 3000;

  app.listen(port, async () => {
    try {
      await connectDB();
      console.log(`Server is running on http://localhost:${port}`);
    } catch (error) {
      console.error('Startup error:', error.message);
      process.exit(1);
    }
  });
}

module.exports = app;
