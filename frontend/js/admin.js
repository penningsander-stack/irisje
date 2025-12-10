// frontend/js/admin.js (logs fix only)
// Voeg deze functie toe of vervang je bestaande loadServerLogs()

async function loadServerLogs() {
  const container = document.getElementById('logs-container');
  if (!container) return;

  container.textContent = 'Logs worden geladen...';

  const res = await safeFetch('/api/admin/logs');
  if (!res.ok || !res.data) {
    container.textContent = 'Kon de serverlogs niet ophalen.';
    return;
  }

  const lines = res.data.logs || [];
  if (!lines.length) {
    container.textContent = 'Geen logregels beschikbaar.';
    return;
  }

  container.innerHTML = lines
    .map(l => `<div class='font-mono whitespace-pre'>${l}</div>`)
    .join('');
}
