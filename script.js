const save = (k,v) => localStorage.setItem(k, JSON.stringify(v));
const load = (k,def) => { try { const s = localStorage.getItem(k); return s ? JSON.parse(s) : def } catch(e){ return def } }

const ADMIN_USERNAME = "ObyMoods";
const ADMIN_PASSWORD = "12345";

let texts = load("tb_texts", []);
let stickers = load("tb_stickers", []);
let stopSending = false;

let sessionToken = sessionStorage.getItem("tb_tok") || "";

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

$("#menuBtn").addEventListener("click", ()=> {
  $("#sidebar").classList.toggle("open");
});

document.addEventListener("click", (e)=>{
  if(!e.target.closest("#sidebar") && !e.target.closest("#menuBtn")){
    // keep it open if admin area visible and clicked inside header - but user asked no X and toggle by menu, so we won't auto-close
    // do nothing
  }
});

$("#togglePass").addEventListener("click", ()=>{
  const p = $("#adminPass"); p.type = p.type === "password" ? "text" : "password";
});

$("#btnAdminLogin").addEventListener("click", ()=>{
  const u = $("#adminUser").value.trim(), p = $("#adminPass").value;
  if(u === ADMIN_USERNAME && p === ADMIN_PASSWORD){
    $("#adminMsg").textContent = "Login admin sukses";
    $("#adminArea").style.display = "block";
    $("#btnAdminLogin").style.display = "none";
    $("#btnAdminLogout").style.display = "inline-block";
    renderAdmin();
  } else {
    $("#adminMsg").textContent = "Username / password salah";
  }
});
$("#btnAdminLogout").addEventListener("click", ()=>{
  $("#adminArea").style.display = "none";
  $("#btnAdminLogin").style.display = "inline-block";
  $("#btnAdminLogout").style.display = "none";
  $("#adminMsg").textContent = "Logout";
});

$("#btnStop").addEventListener("click", () => {
  stopSending = true;
});

async function renderAdmin(){
  await loadPremium();
  texts = load("tb_texts", texts);
  stickers = load("tb_stickers", stickers);

  // === RENDER PREMIUM ===
  $("#premList").innerHTML = premium.length ? premium.map((u, i)=>{
    return `
      <div class="prem-item">
        <span>👤 ${u.info || "Tanpa Nama"}</span>
        <span>🆔 ${u.id}</span>
        <span>⏳ ${u.days} hari</span>
        <button class="btn danger del-prem" data-i="${i}">❌</button>
      </div>
    `;
  }).join("") : `<div class="small">Belum ada user premium</div>`;

  // === RENDER TEKS ===
  $("#textList").innerHTML = texts.length ? texts.map((t,i)=>
    `<div>${i+1}. ${escapeHtml(t)} <button class="item-btn del-text" data-i="${i}">hapus</button></div>`
  ).join("") : `<div class="small">Belum ada teks</div>`;

  // === RENDER STICKER ===
  $("#stickerList").innerHTML = stickers.length ? stickers.map((s,i)=>
    `<div>${i+1}. ${s} <button class="item-btn del-st" data-i="${i}">hapus</button></div>`
  ).join("") : `<div class="small">Belum ada sticker</div>`;

  populateContent();
}

function escapeHtml(str){ return (str||"").replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c])); }

$("#addText").addEventListener("click", ()=>{
  const t = $("#newText").value.trim(); if(!t){ alert("Isi teks"); return; }
  texts.push(t); save("tb_texts", texts); $("#newText").value=""; renderAdmin();
});
$("#clearText").addEventListener("click", ()=>{
  if(confirm("Hapus semua teks?")){ texts=[]; save("tb_texts", texts); renderAdmin(); }
});
$("#addSticker").addEventListener("click", ()=>{
  const s = $("#newSticker").value.trim(); if(!s){ alert("Isi sticker file_id"); return; }
  stickers.push(s); save("tb_stickers", stickers); $("#newSticker").value=""; renderAdmin();
});
$("#clearStickers").addEventListener("click", ()=>{
  if(confirm("Hapus semua sticker?")){ stickers=[]; save("tb_stickers", stickers); renderAdmin(); }
});

document.addEventListener("click", (e) => {
  if(e.target.matches(".del-text")){
    const idx = parseInt(e.target.dataset.i);
    texts.splice(idx, 1);
    save("tb_texts", texts);
    renderAdmin();
  } else if(e.target.matches(".del-st")){
    const idx = parseInt(e.target.dataset.i);
    stickers.splice(idx, 1);
    save("tb_stickers", stickers);
    renderAdmin();
  }
});

