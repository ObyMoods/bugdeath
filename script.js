// ===== Storage Helpers =====
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const load = (k, def) => { try { const s = localStorage.getItem(k); return s ? JSON.parse(s) : def; } catch(e){ return def; } }

// ===== Admin Credentials =====
const ADMIN_USERNAME = "ObyMoods";
const ADMIN_PASSWORD = "12345";

// ===== Global Variables =====
let texts = load("tb_texts", []);
let stickers = load("tb_stickers", []);
let premium = [];
let sessionUser = sessionStorage.getItem("tb_user") || "";

// ===== Shortcuts =====
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

// ===== Sidebar Toggle =====
$("#menuBtn")?.addEventListener("click", ()=> $("#sidebar").classList.toggle("open"));
$("#closeSidebar")?.addEventListener("click", ()=> { $("#sidebar").classList.remove("open"); $("#sidebar").setAttribute("aria-hidden","true"); });

// ===== Admin Login =====
$("#togglePass")?.addEventListener("click", ()=> {
  const p = $("#adminPass"); if(p) p.type = p.type==="password"?"text":"password";
});

$("#btnAdminLogin")?.addEventListener("click", async ()=>{
  const u = $("#adminUser").value.trim();
  const p = $("#adminPass").value;
  if(u===ADMIN_USERNAME && p===ADMIN_PASSWORD){
    $("#adminMsg").textContent = "Login admin sukses";
    $("#adminArea").style.display="block";
    $("#btnAdminLogin").style.display="none";
    $("#btnAdminLogout").style.display="inline-block";
    await renderAdmin();
  } else {
    $("#adminMsg").textContent = "Username / password salah";
  }
});

$("#btnAdminLogout")?.addEventListener("click", ()=>{
  $("#adminArea").style.display="none";
  $("#btnAdminLogin").style.display="inline-block";
  $("#btnAdminLogout").style.display="none";
  $("#adminMsg").textContent="Logout";
});

// ===== Load & Save Premium =====
async function loadPremium(){
  try{
    const res = await fetch("https://api.github.com/repos/ObyMoods/bugdeath/contents/users.json");
    const data = await res.json();
    premium = JSON.parse(atob(data.content));
  } catch(e){ console.error("❌ Gagal load users.json", e); premium=[]; }
}

async function savePremium(){
  try{
    await fetch("/api/save-users", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(premium) });
  } catch(e){ console.error("❌ savePremium error:", e.message); }
}

// ===== Escape HTML =====
function escapeHtml(str){ return (str||"").replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c])); }

// ===== Render Admin Panel =====
async function renderAdmin(){
  await loadPremium();
  texts = load("tb_texts", texts);
  stickers = load("tb_stickers", stickers);

  // PREMIUM
  $("#premList").innerHTML = premium.length ? premium.map((u,i)=>`
    <div class="prem-item">
      <span>👤 ${u.info||"Tanpa Nama"}</span>
      <span>🆔 ${u.id}</span>
      <span>⏳ ${u.days} hari</span>
    </div>`).join("") : `<div class="small">Belum ada user premium</div>`;
    
  // TEXTS
  $("#textList").innerHTML = texts.length
    ? texts.map((t,i)=>`
        <div>
          ${i+1}. ${escapeHtml(t)} 
          <button class="item-btn del-text" data-i="${i}">hapus</button>
        </div>
      `).join("")
    : `<div class="small">Belum ada teks</div>`;

  // STICKERS
  $("#stickerList").innerHTML = stickers.length
    ? stickers.map((s,i)=>`
        <div>
          ${i+1}. ${s} 
          <button class="item-btn del-st" data-i="${i}">hapus</button>
        </div>
      `).join("")
    : `<div class="small">Belum ada sticker</div>`;

  populateContent();
}

// ===== Save Helpers =====
function saveTexts() { save("tb_texts", texts); }
function saveStickers() { save("tb_stickers", stickers); }

// ===== Add / Clear Texts & Stickers =====
$("#addText")?.addEventListener("click", ()=>{
  const t = $("#newText").value.trim(); if(!t){ alert("Isi teks"); return; }
  texts.push(t); saveTexts(); $("#newText").value=""; renderAdmin();
});
$("#clearText")?.addEventListener("click", ()=>{
  if(confirm("Hapus semua teks?")){ texts=[]; saveTexts(); renderAdmin(); }
});
$("#addSticker")?.addEventListener("click", ()=>{
  const s = $("#newSticker").value.trim(); if(!s){ alert("Isi sticker file_id"); return; }
  stickers.push(s); saveStickers(); $("#newSticker").value=""; renderAdmin();
});
$("#clearStickers")?.addEventListener("click", ()=>{
  if(confirm("Hapus semua sticker?")){ stickers=[]; saveStickers(); renderAdmin(); }
});

