const API_BASE_URL = 'https://irisje.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
  const isAdmin = window.location.pathname.includes('admin.html');
  if (isAdmin) {
    const companyList = document.getElementById('companyList');
    const form = document.getElementById('addCompanyForm');

    if (!companyList) {
      console.error('companyList element niet gevonden');
      return;
    }
    if (!form) {
      console.error('addCompanyForm element niet gevonden');
      return;
    }

    // Laden bedrijven
    fetch(`${API_BASE_URL}/api/companies`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (!Array.isArray(data)) {
          console.error('Verwachte array van bedrijven, kreeg:', data);
          return;
        }
        companyList.innerHTML = '';
        if (data.length === 0) {
          companyList.innerHTML = '<li>Geen bedrijven gevonden.</li>';
        } else {
          data.forEach(company => {
            const li = document.createElement('li');
            li.innerHTML = `
              <strong>${company.name}</strong> – ${company.category} – ${company.location}<br>
              ${company.description}<br>
              <button data-id="${company._id}" class="btn-delete">Verwijder</button>
            `;
            companyList.appendChild(li);
          });

          document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => {
              const id = btn.getAttribute('data-id');
              if (confirm('Weet je zeker dat je dit bedrijf wilt verwijderen?')) {
                fetch(`${API_BASE_URL}/api/companies/${id}`, { method: 'DELETE' })
                  .then(r => {
                    if (!r.ok) throw new Error('Delete mislukt');
                    return r.json();
                  })
                  .then(() => {
                    alert('Bedrijf verwijderd');
                    location.reload();
                  })
                  .catch(err => {
                    console.error('Fout bij verwijderen:', err);
                    alert('Kon bedrijf niet verwijderen');
                  });
              }
            });
          });
        }
      })
      .catch(err => {
        console.error('Fout bij fetch bedrijven:', err);
        companyList.innerHTML = '<li>Fout bij laden bedrijven.</li>';
      });

    // Formulier toevoegen
    form.addEventListener('submit', e => {
      e.preventDefault();
      const name = document.getElementById('newName').value.trim();
      const category = document.getElementById('newCategory').value.trim();
      const location = document.getElementById('newLocation').value.trim();
      const description = document.getElementById('newDescription').value.trim();

      if (!name || !category || !location || !description) {
        alert('Vul alle velden in');
        return;
      }

      fetch(`${API_BASE_URL}/api/companies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, category, location, description })
      })
        .then(r => {
          if (!r.ok) throw new Error('POST mislukt');
          return r.json();
        })
        .then(() => {
          alert('Bedrijf toegevoegd');
          location.reload();
        })
        .catch(err => {
          console.error('Fout bij toevoegen:', err);
          alert('Kon bedrijf niet toevoegen');
        });
    });
  }
});
