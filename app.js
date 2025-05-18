const express = require('express');
const cors = require('cors');
const app = express();

// CORS configuration
app.use(cors());

// Middleware for parsing JSON bodies
app.use(express.json());
app.get('/', (req, res) => {
  res.send('Hello, from Omnium!');
});
// Import routes
const apiRouter = require('./routes/api');

// Use routes
app.use('/api', apiRouter);

// Basic error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});