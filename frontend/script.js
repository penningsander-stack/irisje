const API_BASE_URL = 'https://irisje.onrender.com';

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const companyId = params.get('id');

  if (!companyId) {
    document.getElementById('companyDetails').innerHTML = '<p>Bedrijf niet gevonden.</p>';
    return;
  }

  try {
    // Bedrijfsgegevens ophalen
    const compRes = await fetch(`${API_BASE_URL}/api/companies/${companyId}`);
    const company = await compRes.json();

    document.getElementById('companyDetails').innerHTML = `
      <h2>${company.name}</h2>
      <p><strong>${company.category}</strong> – ${company.location}</p>
      <p>${company.description}</p>
    `;

    // Reviews ophalen
    const revRes = await fetch(`${API_BASE_URL}/api/reviews/company/${companyId}`);
    const reviews = await revRes.json();
    const reviewList = document.getElementById('reviewList');

    if (!reviews.length) {
      reviewList.innerHTML = '<p>Er zijn nog geen reviews voor dit bedrijf.</p>';
    } else {
      reviewList.innerHTML = '<ul>' + reviews.map(r => `
        <li>
          <strong>${r.author}</strong> (${r.rating}/5):<br/>
          ${r.comment}
        </li>
      `).join('') + '</ul>';
    }
  } catch (err) {
    console.error('Fout bij ophalen:', err);
    document.getElementById('companyDetails').innerHTML = '<p>Fout bij laden van gegevens.</p>';
  }

  // Review verzenden
  const submitBtn = document.getElementById('submitReview');
  if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
      const author = document.getElementById('reviewName').value.trim();
      const rating = parseInt(document.getElementById('reviewRating').value);
      const comment = document.getElementById('reviewComment').value.trim();
      const status = document.getElementById('reviewStatus');

      if (!author || !rating || !comment) {
        status.textContent = 'Vul alle velden in.';
        status.style.color = 'red';
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/reviews`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company: companyId,
            author,
            rating,
            comment
          })
        });

        if (res.ok) {
          status.textContent = 'Review succesvol toegevoegd!';
          status.style.color = 'green';
          document.getElementById('reviewName').value = '';
          document.getElementById('reviewRating').value = '';
          document.getElementById('reviewComment').value = '';
          setTimeout(() => location.reload(), 1000);
        } else {
          const errData = await res.json();
          throw new Error(errData.message || 'Fout bij toevoegen review.');
        }
      } catch (err) {
        console.error('Fout bij POST review:', err);
        status.textContent = `Er is iets misgegaan: ${err.message}`;
        status.style.color = 'red';
      }
    });
  }
});
