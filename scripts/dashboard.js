// ============================================================================
// Dashboard.js
// Client-side logic for the TypeFace Personal Finance Dashboard
// Handles: auth guard, transaction CRUD, filters, pagination, KPIs, charts,
// and imports (receipts + PDF statements).
// ============================================================================

// ----------------- Global helpers -----------------
const API_BASE = (window.VITE_API_BASE || "http://localhost:5001"); // backend URL

// DOM utilities
const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

// Format number as Indian Rupees currency
const fmtINR = (n) => new Intl.NumberFormat('en-IN',{ style:'currency', currency:'INR' }).format(Number(n||0));

// Query string helper: builds ?a=1&b=2 only from defined values
const qs = (obj) => new URLSearchParams(Object.entries(obj).filter(([,v])=>v!==undefined && v!=='')).toString();

// Utility functions
const clamp = (n,min,max)=>Math.max(min,Math.min(max,n));
const debounce = (fn,ms)=>{ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a),ms);} };
const escapeHtml = (s)=>String(s||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

// ----------------- Chart.js defaults (dark theme) -----------------
if (window.Chart) {
  Chart.defaults.color = '#f5f7ff';
  Chart.defaults.borderColor = 'rgba(255,255,255,.16)';
  Chart.defaults.plugins.legend.labels.color = '#ffffff';
  Chart.defaults.plugins.tooltip.titleColor = '#0b1020';
  Chart.defaults.plugins.tooltip.bodyColor  = '#0b1020';
  Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(255,255,255,.95)';
}

// Predefined neon color palette (used for pie slices etc.)
const neon = ['#22D3EE','#7C5CFF','#24D17E','#F59E0B','#F472B6','#60A5FA','#34D399','#F43F5E','#A78BFA','#FCD34D'];

// ----------------- Auth guard -----------------
/**
 * Ensures a logged-in user exists before loading dashboard.
 * If not authenticated → redirects to login page.
 */
async function guard(){
  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, { credentials: 'include' });
    if(!res.ok){ window.location.href='index.html'; return null; }
    const data = await res.json();
    if(!data?.user){ window.location.href='index.html'; return null; }

    // Display user initials in avatar
    const initials = (data.user.name || data.user.email || 'U')
      .split(' ')
      .map(s=>s[0])
      .join('')
      .slice(0,2)
      .toUpperCase();
    const av = $('.avatar span'); 
    if(av) av.textContent = initials;

    return data.user;
  } catch (err) {
    console.error("Auth check failed", err);
    window.location.href='index.html';
    return null;
  }
}

// ----------------- Global state -----------------
window.state = {
  page: 1, pageSize: 20, pages: 1, total: 0,
  filters: { q:'', start:'', end:'', category:'' },
  range: 'MTD',
  previewItems: [], // used for import modal
  previewSource: '', 
};

// ----------------- Quick range filter -----------------
function initQuickRange(){
  const sel = $('#quickRange'); if(!sel) return;
  applyQuickRange(sel.value);
  sel.addEventListener('change', ()=>{
    applyQuickRange(sel.value);
    state.page = 1; 
    loadTransactions();
  });
}

function applyQuickRange(val){
  state.range = val || 'MTD';
  const startI = $('#startDate'), endI = $('#endDate');
  const today = new Date(); today.setHours(0,0,0,0);
  const fmt = (d)=>d.toISOString().slice(0,10);

  if(state.range === 'ALL'){ 
    startI.value=''; endI.value=''; 
  }
  else if(state.range === '7D'){ 
    const s=new Date(today); s.setDate(s.getDate()-6);
    startI.value=fmt(s); endI.value=fmt(today); 
  }
  else { // default = MTD
    const s=new Date(today); s.setDate(1);
    startI.value=fmt(s); endI.value=fmt(today); 
  }

  state.filters.start = startI.value; 
  state.filters.end = endI.value;
}

