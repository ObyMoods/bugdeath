// ===== Storage Helpers =====
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const load = (k, def) => { try { const s = localStorage.getItem(k); return s ? JSON.parse(s) : def; } catch(e){ return def; } }

function todayStr(){
  const d = new Date();
  return d.toISOString().split("T")[0];
}

// ===== Admin Credentials =====
const ADMIN_USERNAME = "Death";
const ADMIN_PASSWORD = "Ganteng";

// ===== Global Variables =====
let texts = load("tb_texts", []);
let stickers = load("tb_stickers", []);
let premium = [];
let sessionUser = sessionStorage.getItem("tb_user") || "";
let stopSendingGlobal = false;

// ===== Shortcuts =====
const $ = s => document.querySelector(s);

// ===== Navigation =====
document.querySelectorAll(".footer-nav .nav-btn").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    const targetPage = btn.getAttribute("data-page");
    if(!targetPage) return;
    document.querySelectorAll("main.page").forEach(p=>p.style.display="none");
    const el = document.getElementById(targetPage);
    if(el) el.style.display="block";
  });
});

// ===== Admin Login =====
$("#togglePass")?.addEventListener("click", ()=> {
  const p = $("#adminPass"); 
  if(p) p.type = p.type==="password"?"text":"password";
});

$("#btnAdminLogin")?.addEventListener("click", async ()=>{
  const u = $("#adminUser").value.trim();
  const p = $("#adminPass").value;
  if(u===ADMIN_USERNAME && p===ADMIN_PASSWORD){
    $("#adminMsg").textContent = "✅ Login admin sukses";
    $("#adminArea").style.display="block";
    $("#btnAdminLogin").style.display="none";
    $("#btnAdminLogout").style.display="inline-block";
    await renderAdmin();
  } else {
    $("#adminMsg").textContent = "❌ Username / password salah";
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
    premium = (data && data.content) ? JSON.parse(atob(data.content)) : [];

    const lastCheck = localStorage.getItem("tb_lastCheck") || todayStr();
    const now = todayStr();

    if(now !== lastCheck){
      premium.forEach(u=>{
        if(typeof u.days === "number" && u.days > 0) u.days = Math.max(0, u.days - 1);
      });
      localStorage.setItem("tb_lastCheck", now);
      await savePremium();
    }
  } catch(e){ 
    console.error("❌ Gagal load users.json", e); 
    premium=[]; 
  }
}

async function savePremium(){
  try{
    await fetch("/api/save-users", { 
      method:"POST", 
      headers:{"Content-Type":"application/json"}, 
      body:JSON.stringify(premium) 
    });
  } catch(e){ console.error("❌ savePremium error:", e.message); }
}

// ===== Escape HTML =====
function escapeHtml(str){ 
  return (str||"").replace(/[&<>"']/g,c=>(
    {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c]
  )); 
}

// ===== Render Admin =====
async function renderAdmin(){
  await loadPremium();
  texts = load("tb_texts", texts);
  stickers = load("tb_stickers", stickers);

  $("#premList").innerHTML = premium.length 
    ? premium.map((u)=>`<div class="prem-item"><span>👤 ${u.info||"Tanpa Nama"}</span> <span>🆔 ${u.id}</span> <span>⏳ ${u.days} hari</span></div>`).join("") 
    : `<div class="small">Belum ada user premium</div>`;

  $("#textList").innerHTML = texts.length
    ? texts.map((t,i)=>`${i+1}. ${escapeHtml(t)} <button class="item-btn del-text" data-i="${i}">hapus</button>`).join("<br>")
    : `<div class="small">Belum ada teks</div>`;

  $("#stickerList").innerHTML = stickers.length
    ? stickers.map((s,i)=>`${i+1}. ${escapeHtml(s)} <button class="item-btn del-st" data-i="${i}">hapus</button>`).join("<br>")
    : `<div class="small">Belum ada sticker</div>`;

  populateContent();
}

// ===== Delete Handlers =====
document.addEventListener("click", (e) => {
  if(e.target.matches(".del-text")){
    texts.splice(e.target.dataset.i, 1); save("tb_texts", texts); renderAdmin();
  }
  if(e.target.matches(".del-st")){
    stickers.splice(e.target.dataset.i, 1); save("tb_stickers", stickers); renderAdmin();
  }
  if(e.target.matches(".del-tok")){
    const tokens = loadTokens(sessionUser);
    tokens.splice(e.target.dataset.i,1);
    saveTokens(sessionUser,tokens);
    renderTokens(sessionUser);
  }
});

// ===== User Login =====
$("#btnLogin")?.addEventListener("click", async ()=>{
  const id = $("#loginId").value.trim(); 
  if(!id){ $("#loginMsg").textContent="❌ Masukkan ID"; return; }
  await loadPremium();
  const user = premium.find(u=>u.id===id);
  if(user){ sessionStorage.setItem("tb_user",id); sessionUser=id; showDashboard(id,user); } 
  else $("#loginMsg").textContent="❌ ID tidak terdaftar sebagai Premium!";
});

function showDashboard(id,user){
  if(user.days <= 0){
    $("#loginMsg").textContent="❌ Masa aktif Premium sudah habis!";
    sessionStorage.removeItem("tb_user"); sessionUser="";
    $("#dashboard").style.display="none"; 
    $("#loginCard").style.display="block";
    $("#loginNav").style.display="flex";
    $("#footerNav").style.display="none";
    return;
  }

  $("#loginCard").style.display="none"; 
  $("#dashboard").style.display="block";
  $("#premInfo").textContent=`Premium aktif • ${user.days} hari • ID: ${id}`;
  
  renderTokens(id); 
  populateContent();

  $("#loginNav").style.display="none";
  $("#footerNav").style.display="flex";

  document.querySelectorAll("main.page").forEach(p=>p.style.display="none");
  $("#bugPage").style.display="block";

  $("#profileInfo").innerHTML = `
    <div class="card">
      <p><b>ID Premium:</b> ${id}</p>
      <p><b>Sisa Hari:</b> ${user.days}</p>
      <p><b>Nama:</b> ${user.info || "Tanpa Nama"}</p>
    </div>
  `;
}

// ===== Resolve Chat ID =====
async function resolveChatId(token, target){
  if(/^-?\d+$/.test(target)) return target;
  if(target.startsWith("@")){
    const res = await fetch(`https://api.telegram.org/bot${token}/getChat?chat_id=${encodeURIComponent(target)}`);
    const data = await res.json();
    if(data.ok) return data.result.id;
  }
  return null;
}

// ===== Stop Button =====
$("#btnStop")?.addEventListener("click", ()=> stopSendingGlobal = true);

// ===== Kirim Bug =====
$("#btnSend")?.addEventListener("click", async ()=>{
  const tokens = loadTokens(sessionUser);
  const target = $("#target")?.value.trim();
  const type = $("#typeSelect")?.value;
  const customText = $("#bugMessage")?.value.trim();
  const content = $("#contentSelect")?.value.trim();
  const count = Math.max(1, parseInt($("#count")?.value) || 1);
  const statusEl = $("#sendMsg");

  if(!tokens.length || !target || (!customText && !content)){
    statusEl.innerHTML = `❌ Isi semua field & pastikan ada token + konten bug!`;
    return;
  }

  stopSendingGlobal = false;
  statusEl.innerHTML = "";

  await Promise.all(tokens.map((token,i)=> 
    sendContent(token,target,type,content,count,statusEl,i+1,tokens.length,customText)
  ));

  statusEl.innerHTML += stopSendingGlobal 
    ? `⏹️ Pengiriman dihentikan`
    : `✅ Semua bot selesai`;
});

// ===== Send Content =====
async function sendContent(token,chatId,type,content,count,statusEl,botIndex,totalBots,customText){
  const botStatusId = `bot-status-${botIndex}`;
  let botStatus = document.getElementById(botStatusId);
  if(!botStatus){
    botStatus = document.createElement("div");
    botStatus.id = botStatusId;
    statusEl.appendChild(botStatus);
  }

  for(let i=0;i<count;i++){
    if(stopSendingGlobal){
      botStatus.innerHTML = `⏹️ Bot ${botIndex}/${totalBots} dihentikan`;
      return;
    }
    try{
      if(customText){ 
        const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({ chat_id:chatId, text:customText })
        });
        const data = await res.json();
        if(!data.ok) throw new Error(data.description||JSON.stringify(data));
      } else if(content){
        const url = type==="sticker"
          ? `https://api.telegram.org/bot${token}/sendSticker`
          : `https://api.telegram.org/bot${token}/sendMessage`;
        const body = type==="sticker"
          ? { chat_id:chatId, sticker:content }
          : { chat_id:chatId, text:content };
        const res = await fetch(url,{
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify(body)
        });
        const data = await res.json();
        if(!data.ok) throw new Error(data.description||JSON.stringify(data));
      }

      botStatus.innerHTML = `✅ Bot ${botIndex}/${totalBots} kirim ${i+1}/${count}`;
      await new Promise(r=>setTimeout(r,350));
    }catch(err){
      botStatus.innerHTML = `❌ Bot ${botIndex}/${totalBots} gagal: ${err.message}`;
    }
  }
  botStatus.innerHTML = `✅ Bot ${botIndex}/${totalBots} selesai`;
}

