const API_BASE_URL = 'https://irisje.onrender.com';

function initReviewForm() {
  const reviewForm = document.getElementById('reviewForm');
  const reviewList = document.getElementById('reviewList');
  const companyTitle = document.getElementById('companyTitle');

  if (!reviewForm || !reviewList) {
    console.log("Geen reviewform of reviewList gevonden.");
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const companyId = urlParams.get('id');
  if (!companyId) {
    console.log("Geen bedrijf ID in URL.");
    return;
  }

  console.log("Bedrijf ID:", companyId);

  function loadReviews() {
    fetch(`${API_BASE_URL}/api/reviews/company/${companyId}`)
      .then(res => res.json())
      .then(reviews => {
        reviewList.innerHTML = '';
        if (!reviews.length) {
          reviewList.innerHTML = '<p>Nog geen reviews.</p>';
        } else {
          reviews.forEach(r => {
            const div = document.createElement('div');
            div.innerHTML = `<p><strong>${r.author}</strong> (${r.rating}/5): ${r.comment}</p>`;
            reviewList.appendChild(div);
          });
        }
      });
  }

  reviewForm.addEventListener('submit', e => {
    e.preventDefault();
    const author = document.getElementById('author').value;
    const rating = parseInt(document.getElementById('rating').value);
    const comment = document.getElementById('comment').value;

    console.log("Review verstuurd:", { author, rating, comment });

    fetch(`${API_BASE_URL}/api/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company: companyId, author, rating, comment })
    })
      .then(res => res.json())
      .then(() => {
        reviewForm.reset();
        loadReviews();
      })
      .catch(err => console.error('Fout bij POST:', err));
  });

  loadReviews();
}

function initSearch() {
  const searchBtn = document.getElementById('searchBtn');
  const searchInput = document.getElementById('searchInput');
  const resultsDiv = document.getElementById('results');

  if (!searchBtn || !searchInput || !resultsDiv) return;

  searchBtn.addEventListener('click', () => {
    const query = searchInput.value.trim().toLowerCase();
    fetch(`${API_BASE_URL}/api/companies`)
      .then(res => res.json())
      .then(data => {
        resultsDiv.innerHTML = '';
        const filtered = data.filter(company =>
          company.name.toLowerCase().includes(query) ||
          company.category.toLowerCase().includes(query) ||
          company.location.toLowerCase().includes(query)
        );

        if (filtered.length === 0) {
          resultsDiv.innerHTML = '<p>Geen resultaten gevonden.</p>';
        } else {
          filtered.forEach(company => {
            const avgRating =
              company.reviews && company.reviews.length
                ? (
                    company.reviews.reduce((sum, r) => sum + r.rating, 0) /
                    company.reviews.length
                  ).toFixed(1)
                : 0;

            const card = document.createElement('div');
            card.className = 'company-card';
            card.innerHTML = `
              <h3>${company.name}</h3>
              <p><strong>${company.category}</strong> – ${company.location}</p>
              <p>⭐ Gem. beoordeling: ${avgRating} / 5 (${company.reviews?.length || 0} reviews)</p>
              <a href="company.html?id=${company._id}">Bekijk</a>
            `;
            resultsDiv.appendChild(card);
          });
        }
      })
      .catch(err => {
        resultsDiv.innerHTML = `<p>Fout bij het laden van gegevens: ${err.message}</p>`;
      });
  });
}

// Altijd direct uitvoeren
initSearch();
initReviewForm();
