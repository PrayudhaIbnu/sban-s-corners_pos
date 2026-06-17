// ===== RECEIPT =====
function showReceipt(id, items, total, method, tendered, change) {
  const name = "SBAN'S CORNER";
  const footer = "Thank you for visiting!";
  const date = new Date().toLocaleString();
  
  let html = `<p class="font-bold text-sm mb-1">${name}</p>`;
  html += `<p class="text-[10px] mb-2">${date}</p>`;
  html += `<p class="text-[10px] mb-1">${id}</p>`;
  html += `<hr class="border-dashed my-2">`;
  
  items.forEach(i => { 
    html += `<div class="flex justify-between">
      <span>${i.name} x${i.qty}</span>
      <span>Rp ${(i.price * i.qty).toLocaleString()}</span>
    </div>`; 
  });
  
  html += `<hr class="border-dashed my-2">`;
  html += `<div class="flex justify-between font-bold">
    <span>TOTAL</span>
    <span>Rp ${total.toLocaleString()}</span>
  </div>`;
  html += `<div class="flex justify-between">
    <span>Method</span>
    <span>${method}</span>
  </div>`;
  
  if (method === 'CASH') {
    html += `<div class="flex justify-between">
      <span>Tendered</span>
      <span>Rp ${tendered.toLocaleString()}</span>
    </div>`;
    html += `<div class="flex justify-between">
      <span>Change</span>
      <span>Rp ${change.toLocaleString()}</span>
    </div>`;
  }
  
  html += `<hr class="border-dashed my-2">`;
  html += `<p class="text-[10px]">${footer}</p>`;
  
  const receiptContent = document.getElementById('receiptContent');
  const receiptModal = document.getElementById('receiptModal');
  
  if (receiptContent) receiptContent.innerHTML = html;
  if (receiptModal) receiptModal.classList.remove('hidden');
}

function closeReceipt() { 
  const modal = document.getElementById('receiptModal');
  if (modal) modal.classList.add('hidden'); 
}