$("#btnLogin").addEventListener("click", async () => {
  const id = $("#loginId").value.trim();
  if (!id) return alert("Masukkan ID");

  await loadPremium();
  const user = premium.find(u => u.id === id);

  if (user) {
    sessionStorage.setItem("tb_user", id);
    showDashboard(id, user);
  } else {
    $("#loginMsg").textContent = "ID tidak terdaftar sebagai Premium!";
  }
});

let premium = [];
let sessionUser = "";

$("#btnAddPrem").addEventListener("click", async () => {
  const id = $("#premId").value.trim();
  const days = parseInt($("#premDays").value) || 0;
  const info = $("#premInfo").value.trim();

  if (!id || days <= 0) {
    alert("❌ Isi ID dan jumlah hari dengan benar!");
    return;
  }

  premium.push({ id, days, info });

  await savePremium(); 
  $("#premId").value = "";
  $("#premDays").value = "";
  $("#premInfo").value = "";

  renderAdmin();
});

$("#btnClearPrem").addEventListener("click", async () => {
  if (confirm("⚠️ Yakin hapus semua user premium?")) {
    premium = [];
    await savePremium();
    renderAdmin();
  }
});

document.addEventListener("click", async (e) => {
  if (e.target.matches(".del-prem")) {
    const idx = parseInt(e.target.dataset.i);
    premium.splice(idx, 1);
    await savePremium();
    renderAdmin();
  }
});

async function loadPremium() {
  try {
    const res = await fetch("https://api.github.com/repos/ObyMoods/bugdeath/contents/users.json");
    const data = await res.json();
    const content = JSON.parse(atob(data.content));
    return content;
  } catch (e) {
    console.error("❌ Gagal load users.json", e);
    return [];
  }
}

async function savePremium(users) {
  try {
    const res = await fetch("/api/save-users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(users)
    });
    if (!res.ok) throw new Error("Gagal simpan premium");
    return true;
  } catch (e) {
    console.error("❌ savePremium error:", e.message);
    return false;
  }
}

function renderTokens(userId) {
  const tokens = loadTokens(userId);
  const list = $("#tokenList");
  list.innerHTML = "";

  if (tokens.length) {
    tokens.forEach((tok, i) => {
      const div = document.createElement("div");
      div.innerHTML = `${i+1}. ${tok} <button class="item-btn del-tok" data-i="${i}">hapus</button>`;
      list.appendChild(div);
    });
  } else {
    list.innerHTML = `<div class="small">Belum ada token tersimpan</div>`;
  }
}

function showDashboard(id, user){
  $("#loginCard").style.display = "none";
  $("#dashboard").style.display = "block";

  $("#premInfo").textContent = `Premium aktif • ${user.days} hari • ID: ${id}`;
  renderTokens(id);
  populateContent();
}

function populateContent(){
  texts = load("tb_texts", texts);
  stickers = load("tb_stickers", stickers);
  const sel = $("#contentSelect");
  sel.innerHTML = "";
  if($("#typeSelect").value === "text"){
    if(!texts.length) sel.innerHTML = '<option value="">(Belum ada teks)</option>';
    else texts.forEach(t=> { const o = document.createElement("option"); o.value = t; o.textContent = t.length>80? t.substr(0,80)+"...": t; sel.appendChild(o); });
  } else {
    if(!stickers.length) sel.innerHTML = '<option value="">(Belum ada sticker)</option>';
    else stickers.forEach(s=> { const o = document.createElement("option"); o.value = s; o.textContent = s; sel.appendChild(o); });
  }
}
$("#typeSelect").addEventListener("change", populateContent);