// ===== Add Text =====
$("#addText")?.addEventListener("click", ()=>{
  const msgEl = $("#textMsg");
  const t = $("#newText").value.trim();

  if(!t){ msgEl.textContent = "❌ Isi teks dulu!"; msgEl.style.color = "red"; return; }
  if(texts.includes(t)){ msgEl.textContent = "⚠️ Teks sudah ada!"; msgEl.style.color = "orange"; return; }

  texts.push(t); save("tb_texts", texts);
  $("#newText").value=""; renderAdmin();

  msgEl.textContent = "✅ Teks berhasil ditambahkan!";
  msgEl.style.color = "green";
  setTimeout(()=> msgEl.textContent="", 2500);
});

// ===== Add Sticker =====
$("#addSticker")?.addEventListener("click", ()=>{
  const msgEl = $("#stickerMsg");
  const s = $("#newSticker").value.trim();

  if(!s){ msgEl.textContent = "❌ Isi sticker file_id dulu!"; msgEl.style.color = "red"; return; }
  if(stickers.includes(s)){ msgEl.textContent = "⚠️ Sticker sudah ada!"; msgEl.style.color = "orange"; return; }

  stickers.push(s); save("tb_stickers", stickers);
  $("#newSticker").value=""; renderAdmin();

  msgEl.textContent = "✅ Sticker berhasil ditambahkan!";
  msgEl.style.color = "green";
  setTimeout(()=> msgEl.textContent="", 2500);
});

