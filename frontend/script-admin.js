const API_BASE_URL = 'https://irisje.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
  const companyList = document.getElementById('companyList');
  const reviewListAdmin = document.getElementById('reviewListAdmin');

  // Laden bedrijven
  fetch(`${API_BASE_URL}/api/companies`)
    .then(res => res.json())
    .then(companies => {
      companyList.innerHTML = '';
      companies.forEach(c => {
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `
          <h3>${c.name}</h3>
          <p>${c.category} – ${c.location}</p>
          <p>${c.description}</p>
          <button onclick="editCompany('${c._id}')">Bewerk</button>
          <button onclick="deleteCompany('${c._id}')">Verwijder</button>
        `;
        companyList.appendChild(div);
      });
    });

  // Laden reviews
  fetch(`${API_BASE_URL}/api/reviews/company/`)
    .then(res => res.json())
    .then(reviews => {
      reviewListAdmin.innerHTML = '';
      reviews.forEach(r => {
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `
          <p>ID: ${r._id}</p>
          <p>Bedrijf: ${r.company}</p>
          <p>${r.author} (${r.rating}/5): ${r.comment}</p>
          <button onclick="deleteReview('${r._id}')">Verwijder review</button>
        `;
        reviewListAdmin.appendChild(div);
      });
    });

  window.editCompany = function(id) {
    const newName = prompt('Nieuwe naam:');
    const newDesc = prompt('Nieuwe beschrijving:');
    if (newName || newDesc) {
      fetch(`${API_BASE_URL}/api/companies/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, description: newDesc })
      })
        .then(_ => location.reload());
    }
  };

  window.deleteCompany = function(id) {
    if (confirm('Weet je zeker dat je dit bedrijf wil verwijderen?')) {
      fetch(`${API_BASE_URL}/api/companies/${id}`, {
        method: 'DELETE'
      })
        .then(_ => location.reload());
    }
  };

  window.deleteReview = function(id) {
    if (confirm('Weet je zeker dat je deze review wil verwijderen?')) {
      fetch(`${API_BASE_URL}/api/reviews/${id}`, {
        method: 'DELETE'
      })
        .then(_ => location.reload());
    }
  };
});
