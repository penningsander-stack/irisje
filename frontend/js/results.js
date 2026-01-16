// frontend/js/results.js
// Leest uitsluitend uit sessionStorage (geen GET /api/publicRequests/:id)

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(location.search);
  const requestId = params.get("requestId") || sessionStorage.getItem("requestId");

  const stateEl = document.getElementById("resultsState");
  const listEl = document.getElementById("companiesList");
  const footerEl = document.getElementById("resultsFooter");
  const countEl = document.getElementById("selectedCount");
  const sendBtn = document.getElementById("sendBtn");
  const subtitleEl = document.getElementById("resultsSubtitle");
  const stickySubmitBtn = document.getElementById("stickySubmitBtn");

  if(!stateEl || !listEl){ console.error("results.js: elementen ontbreken"); return; }
  if(!requestId){ stateEl.textContent="Ongeldige aanvraag."; return; }

  let context=null, companies=[];
  try{
    context = JSON.parse(sessionStorage.getItem("requestContext")||"null");
    companies = JSON.parse(sessionStorage.getItem("requestCompanies")||"[]");
  } catch(e){}

  if(subtitleEl && context){
    subtitleEl.textContent = `Gebaseerd op jouw aanvraag voor ${context.category||""} in ${context.city||""}.`;
  }

  if(!Array.isArray(companies) || !companies.length){
    stateEl.textContent="Er zijn op dit moment geen bedrijven beschikbaar voor deze aanvraag.";
    return;
  }

  stateEl.textContent="";
  renderCompanies(companies);
  if(footerEl) footerEl.classList.remove("hidden");

  function handleSend(){
    const checked = document.querySelectorAll(".company-checkbox:checked");
    if(!checked.length){ alert("Selecteer minimaal één bedrijf."); return; }
    const ids = Array.from(checked).map(cb=>cb.dataset.companyId).filter(Boolean);
    if(!ids.length){ alert("Selectie ongeldig."); return; }
    sessionStorage.setItem("selectedCompanyIds", JSON.stringify(ids));
    sessionStorage.setItem("requestId", String(requestId));
    window.location.href = `/request-send.html?requestId=${encodeURIComponent(requestId)}`;
  }

  if(sendBtn) sendBtn.addEventListener("click", handleSend);
  if(stickySubmitBtn) stickySubmitBtn.addEventListener("click", handleSend);

  function renderCompanies(list){
    listEl.innerHTML="";
    updateSelection();
    list.forEach((company,idx)=>{
      const card=document.createElement("div");
      card.className="result-card";
      const companyId = company?._id ? String(company._id):"";
      const name = escapeHtml(company?.name);
      const city = escapeHtml(company?.city);
      card.innerHTML=`
        <label class="company-select">
          <input type="checkbox" class="company-checkbox" data-company-id="${escapeHtml(companyId)}"/>
          <div class="company-info">
            <h3>${name}</h3>
            <div class="company-city">${city}</div>
          </div>
        </label>`;
      const cb = card.querySelector(".company-checkbox");
      cb.addEventListener("change",()=>{
        if(document.querySelectorAll(".company-checkbox:checked").length>5){
          cb.checked=false; return;
        }
        updateSelection();
      });
      listEl.appendChild(card);
    });
  }

  function updateSelection(){
    const n = document.querySelectorAll(".company-checkbox:checked").length;
    if(countEl) countEl.textContent = `${n} van 5 geselecteerd`;
    if(sendBtn) sendBtn.disabled = n===0;
  }

  function escapeHtml(s){
    return String(s||"").replace(/[&<>"']/g, m=>({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[m]));
  }
});
