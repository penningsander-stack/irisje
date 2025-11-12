const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected for seeding'))
  .catch(err => console.error('MongoDB connection error:', err));

const Company = require('./models/company');

const seedData = [
  {
    name: 'Schildersbedrijf De Vries',
    category: 'Schilder',
    location: 'Amsterdam',
    description: 'Professioneel schilderwerk voor binnen en buiten.'
  },
  {
    name: 'Loodgieter Janssen',
    category: 'Loodgieter',
    location: 'Rotterdam',
    description: '24/7 spoedservice en installatie van sanitair.'
  },
  {
    name: 'TuinExpert Groen',
    category: 'Hovenier',
    location: 'Utrecht',
    description: 'Tuinontwerp, aanleg en onderhoud.'
  }
];

async function seed() {
  await Company.deleteMany({});
  await Company.insertMany(seedData);
  console.log('Testbedrijven toegevoegd!');
  mongoose.disconnect();
}

seed();