// ===== Delete Text/Sticker via Delegation =====
document.addEventListener("click", (e) => {
  if(e.target.matches(".del-text")){
    const idx = parseInt(e.target.dataset.i);
    texts.splice(idx, 1);
    saveTexts();
    renderAdmin();
  } else if(e.target.matches(".del-st")){
    const idx = parseInt(e.target.dataset.i);
    stickers.splice(idx, 1);
    saveStickers();
    renderAdmin();
  } else if(e.target.matches(".del-tok")){
    const idx = parseInt(e.target.dataset.i);
    const tokens = loadTokens(sessionUser);
    tokens.splice(idx,1);
    saveTokens(sessionUser,tokens);
    renderTokens(sessionUser);
  }
});

// ===== Admin Premium Management =====
$("#btnAddPrem")?.addEventListener("click", async ()=>{
  const id = $("#premId").value.trim();
  const days = parseInt($("#premDays").value)||0;
  const info = $("#premInfo")?.value.trim()||"";
  if(!id || days<=0){ alert("❌ Isi ID dan jumlah hari!"); return; }
  premium.push({id,days,info}); await savePremium();
  $("#premId").value=""; $("#premDays").value=""; if($("#premInfo")) $("#premInfo").value="";
  renderAdmin();
});
$("#btnClearPrem")?.addEventListener("click", async ()=>{ if(confirm("⚠️ Hapus semua premium?")){ premium=[]; await savePremium(); renderAdmin(); } });

// ===== User Login =====
$("#btnLogin")?.addEventListener("click", async ()=>{
  const id = $("#loginId").value.trim(); if(!id){ alert("Masukkan ID"); return; }
  await loadPremium();
  const user = premium.find(u=>u.id===id);
  if(user){ sessionStorage.setItem("tb_user",id); sessionUser=id; showDashboard(id,user); } 
  else $("#loginMsg").textContent="ID tidak terdaftar sebagai Premium!";
});

function showDashboard(id,user){
  $("#loginCard").style.display="none"; 
  $("#dashboard").style.display="block";
  $("#premInfo").textContent=`Premium aktif • ${user.days} hari • ID: ${id}`;
  renderTokens(id); populateContent();
}

// ===== Populate Content Dropdown =====
function populateContent(){
  texts = load("tb_texts", texts);
  stickers = load("tb_stickers", stickers);
  const sel=$("#contentSelect"); if(!sel) return;
  sel.innerHTML="";
  if($("#typeSelect").value==="text"){
    if(!texts.length) sel.innerHTML='<option value="">(Belum ada teks)</option>';
    else texts.forEach(t=>{ const o=document.createElement("option"); o.value=t; o.textContent=t.length>80?t.substr(0,80)+"...":t; sel.appendChild(o); });
  } else {
    if(!stickers.length) sel.innerHTML='<option value="">(Belum ada sticker)</option>';
    else stickers.forEach(s=>{ const o=document.createElement("option"); o.value=s; o.textContent=s; sel.appendChild(o); });
  }
}
$("#typeSelect")?.addEventListener("change", populateContent);

// ===== Token Management =====
function loadTokens(uid){ return load("tb_tokens_"+uid,[]); }
function saveTokens(uid,toks){ save("tb_tokens_"+uid,toks); }
function renderTokens(uid){
  const tokens = loadTokens(uid); const list=$("#tokenList"); if(!list) return;
  list.innerHTML="";
  if(tokens.length){ tokens.forEach((tok,i)=>{ const div=document.createElement("div"); div.innerHTML=`${i+1}. ${tok} <button class="item-btn del-tok" data-i="${i}">hapus</button>`; list.appendChild(div); }); }
  else list.innerHTML=`<div class="small">Belum ada token tersimpan</div>`;
}
$("#addToken")?.addEventListener("click", ()=>{
  const tok=$("#newToken").value.trim(); if(!tok){ alert("Isi token bot"); return; }
  const tokens=loadTokens(sessionUser); if(tokens.includes(tok)){ alert("Token sudah ada!"); return; }
  tokens.push(tok); saveTokens(sessionUser,tokens); $("#newToken").value=""; renderTokens(sessionUser);
});

// ===== Send Bug Telegram =====
let stopSendingGlobal=false;
$("#btnStop")?.addEventListener("click", ()=> stopSendingGlobal=true);

async function resolveChatId(token,target){
  if(!target) return null;
  const t=target.trim();
  if(/^-?\d+$/.test(t)) return t;
  if(t.startsWith("@")){
    try{ const res=await fetch(`https://api.telegram.org/bot${token}/getChat?chat_id=${encodeURIComponent(t)}`); const data=await res.json(); if(data.ok && data.result && data.result.id) return data.result.id; }catch(e){ console.error("getChat",e); }
  }
  try{
    const res2=await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
    const data2=await res2.json();
    if(data2.ok && Array.isArray(data2.result)){
      for(const up of data2.result){
        const msg=up.message||up.channel_post||up.edited_message;
        if(msg && msg.chat && msg.chat.id){
          if(msg.from?.username && ("@"+msg.from.username).toLowerCase()===t.toLowerCase()) return msg.chat.id;
          if(msg.chat.title && msg.chat.title.toLowerCase()===t.toLowerCase()) return msg.chat.id;
        }
      }
    }
  }catch(e){ console.error("getUpdates",e); }
  return null;
}

