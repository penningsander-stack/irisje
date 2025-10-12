const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
require('dotenv').config();

const companiesRoute = require('./routes/companies');
const reviewsRoute = require('./routes/reviews');

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

app.use('/api/companies', companiesRoute);
app.use('/api/reviews', reviewsRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
