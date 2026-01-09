// frontend/js/dashboard.js
// v20260110-PREMIUM-CARDS-TABS

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
}

// Profile
function fillProfile() {
  $("#companyName").value = company.name || "";
  $("#companyCity").value = company.city || "";

  const intro = company.introduction || "";
  const introEl = $("#companyIntroduction");
  introEl.value = intro;
  $("#introCount").innerText = intro.length;
  introEl.addEventListener("input", () => $("#introCount").innerText = introEl.value.length);

  renderCards("reasonsCards", REASONS, company.reasons || [], 5);
}

$("#saveProfileBtn").onclick = async () => {
  await apiPut(`/companies/${companyId}`, {
    city: $("#companyCity").value,
    introduction: $("#companyIntroduction").value,
    reasons: getActive("reasonsCards"),
  });
  alert("Bedrijfsprofiel opgeslagen");
};

// Services
function fillServices() {
  renderCards("workformsCards", WORKFORMS, company.workforms || []);
  renderCards("targetGroupsCards", TARGET_GROUPS, company.targetGroups || []);
  renderCards("specialtiesCards", SPECIALTIES, company.specialties || []);
  renderCards("regionsCards", REGIONS, company.regions || []);
  $("#worksNationwide").checked = !!company.worksNationwide;
}

$("#saveServicesBtn").onclick = async () => {
  await apiPut(`/companies/${companyId}`, {
    workforms: getActive("workformsCards"),
    targetGroups: getActive("targetGroupsCards"),
    specialties: getActive("specialtiesCards"),
    regions: getActive("regionsCards"),
    worksNationwide: $("#worksNationwide").checked,
  });
  alert("Diensten & expertise opgeslagen");
};

// Cards
function renderCards(containerId, options, selected = [], max = null) {
  const el = document.getElementById(containerId);
  el.innerHTML = "";
  options.forEach(opt => {
    const card = document.createElement("div");
    card.className = "pill" + (selected.includes(opt) ? " active" : "");
    card.textContent = opt;
    card.onclick = () => {
      const isActive = card.classList.toggle("active");
      if (max && isActive) {
        const actives = el.querySelectorAll(".pill.active");
        if (actives.length > max) card.classList.remove("active");
      }
    };
    el.appendChild(card);
  });
}

function getActive(containerId) {
  return [...document.querySelectorAll(`#${containerId} .pill.active`)].map(p => p.textContent);
}

// Helpers
function $(sel) { return document.querySelector(sel); }

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

$("#logoutBtn").onclick = () => {
  localStorage.removeItem("token");
  location.href = "/login.html";
};
