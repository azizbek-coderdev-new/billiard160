'use strict';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const som = n => Math.round(n).toLocaleString('ru-RU').replace(/\u00a0/g, ' ') + " so'm";
const pad = n => String(n).padStart(2, '0');
const st = { settings: { hourly_rate: 40000, rounding: 100 }, tables: [], orders: [], menu: [] };

const clockStr = s => `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s % 3600 / 60))}:${pad(s % 60)}`;
const durStr = s => { const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return (h ? h + ' soat ' : '') + m + ' daqiqa'; };
const timeMoney = secs => Math.round(st.settings.hourly_rate * secs / 3600 / st.settings.rounding) * st.settings.rounding;
const elapsed = t => Math.max(0, Math.floor((Date.now() - new Date(t.started_at)) / 1000));
const itemsSum = id => st.orders.filter(o => o.table_id === id).reduce((a, o) => a + o.price * o.qty, 0);

function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2500); }
async function run(p) { const { data, error } = await p; if (error) { toast('Xato: ' + error.message); throw error; } return data; }

// ---------- Auth ----------
async function boot() {
  const { data } = await sb.auth.getSession();
  show(!!data.session);
  sb.auth.onAuthStateChange((_, s) => show(!!s));
}
function show(on) {
  $('#login').hidden = on; $('#app').hidden = !on;
  if (on) loadAll();
}
$('#loginForm').onsubmit = async e => {
  e.preventDefault(); const f = new FormData(e.target);
  const l = f.get('login').trim().toLowerCase(), email = l.includes('@') ? l : l + '@biliyard160.uz';
  const { error } = await sb.auth.signInWithPassword({ email, password: f.get('password') });
  $('#loginErr').textContent = error ? "Login yoki parol noto'g'ri" : '';
};
$('#logoutBtn').onclick = () => sb.auth.signOut();

// ---------- Theme ----------
$('#themeBtn').onclick = () => {
  const d = document.documentElement, n = d.dataset.theme === 'dark' ? 'light' : 'dark';
  d.dataset.theme = n; try { localStorage.setItem('theme', n); } catch (e) {}
};

// ---------- Data ----------
async function loadAll() {
  const [s, t, o, m] = await Promise.all([
    run(sb.from('settings').select('*').single()), run(sb.from('tables').select('*').order('id')),
    run(sb.from('order_items').select('*').order('id')), run(sb.from('menu_items').select('*').order('name'))]);
  Object.assign(st, { settings: s, tables: t, orders: o, menu: m });
  renderTables(); renderMenu(); $('#rateInp').value = s.hourly_rate;
}
setInterval(() => { if (!$('#app').hidden && !$('#dlg').open) loadAll().catch(() => {}); }, 30000);

