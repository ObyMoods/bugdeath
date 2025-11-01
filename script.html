<script>
function showPage(page, el){
 document.querySelectorAll("section").forEach(sec=>sec.classList.remove("active"));
 document.getElementById(page).classList.add("active");
 document.querySelectorAll(".nav-item").forEach(n=>n.classList.remove("active"));
 el.classList.add("active");
}

function showPayment(){
    let pop = document.createElement("div");
    pop.className = "payment-popup";
    pop.innerHTML = `
        <div class="payment-box">
            <h3 style="color:#00eaff;margin-bottom:12px;font-size:20px;font-weight:700;">Pembayaran Dana / QRIS</h3>

            <!-- QRIS aesthetic -->
            <img src="https://files.catbox.moe/bve69c.jpg">

            <div class="paytext">Nomor Dana:</div>
            <div class="paytext" id="danaNum">088220252154</div>
            <div class="paytext">Atas Nama: A.M</div>

            <button class="copy-btn" onclick="copyDana()">📋 Copy Nomor</button>
            <a href="https://t.me/const_true_co"
   target="_blank"
   class="social-btn-column"
   style="
       display:block;
       text-align:center;
       margin-top:12px;
       padding:12px 20px;
       background:linear-gradient(135deg,#00aaff,#0077ff);
       border-radius:12px;
       color:white;
       font-weight:700;
       text-decoration:none;
       font-size:16px;
       letter-spacing:0.4px;
       width:92%;
       margin-left:auto;
       margin-right:auto;
       box-shadow:0 4px 12px rgba(0,153,255,0.4);
       transition:all .22s ease;
   "
   onmouseover="this.style.transform='scale(1.04)';this.style.boxShadow='0 6px 18px rgba(0,170,255,0.6)';"
   onmouseout="this.style.transform='scale(1)';this.style.boxShadow='0 4px 12px rgba(0,153,255,0.4)';"
>
   🚀 Kirim Bukti Ke Penjual
</a>
            <button class="close-btn" onclick="closePay(this)">Tutup</button>
        </div>
    `;
    document.body.appendChild(pop);
}

function copyDana(){
    const num = document.getElementById("danaNum").innerText;
    navigator.clipboard.writeText(num);

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerText = "✅ Nomor Dana berhasil disalin";

    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add("hide"), 1800);
    setTimeout(() => toast.remove(), 2300);
}

function closePay(el){
    el.parentNode.parentNode.remove();
}

let cart = [];

function addCart(item){
    cart.push(item);

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerText = "✅ Berhasil menambahkan ke keranjang: " + item;

    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add("hide"), 1800);
    setTimeout(() => toast.remove(), 2300);
}

function viewCart() {
    const popup = document.createElement("div");
    popup.className = "cart-popup";

    popup.innerHTML = `
        <div class="cart-box">
            <h2>🛒 Keranjang</h2>

            <div class="cart-items">
                ${ cart.length
                ? cart.map((item, index) => `
                    <div class="cart-item">
                        <div class="cart-info">
                            <span class="cart-name">${item}</span>
                        </div>
                        <button class="remove-btn" onclick="removeItem(${index})">
                            <i>❌ Hapus</i>
                        </button>
                    </div>
                `).join("")
                : `<div class="cart-item" style="text-align:center;">🛒 Keranjang masih kosong</div>` }
            </div>

            <button class="cart-btn checkout-btn" onclick="checkoutCart()">💳 Checkout</button>
            <button class="cart-btn close-cart" onclick="this.parentNode.parentNode.remove()">Tutup</button>
        </div>
    `;

    document.body.appendChild(popup);
}

function checkoutCart() {
    document.querySelector(".cart-popup")?.remove();

    showPayment();

    cart = [];
}

function removeItem(index) {
    cart.splice(index, 1); 
    document.querySelector(".cart-popup").remove();
    viewCart();
}

function orderTelegram(product, price) {
    const username = "const_true_co";

    const text = `Halo kak, saya mau beli:%0A` +
                 `Produk: *${product}*%0A` +
                 `Harga: Rp *${price}*`;

    window.open(`https://t.me/${username}?text=${text}`, "_blank");
}
</script>