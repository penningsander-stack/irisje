const API_BASE_URL = 'https://irisje.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
  const searchBtn = document.getElementById('searchBtn');
  const searchInput = document.getElementById('searchInput');
  const resultsContainer = document.getElementById('results');

  if (searchBtn && searchInput && resultsContainer) {
    searchBtn.addEventListener('click', () => {
      const query = searchInput.value.trim();
      if (!query) return;

      fetch(`${API_BASE_URL}/api/companies`)
        .then(res => res.json())
        .then(data => {
          const filtered = data.filter(c =>
            c.name.toLowerCase().includes(query.toLowerCase()) ||
            c.category.toLowerCase().includes(query.toLowerCase())
          );

          resultsContainer.innerHTML = '';
          if (filtered.length === 0) {
            resultsContainer.innerHTML = '<p>Geen resultaten gevonden.</p>';
            return;
          }

          filtered.forEach(company => {
            const div = document.createElement('div');
            div.className = 'company-card';
            div.innerHTML = `
              <h2>${company.name}</h2>
              <p><strong>${company.category}</strong> – ${company.location}</p>
              <p>${company.description}</p>
              <a href="company.html?id=${company._id}">Bekijk</a>
            `;
            resultsContainer.appendChild(div);
          });
        });
    });
  }

  const isCompanyPage = window.location.pathname.includes('company.html');
  if (isCompanyPage) {
    const params = new URLSearchParams(window.location.search);
    const companyId = params.get('id');

    const nameEl = document.getElementById('companyName');
    const categoryEl = document.getElementById('companyCategory');
    const locationEl = document.getElementById('companyLocation');
    const descEl = document.getElementById('companyDescription');
    const reviewList = document.getElementById('reviewList');
    const reviewForm = document.getElementById('reviewForm');

    fetch(`${API_BASE_URL}/api/companies/${companyId}`)
      .then(res => res.json())
      .then(company => {
        nameEl.textContent = company.name;
        categoryEl.textContent = `${company.category} – ${company.location}`;
        locationEl.textContent = company.location;
        descEl.textContent = company.description;
      });

    fetch(`${API_BASE_URL}/api/reviews/${companyId}`)
      .then(res => res.json())
      .then(reviews => {
        reviewList.innerHTML = '';
        if (reviews.length === 0) {
          reviewList.innerHTML = '<p>Er zijn nog geen reviews.</p>';
        } else {
          reviews.forEach(r => {
            const div = document.createElement('div');
            div.innerHTML = `<strong>${r.name}</strong> (${r.rating}/5):<br>${r.comment}<hr>`;
            reviewList.appendChild(div);
          });
        }
      });

    reviewForm.addEventListener('submit', e => {
      e.preventDefault();
      const name = reviewForm.name.value.trim();
      const rating = reviewForm.rating.value;
      const comment = reviewForm.comment.value.trim();

      if (!name || !rating || !comment) {
        alert('Vul alle velden in.');
        return;
      }

      fetch(`${API_BASE_URL}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, name, rating, comment })
      })
        .then(res => {
          if (!res.ok) throw new Error('Review niet opgeslagen');
          alert('Review succesvol toegevoegd!');
          location.reload();
        })
        .catch(() => alert('Er is iets misgegaan.'));
    });
  }

  const isAdminPage = window.location.pathname.includes('admin.html');
  if (isAdminPage) {
    const companyList = document.getElementById('companyList');

    fetch(`${API_BASE_URL}/api/companies`)
      .then(res => res.json())
      .then(data => {
        companyList.innerHTML = '';
        data.forEach(company => {
          const li = document.createElement('li');
          li.innerHTML = `
            <strong>${company.name}</strong> – ${company.category} – ${company.location}<br />
            <button data-id="${company._id}" class="deleteBtn">Verwijderen</button>
          `;
          companyList.appendChild(li);
        });

        document.querySelectorAll('.deleteBtn').forEach(button => {
          button.addEventListener('click', () => {
            const id = button.getAttribute('data-id');
            if (confirm('Weet je zeker dat je dit bedrijf wilt verwijderen?')) {
              fetch(`${API_BASE_URL}/api/companies/${id}`, {
                method: 'DELETE'
              })
                .then(res => res.json())
                .then(() => {
                  alert('Bedrijf verwijderd.');
                  location.reload();
                });
            }
          });
        });
      });
  }
});
