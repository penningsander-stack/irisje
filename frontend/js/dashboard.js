// frontend/js/dashboard.js
// v20260109-DASHBOARD-ONBOARDING-ROBUST

const API_BASE = "https://irisje-backend.onrender.com/api";
const token = localStorage.getItem("token");
if (!token) location.href = "/login.html";

const params = new URLSearchParams(window.location.search);
const isOnboarding = params.get("onboarding") === "1";

// Tabs
document.querySelectorAll(".tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab-section").forEach((s) => s.classList.add("hidden"));
    btn.classList.add("active");
    document.getElementById(`tab-${btn.dataset.tab}`)?.classList.remove("hidden");
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
  // 1) Mijn bedrijven ophalen
  const my = await apiGet("/companies/my");
  if (!my?.ok) {
    // token kan verlopen zijn
    safeLogoutToLogin();
    return;
  }

  if (!Array.isArray(my.companies) || my.companies.length === 0) {
    // Geen bedrijf → eerst registreren
    location.href = "/register-company.html";
    return;
  }

  companyId = my.companies[0]._id;

  // 2) Bedrijf ophalen
  const data = await apiGet(`/companies/${companyId}`);
  if (!data?.ok || !data?.item) {
    location.href = "/register-company.html";
    return;
  }

  company = data.item;

  fillProfile();
  fillServices();

  updateCompleteness();
  renderPreview();

  // 3) Onboarding banner + starttab + URL opschonen
  if (isOnboarding) {
    const banner = document.getElementById("onboardingBanner");
    banner?.classList.remove("hidden");

    openTab("profile");

    // URL opschonen (zodat refresh niet opnieuw onboarding triggert)
    history.replaceState({}, "", "/dashboard.html");
  }
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
  if (!companyId) return;

  company.introduction = ($("#companyIntroduction").value || "").trim();
  company.reasons = getActive("reasonsCards");

  const res = await apiPut(`/companies/${companyId}`, {
    introduction: company.introduction,
    reasons: company.reasons,
  });

  if (!res?.ok) {
    alert(res?.error || "Opslaan mislukt.");
    return;
  }

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

  $("#worksNationwide").addEventListener("change", () => {
    company.worksNationwide = $("#worksNationwide").checked;
    updateCompleteness();
    renderPreview();
  });
}

$("#saveServicesBtn").onclick = async () => {
  if (!companyId) return;

  company.workforms = getActive("workformsCards");
  company.targetGroups = getActive("targetGroupsCards");
  company.specialties = getActive("specialtiesCards");
  company.regions = getActive("regionsCards");
  company.worksNationwide = $("#worksNationwide").checked;

  const res = await apiPut(`/companies/${companyId}`, {
    workforms: company.workforms,
    targetGroups: company.targetGroups,
    specialties: company.specialties,
    regions: company.regions,
    worksNationwide: company.worksNationwide,
  });

  if (!res?.ok) {
    alert(res?.error || "Opslaan mislukt.");
    return;
  }

  updateCompleteness();
  renderPreview();
  alert("Diensten & expertise opgeslagen");
};

// -------- Completeness --------
function updateCompleteness() {
  let score = 0;
  if ((company.introduction || "").trim().length >= 80) score++;
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
  const intro = (company.introduction || "").trim();
  setText("#pv-intro", intro || "Nog geen introductie ingevuld.");

  // Reasons
  const reasons = company.reasons || [];
  const ul = $("#pv-reasons");
  ul.innerHTML = "";
  reasons.forEach((r) => {
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
  if (!el) return;
  el.innerHTML = "";

  options.forEach((opt) => {
    const card = document.createElement("div");
    card.className = "pill" + (selected.includes(opt) ? " active" : "");
    card.innerText = opt;

    card.onclick = () => {
      const nowActive = card.classList.toggle("active");

      if (max && nowActive) {
        const actives = el.querySelectorAll(".pill.active");
        if (actives.length > max) card.classList.remove("active");
      }

      // Sync state
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
  return [...document.querySelectorAll(`#${containerId} .pill.active`)].map((p) => p.innerText);
}

// -------- Helpers --------
function $(q) {
  return document.querySelector(q);
}

function openTab(tabName) {
  document.querySelectorAll(".tab").forEach((b) => b.classList.remove("active"));
  document.querySelectorAll(".tab-section").forEach((s) => s.classList.add("hidden"));

  document.querySelector(`[data-tab="${tabName}"]`)?.classList.add("active");
  document.getElementById(`tab-${tabName}`)?.classList.remove("hidden");
}

async function apiGet(url) {
  try {
    const r = await fetch(API_BASE + url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const text = await r.text();
    const data = safeJson(text);

    if (!r.ok) {
      // jwt expired of 401 → terug naar login
      if (r.status === 401) return { ok: false, error: "Niet ingelogd." };
      return { ok: false, error: data?.error || "Serverfout." };
    }

    return data || { ok: false, error: "Onverwachte respons." };
  } catch (e) {
    return { ok: false, error: "Netwerkfout." };
  }
}

async function apiPut(url, body) {
  try {
    const r = await fetch(API_BASE + url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const text = await r.text();
    const data = safeJson(text);

    if (!r.ok) {
      if (r.status === 401) return { ok: false, error: "Niet ingelogd." };
      return { ok: false, error: data?.error || "Opslaan mislukt." };
    }

    return data || { ok: true };
  } catch (e) {
    return { ok: false, error: "Netwerkfout." };
  }
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function safeLogoutToLogin() {
  localStorage.removeItem("token");
  localStorage.removeItem("companyId");
  location.href = "/login.html";
}

$("#logoutBtn").onclick = () => safeLogoutToLogin();
