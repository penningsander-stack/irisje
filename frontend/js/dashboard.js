// frontend/js/dashboard.js
// v20260112-PREVIEW

const API_BASE = "https://irisje-backend.onrender.com/api";
const token = localStorage.getItem("token");
if (!token) location.href = "/login.html";

// Tabs
document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-section").forEach(s => s.classList.add("hidden"));
    btn.classList.add("active");
    document.getElementById(`tab-${btn.dataset.tab}`).classList.remove("hidden");
  });
});

// Opties
const REASONS = [
  "Gratis eerste advies",
  "Ook ’s avonds en in het weekend bereikbaar",
  "Specialist in spoedzaken",
  "Landelijk actief",
  "Persoonlijke begeleiding",
  "No cure no pay mogelijk",
  "Ruime ervaring in complexe zaken",
  "Snelle reactie en duidelijke communicatie",
];
const WORKFORMS = ["Telefonisch", "Online", "Op locatie"];
const TARGET_GROUPS = ["Particulier", "ZZP", "MKB", "Werkgever", "Werknemer"];
const SPECIALTIES = ["Arbeidsrecht", "Bestuursrecht", "Mediation", "Ontslag", "Boetes"];
const REGIONS = ["Zeeland", "Zuid-Holland", "Noord-Holland", "Brabant"];

let companyId = null;
let company = {};

init();

async function init() {
  const my = await apiGet("/companies/my");
  if (!my.companies?.length) return;
  companyId = my.companies[0]._id;

  const data = await apiGet(`/companies/${companyId}`);
  company = data.item || {};

  fillProfile();
  fillServices();
  updateCompleteness();
  renderPreview();
}

// -------- Profile --------
function fillProfile() {
  $("#companyName").value = company.name || "";
  $("#companyCity").value = company.city || "";

  const introEl = $("#companyIntroduction");
  introEl.value = company.introduction || "";
  $("#introCount").innerText = introEl.value.length;
  introEl.oninput = () => {
    $("#introCount").innerText = introEl.value.length;
    company.introduction = introEl.value;
    updateCompleteness();
    renderPreview();
  };

  renderCards("reasonsCards", REASONS, company.reasons || [], 5);
}

$("#saveProfileBtn").onclick = async () => {
  company.reasons = getActive("reasonsCards");
  await apiPut(`/companies/${companyId}`, {
    introduction: $("#companyIntroduction").value,
    reasons: company.reasons,
  });
  updateCompleteness();
  renderPreview();
  alert("Bedrijfsprofiel opgeslagen");
};

// -------- Services --------
function fillServices() {
  renderCards("workformsCards", WORKFORMS, company.workforms || []);
  renderCards("targetGroupsCards", TARGET_GROUPS, company.targetGroups || []);
  renderCards("specialtiesCards", SPECIALTIES, company.specialties || []);
  renderCards("regionsCards", REGIONS, company.regions || []);
  $("#worksNationwide").checked = !!company.worksNationwide;
}

$("#saveServicesBtn").onclick = async () => {
  company.workforms = getActive("workformsCards");
  company.targetGroups = getActive("targetGroupsCards");
  company.specialties = getActive("specialtiesCards");
  company.regions = getActive("regionsCards");
  company.worksNationwide = $("#worksNationwide").checked;

  await apiPut(`/companies/${companyId}`, company);
  updateCompleteness();
  renderPreview();
  alert("Diensten & expertise opgeslagen");
};

// -------- Preview --------
function renderPreview() {
  $("#pv-name").innerText = company.name || "";
  $("#pv-city").innerText = company.worksNationwide ? "Landelijk actief" : (company.city || "");
  $("#pv-intro").innerText = company.introduction || "";

  const badges = $("#pv-badges");
  badges.innerHTML = "";
  if (company.worksNationwide) {
    const b = document.createElement("span");
    b.className = "pill badge";
    b.innerText = "Landelijk actief";
    badges.appendChild(b);
  }

  const reasonsEl = $("#pv-reasons");
  reasonsEl.innerHTML = "";
  (company.reasons || []).forEach(r => {
    const li = document.createElement("li");
    li.innerText = r;
    reasonsEl.appendChild(li);
  });

  $("#pv-specialties").innerText = (company.specialties || []).join(" · ");
  $("#pv-workforms").innerText = (company.workforms || []).join(" · ");
}

// -------- Completeness --------
function updateCompleteness() {
  let score = 0;
  if ((company.introduction || "").length >= 80) score++;
  if ((company.reasons || []).length >= 3) score++;
  if ((company.workforms || []).length >= 1) score++;
  if ((company.targetGroups || []).length >= 1) score++;
  if ((company.specialties || []).length >= 1) score++;
  if ((company.regions || []).length >= 1 || company.worksNationwide) score++;

  const percent = Math.round((score / 6) * 100);
  $("#profilePercent").innerText = percent;
  $("#profileBar").style.width = percent + "%";

  if (percent < 60) {
    $("#profileHint").innerText = `Nog ${6 - score} stap(pen) om zichtbaar te worden voor klanten.`;
  } else if (percent < 80) {
    $("#profileHint").innerText = "Bijna klaar – je profiel wordt beter zichtbaar.";
  } else {
    $("#profileHint").innerText = "Je profiel is volledig zichtbaar voor klanten.";
  }
}

// -------- Cards --------
function renderCards(containerId, options, selected = [], max = null) {
  const el = document.getElementById(containerId);
  el.innerHTML = "";
  options.forEach(opt => {
    const card = document.createElement("div");
    card.className = "pill" + (selected.includes(opt) ? " active" : "");
    card.innerText = opt;
    card.onclick = () => {
      card.classList.toggle("active");
      if (max) {
        const actives = el.querySelectorAll(".pill.active");
        if (actives.length > max) card.classList.remove("active");
      }
      updateCompleteness();
      renderPreview();
    };
    el.appendChild(card);
  });
}

function getActive(containerId) {
  return [...document.querySelectorAll(`#${containerId} .pill.active`)].map(p => p.innerText);
}

// -------- Helpers --------
function $(q) { return document.querySelector(q); }
async function apiGet(url) {
  const r = await fetch(API_BASE + url, { headers: { Authorization: `Bearer ${token}` } });
  return r.json();
}
async function apiPut(url, body) {
  const r = await fetch(API_BASE + url, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  return r.json();
}
$("#logoutBtn").onclick = () => { localStorage.removeItem("token"); location.href="/login.html"; };