// ===== Populate Content =====
function populateContent(){
  const sel=$("#contentSelect"); sel.innerHTML="";
  if($("#typeSelect").value==="text"){
    if(!texts.length) sel.innerHTML='<option value="">(Belum ada teks)</option>';
    else texts.forEach(t=>{ const o=document.createElement("option"); o.value=t; o.textContent=t; sel.appendChild(o); });
  }else{
    if(!stickers.length) sel.innerHTML='<option value="">(Belum ada sticker)</option>';
    else stickers.forEach(s=>{ const o=document.createElement("option"); o.value=s; o.textContent=s; sel.appendChild(o); });
  }
}
$("#typeSelect")?.addEventListener("change", populateContent);

// ===== Token Management =====
function loadTokens(uid){ return load("tb_tokens_"+uid,[]); }
function saveTokens(uid,toks){ save("tb_tokens_"+uid,toks); }
function renderTokens(uid){
  const tokens=loadTokens(uid); const list=$("#tokenList");
  list.innerHTML = tokens.length
    ? tokens.map((tok,i)=>`${i+1}. ${tok} <button class="item-btn del-tok" data-i="${i}">hapus</button>`).join("<br>") 
    : `<div class="small">Belum ada token</div>`;
}
$("#addToken")?.addEventListener("click", ()=>{
  const msgEl = $("#tokenMsg");
  const tok=$("#newToken").value.trim();
  if(!tok){ msgEl.textContent="❌ Token kosong!"; msgEl.style.color="red"; return; }

  const tokens=loadTokens(sessionUser);
  if(tokens.includes(tok)){ msgEl.textContent="⚠️ Token sudah ada!"; msgEl.style.color="orange"; return; }

  tokens.push(tok); saveTokens(sessionUser,tokens); $("#newToken").value=""; renderTokens(sessionUser);

  msgEl.textContent="✅ Token berhasil ditambahkan!";
  msgEl.style.color="green";
  setTimeout(()=> msgEl.textContent="",2500);
});

// ===== Logout =====
$("#btnLogout")?.addEventListener("click", ()=>{
  sessionStorage.removeItem("tb_user"); sessionUser="";
  $("#dashboard").style.display="none"; 
  $("#loginCard").style.display="block";

  $("#footerNav").style.display="none";
  $("#loginNav").style.display="flex";

  document.querySelectorAll("main.page").forEach(p=>p.style.display="none");
  $("#homePage").style.display="block";
});

// ===== Avatar =====
const adminAvatarPreview = $("#adminAvatarPreview");
const premiumAvatarEl = $("#premiumAvatar");
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

btnUpdateAvatar?.addEventListener("click", ()=>{
  const url = adminAvatarUrl.value.trim();

  if(!url){ avatarMsgEl.innerHTML = `❌ Gagal: link avatar kosong!`; return; }
  if(!url.match(/\.(jpg|jpeg|png|gif|webp)$/i)){
    avatarMsgEl.innerHTML = `❌ Gagal: link harus gambar (jpg/png/gif/webp)!`; return;
  }

  try {
    setAdminAvatar(url);
    avatarMsgEl.innerHTML = `✅ Avatar berhasil diupdate & tersimpan!`;
  } catch(e){
    avatarMsgEl.innerHTML = `❌ Gagal update avatar: ${e.message}`;
  }
  setTimeout(()=>{ avatarMsgEl.innerHTML=""; }, 3000);
});

