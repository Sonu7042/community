require('dotenv').config();

const cors = require('cors');
const express = require('express');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const app = express();
connectDB();
// const port = process.env.PORT || 3000;

app.use(cors());
// app.use(
//   cors({
//     origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
//   })
// );
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);

// app.listen(port, () => {
//   console.log(`Server is running on http://localhost:${port}`);
// });

app.get('/', (req, res) => {
  res.send('Hello, World!');
});



module.exports = app;