// frontend/js/dashboard.js
// v20260109-PREVIEW-COMPLETE-SAFE-SAVE

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
  if (!my?.companies?.length) return;

  companyId = my.companies[0]._id;

  const data = await apiGet(`/companies/${companyId}`);
  company = data?.item || {};

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
  company.introduction = $("#companyIntroduction").value;
  company.reasons = getActive("reasonsCards");

  await apiPut(`/companies/${companyId}`, {
    introduction: company.introduction,
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

  // Veilig: alleen velden die dit scherm beheert
  await apiPut(`/companies/${companyId}`, {
    workforms: company.workforms,
    targetGroups: company.targetGroups,
    specialties: company.specialties,
    regions: company.regions,
    worksNationwide: company.worksNationwide,
  });

  updateCompleteness();
  renderPreview();
  alert("Diensten & expertise opgeslagen");
};

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

  const percentEl = document.getElementById("profilePercent");
  const bar = document.getElementById("profileBar");
  const hint = document.getElementById("profileHint");

  if (percentEl) percentEl.innerText = percent;

  if (bar) {
    bar.style.display = "block";
    bar.style.height = "10px";
    bar.style.width = percent + "%";
    bar.style.background = "linear-gradient(90deg,#4f46e5,#6366f1)";
    bar.style.borderRadius = "999px";
    bar.style.transition = "width 0.4s ease";
  }

  if (hint) {
    if (percent < 60) hint.innerText = `Nog ${6 - score} stap(pen) om zichtbaar te worden voor klanten.`;
    else if (percent < 80) hint.innerText = "Bijna klaar – je profiel wordt beter zichtbaar.";
    else hint.innerText = "Je profiel is volledig zichtbaar voor klanten.";
  }
}

// -------- Preview --------
function renderPreview() {
  setText("#pv-name", company.name || "");
  setText("#pv-city", company.city || "");

  // Badges
  const badges = $("#pv-badges");
  badges.innerHTML = "";
  if (company.worksNationwide) badges.appendChild(makeBadge("Landelijk actief"));
  if ((company.specialties || []).length >= 3) badges.appendChild(makeBadge("Breed gespecialiseerd"));
  if ((company.reasons || []).length >= 3) badges.appendChild(makeBadge("Sterk profiel"));

  // Intro
  setText("#pv-intro", (company.introduction || "").trim() || "Nog geen introductie ingevuld.");

  // Reasons list + empty state
  const reasons = company.reasons || [];
  const ul = $("#pv-reasons");
  ul.innerHTML = "";
  reasons.forEach(r => {
    const li = document.createElement("li");
    li.innerText = r;
    ul.appendChild(li);
  });
  toggleEmpty("#pv-reasons-empty", reasons.length === 0);

  // Specialties
  const specialties = company.specialties || [];
  setText("#pv-specialties", specialties.join(" · "));
  toggleEmpty("#pv-specialties-empty", specialties.length === 0);

  // Target groups
  const tg = company.targetGroups || [];
  setText("#pv-targetGroups", tg.join(" · "));
  toggleEmpty("#pv-targetGroups-empty", tg.length === 0);

  // Workforms
  const wf = company.workforms || [];
  setText("#pv-workforms", wf.join(" · "));
  toggleEmpty("#pv-workforms-empty", wf.length === 0);

  // Regions
  const reg = company.regions || [];
  const regionText = company.worksNationwide ? "Heel Nederland" : reg.join(" · ");
  setText("#pv-regions", regionText);
  toggleEmpty("#pv-regions-empty", !company.worksNationwide && reg.length === 0);
}

function makeBadge(text) {
  const s = document.createElement("span");
  s.className = "pill badge";
  s.innerText = text;
  return s;
}

function setText(sel, value) {
  const el = document.querySelector(sel);
  if (el) el.innerText = value || "";
}

function toggleEmpty(sel, show) {
  const el = document.querySelector(sel);
  if (!el) return;
  if (show) el.classList.remove("hidden");
  else el.classList.add("hidden");
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
      const nowActive = card.classList.toggle("active");

      if (max && nowActive) {
        const actives = el.querySelectorAll(".pill.active");
        if (actives.length > max) card.classList.remove("active");
      }

      // Sync naar company-state voor live preview/compleetheid
      if (containerId === "reasonsCards") company.reasons = getActive("reasonsCards");
      if (containerId === "workformsCards") company.workforms = getActive("workformsCards");
      if (containerId === "targetGroupsCards") company.targetGroups = getActive("targetGroupsCards");
      if (containerId === "specialtiesCards") company.specialties = getActive("specialtiesCards");
      if (containerId === "regionsCards") company.regions = getActive("regionsCards");

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

$("#logoutBtn").onclick = () => {
  localStorage.removeItem("token");
  location.href = "/login.html";
};