// ---------- Tables ----------
function rackSVG() {
  const cs = ['#f4c430', '#2a6fdb', '#e63946', '#7a3fb0', '#ff8c1a', '#1a9468', '#8b1e2d', '#151515', '#f4c430', '#2a6fdb', '#e63946', '#7a3fb0', '#ff8c1a', '#1a9468', '#8b1e2d'];
  let b = '', i = 0;
  for (let r = 0; r < 5; r++) for (let c = 0; c <= r; c++) { const x = 150 - r * 13 + c * 26, y = 26 + r * 23;
    b += `<circle cx="${x}" cy="${y}" r="12" fill="${cs[i++]}"/><circle cx="${x - 4}" cy="${y - 4}" r="3.5" fill="#fff" opacity=".65"/>`; }
  return `<svg viewBox="0 0 310 140" aria-hidden="true"><path d="M150 3 L244 135 L56 135Z" fill="#ffffff12" stroke="#e0b04f" stroke-width="3" stroke-linejoin="round"/>${b}
    <line x1="262" y1="112" x2="206" y2="104" stroke="#fff" stroke-opacity=".6" stroke-width="2" stroke-dasharray="5 5"/>
    <circle cx="282" cy="114" r="13" fill="#fffdf0"/><circle cx="278" cy="110" r="4" fill="#fff"/></svg>`;
}
$('#rack').innerHTML = rackSVG();
function renderTables() {
  $('#bandCount').textContent = st.tables.filter(t => t.started_at).length + ' / ' + st.tables.length;
  $('#tableGrid').innerHTML = st.tables.map(t => {
    const live = !!t.started_at, its = st.orders.filter(o => o.table_id === t.id);
    return `<article class="card table ${live ? 'live' : ''}" data-t="${t.id}">
      <div class="top"><h2>${esc(t.name)}</h2><span class="badge">${live ? "O'yinda" : "Bo'sh"}</span></div>
      <div class="felt"><div class="clock" data-clock="${t.id}">${live ? clockStr(elapsed(t)) : '00:00:00'}</div>
      <div class="money" data-money="${t.id}">${som(live ? timeMoney(elapsed(t)) : 0)}</div>
      <div class="balls"><i></i><i></i><i></i><i></i><i></i></div></div>
      <div class="items">${its.map(o => `<div class="item"><span>${esc(o.name)} · ${som(o.price)}</span>
        <span class="q"><button class="btn sm" data-act="dec" data-id="${o.id}" aria-label="Kamaytirish">−</button><b>${o.qty}</b>
        <button class="btn sm" data-act="inc" data-id="${o.id}" aria-label="Ko'paytirish">+</button>
        <button class="btn sm" data-act="del" data-id="${o.id}" aria-label="O'chirish">✕</button></span></div>`).join('') || '<span class="muted">Mahsulot yo\'q</span>'}</div>
      <div class="acts">
        <button class="btn primary" data-act="start" ${live ? 'disabled' : ''}>▶ Boshlash</button>
        <button class="btn" data-act="add" ${live ? '' : 'disabled'}>🍹 Mahsulot</button>
        <button class="btn stop" data-act="stop" ${live ? '' : 'disabled'}>🧾 Tugatish</button>
      </div></article>`;
  }).join('');
}
setInterval(() => st.tables.forEach(t => {
  if (!t.started_at) return;
  const c = $(`[data-clock="${t.id}"]`), m = $(`[data-money="${t.id}"]`), e = elapsed(t);
  if (c) c.textContent = clockStr(e); if (m) m.textContent = som(timeMoney(e));
}), 1000);

$('#tableGrid').onclick = async e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const tid = +b.closest('[data-t]').dataset.t, act = b.dataset.act, id = +b.dataset.id;
  const o = st.orders.find(x => x.id === id);
  if (act === 'start') await run(sb.rpc('start_table', { p_table: tid }));
  else if (act === 'add') return openAdd(tid);
  else if (act === 'stop') return openCheckout(tid);
  else if (act === 'inc') await run(sb.from('order_items').update({ qty: o.qty + 1 }).eq('id', id));
  else if (act === 'dec') { o.qty > 1 ? await run(sb.from('order_items').update({ qty: o.qty - 1 }).eq('id', id)) : await run(sb.from('order_items').delete().eq('id', id)); }
  else if (act === 'del') { if (!confirm("Mahsulot hisobdan o'chirilsinmi?")) return; await run(sb.from('order_items').delete().eq('id', id)); }
  loadAll();
};

function openAdd(tid) {
  const d = $('#dlg'), t = st.tables.find(x => x.id === tid);
  d.innerHTML = `<h2>${esc(t.name)}: mahsulot qo'shish</h2>
    <div class="grid" style="grid-template-columns:1fr 1fr">${st.menu.map(m => `<button class="btn" data-m="${m.id}">${esc(m.name)}<br><small class="muted">${som(m.price)}</small></button>`).join('') || '<p class="muted">Avval Menyu bo\'limida mahsulot qo\'shing.</p>'}</div>
    <p><button class="btn" data-close>Yopish</button></p>`;
  d.onclick = async e => {
    if (e.target.closest('[data-close]')) return d.close();
    const b = e.target.closest('[data-m]'); if (!b) return;
    const m = st.menu.find(x => x.id === +b.dataset.m), ex = st.orders.find(o => o.table_id === tid && o.name === m.name && o.price === m.price);
    ex ? await run(sb.from('order_items').update({ qty: ex.qty + 1 }).eq('id', ex.id))
       : await run(sb.from('order_items').insert({ table_id: tid, name: m.name, price: m.price, qty: 1 }));
    await loadAll(); toast(m.name + " qo'shildi");
  };
  d.showModal();
}

