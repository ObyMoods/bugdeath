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
  const btnUpload = document.getElementById('btnCatboxUpload');
  const fileInput = document.getElementById('catboxFile');
  const msg = document.getElementById('catboxMsg');
  const result = document.getElementById('catboxResult');

  btnUpload.addEventListener('click', async () => {
    msg.textContent = "";
    result.innerHTML = "";

    if (!fileInput.files.length) {
      msg.textContent = "❌ Pilih file terlebih dahulu!";
      return;
    }

    const file = fileInput.files[0];
    const allowedTypes = [
      'image/jpeg','image/png','image/gif',
      'video/mp4','video/quicktime',
      'audio/mpeg','audio/ogg',
      'application/pdf','application/zip'
    ];

    if (!allowedTypes.includes(file.type)) {
      msg.textContent = "❌ Tipe file tidak didukung!";
      return;
    }

    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    formData.append('userhash', '');
    formData.append('fileToUpload', file);

    msg.textContent = "⏳ Mengupload...";

    try {
      const response = await fetch('https://catbox.moe/user/api.php', {
        method: 'POST',
        body: formData
      });

      const data = await response.text();
      console.log('RESPONSE CATBOX:', data);

      if (data.startsWith('http')) {
        msg.textContent = "✅ Upload berhasil!";
        let preview = '';
        if (file.type.startsWith('image/')) preview = `<img src="${data}" style="max-width:300px; display:block; margin-top:10px;" />`;
        result.innerHTML = `<a href="${data}" target="_blank">${data}</a>${preview}`;
      } else {
        msg.textContent = "❌ Upload gagal!";
        result.textContent = data;
      }
    } catch (err) {
      msg.textContent = "❌ Terjadi kesalahan saat upload!";
      console.error('ERROR CATBOX:', err);
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

  // Menu TikTok
  const btnShowTikTok = document.getElementById('btnShowTikTok');
  const btnBackMenuTikTok = document.getElementById('btnBackMenuTikTok');
  if (btnShowTikTok) btnShowTikTok.addEventListener('click', () => showPage('tiktokPage'));
  if (btnBackMenuTikTok) btnBackMenuTikTok.addEventListener('click', () => showPage('home'));

  // Elements TikTok
  const tiktokURLInput = document.getElementById('tiktokURL');
  const btnDownloadTikTok = document.getElementById('btnDownloadTikTok');
  const tiktokMsg = document.getElementById('tiktokMsg');
  const tiktokResult = document.getElementById('tiktokResult');

  if (btnDownloadTikTok) {
    btnDownloadTikTok.addEventListener('click', async () => {
      const url = tiktokURLInput.value.trim();
      tiktokMsg.textContent = '';
      tiktokResult.innerHTML = '';

      if (!url) {
        tiktokMsg.textContent = "❌ Masukkan URL TikTok!";
        return;
      }

      tiktokMsg.textContent = "🔄 Sedang memproses...";

      try {
        const apiURL = `https://api.yudzxyz.x-server.my.id/api/tiktok?url=${encodeURIComponent(url)}`;
        const response = await fetch(apiURL, { headers: { "accept": "application/json" } });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        console.log("HASIL API:", data);

        if (data?.result?.nowatermark) {
          const videoURL = data.result.nowatermark;
          const thumbURL = data.result.thumbnail || '';

          tiktokMsg.textContent = "✅ Video siap di-download!";
          tiktokResult.innerHTML = `
            ${thumbURL ? `<img src="${thumbURL}" alt="Thumbnail" style="max-width:200px; margin-bottom:5px; display:block;">` : ''}
            <video src="${videoURL}" controls style="max-width:100%; margin-bottom:5px;"></video>
            <a href="${videoURL}" download="tiktok_video.mp4" class="btn primary" style="margin-top:5px; display:inline-block;">💾 Download Video</a>
          `;
        } else {
          tiktokMsg.textContent = "❌ Gagal mendapatkan video. Pastikan URL valid dan video tidak private.";
        }
      } catch (err) {
        console.error(err);
        tiktokMsg.textContent = "❌ Terjadi kesalahan saat memproses.";
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

// ===== Obfuscate =====
document.addEventListener("DOMContentLoaded", () => {

  function togglePage(pageId) {
    document.querySelectorAll(".page").forEach(p =>
      p.style.display = (p.id === pageId ? "block" : "none")
    );
  }
  document.getElementById("btnShowObfuscate").onclick = () => togglePage("obfuscatePage");
  document.getElementById("btnBackMenuObf").onclick = () => togglePage("mainMenuPage");

  var textInput = document.getElementById("obfTextInput");
  var obfTextBtn = document.getElementById("btnObfText");
  var textOutput = document.getElementById("obfTextResult");
  var textStatus = document.getElementById("obfTextMsg");
  var copyBtn = document.getElementById("btnCopyText");
  var clearBtn = document.getElementById("btnClear");

  // ===== Encoder: ubah hasil obfuscator jadi karakter ZWNJ =====
  function encodeInvisible(str) {
    // Pakai ZWNJ (U+200C) untuk 1, ZWSP (U+200B) untuk 0
    return Array.from(str).map(c => {
      const bin = c.charCodeAt(0).toString(2).padStart(8, "0");
      return bin.replace(/0/g, "\u200B").replace(/1/g, "\u200C");
    }).join(" ");
  }

  // ===== Fungsi Obfuscate Teks =====
  function obfuscateText(code) {
    var obf = JavaScriptObfuscator.obfuscate(code, {
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

    return encodeInvisible(obf); // hanya invisible
  }

  // ===== Tombol Obfuscate Teks =====
  obfTextBtn.addEventListener("click", () => {
    var code = textInput.value.trim();
    if (!code) {
      textStatus.textContent = "❌ Teks kosong!";
      textOutput.style.display = "none";
      return;
    }
    textStatus.textContent = "⏳ Meng-obfuscate...";
    setTimeout(() => {
      try {
        var obfCode = obfuscateText(code);
        textOutput.value = obfCode; // tampilkan invisible
        textOutput.style.display = "block";
        textStatus.textContent = "✅ Teks berhasil di-obfuscate!";
      } catch (err) {
        console.error(err);
        textStatus.textContent = "❌ Gagal obfuscate teks!";
      }
    }, 50);
  });

  // ===== Tombol Copy Teks =====
  copyBtn.addEventListener("click", () => {
    if (!textOutput.value) {
      textStatus.textContent = "❌ Tidak ada teks untuk disalin!";
      return;
    }
    navigator.clipboard.writeText(textOutput.value)
      .then(() => textStatus.textContent = "✅ Teks berhasil disalin!")
      .catch(() => textStatus.textContent = "❌ Gagal menyalin teks!");
  });

  // ===== Tombol Clear =====
  clearBtn.addEventListener("click", () => {
    textInput.value = "";
    textOutput.value = "";
    textOutput.style.display = "none";
    textStatus.textContent = "";
  });

  // ===== Elemen File =====
  var fileChooser = document.getElementById("obfFileInput");
  var obfFileBtn = document.getElementById("btnObfFile");
  var fileStatus = document.getElementById("obfFileMsg");
  var downloadLink = document.getElementById("downloadObfFile");

  // ===== Tombol Obfuscate File =====
  obfFileBtn.addEventListener("click", async () => {
    if (!fileChooser.files.length) {
      fileStatus.textContent = "❌ Pilih file dulu!";
      downloadLink.style.display = "none";
      return;
    }

    var file = fileChooser.files[0];
    var code = await file.text();

    fileStatus.textContent = "⏳ Meng-obfuscate...";
    setTimeout(() => {
      try {
        var obfCode = obfuscateText(code);

        // Download hasil invisible (persis tampilan textarea)
        var blob = new Blob([obfCode], { type: "text/javascript" });
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = file.name.replace(/\.js$/i, "") + ".obf.js";
        downloadLink.style.display = "inline-block";
        fileStatus.textContent = "✅ File berhasil di-obfuscate!";
      } catch (err) {
        console.error(err);
        fileStatus.textContent = "❌ Gagal obfuscate file!";
        downloadLink.style.display = "none";
      }
    }, 50);
  });

});

// ===== Init =====
(async function init(){
  await renderAdmin(); populateContent();
  if(sessionUser){ await loadPremium(); const p=premium.find(u=>u.id===sessionUser); if(p) showDashboard(sessionUser,p); }
})();