// ----------------- Filter controls -----------------
function initFilters(){
  $('#searchTxt')?.addEventListener('input', debounce(()=>{
    state.filters.q = $('#searchTxt').value.trim(); 
    state.page=1; 
    loadTransactions();
  },300));

  $('#startDate')?.addEventListener('change', ()=>{
    state.filters.start=$('#startDate').value||''; 
    state.page=1; 
    loadTransactions(); 
  });
  $('#endDate')?.addEventListener('change', ()=>{
    state.filters.end=$('#endDate').value||''; 
    state.page=1; 
    loadTransactions(); 
  });
  $('#catSel')?.addEventListener('change', ()=>{
    state.filters.category=$('#catSel').value||''; 
    state.page=1; 
    loadTransactions(); 
  });
}

// ----------------- Pagination -----------------
function renderPagination(){
  $('#pageInfo').textContent = `Page ${state.page} of ${state.pages || 1}`;
  $('#prevPage').disabled = state.page<=1;
  $('#nextPage').disabled = state.page>=state.pages;
  $('#prevPage').onclick = ()=>{ if(state.page>1){ state.page--; loadTransactions(); } };
  $('#nextPage').onclick = ()=>{ if(state.page<state.pages){ state.page++; loadTransactions(); } };

  const wrap = $('.pages'); wrap.innerHTML='';
  const maxButtons = 7;
  const start = Math.max(1, state.page - 3);
  const end   = Math.min(state.pages, start + maxButtons - 1);

  for(let p=start; p<=end; p++){
    const b = document.createElement('button');
    b.className = 'page-btn' + (p===state.page ? ' active' : '');
    b.dataset.page = p; b.textContent = p;
    b.onclick = ()=>{ state.page = p; loadTransactions(); };
    wrap.appendChild(b);
  }
}

