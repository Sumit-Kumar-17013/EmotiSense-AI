(() => {
  const $ = s => document.querySelector(s);
  const EMO = {
    joy: { c: '#facc15', e: '😄', n: 'Joy' }, sadness: { c: '#60a5fa', e: '😢', n: 'Sadness' },
    love: { c: '#f472b6', e: '❤️', n: 'Love' }, anger: { c: '#fb7185', e: '😠', n: 'Anger' },
    fear: { c: '#a78bfa', e: '😨', n: 'Fear' }, surprise: { c: '#22d3ee', e: '😲', n: 'Surprise' }
  };
  const SAMPLES = [
    'I am extremely happy today because I achieved my goals.',
    'I feel lonely and disappointed about everything.',
    'I am nervous about my upcoming examination.',
    'I am angry because things did not go as expected.'
  ];
  const API = ''; 'http://127.0.0.1:8000'
  const KEY = 'eca_history', MAX_HIST = 8;
  const text = $('#text'), btn = $('#analyzeBtn'), err = $('#error');
  let current = null;

  /* ---------- helpers ---------- */
  const store = {
    get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
    set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
  };
  const pct = p => (p * 100).toFixed(1);

  /* ---------- theme, menu, year ---------- */
  document.documentElement.dataset.theme = store.get('eca_theme', 'dark');
  $('#themeBtn').onclick = () => {
    const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = t; store.set('eca_theme', t);
  };
  $('#menuBtn').onclick = e => {
    const open = $('#links').classList.toggle('open');
    e.currentTarget.setAttribute('aria-expanded', open);
  };
  $('#links').addEventListener('click', () => { $('#links').classList.remove('open'); $('#menuBtn').setAttribute('aria-expanded', false); });
  $('#year').textContent = new Date().getFullYear();

  /* ---------- hero waveform ---------- */
  const wave = $('#wave');
  for (let i = 0; i < 36; i++) {
    const b = document.createElement('i');
    b.style.height = (30 + Math.abs(Math.sin(i / 3.2)) * 70) + '%';
    b.style.animationDelay = (i * 0.07) + 's';
    wave.appendChild(b);
  }

  /* ---------- scroll reveal + active nav ---------- */
  document.querySelectorAll('.reveal').forEach((el, i) => el.style.setProperty('--d', (i % 6) * 0.07 + 's'));
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  const links = [...document.querySelectorAll('.links a')];
  const so = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('main section').forEach(s => so.observe(s));

  /* ---------- backend status ---------- */
  async function checkHealth() {
    const s = $('#status'), t = $('#statusText');
    try {
      const r = await fetch(API + '/health');
      const d = await r.json();
      if (r.ok && d.model_loaded) { s.className = 'status ok'; t.textContent = 'Model online'; }
      else { s.className = 'status bad'; t.textContent = 'Model not loaded'; }
    } catch { s.className = 'status bad'; t.textContent = 'Backend offline'; }
  }
  checkHealth(); setInterval(checkHealth, 20000);

  /* ---------- input ---------- */
  function updateCounts() {
    const v = text.value;
    $('#chars').textContent = v.length;
    $('#words').textContent = v.trim() ? v.trim().split(/\s+/).length : 0;
    btn.disabled = !v.trim();
  }
  text.addEventListener('input', updateCounts);
  text.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') analyze(); });
  $('#clearBtn').onclick = () => { text.value = ''; updateCounts(); err.hidden = true; text.focus(); };
  $('#randomBtn').onclick = () => { text.value = SAMPLES[Math.floor(Math.random() * SAMPLES.length)]; updateCounts(); text.focus(); };
  SAMPLES.forEach(s => {
    const b = document.createElement('button');
    b.textContent = s; b.onclick = () => { text.value = s; updateCounts(); text.focus(); };
    $('#samples').appendChild(b);
  });

  /* ---------- analyze ---------- */
  function showError(msg) { err.textContent = msg; err.hidden = false; }
  async function analyze() {
    const value = text.value.trim();
    if (!value || btn.classList.contains('loading')) return;
    err.hidden = true; btn.classList.add('loading'); btn.disabled = true; $('#btnLabel').textContent = 'Analyzing…';
    try {
      const r = await fetch(API + '/predict', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: value }) });
      if (!r.ok) throw new Error(r.status === 422 ? 'Please enter between 1 and 2,000 characters.' : 'The server could not process this request (status ' + r.status + ').');
      const data = await r.json();
      render(data); saveHistory(data);
    } catch (e) {
      showError(e instanceof TypeError ? 'Cannot reach the backend. Make sure the FastAPI server is running, then try again.' : e.message);
    } finally {
      btn.classList.remove('loading'); $('#btnLabel').textContent = 'Analyze Emotion'; updateCounts();
    }
  }
  btn.onclick = analyze;

  /* ---------- render result ---------- */
  function render(d) {
    current = d;
    const m = EMO[d.predicted_emotion] || { c: '#8b5cf6', e: '🤖', n: d.predicted_emotion };
    $('#result').style.setProperty('--e', m.c);
    $('#empty').hidden = true;
    const out = $('#out'); out.hidden = false;
    out.style.animation = 'none'; void out.offsetWidth; out.style.animation = '';
    $('#emoji').textContent = m.e; $('#emotion').textContent = m.n;
    $('#quote').textContent = '“' + d.text + '”';
    const ring = $('#ringFill'); ring.style.strokeDashoffset = 327;
    const target = d.confidence * 100, pctEl = $('#pct');
    requestAnimationFrame(() => { ring.style.strokeDashoffset = 327 * (1 - d.confidence); });
    const t0 = performance.now();
    (function tick(t) {
      const k = Math.min(1, (t - t0) / 1000);
      pctEl.textContent = (target * (1 - Math.pow(1 - k, 3))).toFixed(1);
      if (k < 1) requestAnimationFrame(tick);
    })(t0);
    const bars = $('#bars'); bars.innerHTML = '';
    Object.entries(d.all_probabilites).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
      const c = (EMO[k] || {}).c || '#8b5cf6';
      const row = document.createElement('div'); row.className = 'bar'; row.style.setProperty('--c', c);
      row.innerHTML = '<span></span><div class="t"><div class="f"></div></div><span></span>';
      row.children[0].textContent = k; row.children[2].textContent = pct(v) + '%';
      bars.appendChild(row);
      requestAnimationFrame(() => requestAnimationFrame(() => { row.querySelector('.f').style.width = pct(v) + '%'; }));
    });
    if (window.innerWidth < 900) $('#result').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /* ---------- history ---------- */
  function renderHistory() {
    const h = store.get(KEY, []), ul = $('#histList'); ul.innerHTML = '';
    $('#histEmpty').hidden = h.length > 0; $('#clearHist').hidden = !h.length;
    h.forEach(d => {
      const m = EMO[d.predicted_emotion] || { e: '🤖', n: d.predicted_emotion };
      const li = document.createElement('li'), b = document.createElement('button');
      b.innerHTML = '<span>' + m.e + '</span><span class="tx"></span><em></em>';
      b.children[1].textContent = d.text; b.children[2].textContent = m.n + ' · ' + pct(d.confidence) + '%';
      b.onclick = () => { text.value = d.text; updateCounts(); render(d); };
      li.appendChild(b); ul.appendChild(li);
    });
  }
  function saveHistory(d) {
    store.set(KEY, [d, ...store.get(KEY, []).filter(x => x.text !== d.text)].slice(0, MAX_HIST)); renderHistory();
  }
  $('#clearHist').onclick = () => { store.set(KEY, []); renderHistory(); };

  /* ---------- copy / download ---------- */
  function report() {
    const lines = Object.entries(current.all_probabilites).sort((a, b) => b[1] - a[1]).map(([k, v]) => '  ' + k + ': ' + pct(v) + '%');
    return 'AI Emotion Analysis Report\n' + new Date().toLocaleString() + '\n\nText: ' + current.text +
      '\nPredicted emotion: ' + current.predicted_emotion + '\nConfidence: ' + pct(current.confidence) + '%\n\nAll probabilities:\n' + lines.join('\n') + '\n';
  }
  $('#copyBtn').onclick = async e => {
    if (!current) return;
    const b = e.currentTarget;
    try { await navigator.clipboard.writeText(report()); b.textContent = 'Copied'; } catch { b.textContent = 'Copy failed'; }
    setTimeout(() => b.textContent = 'Copy result', 1600);
  };
  $('#dlBtn').onclick = () => {
    if (!current) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([report()], { type: 'text/plain' }));
    a.download = 'emotion-report.txt'; a.click(); URL.revokeObjectURL(a.href);
  };

  updateCounts(); renderHistory();
})();
