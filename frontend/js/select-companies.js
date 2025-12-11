// select-companies.js
// full version

const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", init);

function param(k){return new URLSearchParams(window.location.search).get(k)||"";}

async function init(){
  const firstId = param("firstCompanyId");
  const firstName = decodeURIComponent(param("firstCompanyName"));
  const city = decodeURIComponent(param("city"));
  const category = decodeURIComponent(param("category"));
  document.getElementById("titleMain").textContent = `Je hebt offerte aangevraagd bij ${firstName}.`;
  document.getElementById("titleSub").textContent = `Wil je ook andere bedrijven in ${city} vergelijken?`;
  const r = await fetch(`${API_BASE}/companies/search?category=${encodeURIComponent(category)}&city=${encodeURIComponent(city)}`);
  const d = await r.json();
  let items = d.items||[];
  items = items.filter(c=>c._id!==firstId);
  items.sort((a,b)=>{
    if(b.isVerified - a.isVerified) return b.isVerified - a.isVerified;
    if((b.avgRating||0)-(a.avgRating||0)) return (b.avgRating||0)-(a.avgRating||0);
    return (b.reviewCount||0)-(a.reviewCount||0);
  });
  build(items);
}

function build(items){
  const box=document.getElementById("companyList");
  box.innerHTML="";
  items.forEach(c=>{
    let stars="★".repeat(Math.round(c.avgRating||0));
    stars+= "☆".repeat(5-stars.length);
    const div=document.createElement("div");
    div.innerHTML = `
      <div>
        <b>${c.name}</b><br>
        <span>${stars} ${(c.avgRating||0).toFixed(1)} • ${c.reviewCount||0} reviews</span>
      </div>
      <input type="checkbox" class="chk" value="${c._id}">
    `;
    div.style.border="1px solid #ccc";
    div.style.padding="10px";
    div.style.margin="5px 0";
    box.appendChild(div);
  });
  document.getElementById("sendBtn").onclick = sendReq;
}

async function sendReq(){
  const sel=[...document.querySelectorAll(".chk:checked")].map(x=>x.value).slice(0,4);
  const p=new URLSearchParams(window.location.search);
  const firstId=p.get("firstCompanyId");
  const base={};
  for(const [k,v] of p.entries()) base[k]=decodeURIComponent(v);

  await postOne(firstId, base);
  for(const id of sel) await postOne(id, base);

  window.location.href="success.html";
}

async function postOne(id, base){
  const body={
    name: base.name,
    email: base.email,
    phone: base.phone,
    city: base.city,
    message: base.message + (base.photos?`\n\nFoto's: ${base.photos}`:""),
    category: base.category,
    postcode: base.postcode,
    street: base.street,
    houseNumber: base.houseNumber,
    companyId: id
  };
  await fetch(`${API_BASE}/requests`,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify(body)
  });
}
