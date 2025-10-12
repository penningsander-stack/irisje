const API_BASE_URL = 'http://localhost:5000';

function calcAverage(reviews) {
  if (!reviews || reviews.length === 0) return 0;
  const sum = reviews.reduce((total, r) => total + r.rating, 0);
  return (sum / reviews.length).toFixed(1);
}

// Zoekpagina (index.html)
if (window.location.href.includes('index.html')) {
  document.getElementById('searchBtn')?.addEventListener('click', async () => {
    const term = document.getElementById('searchInput').value.trim().toLowerCase();
    const res = await fetch(`${API_BASE_URL}/api/companies`);
    const companies = await res.json();

    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';

    const matches = companies.filter(c =>
      c.name.toLowerCase().includes(term) ||
      c.category.toLowerCase().includes(term) ||
      c.location.toLowerCase().includes(term)
    );

    if (matches.length === 0) {
      resultsDiv.innerHTML = '<p>🔍 Geen bedrijven gevonden die passen bij je zoekopdracht.</p>';
      return;
    }

    for (const c of matches) {
      const revRes = await fetch(`${API_BASE_URL}/api/reviews/company/${c._id}`);
      const reviews = await revRes.json();
      const avg = calcAverage(reviews);

      const card = document.createElement('div');
      card.className = 'company-card';
      card.innerHTML = `
        <h3>${c.name}</h3>
        <p>${c.category} – ${c.location}</p>
        <p>⭐ Gem. beoordeling: ${avg} / 5 (${reviews.length} reviews)</p>
        <button onclick="location.href='company.html?id=${c._id}'">Bekijk</button>
      `;
      resultsDiv.appendChild(card);
    }
  });
}

// Bedrijfspagina (company.html)
if (window.location.href.includes('company.html')) {
  document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) return;

    const compRes = await fetch(`${API_BASE_URL}/api/companies/${id}`);
    const company = await compRes.json();

    document.getElementById('companyName').innerText = company.name;
    document.getElementById('companyDetails').innerHTML = `
      <p><strong>Categorie:</strong> ${company.category}</p>
      <p><strong>Locatie:</strong> ${company.location}</p>
      <p><strong>Beschrijving:</strong> ${company.description}</p>
    `;

    async function loadReviewsAndDisplay() {
      const revRes = await fetch(`${API_BASE_URL}/api/reviews/company/${id}`);
      const reviews = await revRes.json();
      const avg = calcAverage(reviews);

      const reviewsList = document.getElementById('reviewsList');
      reviewsList.innerHTML = `<p>⭐ Gem. beoordeling: ${avg} / 5 (${reviews.length} reviews)</p>`;

      if (reviews.length > 0) {
        reviewsList.innerHTML += reviews
          .map(
            r => `
          <div class="review">
            <strong>${r.author}</strong> (${r.rating}/5):<br/>
            ${r.comment}
          </div>`
          )
          .join('');
      } else {
        reviewsList.innerHTML += '<p>Nog geen reviews.</p>';
      }
    }

    await loadReviewsAndDisplay();

    const form = document.getElementById('reviewForm');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const author = document.getElementById('author').value.trim();
        const rating = document.getElementById('rating').value.trim();
        const comment = document.getElementById('comment').value.trim();

        // Frontend-validatie
        if (!author || !rating || !comment) {
          alert('Vul aub alle velden in.');
          return;
        }
        const rnum = parseInt(rating);
        if (isNaN(rnum) || rnum < 1 || rnum > 5) {
          alert('Beoordeling moet een getal tussen 1 en 5 zijn.');
          return;
        }

        const resp = await fetch(`${API_BASE_URL}/api/reviews`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ company: id, author, rating: rnum, comment })
        });

        if (resp.ok) {
          form.reset();
          await loadReviewsAndDisplay();
        } else {
          const err = await resp.json();
          alert(`Fout bij versturen review: ${err.message}`);
        }
      });
    }
  });
}

// Bedrijf toevoegen (add-company.html)
if (window.location.href.includes('add-company.html')) {
  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('companyForm');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('name').value.trim();
      const category = document.getElementById('category').value.trim();
      const location = document.getElementById('location').value.trim();
      const description = document.getElementById('description').value.trim();

      // Frontend-validatie
      if (!name || !category || !location || !description) {
        document.getElementById('message').textContent = 'Alle velden zijn verplicht.';
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/companies`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, category, location, description })
        });

        const messageDiv = document.getElementById('message');
        if (response.ok) {
          messageDiv.textContent = '✅ Bedrijf succesvol toegevoegd!';
          form.reset();
        } else {
          const data = await response.json();
          messageDiv.textContent = `❌ Fout: ${data.message || 'Onbekend probleem'}`;
        }
      } catch (error) {
        document.getElementById('message').textContent = '⚠️ Kan server niet bereiken.';
      }
    });
  });
}