async function resolveChatId(token, target) {
  if (!target) return null;
  const t = target.trim();

  if (/^-?\d+$/.test(t)) return t;

  if (t.startsWith("@")) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/getChat?chat_id=${encodeURIComponent(t)}`);
      const data = await res.json();
      if (data.ok && data.result && data.result.id) return data.result.id;
    } catch (e) {
      console.error("getChat error:", e);
    }
  }

  try {
    const res2 = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
    const data2 = await res2.json();
    if (data2.ok && Array.isArray(data2.result)) {
      for (const up of data2.result) {
        const msg = up.message || up.channel_post || up.edited_message;
        if (msg && msg.chat && msg.chat.id) {

          if (msg.from && msg.from.username && ("@" + msg.from.username).toLowerCase() === t.toLowerCase()) {
            return msg.chat.id;
          }

          if (msg.chat.title && msg.chat.title.toLowerCase() === t.toLowerCase()) {
            return msg.chat.id;
          }
        }
      }
    }
  } catch (e) {
    console.error("getUpdates error:", e);
  }

  return null; 
}

$("#addToken").addEventListener("click", () => {
  const tok = $("#newToken").value.trim();
  if (!tok) {
    alert("Isi token bot");
    return;
  }
  const tokens = loadTokens(sessionUser);
  if (tokens.includes(tok)) {
    alert("Token sudah ada!");
    return;
  }
  tokens.push(tok);
  saveTokens(sessionUser, tokens);
  $("#newToken").value = "";
  renderTokens(sessionUser);
});

document.addEventListener("click", (e) => {
  if (e.target.matches(".del-tok")) {
    const idx = parseInt(e.target.dataset.i);
    const tokens = loadTokens(sessionUser);
    tokens.splice(idx, 1);
    saveTokens(sessionUser, tokens);
    renderTokens(sessionUser);
  }
});

async function sendContent(token, chatId, type, content, count = 1, statusEl, botIndex, totalBots) {
  const botStatusId = `bot-status-${botIndex}`;
  let botStatus = document.getElementById(botStatusId);
  if (!botStatus) {
    botStatus = document.createElement("div");
    botStatus.id = botStatusId;
    statusEl.appendChild(botStatus);
  }

  for (let i = 0; i < count; i++) {
    if (stopSending) {
      botStatus.innerHTML = `<span class="err">⏹️ Bot ${botIndex}/${totalBots} dihentikan ${i}/${count}</span>`;
      return;
    }
    try {
      let url = type === "text"
        ? `https://api.telegram.org/bot${token}/sendMessage`
        : `https://api.telegram.org/bot${token}/sendSticker`;
      let bodyData = type === "text"
        ? { chat_id: chatId, text: content }
        : { chat_id: chatId, sticker: content };
      const res = await fetch(url,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(bodyData)
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.description || JSON.stringify(data));

      botStatus.innerHTML = `<span class="ok">✅ Bot ${botIndex}/${totalBots} kirim ${i+1}/${count}</span>`;
      await new Promise(r => setTimeout(r, 350));
    } catch (err) {
      botStatus.innerHTML = `<span class="err">❌ Bot ${botIndex}/${totalBots} gagal: ${err.message}</span>`;
    }
  }

  botStatus.innerHTML = `<span class="ok">✅ Bot ${botIndex}/${totalBots} selesai</span>`;
}

$("#btnSend").addEventListener("click", async () => {
  const tokens = loadTokens(sessionUser);
  const target = $("#target").value.trim();
  const type = $("#typeSelect").value;
  const content = $("#contentSelect").value;
  const count = Math.max(1, parseInt($("#count").value) || 1);
  const statusEl = $("#sendMsg");

  if (!tokens.length || !target || !content) {
    statusEl.innerHTML = `<span class="err">❌ Isi semua field & pastikan ada token!</span>`;
    return;
  }

  stopSending = false;
  statusEl.innerHTML = ""; 

  await Promise.all(tokens.map(async (token, i) => {
    if (stopSending) return;
    const shortTok = token.substr(0, 10) + "...";
    statusEl.innerHTML += `<div>🔄 Bug ${i+1}/${tokens.length} sedang mengirim (${shortTok})</div>`;
    const chatId = await resolveChatId(token, target);
    if (!chatId) {
      statusEl.innerHTML += `<div class="err">❌ Target tidak ditemukan oleh Bot ${i+1}/${tokens.length}</div>`;
      return;
    }
    await sendContent(token, chatId, type, content, count, statusEl, i+1, tokens.length);
    if (!stopSending) {
      statusEl.innerHTML += `<div class="ok">✅ Bug ${i+1}/${tokens.length} selesai</div>`;
    }
  }));

  if (!stopSending) {
    statusEl.innerHTML += `<div class="ok"> Semua ${tokens.length} Bug selesai diproses</div>`;
  } else {
    statusEl.innerHTML += `<div class="err">⏹️ Pengiriman Bug dihentikan</div>`;
  }
});

$("#btnLogout").addEventListener("click", ()=>{
  sessionStorage.removeItem("tb_user"); sessionStorage.removeItem("tb_tok");
  sessionUser=""; sessionToken="";
  $("#dashboard").style.display = "none"; $("#loginCard").style.display = "block";
});

(function init(){
  renderAdmin();

  const su = sessionStorage.getItem("tb_user");
  if(su){
    loadPremium().then(()=>{
      const p = premium.find(u => u.id === su);
      if(p) showDashboard(su, p);
    });
  }

  populateContent();
  loadAvatarFromGitHub();
})();

const closeSidebarBtn = document.getElementById("closeSidebar");
const sidebarEl = document.getElementById("sidebar");

if(closeSidebarBtn){
  closeSidebarBtn.addEventListener("click", ()=> {
    sidebarEl.classList.remove("open");
    sidebarEl.setAttribute("aria-hidden","true");
  });
}

const premiumAvatarEl = $("#premiumAvatar");

