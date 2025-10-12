const API_BASE_URL = 'https://irisje.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
  const searchBtn = document.getElementById('searchBtn');
  const searchInput = document.getElementById('searchInput');
  const resultsDiv = document.getElementById('results');

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
});
