// request.js updated
document.addEventListener("DOMContentLoaded",()=>{
  const f=document.getElementById("requestForm");
  f.addEventListener("submit",e=>{
    e.preventDefault();
    go();
  });
});

function go(){
  const f=document.getElementById("requestForm");
  const d={
    firstCompanyId:f.firstCompanyId.value,
    firstCompanyName:encodeURIComponent(f.firstCompanyName.value),
    name:encodeURIComponent(f.name.value),
    email:encodeURIComponent(f.email.value),
    phone:encodeURIComponent(f.phone.value),
    city:encodeURIComponent(f.city.value),
    category:encodeURIComponent(f.category.value),
    message:encodeURIComponent(f.message.value),
    postcode:encodeURIComponent(f.postcode.value),
    street:encodeURIComponent(f.street.value),
    houseNumber:encodeURIComponent(f.houseNumber.value),
    photos:encodeURIComponent(f.photos.value||"")
  };
  const qs=Object.entries(d).map(([k,v])=>`${k}=${v}`).join("&");
  window.location.href=`select-companies.html?${qs}`;
}