// ==== Navigasi Halaman ====
const navBtns = document.querySelectorAll('.nav-btn');
const pages = document.querySelectorAll('.page');

function showPage(pageId) {
  pages.forEach(p => p.style.display = 'none');
  document.getElementById(pageId).style.display = 'block';
}

navBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    showPage(btn.dataset.page);
  });
});

document.getElementById('btnShowCatbox')?.addEventListener('click', () => {
  showPage('catboxPage');
});

document.getElementById('btnBackToMenu')?.addEventListener('click', () => {
  showPage('menuLainnya');
});

// ==== Upload Foto Catbox ===
document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("catboxFile");
  const uploadBtn = document.getElementById("btnCatboxUpload");
  const msg = document.getElementById("catboxMsg");
  const result = document.getElementById("catboxResult");
  let selectedFile = null;

  fileInput.addEventListener("change", () => {
    if (!fileInput.files.length) return;
    selectedFile = fileInput.files[0];
    msg.textContent = `Dipilih: ${selectedFile.name}`;
    result.innerHTML = "";
  });

  function getFileType(file) {
    const type = file.type;
    if (type.startsWith("image/")) return "image";
    if (type.startsWith("video/")) return "video";
    if (type.startsWith("audio/")) return "audio";
    return "file";
  }

  uploadBtn.addEventListener("click", async () => {
    if (!selectedFile) {
      msg.textContent = "⚠️ Pilih file dulu!";
      return;
    }

    uploadBtn.disabled = true;
    msg.textContent = "⏳ Uploading...";

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });

      if (!res.ok) throw new Error("Gagal koneksi");
      const { url } = await res.json();

      msg.textContent = "✅ Upload sukses!";

      const fileType = getFileType(selectedFile);
      let previewHTML = "";

      if (fileType === "image") {
        previewHTML = `<img src="${url}" style="max-width:100%;margin-top:10px;border-radius:8px;">`;
      } else if (fileType === "video") {
        previewHTML = `<video src="${url}" controls style="max-width:100%;margin-top:10px;border-radius:8px;"></video>`;
      } else if (fileType === "audio") {
        previewHTML = `<audio src="${url}" controls style="width:100%;margin-top:10px;"></audio>`;
      }

      result.innerHTML = `
        <p>URL: <a href="${url}" target="_blank">${url}</a></p>
        ${previewHTML}
      `;
    } catch (err) {
      msg.textContent = `❌ Error: ${err.message}`;
    } finally {
      uploadBtn.disabled = false;
    }
  });
});

// ===== FOTO HD =====
document.addEventListener('DOMContentLoaded', () => {

  const pages = document.querySelectorAll('.page');

  function showPage(pageId) {
    pages.forEach(p => p.style.display = 'none');
    const page = document.getElementById(pageId);
    if (page) page.style.display = 'block';
  }

  // Default page
  showPage('home');

  // Navigasi utama
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => showPage(btn.dataset.page));
  });

  // Tombol Menu Lainnya → HD Photo
  const btnShowHDPhoto = document.getElementById('btnShowHDPhoto');
  btnShowHDPhoto.addEventListener('click', () => showPage('hdPhotoPage'));

  // Kembali ke Menu Lainnya
  const btnBackMenuHD = document.getElementById('btnBackMenuHD');
  btnBackMenuHD.addEventListener('click', () => showPage('menuLainnya'));

  // Elements
  const fileInput = document.getElementById('hdPhotoFile');
  const msg = document.getElementById('hdPhotoMsg');
  const container = document.getElementById('hdPhotoResultContainer');
  const btnShowHD = document.getElementById('btnShowHD');
  const btnDownloadHD = document.getElementById('btnDownloadHD');

  let currentDataURL = '';

  // Tombol tampilkan HD
  btnShowHD.addEventListener('click', () => {
    if (!fileInput.files.length) {
      msg.textContent = "❌ Pilih foto terlebih dahulu!";
      container.innerHTML = '';
      currentDataURL = '';
      return;
    }

    const file = fileInput.files[0];

    if (file.size > 100 * 1024 * 1024) {
      msg.textContent = "❌ Foto terlalu besar! Maks 100MB.";
      container.innerHTML = '';
      currentDataURL = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      currentDataURL = e.target.result;
      msg.textContent = "✅ Foto siap ditampilkan!";
      container.innerHTML = '';
      const img = new Image();
      img.src = currentDataURL;
      img.style.width = '350px';
      img.style.height = '300';
      img.style.display = 'block';
      container.appendChild(img);
      container.style.overflow = 'auto';
    };
    reader.readAsDataURL(file);
  });

  // Tombol download
  btnDownloadHD.addEventListener('click', () => {
    if (!currentDataURL) {
      msg.textContent = "❌ Tidak ada foto untuk di-download!";
      return;
    }
    const a = document.createElement('a');
    a.href = currentDataURL;
    a.download = fileInput.files[0].name || 'photo_hd.png';
    a.click();
  });

});