const adminAvatarPreview = $("#adminAvatarPreview");
const adminAvatarUrl = $("#adminAvatarUrl");
const btnUpdateAvatar = $("#btnUpdateAvatar");
const avatarMsgEl = $("#avatarMsg");

function setAdminAvatar(url){
  const finalUrl = url || "https://via.placeholder.com/120?text=Premium";

  localStorage.setItem("tb_admin_avatar", finalUrl);

  if(adminAvatarPreview) adminAvatarPreview.src = finalUrl;

  if(premiumAvatarEl) premiumAvatarEl.src = finalUrl;
}

const savedAvatar = localStorage.getItem("tb_admin_avatar");
if(savedAvatar) setAdminAvatar(savedAvatar);
else setAdminAvatar("");

adminAvatarUrl.addEventListener("input", ()=>{
  const url = adminAvatarUrl.value.trim();
  if(adminAvatarPreview) adminAvatarPreview.src = url || "https://via.placeholder.com/120?text=Premium";
});

btnUpdateAvatar.addEventListener("click", () => {
  const url = adminAvatarUrl.value.trim();

  if (!url) {
    avatarMsgEl.innerHTML = `<span style="color:var(--danger)">❌ Masukkan link foto Catbox/Imgur!</span>`;
    return;
  }

  setAdminAvatar(url);

  avatarMsgEl.innerHTML = `<span style="
    display:inline-block;
    padding:6px 12px;
    border-radius:8px;
    background: linear-gradient(90deg, #00f3de, #00d8c5);
    color:#042;
    font-weight:700;
    box-shadow:0 0 12px #00f3de,0 0 24px #00d8c5;
  ">✅ Avatar berhasil diupdate & tersimpan!</span>`;

  setTimeout(() => { avatarMsgEl.innerHTML = ""; }, 3000);
});

function loadTokens(userId) {
  return load("tb_tokens_" + userId, []);
}
function saveTokens(userId, tokens) {
  save("tb_tokens_" + userId, tokens);
}
function renderTokens(userId) {
  const tokens = loadTokens(userId);
  const list = $("#tokenList");
  list.innerHTML = "";
  if (tokens.length) {
    tokens.forEach((tok, i) => {
      const div = document.createElement("div");
      div.innerHTML = `${i + 1}. ${tok} <button class="item-btn del-tok" data-i="${i}">hapus</button>`;
      list.appendChild(div);
    });
  } else {
    list.innerHTML = `<div class="small">Belum ada token tersimpan</div>`;
  }
}

// ==== AVATAR (LOCALSTORAGE) ====
let avatarUrl = "";

// Elemen
const adminAvatarPreview = document.getElementById("adminAvatarPreview");
const premiumAvatarEl = document.getElementById("premiumAvatarEl"); // optional
const adminAvatarUrl = document.getElementById("adminAvatarUrl");
const btnUpdateAvatar = document.getElementById("btnUpdateAvatar");
const adminAvatarFile = document.getElementById("adminAvatarFile");
const avatarMsgEl = document.getElementById("avatarMsgEl");

// ==== Load Avatar dari localStorage ====
function loadAvatar() {
  const saved = localStorage.getItem("tb_admin_avatar");
  avatarUrl = saved || "https://via.placeholder.com/120?text=Premium";

  if (adminAvatarPreview) adminAvatarPreview.src = avatarUrl;
  if (premiumAvatarEl) premiumAvatarEl.src = avatarUrl;
}

// ==== Save Avatar ke localStorage ====
function saveAvatar(url) {
  avatarUrl = url;
  localStorage.setItem("tb_admin_avatar", avatarUrl);

  if (adminAvatarPreview) adminAvatarPreview.src = avatarUrl;
  if (premiumAvatarEl) premiumAvatarEl.src = avatarUrl;

  avatarMsgEl.innerHTML = `<span style="
    display:inline-block;
    padding:6px 12px;
    border-radius:8px;
    background:linear-gradient(90deg,#00f3de,#00d8c5);
    color:#042;
    font-weight:700;
    box-shadow:0 0 12px #00f3de,0 0 24px #00d8c5;
  ">✅ Avatar berhasil diupdate & tersimpan!</span>`;

  setTimeout(() => { avatarMsgEl.innerHTML = ""; }, 3000);
}

// ==== Event tombol Update Avatar URL ====
btnUpdateAvatar.addEventListener("click", () => {
  const url = adminAvatarUrl.value.trim();
  if (!url) {
    avatarMsgEl.innerHTML = `<span style="color:red">❌ Masukkan link foto Catbox/Imgur!</span>`;
    return;
  }
  saveAvatar(url);
});

// ==== Event Upload File ====
adminAvatarFile.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    saveAvatar(reader.result); // data URL disimpan
  };
  reader.readAsDataURL(file);
});

// ==== Init saat load halaman ====
loadAvatar();