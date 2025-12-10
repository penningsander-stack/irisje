// frontend/js/admin.js
// v20251210-ADMIN-FINAL
//
// Complete adminpanel functionaliteit:
// - Bedrijvenoverzicht
// - Claimverzoeken
// - Gemelde reviews (met 'Melding wissen')
// - Admin-navigatie & tokenbeheer

(function () {
  'use strict';

  const API_BASE = window.irisjeApiBaseUrl || 'https://irisje-backend.onrender.com';

  function getToken(k){try{return localStorage.getItem(k);}catch{return null;}}
  function setToken(k,v){try{localStorage.setItem(k,v);}catch{}}

  // Auto-convert normaal token → adminToken
  (async function(){
    const t = getToken('token');
    const a = getToken('adminToken');
    if (a || !t) return;
    try{
      const r = await fetch(API_BASE+'/api/auth/me',{headers:{Authorization:'Bearer '+t}});
      if(!r.ok)return;
      const d = await r.json();
      if(d.role==='admin'){ setToken('adminToken',t); }
    }catch{}
  })();

  // SafeFetch
  async function safeFetch(path,opt={}){
    const admin = getToken('adminToken');
    const h = new Headers(opt.headers||{});
    h.set('Accept','application/json');
    if(opt.body && !h.has('Content-Type')) h.set('Content-Type','application/json');
    if(admin) h.set('Authorization','Bearer '+admin);
    const cfg = Object.assign({},opt,{headers:h});
    let res;
    try{res = await fetch(API_BASE+path,cfg);}catch(e){return {ok:false,error:'fetch'};}
    if(!res.ok){
      const t = await res.text().catch(()=> '');
      return {ok:false,status:res.status,text:t};
    }
    let data;
    try{ data = await res.json(); }catch{ return {ok:false,error:'json'}; }
    return {ok:true,data};
  }

  // -------------------------------
  // Navigatie
  // -------------------------------
  const nav = document.getElementById('adminNav');
  function switchSection(id){
    document.querySelectorAll('section[id^="section-"]').forEach(s=>s.classList.add('hidden'));
    const el = document.getElementById(id);
    if(el) el.classList.remove('hidden');
  }
  if(nav){
    nav.addEventListener('click',e=>{
      const btn = e.target.closest('[data-section]');
      if(!btn)return;
      const s = btn.getAttribute('data-section');
      switchSection(s);
      nav.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('bg-indigo-50','text-indigo-700'));
      btn.classList.add('bg-indigo-50','text-indigo-700');
    });
  }

  // Uitloggen admin
  const logoutBtn = document.getElementById('logoutBtn');
  if(logoutBtn){
    logoutBtn.addEventListener('click',()=>{localStorage.removeItem('adminToken');location.reload();});
  }

  // -------------------------------
  // Bedrijven laden
  // -------------------------------
  async function loadCompanies(){
    const body = document.getElementById('adminCompanyTable');
    const total = document.getElementById('total-companies');
    if(!body)return;
    body.innerHTML='<tr><td colspan="5">Laden...</td></tr>';
    if(total) total.textContent='–';

    const r = await safeFetch('/api/admin/companies');
    if(!r.ok){
      body.innerHTML='<tr><td colspan="5">Fout bij laden</td></tr>';
      return;
    }
    const d = r.data;
    let list = [];
    if(Array.isArray(d.companies)) list=d.companies;
    if(!list.length){
      body.innerHTML='<tr><td colspan="5">Geen bedrijven gevonden</td></tr>';
      return;
    }
    if(total) total.textContent=String(list.length);

    body.innerHTML = list.map(c=>`
      <tr>
        <td class="p-3">${(c.name||'-')}</td>
        <td class="p-3">${(c.email||'-')}</td>
        <td class="p-3">${(c.status|| (c.isVerified?'Geverifieerd':'Onbevestigd'))}</td>
        <td class="p-3 text-center">${(c.reviewCount??0)}</td>
        <td class="p-3 text-xs text-slate-500">–</td>
      </tr>`).join('');
  }
  const refreshCompaniesBtn = document.getElementById('refreshCompanies');
  if(refreshCompaniesBtn) refreshCompaniesBtn.addEventListener('click',loadCompanies);

  // -------------------------------
  // Claims laden
  // -------------------------------
  async function loadClaims(){
    const body = document.getElementById('claimTableBody');
    if(!body)return;
    body.innerHTML='<tr><td colspan="6">Laden...</td></tr>';

    const r = await safeFetch('/api/admin/claims');
    if(!r.ok){
      body.innerHTML='<tr><td colspan="6">Fout bij laden</td></tr>';
      return;
    }
    const d=r.data;
    let list=[];
    if(Array.isArray(d.claims)) list=d.claims;
    if(!list.length){
      body.innerHTML='<tr><td colspan="6">Geen claimverzoeken gevonden</td></tr>';
      return;
    }
    body.innerHTML = list.map(cl=>{
      const dt = cl.createdAt?new Date(cl.createdAt).toLocaleString('nl-NL'):'-';
      const comp = cl.companyName || (cl.company?.name) || '-';
      return `
      <tr>
        <td class="p-3">${dt}</td>
        <td class="p-3">${comp}</td>
        <td class="p-3">${(cl.contactName||'-')}</td>
        <td class="p-3">${(cl.email||'-')}</td>
        <td class="p-3">${(cl.phone||'-')}</td>
        <td class="p-3">${(cl.status||'Open')}</td>
      </tr>`;
    }).join('');
  }
  const refreshClaimsBtn = document.getElementById('refreshClaims');
  if(refreshClaimsBtn) refreshClaimsBtn.addEventListener('click',loadClaims);

  // -------------------------------
  // Gemelde reviews laden
  // -------------------------------
  async function loadReportedReviews(){
    const body = document.getElementById('reviewReportsTableBody');
    const total = document.getElementById('totalReportedReviews');
    const open = document.getElementById('openReportedReviews');
    const resolved = document.getElementById('resolvedReportedReviews');

    if(!body)return;
    body.innerHTML='<tr><td colspan="8">Laden...</td></tr>';

    const r = await safeFetch('/api/admin/reported-reviews');
    if(!r.ok){
      body.innerHTML='<tr><td colspan="8">Fout bij laden</td></tr>';
      return;
    }
    const d = r.data;
    let list=[];
    if(Array.isArray(d.reviews)) list=d.reviews;

    if(total) total.textContent=String(list.length);
    if(open) open.textContent=String(list.length);
    if(resolved) resolved.textContent='0';

    if(!list.length){
      body.innerHTML='<tr><td colspan="8">Geen gemelde reviews gevonden</td></tr>';
      return;
    }

    body.innerHTML = list.map(rv=>{
      const dt = rv.date?new Date(rv.date).toLocaleString('nl-NL'):'-';
      return `
      <tr>
        <td class="p-3">${(rv.company||'-')}</td>
        <td class="p-3">${(rv.name||'-')}</td>
        <td class="p-3 text-center">${(rv.rating||'-')}</td>
        <td class="p-3">${(rv.message||'-')}</td>
        <td class="p-3">–</td>
        <td class="p-3">${dt}</td>
        <td class="p-3">Gemeld</td>
        <td class="p-3">
          <button class="px-3 py-1 text-white bg-indigo-600 rounded text-sm"
            onclick="clearReviewReport('${rv._id}')">
            Melding wissen
          </button>
        </td>
      </tr>`;
    }).join('');
  }

  window.clearReviewReport = async function(id){
    if(!confirm("Weet je zeker dat je deze melding wilt wissen?")) return;
    const r = await safeFetch('/api/admin/reported-reviews/'+id+'/clear',{method:'POST'});
    if(!r.ok){ alert("Fout bij wissen melding"); return; }
    loadReportedReviews();
  };

  const refreshReviewReportsBtn = document.getElementById('refreshReviewReports');
  if(refreshReviewReportsBtn) refreshReviewReportsBtn.addEventListener('click',loadReportedReviews);

  // INIT
  switchSection('section-overview');
  loadCompanies();
  loadClaims();
  loadReportedReviews();

})();