// ==== DOWNLOAD TIKTOK =====
document.addEventListener("DOMContentLoaded", () => {
  // --- PAGE NAVIGATION ---
  const pages = document.querySelectorAll(".page");

  function showPage(pageId) {
    pages.forEach(p => (p.style.display = "none"));
    const page = document.getElementById(pageId);
    if (page) page.style.display = "block";
  }

  // Default page
  showPage("home");

  // Tombol navigasi utama
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => showPage(btn.dataset.page));
  });

  // --- SUBMENU TikTok ---
  const btnShowTikTok = document.getElementById("btnShowTikTok");
  const btnBackMenuTikTok = document.getElementById("btnBackMenuTikTok");

  if (btnShowTikTok) btnShowTikTok.addEventListener("click", () => showPage("tiktokPage"));
  if (btnBackMenuTikTok) btnBackMenuTikTok.addEventListener("click", () => showPage("menuLainnya"));

  // --- ELEMENTS TikTok ---
  const tiktokURLInput = document.getElementById("tiktokURL");
  const btnDownloadTikTok = document.getElementById("btnDownloadTikTok");
  const tiktokMsg = document.getElementById("tiktokMsg");
  const tiktokResult = document.getElementById("tiktokResult");

  if (btnDownloadTikTok) {
    btnDownloadTikTok.addEventListener("click", async () => {
      const url = tiktokURLInput.value.trim();
      tiktokMsg.style.color = "red";
      tiktokMsg.textContent = "";
      tiktokResult.innerHTML = "";

      if (!url) {
        tiktokMsg.textContent = "❌ Masukkan URL TikTok!";
        return;
      }

      tiktokMsg.style.color = "black";
      tiktokMsg.textContent = "🔄 Sedang memproses...";

      try {
        // Panggil backend (server.js) → API TikTok
        const response = await fetch(`/api/tiktok?url=${encodeURIComponent(url)}`, {
          headers: { accept: "application/json" }
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        console.log("HASIL API:", data);

        if (data && data.status === true && data.result && data.result.nowatermark) {
          const videoURL = data.result.nowatermark;
          tiktokMsg.style.color = "green";
          tiktokMsg.textContent = "✅ Video siap di-download!";
          tiktokResult.innerHTML = `
            <video src="${videoURL}" controls style="max-width:100%; margin-top:10px;"></video>
            <br>
            <a href="${videoURL}" download="tiktok_video.mp4" 
               class="btn-primary" 
               style="display:inline-block; padding:5px 10px; background:#4CAF50; color:#fff; text-decoration:none; border-radius:4px; margin-top:5px;">
               💾 Download Video
            </a>
          `;
        } else {
          let errMsg = data && data.message ? data.message : "Gagal mendapatkan video. Pastikan URL valid.";
          tiktokMsg.textContent = `❌ ${errMsg}`;
        }
      } catch (err) {
        console.error(err);
        tiktokMsg.textContent = "❌ Terjadi kesalahan: " + err.message;
      }
    });
  }
});

// ==== HELP =====
const btnHelp = document.getElementById('btnHelp');
const helpPopup = document.getElementById('helpPopup');
const helpClose = document.getElementById('helpClose');

// Buka popup saat tombol Help diklik
btnHelp.addEventListener('click', () => {
  helpPopup.style.display = 'flex';
});

// Tutup popup saat tombol close diklik
helpClose.addEventListener('click', () => {
  helpPopup.style.display = 'none';
});

// Tutup popup saat klik di luar content
window.addEventListener('click', (e) => {
  if(e.target === helpPopup){
    helpPopup.style.display = 'none';
  }
});

