const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: String,
  location: String,
  description: String
});

module.exports = mongoose.model('Company', companySchema);