async function sendContent(token,chatId,type,content,count,statusEl,botIndex,totalBots){
  const botStatusId=`bot-status-${botIndex}`;
  let botStatus=document.getElementById(botStatusId);
  if(!botStatus){ botStatus=document.createElement("div"); botStatus.id=botStatusId; statusEl.appendChild(botStatus); }
  for(let i=0;i<count;i++){
    if(stopSendingGlobal){ botStatus.innerHTML=`⏹️ Bot ${botIndex}/${totalBots} dihentikan ${i}/${count}`; return; }
    try{
      const url=type==="text"?`https://api.telegram.org/bot${token}/sendMessage`:`https://api.telegram.org/bot${token}/sendSticker`;
      const body=type==="text"?{chat_id:chatId,text:content}:{chat_id:chatId,sticker:content};
      const res=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      const data=await res.json(); if(!data.ok) throw new Error(data.description||JSON.stringify(data));
      botStatus.innerHTML=`✅ Bot ${botIndex}/${totalBots} kirim ${i+1}/${count}`;
      await new Promise(r=>setTimeout(r,350));
    }catch(err){ botStatus.innerHTML=`❌ Bot ${botIndex}/${totalBots} gagal: ${err.message}`; }
  }
  botStatus.innerHTML=`✅ Bot ${botIndex}/${totalBots} selesai`;
}

$("#btnSend")?.addEventListener("click", async ()=>{
  const tokens=loadTokens(sessionUser);
  const target=$("#target").value.trim();
  const type=$("#typeSelect").value;
  const content=$("#contentSelect").value;
  const count=Math.max(1,parseInt($("#count").value)||1);
  const statusEl=$("#sendMsg");
  if(!tokens.length||!target||!content){ statusEl.innerHTML=`❌ Isi semua field & pastikan ada token!`; return; }
  stopSendingGlobal=false; statusEl.innerHTML="";
  await Promise.all(tokens.map(async(token,i)=>{
    if(stopSendingGlobal) return;
    statusEl.innerHTML+=`<div>🔄 Bug ${i+1}/${tokens.length} sedang mengirim (${token.substr(0,10)}...)</div>`;
    const chatId=await resolveChatId(token,target);
    if(!chatId){ statusEl.innerHTML+=`❌ Target tidak ditemukan oleh Bot ${i+1}`; return; }
    await sendContent(token,chatId,type,content,count,statusEl,i+1,tokens.length);
  }));
  statusEl.innerHTML+= stopSendingGlobal?`⏹️ Pengiriman dihentikan`:`✅ Semua ${tokens.length} Bug selesai diproses`;
});

// ===== Logout User =====
$("#btnLogout")?.addEventListener("click", ()=>{
  sessionStorage.removeItem("tb_user");
  sessionUser=""; $("#dashboard").style.display="none"; $("#loginCard").style.display="block";
});

// ===== Admin Avatar =====
const adminAvatarPreview=$("#adminAvatarPreview");
const premiumAvatarEl=$("#premiumAvatar");
const adminAvatarUrl=$("#adminAvatarUrl");
const btnUpdateAvatar=$("#btnUpdateAvatar");
const avatarMsgEl=$("#avatarMsg");

function setAdminAvatar(url){
  const finalUrl=url||"https://via.placeholder.com/120?text=Premium";
  localStorage.setItem("tb_admin_avatar",finalUrl);
  if(adminAvatarPreview) adminAvatarPreview.src=finalUrl;
  if(premiumAvatarEl) premiumAvatarEl.src=finalUrl;
}

if(localStorage.getItem("tb_admin_avatar")) setAdminAvatar(localStorage.getItem("tb_admin_avatar"));

// Event update avatar
btnUpdateAvatar?.addEventListener("click", ()=>{
  const url=adminAvatarUrl.value.trim();
  if(!url){ avatarMsgEl.innerHTML=`❌ Masukkan link foto!`; return; }
  setAdminAvatar(url);
  avatarMsgEl.innerHTML=`✅ Avatar berhasil diupdate & tersimpan!`;
  setTimeout(()=>{ avatarMsgEl.innerHTML=""; },3000);
});

// ===== Init =====
(async function init(){
  await renderAdmin();
  if(sessionUser){
    await loadPremium();
    const p=premium.find(u=>u.id===sessionUser);
    if(p) showDashboard(sessionUser,p);
  }
})();