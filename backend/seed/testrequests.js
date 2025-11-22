// backend/seed/testRequests.js
const mongoose = require('mongoose');
require('dotenv').config();

const Request = require('../models/request');
const Company = require('../models/company');

(async () => {
  try {
    console.log('⏳ Verbinden met MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);

    // Zoek het demo-bedrijf
    const company = await Company.findOne({ email: 'demo@irisje.nl' });
    if (!company) {
      console.error('❌ Demo-bedrijf niet gevonden.');
      process.exit(1);
    }

    console.log(`🏢 Gekoppeld bedrijf gevonden: ${company.name}`);

    const testRequests = [
      {
        customerName: 'Jan Jansen',
        customerEmail: 'jan.jansen@example.com',
        customerPhone: '0612345678',
        description: 'Ik heb lekkage bij mijn dak en zoek een bedrijf in de buurt om dit te repareren.',
        company: company._id,
        statusByCompany: [
          { company: company._id, status: 'Nieuw', updatedAt: new Date() }
        ],
        createdAt: new Date()
      },
      {
        customerName: 'Marieke de Boer',
        customerEmail: 'marieke.deboer@example.com',
        customerPhone: '0622334455',
        description: 'Ik wil graag mijn tuin opnieuw laten aanleggen, kunnen jullie een offerte maken?',
        company: company._id,
        statusByCompany: [
          { company: company._id, status: 'Nieuw', updatedAt: new Date() }
        ],
        createdAt: new Date()
      }
    ];

    await Request.insertMany(testRequests);
    console.log('✅ Twee testaanvragen toegevoegd!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Fout bij het toevoegen van testaanvragen:', err);
    process.exit(1);
  }
})();
