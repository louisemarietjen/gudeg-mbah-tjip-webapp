const FOOD_DATA = [
  { id:'food-1', name:'Nasi Putih', price:5000, image:'assets/nasi-putih.jpg', category:'Food' },
  { id:'food-2', name:'Tempe Bacem', price:4000, image:'assets/tempe-bacem.jpg', category:'Food' },
  { id:'food-3', name:'Tahu Bacem', price:4000, image:'assets/tahu-bacem.jpg', category:'Food' },
  { id:'food-4', name:'Gudeg', price:8000, image:'assets/gudeg.jpg', category:'Food' }
];
const DRINK_DATA = [
  { id:'drink-1', name:'Teh Tawar', price:2000, image:'assets/teh-tawar.jpg', category:'Drink' },
  { id:'drink-2', name:'Teh Manis', price:3000, image:'assets/teh-manis.jpg', category:'Drink' },
  { id:'drink-3', name:'Es Teh Lemon', price:4000, image:'assets/es-teh-lemon.jpg', category:'Drink' },
  { id:'drink-4', name:'Kopi', price:5000, image:'assets/kopi.jpg', category:'Drink' }
];
const ALL_PRODUCTS = [...FOOD_DATA, ...DRINK_DATA];
const MODE_LABELS = { dinein:'Dine-In', takeaway:'Take Away', preorder:'Pre-Order' };
const PAYMENT_LABELS = { qris:'QRIS', va:'Virtual Account Transfer', bank:'Transfer Bank', cash:'Bayar Tunai' };

function rupiah(value){
  const amount = Math.round(Number(value) || 0);
  return 'Rp ' + amount.toLocaleString('id-ID');
}
function getProduct(id){ return ALL_PRODUCTS.find(p=>p.id===id); }