// ==== OBFUSCATE =====
document.addEventListener("DOMContentLoaded", () => {

  function togglePage(pageId) {
    document.querySelectorAll(".page").forEach(p =>
      p.style.display = (p.id === pageId ? "block" : "none")
    );
  }
  const btnShow = document.getElementById("btnShowObfuscate");
  const btnBack  = document.getElementById("btnBackMenuObf");
  if (btnShow) btnShow.onclick = () => togglePage("obfuscatePage");
  if (btnBack)  btnBack.onclick  = () => togglePage("mainMenuPage");

  // === Element References ===
  const textInput   = document.getElementById("obfTextInput");
  const obfTextBtn  = document.getElementById("btnObfText");
  const textOutput  = document.getElementById("obfTextResult");
  const textStatus  = document.getElementById("obfTextMsg");
  const copyBtn     = document.getElementById("btnCopyText");
  const clearBtn    = document.getElementById("btnClear");
  const textModeSel = document.getElementById("obfModeText");

  const fileChooser   = document.getElementById("obfFileInput");
  const obfFileBtn    = document.getElementById("btnObfFile");
  const fileStatus    = document.getElementById("obfFileMsg");
  const downloadLink  = document.getElementById("downloadObfFile");
  const fileModeSel   = document.getElementById("obfModeFile");
  const fileTextArea  = document.getElementById("obfFileResult");   // textarea untuk hasil file (harus ada di HTML)

  // Jika textarea hasil file tidak ada, buat otomatis (fallback)
  if (!fileTextArea) {
    const wrapper = document.querySelector("#obfuscatePage .menu-items") || document.body;
    const ta = document.createElement("textarea");
    ta.id = "obfFileResult";
    ta.rows = 8;
    ta.style = "display:none; width:100%; margin-top:10px;";
    ta.readOnly = true;
    if (downloadLink && downloadLink.parentNode) downloadLink.parentNode.insertBefore(ta, downloadLink.nextSibling);
    else wrapper.appendChild(ta);
  }

  // Pastikan referensi lagi (jika dibuat)
  const fileResult = document.getElementById("obfFileResult");

  // Jika tombol copy file belum ada, buat setelah downloadLink
  let copyFileBtn = document.getElementById("btnCopyFile");
  if (!copyFileBtn) {
    copyFileBtn = document.createElement("button");
    copyFileBtn.id = "btnCopyFile";
    copyFileBtn.className = "btn secondary";
    copyFileBtn.style.marginLeft = "10px";
    copyFileBtn.textContent = "📋 Copy File Result";
    if (downloadLink && downloadLink.parentNode) downloadLink.parentNode.insertBefore(copyFileBtn, downloadLink.nextSibling);
    else (fileResult && fileResult.parentNode ? fileResult.parentNode.appendChild(copyFileBtn) : document.body.appendChild(copyFileBtn));
  }

  // Utilities: manage object URLs
  function setDownloadLink(el, blob, filename, statusEl) {
    try {
      if (el._objectUrl) {
        try { URL.revokeObjectURL(el._objectUrl); } catch(e){}
        el._objectUrl = null;
      }
      const url = URL.createObjectURL(blob);
      el.href = url;
      el._objectUrl = url;
      el.download = filename || "output.js";
      el.style.display = "inline-block";

      // auto revoke setelah 30 detik
      setTimeout(() => {
        try {
          if (el._objectUrl) {
            URL.revokeObjectURL(el._objectUrl);
            el._objectUrl = null;
          }
        } catch(e){}
      }, 30000);
    } catch (e) {
      console.error("setDownloadLink error:", e);
      el.style.display = "none";
      if (statusEl) statusEl.textContent = "❌ Gagal membuat link download!";
    }
  }

  // === Obfuscator implementations ===
  function obfuscateNormal(code) {
    if (typeof JavaScriptObfuscator === "undefined") {
      throw new Error("javascript-obfuscator tidak ditemukan. Sertakan CDN/librarynya.");
    }
    return JavaScriptObfuscator.obfuscate(code, {
      compact: true,
      controlFlowFlattening: true,
      controlFlowFlatteningThreshold: 0.75,
      deadCodeInjection: true,
      deadCodeInjectionThreshold: 0.4,
      disableConsoleOutput: true,
      identifierNamesGenerator: 'hexadecimal',
      numbersToExpressions: true,
      selfDefending: true,
      splitStrings: true,
      stringArray: true,
      stringArrayEncoding: ['base64'],
      stringArrayIndexShift: true,
      stringArrayRotate: true,
      stringArrayWrappersCount: 2,
      stringArrayWrappersChainedCalls: true,
      stringArrayWrappersType: 'function',
      stringArrayThreshold: 0.75
    }).getObfuscatedCode();
  }

  async function obfuscateQuantum(code) {
    if (typeof JsConfuser !== "undefined" && JsConfuser && typeof JsConfuser.obfuscate === "function") {
      try {
        const res = await JsConfuser.obfuscate(code, {
          target: "browser",
          compact: true,
          renameVariables: true,
          renameGlobals: true,
          stringCompression: true,
          stringEncoding: true,
          controlFlowFlattening: 0.75,
          flatten: true,
          shuffle: true,
          rgf: true,
          opaquePredicates: { count: 6, complexity: 4 },
          dispatcher: true,
          globalConcealing: true,
          lock: { selfDefending: true, integrity: true },
          duplicateLiteralsRemoval: true
        });
        return (res && res.code) ? res.code : (typeof res === "string" ? res : "");
      } catch (e) {
        console.warn("JsConfuser gagal, fallback ke normal:", e && e.message ? e.message : e);
      }
    }
    return obfuscateNormal(code);
  }

  async function obfuscateByMode(code, mode) {
    if (mode === "quantum") {
      return await obfuscateQuantum(code);
    } else {
      return obfuscateNormal(code);
    }
  }

  // ===== Tombol Obfuscate Text =====
  if (obfTextBtn) obfTextBtn.addEventListener("click", async () => {
    const code = (textInput && textInput.value || "").trim();
    if (!code) {
      if (textStatus) textStatus.textContent = "❌ Teks kosong!";
      if (textOutput) textOutput.style.display = "none";
      return;
    }

    const mode = (textModeSel && textModeSel.value) ? textModeSel.value : "normal";
    if (textStatus) textStatus.textContent = `⏳ Meng-obfuscate... [${mode}]`;
    try {
      const obfCode = await obfuscateByMode(code, mode);

      if (textOutput) {
        textOutput.value = obfCode;
        textOutput.style.display = "block";
      }
      if (textStatus) textStatus.textContent = `✅ Teks berhasil di-obfuscate! [${mode}]`;

      // download
      if (downloadLink) {
        try {
          const blob = new Blob([obfCode], { type: "text/javascript" });
          setDownloadLink(downloadLink, blob, "obfuscated.js", textStatus);
        } catch (e) {
          console.warn("Gagal set download link:", e);
          if (downloadLink) downloadLink.style.display = "none";
          if (textStatus) textStatus.textContent = "❌ Gagal membuat file download!";
        }
      }
    } catch (err) {
      console.error("Obfuscate text error:", err);
      if (textStatus) textStatus.textContent = `❌ Gagal obfuscate teks! ${err && err.message ? err.message : ""}`;
      if (textOutput) textOutput.style.display = "none";
      if (downloadLink) downloadLink.style.display = "none";
    }
  });

  // ===== Tombol Copy Teks =====
  if (copyBtn) copyBtn.addEventListener("click", () => {
    if (!textOutput || !textOutput.value) {
      if (textStatus) textStatus.textContent = "❌ Tidak ada teks untuk disalin!";
      return;
    }
    navigator.clipboard.writeText(textOutput.value)
      .then(() => { if (textStatus) textStatus.textContent = "✅ Teks berhasil disalin!"; })
      .catch(() => { if (textStatus) textStatus.textContent = "❌ Gagal menyalin teks!"; });
  });

  // ===== Tombol Clear =====
  if (clearBtn) clearBtn.addEventListener("click", () => {
    if (textInput) textInput.value = "";
    if (textOutput) { textOutput.value = ""; textOutput.style.display = "none"; }
    if (fileResult) { fileResult.value = ""; fileResult.style.display = "none"; }
    if (textStatus) textStatus.textContent = "";
    if (fileStatus) fileStatus.textContent = "";
    if (downloadLink) downloadLink.style.display = "none";
  });

  // ===== Tombol Obfuscate File =====
  if (obfFileBtn) obfFileBtn.addEventListener("click", async () => {
    if (!fileChooser || !fileChooser.files || !fileChooser.files.length) {
      if (fileStatus) fileStatus.textContent = "❌ Pilih file dulu!";
      if (downloadLink) downloadLink.style.display = "none";
      return;
    }

    const file = fileChooser.files[0];
    let code = "";
    try {
      code = await file.text();
    } catch (e) {
      console.error("Failed read file:", e);
      if (fileStatus) fileStatus.textContent = "❌ Gagal baca file!";
      return;
    }

    const mode = (fileModeSel && fileModeSel.value) ? fileModeSel.value : "normal";
    if (fileStatus) fileStatus.textContent = `⏳ Meng-obfuscate file... [${mode}]`;

    try {
      const obfCode = await obfuscateByMode(code, mode);

      if (fileResult) {
        fileResult.value = obfCode;
        fileResult.style.display = "block";
      }

      if (downloadLink) {
        try {
          const blob = new Blob([obfCode], { type: "text/javascript" });
          setDownloadLink(downloadLink, blob, file.name.replace(/\.js$/i, "") + ".obf.js", fileStatus);
        } catch (e) {
          console.warn("Failed to create download link:", e);
          if (downloadLink) downloadLink.style.display = "none";
          if (fileStatus) fileStatus.textContent = "❌ Gagal membuat file download!";
        }
      }

      if (fileStatus) fileStatus.textContent = `✅ File berhasil di-obfuscate! [${mode}]`;
    } catch (err) {
      console.error("Obfuscate file error:", err);
      if (fileStatus) fileStatus.textContent = `❌ Gagal obfuscate file! ${err && err.message ? err.message : ""}`;
      if (downloadLink) downloadLink.style.display = "none";
      if (fileResult) fileResult.style.display = "none";
    }
  });

  // ===== Tombol Copy File Result =====
  if (copyFileBtn) {
    copyFileBtn.addEventListener("click", () => {
      const v = (fileResult && fileResult.value) ? fileResult.value : "";
      if (!v) {
        if (fileStatus) fileStatus.textContent = "❌ Tidak ada hasil file untuk disalin!";
        return;
      }
      navigator.clipboard.writeText(v)
        .then(() => { if (fileStatus) fileStatus.textContent = "✅ Hasil file disalin ke clipboard"; })
        .catch(() => { if (fileStatus) fileStatus.textContent = "❌ Gagal menyalin hasil file"; });
    });
  }

  // revoke objectUrl on download link click after a short time
  if (downloadLink) downloadLink.addEventListener("click", () => {
    setTimeout(() => {
      try { if (downloadLink._objectUrl) { URL.revokeObjectURL(downloadLink._objectUrl); downloadLink._objectUrl = null; } } catch(e){}
    }, 1500);
  });

  // keyboard shortcut
  if (textInput) textInput.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter" && (ev.ctrlKey || ev.metaKey)) {
      if (obfTextBtn) obfTextBtn.click();
    }
  });

  // initial messages
  if (textStatus) textStatus.textContent = "Siap — paste kode lalu pilih mode dan klik Obfuscate.";
  if (fileStatus) fileStatus.textContent = "Siap — pilih file lalu klik Obfuscate.";

});

