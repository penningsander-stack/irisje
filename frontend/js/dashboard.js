// frontend/js/dashboard.js
// v20260113-PROFILE-PREVIEW

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

// Options
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
}

// -------- Profile --------
function fillProfile() {
  $("#companyName").value = company.name || "";
  $("#companyCity").value = company.city || "";

  const introEl = $("#companyIntroduction");
  introEl.value = company.introduction || "";
  $("#introCount").innerText = introEl.value.length;
  introEl.addEventListener("input", () => {
    $("#introCount").innerText = introEl.value.length;
    updateCompleteness();
  });

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

  await apiPut(`/companies/${companyId}`, {
    workforms: company.workforms,
    targetGroups: company.targetGroups,
    specialties: company.specialties,
    regions: company.regions,
    worksNationwide: company.worksNationwide,
  });
  updateCompleteness();
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
    if (percent < 60) {
      hint.innerText = `Nog ${6 - score} stap(pen) om zichtbaar te worden voor klanten.`;
    } else if (percent < 80) {
      hint.innerText = "Bijna klaar – je profiel wordt beter zichtbaar.";
    } else {
      hint.innerText = "Je profiel is volledig zichtbaar voor klanten.";
    }
  }
}



// -------- Cards --------
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
      updateCompleteness();
    };
    el.appendChild(card);
  });
}

function getActive(containerId) {
  return [...document.querySelectorAll(`#${containerId} .pill.active`)].map(p => p.textContent);
}

// -------- Preview --------
$("#previewBtn").onclick = () => {
  $("#previewName").innerText = company.name || "";
  $("#previewCity").innerText = company.city || "";
  $("#previewIntro").innerText = $("#companyIntroduction").value || "";

  $("#previewReasons").innerHTML = "";
  getActive("reasonsCards").forEach(r => {
    const span = document.createElement("span");
    span.className = "pill active";
    span.textContent = r;
    $("#previewReasons").appendChild(span);
  });

  const services = [
    ...getActive("workformsCards"),
    ...getActive("targetGroupsCards"),
    ...getActive("specialtiesCards"),
  ];
  $("#previewServices").innerText = services.join(" • ");

  $("#previewModal").style.display = "flex";
};

$("#closePreview").onclick = () => {
  $("#previewModal").style.display = "none";
};

// -------- Helpers --------
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