// ----------------- Load + render transactions -----------------
async function loadTransactions(){
  const params = {
    page: state.page, page_size: state.pageSize,
    q: state.filters.q, start: state.filters.start, end: state.filters.end,
    category: state.filters.category
  };
  const url = `${API_BASE}/api/transactions?${qs(params)}`;

  try {
    const res = await fetch(url, { credentials:'include' });
    if(res.status===401){ window.location.href='index.html'; return; }
    if(!res.ok){ throw new Error(`Fetch failed with status ${res.status}`); }
    const data = await res.json();

    state.pages = data.pages || 1; 
    state.total = data.total || 0;

    const tb = $('#txBody'); tb.innerHTML='';
    (data.items||[]).forEach(it=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${it.date}</td>
        <td>${escapeHtml(it.description||'')}</td>
        <td>${it.type==='income' ? '<span class="chip green">Income</span>' : '<span class="chip red">Expense</span>'}</td>
        <td>${escapeHtml(it.category||'—')}</td>
        <td style="text-align:right">${fmtINR(it.amount)}</td>
      `;
      tb.appendChild(tr);
    });
    $('#emptyState').classList.toggle('hidden', (data.items||[]).length>0);

    updateKpis(data.kpis || {income:0, expense:0, net:0, mom_income_pct:0, mom_expense_pct:0});

    await refreshCharts();

    renderPagination();
  } catch (err) {
    console.error("Error loading transactions", err);
    alert("Could not load transactions. Please try again.");
  }
}

// ----------------- KPI updater -----------------
function updateKpis(k){
  const inc = Number(k.income||0), exp = Number(k.expense||0);
  $('#kpiIncome').textContent  = fmtINR(inc);
  $('#kpiExpense').textContent = fmtINR(exp);
  $('#kpiNet').textContent     = fmtINR(inc-exp);
  $('#kpiNetNote').textContent = $('#quickRange')?.value || 'MTD';

  const budget = 60000;
  const usage = clamp((exp / budget) * 100, 0, 100);
  $('#budgetBar').style.width = `${usage}%`;
  $('#budgetNote').textContent = `${fmtINR(budget)} target`;

  const incDelta = Number(k.mom_income_pct || 0);
  const expDelta = Number(k.mom_expense_pct || 0);

  const incEl = $('#kpiIncomeDelta');
  const expEl = $('#kpiExpenseDelta');

  if (incEl){
    const sign = incDelta >= 0 ? '+' : '';
    incEl.textContent = `${sign}${incDelta.toFixed(1)}%`;
    incEl.classList.toggle('up', incDelta >= 0);
    incEl.classList.toggle('down', incDelta < 0);
  }
  if (expEl){
    const sign = expDelta >= 0 ? '+' : '';
    expEl.textContent = `${sign}${expDelta.toFixed(1)}%`;
    expEl.classList.toggle('up', expDelta >= 0);
    expEl.classList.toggle('down', expDelta < 0);
  }
}

// ----------------- Add Transaction -----------------
function initAddForm(){
  const form = $('#addTxForm'); if(!form) return;
  if (form.__bound) return; form.__bound = true;

  let inflight = false;
  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    if(inflight) return; inflight = true;

    const btn = form.querySelector('button[type="submit"], .btn') || {};
    const originalText = btn.textContent;
    btn.disabled = true; btn.textContent = 'Adding…';

    try{
      const fd = new FormData(form);
      const payload = Object.fromEntries(fd.entries());
      payload.amount = Number(payload.amount);
      payload.date   = String(payload.date||'').slice(0,10);

      const res = await fetch(`${API_BASE}/api/transactions`, {
        method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include',
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(()=>({}));
      if(!res.ok){ alert(data.error||'Failed to add'); return; }

      form.reset();
      state.page = 1; await loadTransactions();
    }catch(err){
      console.error(err); alert('Network error');
    }finally{
      inflight = false; btn.disabled = false; btn.textContent = originalText;
    }
  });
}

// ----------------- Charts -----------------
let charts = {};
function ensureCharts(){
  if(charts._init) return;

  charts.byCat = new Chart($('#byCat'), {
    type:'doughnut',
    data:{ labels:[], datasets:[{ data:[], backgroundColor:[], borderWidth:1, borderColor:'rgba(255,255,255,.08)' }]},
    options:{ plugins:{ legend:{ position:'bottom', labels:{ color:'#fff' } } }, animation:{ duration:450 }, cutout:'60%' }
  });

  charts.overTime = new Chart($('#overTime'), {
    type:'line',
    data:{ labels:[], datasets:[
      { label:'Income',  data:[], tension:.35, borderWidth:2, borderColor:'#24D17E', backgroundColor:'rgba(36,209,126,.18)', pointRadius:2, fill:true },
      { label:'Expense', data:[], tension:.35, borderWidth:2, borderColor:'#F43F5E', backgroundColor:'rgba(244,63,94,.18)',  pointRadius:2, fill:true }
    ]},
    options:{
      plugins:{ legend:{ position:'bottom', labels:{ color:'#fff' } } },
      scales:{ x:{ grid:{ color:'rgba(255,255,255,.12)' }, ticks:{ color:'#f5f7ff' } },
               y:{ beginAtZero:true, grid:{ color:'rgba(255,255,255,.12)' }, ticks:{ color:'#f5f7ff' } } },
      animation:{ duration:450 }
    }
  });

  charts.incomeVsExpense = new Chart($('#incomeVsExpense'), {
    type:'bar',
    data:{ labels:['Income','Expense','Net'], datasets:[{ data:[], backgroundColor:['#24D17E','#F43F5E','#7C5CFF'], borderColor:'rgba(255,255,255,.1)', borderWidth:1 }]},
    options:{
      plugins:{ legend:{ display:false } },
      scales:{ x:{ grid:{ display:false }, ticks:{ color:'#f5f7ff' } },
               y:{ beginAtZero:true, grid:{ color:'rgba(255,255,255,.12)' }, ticks:{ color:'#f5f7ff' } } },
      animation:{ duration:450 }
    }
  });

  charts._init = true;
}

async function refreshCharts(){
  ensureCharts();
  const MAX = 500;
  const params = { page:1, page_size:MAX, q:state.filters.q, start:state.filters.start, end:state.filters.end, category:state.filters.category };
  const url = `${API_BASE}/api/transactions?${qs(params)}`;
  try {
    const res = await fetch(url, { credentials:'include' });
    if(!res.ok) return;
    const data = await res.json();
    const items = data.items || [];

    // Doughnut: expenses by category
    const catMap = {};
    items.forEach(x=>{
      if(x.type!=='expense') return;
      const k = x.category || 'Uncategorized';
      catMap[k] = (catMap[k]||0) + Number(x.amount);
    });
    const labels = Object.keys(catMap);
    const values = labels.map(k=>catMap[k]);
    charts.byCat.data.labels = labels;
    charts.byCat.data.datasets[0].data = values;
    charts.byCat.data.datasets[0].backgroundColor = labels.map((_,i)=>neon[i%neon.length]);
    charts.byCat.update();

    // Line: monthly buckets
    const buckets = {};
    items.forEach(x=>{
      const m = (x.date||'').slice(0,7); if(!m) return;
      buckets[m] ||= { income:0, expense:0 };
      buckets[m][x.type] += Number(x.amount);
    });
    const months = Object.keys(buckets).sort();
    charts.overTime.data.labels = months;
    charts.overTime.data.datasets[0].data = months.map(m=>buckets[m].income);
    charts.overTime.data.datasets[1].data = months.map(m=>buckets[m].expense);
    charts.overTime.update();

    // Bar: totals (from backend or recomputed here)
    const totalInc = Number(data.totals?.income || 0);
    const totalExp = Number(data.totals?.expense || 0);
    charts.incomeVsExpense.data.datasets[0].data = [totalInc, totalExp, totalInc-totalExp];
    charts.incomeVsExpense.update();
  } catch (err) {
    console.error("Error refreshing charts", err);
  }
}

// ----------------- Profile & theme -----------------
function initProfile(){
  const prof = $('#profileMenu'); if(!prof) return;
  const btn = $('.avatar', prof);
  btn?.addEventListener('click', ()=>{
    const open = prof.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', (e)=>{ if(!prof.contains(e.target)) prof.classList.remove('open'); });
  $('#logoutBtn')?.addEventListener('click', async (e)=>{
    e.preventDefault();
    try {
      await fetch(`${API_BASE}/api/auth/logout`, { method:'POST', credentials:'include' });
    } catch (err) {
      console.error("Logout failed", err);
    }
    window.location.href = 'index.html';
  });
}
function initTheme(){ $('#themeToggle')?.addEventListener('click', ()=>{ document.documentElement.classList.toggle('light'); }); }

// ----------------- IMPORTS (Receipts + Statements) -----------------
function initImports(){
  if (initImports._bound) return;
  initImports._bound = true;

  const rIn = $('#fileReceipt'), rArea = $('#uploadReceipt'), rBar = $('#uploadBarReceipt');
  if (rArea) rArea.addEventListener('click', ()=> rIn?.click());
  rIn?.addEventListener('change', async ()=>{
    if(!rIn.files.length) return;
    const fd = new FormData();
    Array.from(rIn.files).forEach(f => fd.append('files', f));
    rBar.style.width = '12%';
    try{
      const res = await fetch(`${API_BASE}/api/imports/parse`, { method:'POST', credentials:'include', body: fd });
      const data = await res.json().catch(()=>({}));
      if(!res.ok){ alert(data.error || 'Parse failed'); rBar.style.width='0%'; return; }
      const items = (data.items || []).filter(Boolean);
      if(!items.length){ alert('No transactions detected.'); rBar.style.width='0%'; return; }
      state.previewItems = items.map(normalizePreviewItem);
      state.previewSource = 'receipt';
      openImportModal();
      rBar.style.width='100%'; setTimeout(()=> rBar.style.width='0%', 600);
    }catch(e){ console.error(e); alert('Network error'); rBar.style.width='0%'; }
    finally{ rIn.value = ''; }
  });

  const sIn = $('#fileStatement'), sArea = $('#uploadStatement'), sBar = $('#uploadBarStatement');
  if (sArea) sArea.addEventListener('click', ()=> sIn?.click());
  sIn?.addEventListener('change', async ()=>{
    if(!sIn.files.length) return;
    const fd = new FormData();
    Array.from(sIn.files).forEach(f => fd.append('files', f));
    sBar.style.width = '12%';
    try{
      const res = await fetch(`${API_BASE}/api/imports/parse`, { method:'POST', credentials:'include', body: fd });
      const data = await res.json().catch(()=>({}));
      if(!res.ok){ alert(data.error || 'Parse failed'); sBar.style.width='0%'; return; }
      const items = (data.items || []).filter(Boolean).map(normalizePreviewItem);
      if(!items.length){ alert('No transactions detected.'); sBar.style.width='0%'; return; }
      const ok = confirm(`Detected ${items.length} transactions from statement.\nImport all now?`);
      if(!ok){ sBar.style.width='0%'; return; }
      for (const it of items) {
        await fetch(`${API_BASE}/api/transactions`, {
          method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify(it)
        });
      }
      alert(`Imported ${items.length} transactions`);
      sBar.style.width='100%'; state.page=1; await loadTransactions(); setTimeout(()=> sBar.style.width='0%', 600);
    }catch(e){ console.error(e); alert('Network error'); sBar.style.width='0%'; }
    finally{ sIn.value=''; }
  });
}

function normalizePreviewItem(it){
  return {
    date: (it.date||'').slice(0,10) || new Date().toISOString().slice(0,10),
    type: it.type === 'income' ? 'income' : 'expense',
    category: it.category || '',
    description: it.description || '',
    amount: Number(it.amount||0)
  };
}

// ----------------- Import Modal (for receipts) -----------------
function openImportModal(){
  const modal = $('#importModal'); if(!modal) return;
  renderPreviewTable();
  modal.classList.add('open'); modal.removeAttribute('aria-hidden');
  function onKey(e){ if(e.key === 'Escape') closeImportModal(); }
  modal.__onKey = onKey; document.addEventListener('keydown', onKey);
}
function closeImportModal(){
  const modal = $('#importModal'); if(!modal) return;
  modal.classList.remove('open'); modal.setAttribute('aria-hidden','true');
  if (modal.__onKey) document.removeEventListener('keydown', modal.__onKey);
}
function renderPreviewTable(){
  const body = $('#previewBody'); if(!body) return;
  body.innerHTML = '';
  state.previewItems.forEach((it, idx)=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input class="pv" data-idx="${idx}" data-k="date" type="date" value="${it.date}"></td>
      <td>
        <select class="pv" data-idx="${idx}" data-k="type">
          <option value="expense"${it.type==='expense'?' selected':''}>Expense</option>
          <option value="income"${it.type==='income'?' selected':''}>Income</option>
        </select>
      </td>
      <td><input class="pv" data-idx="${idx}" data-k="category" value="${escapeHtml(it.category)}"></td>
      <td><input class="pv" data-idx="${idx}" data-k="description" value="${escapeHtml(it.description)}"></td>
      <td style="text-align:right"><input class="pv amt" data-idx="${idx}" data-k="amount" type="number" step="0.01" value="${it.amount}"></td>
      <td><button class="chip danger pv-del" data-idx="${idx}">✕</button></td>
    `;
    body.appendChild(tr);
  });
  $$('.pv').forEach(el=>{
    el.addEventListener('input', (e)=>{
      const i = Number(e.target.dataset.idx);
      const k = e.target.dataset.k;
      let v = e.target.value;
      if (k==='amount') v = Number(v||0);
      state.previewItems[i][k] = v;
    });
  });
  $$('.pv-del').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const i = Number(btn.dataset.idx);
      state.previewItems.splice(i,1);
      renderPreviewTable();
    });
  });
  const total = state.previewItems.reduce((a,b)=>a + Number(b.amount||0) * (b.type==='expense' ? 1 : -1), 0);
  $('#previewTotal').textContent = fmtINR(total);
}
async function commitPreview(){
  const items = state.previewItems.map(normalizePreviewItem).filter(it => Number(it.amount) > 0);
  if (!items.length) { alert('Nothing to import'); return; }
  const btn = $('#btnConfirmImport');
  const orig = btn.textContent; btn.disabled = true; btn.textContent = 'Importing…';
  try {
    for (const it of items) {
      await fetch(`${API_BASE}/api/transactions`, {
        method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify(it)
      });
    }
    alert(`Imported ${items.length} transactions`);
    closeImportModal(); state.page = 1; await loadTransactions();
  } catch (e) { console.error(e); alert('Network error during import'); }
  finally { btn.disabled = false; btn.textContent = orig; }
}

// ----------------- Boot -----------------
(async function(){
  const user = await guard(); if(!user) return;
  initQuickRange(); initFilters(); initAddForm(); initImports();
  initProfile(); initTheme();

  $('#btnCancelImport')?.addEventListener('click', closeImportModal);
  $('#btnConfirmImport')?.addEventListener('click', commitPreview);

  state.page = 1; await loadTransactions();
})();