function receipt(c) {
  const its = c.items.map(i => `<div><span>${esc(i.name)} ×${i.qty}</span><span>${som(i.price * i.qty)}</span></div>`).join('') || '<div class="muted">Mahsulot yo\'q</div>';
  return `<div class="receipt"><div><b>Biliyard160</b><span>${new Date(c.ended_at).toLocaleString('uz-UZ')}</span></div>
    <div><span>${esc(c.table_name)}</span><span>${durStr(c.duration_sec)}</span></div><hr>
    <div><span>Vaqt uchun</span><span>${som(c.time_sum)}</span></div><hr>${its}<hr>
    <div class="tot"><span>To'lanadi</span><span>${som(c.total)}</span></div></div>`;
}
function openCheckout(tid) {
  const d = $('#dlg'), t = st.tables.find(x => x.id === tid), e = elapsed(t);
  const prev = { table_name: t.name, ended_at: new Date(), duration_sec: e, time_sum: timeMoney(e), total: timeMoney(e) + itemsSum(tid),
    items: st.orders.filter(o => o.table_id === tid) };
  d.innerHTML = `<h2>Tugatishni tasdiqlang</h2>${receipt(prev)}<div class="acts" style="margin-top:1rem"><button class="btn" data-close>Bekor qilish</button><button class="btn stop" data-ok>Tugatish va chek</button></div>`;
  d.onclick = async ev => {
    if (ev.target.closest('[data-close]')) return d.close();
    if (!ev.target.closest('[data-ok]')) return;
    const c = await run(sb.rpc('close_table', { p_table: tid }));
    d.innerHTML = `<h2>Chek</h2>${receipt(c)}<p><button class="btn primary" data-close>Yopish</button></p>`;
    loadAll();
  };
  d.showModal();
}

// ---------- Menu ----------
function renderMenu() {
  $('#menuList').innerHTML = st.menu.map(m => `<div class="list-row"><span><b>${esc(m.name)}</b> · ${som(m.price)}</span>
    <span><button class="btn sm" data-edit="${m.id}">Tahrirlash</button> <button class="btn sm" data-rm="${m.id}">O'chirish</button></span></div>`).join('') || '<p class="muted">Menyu bo\'sh.</p>';
}
$('#menuForm').onsubmit = async e => {
  e.preventDefault(); const f = new FormData(e.target);
  await run(sb.from('menu_items').insert({ name: f.get('name').trim(), price: +f.get('price') }));
  e.target.reset(); loadAll();
};
$('#menuList').onclick = async e => {
  const ed = e.target.closest('[data-edit]'), rm = e.target.closest('[data-rm]');
  if (rm && confirm("Menyudan o'chirilsinmi?")) { await run(sb.from('menu_items').delete().eq('id', +rm.dataset.rm)); loadAll(); }
  if (ed) {
    const m = st.menu.find(x => x.id === +ed.dataset.edit), name = prompt('Nomi', m.name); if (!name) return;
    const price = prompt("Narxi (so'm)", m.price); if (price === null || isNaN(+price)) return;
    await run(sb.from('menu_items').update({ name: name.trim(), price: +price }).eq('id', m.id)); loadAll();
  }
};
$('#rateForm').onsubmit = async e => {
  e.preventDefault(); await run(sb.from('settings').update({ hourly_rate: +$('#rateInp').value }).eq('id', 1)); toast('Tarif saqlandi'); loadAll();
};

// ---------- Stats ----------
async function loadStats() {
  const now = new Date(), m0 = new Date(now.getFullYear(), now.getMonth(), 1), d0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const rows = await run(sb.from('checks').select('*').gte('created_at', m0.toISOString()).order('created_at', { ascending: false }));
  const today = rows.filter(r => new Date(r.created_at) >= d0), sum = a => a.reduce((x, r) => x + r.total, 0);
  $('#kDay').textContent = som(sum(today)); $('#kMonth').textContent = som(sum(rows));
  $('#history').innerHTML = today.length ? `<table style="width:100%;border-collapse:collapse"><tr class="muted"><th align="left">Soat</th><th align="left">Stol</th><th align="left">Davomiyligi</th><th align="right">Jami</th></tr>${today.map(r =>
    `<tr style="border-top:1px solid var(--line)"><td>${new Date(r.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</td><td>${esc(r.table_name)}</td><td>${durStr(r.duration_sec)}</td><td align="right"><b>${som(r.total)}</b></td></tr>`).join('')}</table>` : '<p class="muted">Bugun hali chek yopilmagan.</p>';
}

// ---------- Nav ----------
document.querySelector('nav').onclick = e => {
  const b = e.target.closest('[data-view]'); if (!b) return;
  document.querySelectorAll('nav button').forEach(x => x.classList.toggle('on', x === b));
  ['tables', 'menu', 'stats'].forEach(v => $('#v-' + v).hidden = v !== b.dataset.view);
  if (b.dataset.view === 'stats') loadStats(); else loadAll();
};
boot();
