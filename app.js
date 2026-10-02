const App = (() => {
  const KEY='gudeg_mbah_tjip_state_v1';
  let state = loadState();

  function loadState(){
    try { return JSON.parse(localStorage.getItem(KEY)) || freshState(); } catch { return freshState(); }
  }
  function freshState(){ return { mode:null, table:null, customer:{name:'',phone:'',date:'',time:'',notes:''}, cart:{}, payment:null, order:null }; }
  function save(){ localStorage.setItem(KEY,JSON.stringify(state)); updateBadge(); }
  function resetOrder(){ state=freshState(); save(); }
  function cartItems(){ return Object.entries(state.cart).filter(([,q])=>q>0).map(([id,q])=>({product:getProduct(id),qty:q})).filter(x=>x.product); }
  function total(){ return cartItems().reduce((sum,x)=>sum+x.product.price*x.qty,0); }
  function go(page, params={}){
    const qs=new URLSearchParams(params).toString(); location.hash=qs?`${page}?${qs}`:page;
    render(); window.scrollTo({top:0,behavior:'instant'});
  }
  function parseRoute(){ const raw=location.hash.replace(/^#/,'')||'home'; const [path,q='']=raw.split('?'); return {page:path,params:new URLSearchParams(q)}; }
  function updateBadge(){ const n=Object.values(state.cart).reduce((a,b)=>a+b,0); const el=document.getElementById('cartBadge'); if(el){el.textContent=n;el.style.display=n?'flex':'none';} }
  function setMode(mode){ state.mode=mode; state.table=null; state.customer={name:'',phone:'',date:'',time:'',notes:''}; state.payment=null; state.order=null; state.cart={}; save(); }
  function add(id){ state.cart[id]=(state.cart[id]||0)+1; save(); render(); }
  function sub(id){ state.cart[id]=Math.max(0,(state.cart[id]||0)-1); if(!state.cart[id]) delete state.cart[id]; save(); render(); }
  function money(v){return 'Rp ' + Number(v).toLocaleString('id-ID');}
  function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}

  function headerTitle(){return state.mode?MODE_LABELS[state.mode]:'Pilih Menu';}
  function render(){
    const {page}=parseRoute();
    const root=document.getElementById('app');
    const views={home:homeView,data:dataView,menu:menuView,drinks:drinksView,checkout:checkoutView,payment:paymentView,status:statusView};
    root.innerHTML=(views[page]||homeView)();
    updateBadge();
    bindCommon();
  }
  function bindCommon(){
    document.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>add(b.dataset.add));
    document.querySelectorAll('[data-sub]').forEach(b=>b.onclick=()=>sub(b.dataset.sub));
  }
  function homeView(){
    return `<section class="home-hero"><h1>Selamat Datang<br>di Warung<br>Gudeg Mbah Tjip</h1><p>Kami hadir dengan berbagai pilihan layanan untuk memudahkan Anda...</p></section>
      ${modeCard('🍽️','Makan di Tempat (Dine In)','Nikmati langsung hidangan hangat di tempat dengan suasana yang nyaman dan pelayanan terbaik dari kami.','dinein')}
      ${modeCard('▣','Bawa Pulang (Take Away Online)','Pesan dengan mudah tanpa perlu menunggu lama, lalu ambil pesanan Anda atau nikmati di rumah.','takeaway')}
      ${modeCard('◷','Pre-Order','Pesan lebih awal untuk jumlah tertentu atau kebutuhan khusus, sehingga semua dapat disiapkan dengan lebih rapi dan tepat waktu.','preorder')}`;
  }
  function modeCard(icon,title,desc,mode){return `<article class="order-mode"><div class="mode-head"><span class="mode-icon">${icon}</span><h3>${title}</h3></div><p>${desc}</p><button class="primary-btn" onclick="App.startMode('${mode}')">PESAN SEKARANG</button></article>`}

  function dataView(){
    if(state.mode==='dinein') return `<div class="page-title">Pemesanan Anda</div><p style="font-size:12px;font-weight:600;margin:0 0 16px">Berikut adalah ringkasan pemesanan Anda</p><div class="form-card"><h2 class="form-section-title">Nomor Meja</h2><div class="form-group"><label>Nomor Meja</label><input value="${esc(state.table||'')}" readonly placeholder="Pilih nomor meja" onclick="App.openTableModal()"></div><button class="primary-btn" onclick="App.openTableModal()">PILIH NOMOR MEJA</button><div class="form-actions"><button class="primary-btn" onclick="App.continueFromData()">SELANJUTNYA</button></div></div>`;
    const preorder=state.mode==='preorder';
    return `<div class="page-title">Pemesanan Anda</div><p style="font-size:12px;font-weight:600;margin:0 0 16px">Berikut adalah ringkasan pemesanan Anda</p><div class="form-card">
      <h2 class="form-section-title">Data Pemesan</h2>
      ${input('Nama Lengkap','name',state.customer.name,'Masukkan nama lengkap')}
      ${input('Nomor Telepon','phone',state.customer.phone,'Masukkan nomor telepon')}
      <h2 class="form-section-title" style="margin-top:22px">${preorder?'Detail Pre-Order':'Detail Take Away'}</h2>
      ${input(preorder?'Tanggal Ambil':'Tanggal Ambil','date',state.customer.date,'', 'date')}
      ${input('Jam Ambil','time',state.customer.time,'','time')}
      ${input('Catatan','notes',state.customer.notes,'Tambahkan catatan','textarea')}
      <div class="form-actions"><button class="primary-btn" onclick="App.continueFromData()">SELANJUTNYA</button></div></div>`;
  }
  function input(label,key,value,placeholder,type='text'){
    if(type==='textarea') return `<div class="form-group"><label>${label}</label><textarea data-field="${key}" placeholder="${placeholder}">${esc(value)}</textarea></div>`;
    return `<div class="form-group"><label>${label}</label><input data-field="${key}" type="${type}" value="${esc(value)}" placeholder="${placeholder}"></div>`;
  }
  function collectData(){document.querySelectorAll('[data-field]').forEach(el=>state.customer[el.dataset.field]=el.value);save();}

  function menuView(){return menuPage('food')}
  function drinksView(){return menuPage('drink')}
  function menuPage(kind){
    const products=kind==='food'?FOOD_DATA:DRINK_DATA;
    const items=cartItems();
    return `<div class="page-title">Pilih Menu Gudeg Mbah Tjip</div><div class="breadcrumbs"><span class="${kind==='food'?'active':''}">Food</span><span class="chev">›</span><span class="${kind==='drink'?'active':''}">Drinks</span><span class="chev">›</span><span>Checkout</span></div>
      <div class="menu-grid">${products.map(productCard).join('')}</div>${cartSheet(items)}`;
  }
  function productCard(p){const q=state.cart[p.id]||0;return `<article class="product-card"><img src="${p.image}" alt="${esc(p.name)}"><h3>${esc(p.name)}</h3><p class="price">${money(p.price)}</p><div class="qty-control"><button class="qty-btn" data-sub="${p.id}">−</button><span class="qty-number">${q}</span><button class="qty-btn" data-add="${p.id}">+</button></div></article>`}
  function cartSheet(items){
    const totalVal=total();
    return `<aside class="cart-sheet"><h2>Ringkasan Pesanan Anda</h2><div class="cart-head"><span>Produk</span><span>Jumlah</span><span>Sub Total</span></div>${items.length?items.map(x=>`<div class="cart-row"><div class="cart-product"><img src="${x.product.image}"><div><strong>${esc(x.product.name)}</strong><span>${money(x.product.price)}</span></div></div><span>${x.qty} Pcs</span><span>${money(x.product.price*x.qty)}</span></div>`).join(''):`<div class="status-empty" style="padding:12px">Belum ada menu yang dipilih.</div>`}<div class="sheet-total"><span>Total</span><span>${money(totalVal)}</span></div><button class="primary-btn sheet-btn" onclick="App.nextMenu('${items.length?'':'empty'}')">SELANJUTNYA</button></aside>`;
  }

  function checkoutView(){
    const items=cartItems();
    return `<div class="page-title">${MODE_LABELS[state.mode]||'Checkout'} Checkout</div><div class="checkout-card">
      <div class="summary-table"><div class="cart-head"><span>Produk</span><span>Jumlah</span><span>Sub Total</span></div>${items.map(x=>`<div class="cart-row"><div class="cart-product"><img src="${x.product.image}"><div><strong>${esc(x.product.name)}</strong><span>${money(x.product.price)}</span></div></div><span>${x.qty} Pcs</span><span>${money(x.product.price*x.qty)}</span></div>`).join('')}</div>
      <div class="grand-total"><span>Grand Total</span><span>${money(total())}</span></div>
      <div class="extra-note"><label>Tambahkan Catatan (Optional)</label><input id="checkoutNote" value="${esc(state.customer.notes)}" placeholder="Tulis catatan pesanan"></div>
      <div class="payment-title">Metode Pembayaran</div><div class="payment-list">${Object.entries(PAYMENT_LABELS).map(([key,label])=>`<button class="payment-option" onclick="App.choosePayment('${key}')"><span>${label}</span><span>›</span></button>`).join('')}</div>
    </div>`;
  }

  function paymentView(){
    const method=state.payment||'qris';
    const labels={qris:'Bayar dengan QRIS',cash:'Bayar Tunai',bank:'Transfer Bank',va:'Virtual Account'};
    if(method==='qris') return `<div class="payment-page"><div class="payment-pill">${labels[method]}</div><div class="pay-help">Scan Me</div><div class="qr-wrap"><img src="assets/qris.png" alt="QRIS"></div><div class="pay-help">Selesaikan pembayaran<br>dalam <span id="countdown">14:32</span></div><button class="primary-btn" onclick="App.finishPayment()">SUDAH BAYAR</button></div>`;
    return `<div class="payment-page"><div class="payment-pill">${labels[method]}</div><div class="payment-detail">${method==='cash'?'<strong>Bayar di Kasir</strong><br>Silakan lakukan pembayaran saat mengambil pesanan.':method==='bank'?'<strong>Transfer Bank</strong><br>Bank BCA<br>1234567890<br>a.n. Gudeg Mbah Tjip':'<strong>Virtual Account</strong><br>8808 1234 5678 9012<br>Bank BCA'}</div><button class="primary-btn" onclick="App.finishPayment()">${method==='cash'?'BAYAR DI TEMPAT':'SUDAH BAYAR'}</button></div>`;
  }

  function statusView(){
    const order=state.order;if(!order) return `<div class="page-title">Pesanan Anda</div><div class="status-empty">Belum ada pesanan. Silakan buat pesanan terlebih dahulu.</div>`;
    return `<div class="page-title">Pesanan Anda</div><div class="status-card"><div class="status-top"><div><b>No. Pesanan:</b><br>${order.id}<br><b>Nama:</b> ${esc(order.customer.name||'-')}</div><div><b>${MODE_LABELS[order.mode]}</b><br><span class="status-label">Status: ${order.status}</span></div></div><div style="font-size:10px;color:#777;margin-bottom:12px">${order.mode==='dinein'?`Meja: ${order.table||'-'}`:''}</div><h3 style="font-size:13px;margin:12px 0">Ringkasan Pesanan Anda</h3>${order.items.map(x=>`<div class="status-item"><img src="${x.product.image}"><div><b>${esc(x.product.name)}</b><br>${money(x.product.price)}</div><div>${x.qty} Pcs<br><b>${money(x.product.price*x.qty)}</b></div></div>`).join('')}<div class="status-total"><span>Grand Total</span><span>${money(order.total)}</span></div><button class="primary-btn" onclick="App.newOrder()">PESAN LAGI</button></div>`;
  }

  function startMode(mode){setMode(mode); if(mode==='dinein'){openTableModal();}else go('data');}
  function continueFromData(){
    if(state.mode!=='dinein') collectData();
    if(state.mode==='dinein'&&!state.table){openTableModal();return;}
    if(state.mode!=='dinein' && (!state.customer.name||!state.customer.phone||!state.customer.date||!state.customer.time)){toast('Lengkapi data pemesan terlebih dahulu');return;}
    go('menu');
  }
  function nextMenu(flag){if(flag==='empty'){toast('Pilih minimal satu menu');return;} const {page}=parseRoute(); if(page==='menu')go('drinks'); else if(page==='drinks')go('checkout');}
  function choosePayment(method){const note=document.getElementById('checkoutNote');if(note){state.customer.notes=note.value;save();}state.payment=method;save();go('payment');}
  async function finishPayment(){
    const order={id:'MHTP-'+Date.now().toString().slice(-6),mode:state.mode,table:state.table,customer:{...state.customer},payment:state.payment,total:total(),items:cartItems(),status:'Diproses'};

    // Save locally first so the user-testing flow remains usable even if the
    // Supabase project has not been configured yet.
    state.order=order;
    save();

    if (typeof saveOrderToSupabase === 'function' && window.supabaseClient) {
      const result = await saveOrderToSupabase(order);
      if (result.ok) {
        state.order.supabaseSaved = true;
        state.order.supabaseId = result.data?.id || null;
        state.order.supabaseOrderCode = result.data?.orderCode || state.order.id;
        save();
      } else {
        state.order.supabaseSaved = false;
        save();
        console.error('Supabase order error:', result.error);
        const detail = result.error?.message ? ` (${result.error.message})` : '';
        toast(`Belum masuk database${detail}`);
      }
    }

    go('status');
  }
  function newOrder(){resetOrder();go('home');}
  function openTableModal(){
    const current=state.table||'';
    document.getElementById('modal-root').innerHTML=`<div class="modal-backdrop" id="tableBackdrop"><div class="modal" style="position:relative"><button class="close-btn" onclick="App.closeModal()">×</button><h2>Pilih Nomor Meja</h2><p>Pilih meja yang sedang Anda gunakan.</p><div class="table-grid">${Array.from({length:12},(_,i)=>`<button class="table-btn ${current==i+1?'selected':''}" onclick="App.selectTable(${i+1})">${i+1}</button>`).join('')}</div><button class="primary-btn" onclick="App.confirmTable()">KONFIRMASI</button></div></div>`;
  }
  function selectTable(n){state.table=n;openTableModal()}
  function confirmTable(){if(!state.table){toast('Pilih nomor meja');return;}save();closeModal();go('menu');}
  function closeModal(){document.getElementById('modal-root').innerHTML=''}
  function toast(msg){const root=document.getElementById('modal-root');root.innerHTML=`<div class="toast">${esc(msg)}</div>`;setTimeout(()=>{if(root.querySelector('.toast'))root.innerHTML=''},1800)}

  function init(){window.addEventListener('hashchange',render);document.getElementById('menuBtn').onclick=()=>toast('Menu navigasi akan ditambahkan jika dibutuhkan.');render();}
  return {init,go,startMode,add,sub,continueFromData,nextMenu,choosePayment,finishPayment,newOrder,openTableModal,selectTable,confirmTable,closeModal};
})();
window.App=App;App.init();