// html-obfuscator-ui.js

// ====== HTML ======
  const htmlInput   = document.getElementById("obfHtmlInput");
  const obfHtmlBtn  = document.getElementById("btnObfHtml");
  const htmlOutput  = document.getElementById("obfHtmlResult");
  const htmlStatus  = document.getElementById("obfHtmlMsg");
  const copyHtmlBtn = document.getElementById("btnCopyHtml");
  const clearHtmlBtn= document.getElementById("btnClearHtml");

  function obfuscateHtml(code) {
    // simple base64 encoding for HTML
    const base64 = btoa(unescape(encodeURIComponent(code)));
    return `<script>document.write(decodeURIComponent(escape(atob("${base64}"))));<\/script>`;
  }

  if (obfHtmlBtn) obfHtmlBtn.addEventListener("click", () => {
    const code = (htmlInput && htmlInput.value || "").trim();
    if (!code) {
      if (htmlStatus) htmlStatus.textContent = "❌ HTML kosong!";
      if (htmlOutput) htmlOutput.style.display = "none";
      return;
    }
    htmlStatus.textContent = "⏳ Meng-obfuscate HTML...";
    try {
      const obfCode = obfuscateHtml(code);
      if (htmlOutput) {
        htmlOutput.value = obfCode;
        htmlOutput.style.display = "block";
      }
      htmlStatus.textContent = "✅ HTML berhasil di-obfuscate!";
    } catch (err) {
      console.error("Obfuscate HTML error:", err);
      htmlStatus.textContent = `❌ Gagal obfuscate HTML! ${err.message}`;
      if (htmlOutput) htmlOutput.style.display = "none";
    }
  });

  if (copyHtmlBtn) copyHtmlBtn.addEventListener("click", () => {
    if (!htmlOutput || !htmlOutput.value) {
      if (htmlStatus) htmlStatus.textContent = "❌ Tidak ada HTML untuk disalin!";
      return;
    }
    navigator.clipboard.writeText(htmlOutput.value)
      .then(() => htmlStatus.textContent = "✅ HTML berhasil disalin!")
      .catch(() => htmlStatus.textContent = "❌ Gagal menyalin HTML!");
  });

  if (clearHtmlBtn) clearHtmlBtn.addEventListener("click", () => {
    if (htmlInput) htmlInput.value = "";
    if (htmlOutput) { htmlOutput.value = ""; htmlOutput.style.display = "none"; }
    if (htmlStatus) htmlStatus.textContent = "";
  });

// ===== Init =====
(async function init(){
  await renderAdmin(); populateContent();
  if(sessionUser){ await loadPremium(); const p=premium.find(u=>u.id===sessionUser); if(p) showDashboard(sessionUser,p); }
})();