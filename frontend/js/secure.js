// frontend/js/secure.js
// ============================================
// Centrale beveiliging + automatische cache-busting + uitloggen
// ============================================

// 1) Cache-busting voor eigen JS-bestanden (voorkomt oude versies)
(function () {
  try {
    document.querySelectorAll('script[src]').forEach((tag) => {
      const url = new URL(tag.src, window.location.origin);
      // Alleen je eigen frontend-bestanden voorzien van ?v=
      const isOwn = url.origin === window.location.origin;
      if (isOwn && !url.searchParams.has('v')) {
        url.searchParams.set('v', new Date().toISOString().slice(0, 10));
        const fresh = document.createElement('script');
        fresh.src = url.toString();
        fresh.defer = true;
        document.head.appendChild(fresh);
        tag.remove();
      }
    });
  } catch (_) {}
})();

// 2) Tokencontrole op beveiligde pagina's
(function () {
  const token = localStorage.getItem('token');
  const path = window.location.pathname;
  const publicPages = ['/login.html', '/register.html', '/index.html', '/'];

  // Geen token en niet op publieke pagina? -> naar login
  if (!token && !publicPages.some((p) => path.endsWith(p))) {
    window.location.href = 'login.html';
    return;
  }

  // Token basale controle (JWT exp indien aanwezig)
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1] || ''));
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        localStorage.removeItem('token');
        localStorage.removeItem('company');
        window.location.href = 'login.html';
        return;
      }
      console.log('✅ Token is geldig en behouden');
    } catch (e) {
      // Geen geldig JWT-formaat -> uitloggen
      localStorage.removeItem('token');
      localStorage.removeItem('company');
      window.location.href = 'login.html';
    }
  }
})();

// 3) Uitloggen knop(pen) laten werken (ondersteunt #logoutBtn en #logout)
document.addEventListener('DOMContentLoaded', () => {
  const bindLogout = (el) => {
    if (!el) return;
    el.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('token');
      localStorage.removeItem('company');
      window.location.href = 'login.html';
    });
  };

  bindLogout(document.getElementById('logoutBtn'));
  bindLogout(document.getElementById('logout')); // fallback voor oude ID
});
