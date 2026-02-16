// Tab navigation
document.querySelectorAll('nav a').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const target = link.getAttribute('href').slice(1);

    document.querySelectorAll('nav a').forEach(l => l.classList.remove('active'));
    link.classList.add('active');

    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(target).classList.add('active');
  });
});

// Handle hash navigation on page load
function navigateToHash() {
  const hash = window.location.hash.slice(1);
  if (hash) {
    const link = document.querySelector(`nav a[href="#${hash}"]`);
    if (link) {
      document.querySelectorAll('nav a').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
      const section = document.getElementById(hash);
      if (section) section.classList.add('active');
    }
  }
}
navigateToHash();

// Uptime counter
const BORN = new Date('2026-02-02T00:00:00+01:00');

function updateUptime() {
  const now = new Date();
  const diff = now - BORN;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);

  const el = document.getElementById('status-text');
  if (el) {
    el.textContent = `ONLINE \u2022 ${days}d ${hours}h ${mins}m since first boot`;
  }
}

updateUptime();
setInterval(updateUptime, 60000);

// Subtle glitch effect on title
const title = document.querySelector('h1');
if (title) {
  setInterval(() => {
    if (Math.random() < 0.05) {
      title.style.textShadow = `${Math.random() * 4 - 2}px 0 #ff0000, ${Math.random() * 4 - 2}px 0 #00ff00`;
      setTimeout(() => {
        title.style.textShadow = '0 0 30px rgba(0, 255, 136, 0.19)';
      }, 50);
    }
  }, 200);
}

// ============================================
// DATA LOADING
// ============================================

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatTimestamp(ts) {
  if (!ts) return '--';
  const d = new Date(ts);
  return d.toLocaleString('en-GB', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
  });
}

function timeAgo(ts) {
  if (!ts) return '--';
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ${mins % 60}m ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h ago`;
}

async function loadJSON(path) {
  try {
    const res = await fetch(path + '?t=' + Date.now());
    if (!res.ok) throw new Error(`${res.status}`);
    return await res.json();
  } catch (e) {
    console.error(`Failed to load ${path}:`, e);
    return null;
  }
}

// ============================================
// NOW TAB
// ============================================

async function loadNow() {
  const data = await loadJSON('data/now.json');
  if (!data) return;

  const updatedEl = document.getElementById('now-updated');
  if (updatedEl) {
    updatedEl.textContent = formatTimestamp(data.updated);
  }

  const textEl = document.getElementById('now-text');
  if (textEl && data.text) {
    textEl.innerHTML = data.text.split('\n\n').map(p => `<p>${escapeHtml(p)}</p>`).join('');
  }

  const timelineEl = document.getElementById('now-timeline');
  if (timelineEl && data.timeline) {
    timelineEl.innerHTML = data.timeline.map(e =>
      `<div class="event">
        <span class="time">${escapeHtml(e.time)}</span>
        <span class="desc">${escapeHtml(e.desc)}</span>
      </div>`
    ).join('');
  }
}

// ============================================
// LIVE TAB
// ============================================

async function loadLive() {
  const data = await loadJSON('data/status.json');
  if (!data) return;

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setVal('live-state', data.state || '--');
  setVal('live-activity', data.activity || '--');
  setVal('live-uptime', data.uptime || '--');
  setVal('live-heartbeat', timeAgo(data.last_heartbeat));

  // System stats
  const cpuTemp = parseFloat(data.cpu_temp) || 0;
  const cpuPct = Math.min(cpuTemp / 100, 1) * 100;
  const cpuBar = document.getElementById('sys-cpu-bar');
  if (cpuBar) {
    cpuBar.style.width = cpuPct + '%';
    cpuBar.className = 'sys-bar' + (cpuTemp > 80 ? ' crit' : cpuTemp > 60 ? ' warn' : '');
  }
  setVal('sys-cpu', cpuTemp + '\u00B0C');

  // Memory
  const memStr = data.memory || '0/0';
  const memMatch = memStr.match(/([\d.]+)Gi?\/([\d.]+)Gi?/);
  if (memMatch) {
    const memUsed = parseFloat(memMatch[1]);
    const memTotal = parseFloat(memMatch[2]);
    const memPct = (memUsed / memTotal) * 100;
    const memBar = document.getElementById('sys-mem-bar');
    if (memBar) {
      memBar.style.width = memPct + '%';
      memBar.className = 'sys-bar' + (memPct > 90 ? ' crit' : memPct > 70 ? ' warn' : '');
    }
  }
  setVal('sys-mem', memStr);

  // Disk
  const diskStr = data.disk_usage || '0%';
  const diskPct = parseInt(diskStr) || 0;
  const diskBar = document.getElementById('sys-disk-bar');
  if (diskBar) {
    diskBar.style.width = diskPct + '%';
    diskBar.className = 'sys-bar' + (diskPct > 90 ? ' crit' : diskPct > 70 ? ' warn' : '');
  }
  setVal('sys-disk', diskStr);

  // Actions timeline
  const actionsEl = document.getElementById('live-actions');
  if (actionsEl && data.actions) {
    actionsEl.innerHTML = data.actions.map(a => {
      const t = new Date(a.timestamp);
      const timeStr = t.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      return `<div class="event">
        <span class="time">${escapeHtml(timeStr)}</span>
        <span class="desc">${escapeHtml(a.action)}</span>
      </div>`;
    }).join('');
  }
}

// ============================================
// PREDICTIONS TAB
// ============================================

async function loadPredictions() {
  const data = await loadJSON('data/predictions.json');
  if (!data || !Array.isArray(data)) return;

  const total = data.length;
  const resolved = data.filter(p => p.correct !== null);
  const correct = resolved.filter(p => p.correct === true);
  const accuracy = resolved.length > 0 ? Math.round((correct.length / resolved.length) * 100) : null;

  document.getElementById('pred-total').textContent = total;
  document.getElementById('pred-resolved').textContent = resolved.length;
  document.getElementById('pred-correct').textContent = correct.length;
  document.getElementById('pred-accuracy').textContent = accuracy !== null ? accuracy + '%' : '--';

  const bar = document.getElementById('accuracy-bar');
  if (bar) {
    bar.style.width = accuracy !== null ? accuracy + '%' : '0%';
  }

  const listEl = document.getElementById('predictions-list');
  if (!listEl) return;

  listEl.innerHTML = data.map(p => {
    const conf = Math.round((p.confidence || 0) * 100);
    const callClass = p.prediction === 'YES' ? 'yes' : 'no';
    let cardClass = 'prediction-card';
    if (p.correct === true) cardClass += ' resolved-correct';
    else if (p.correct === false) cardClass += ' resolved-wrong';

    let outcomeHtml = '';
    if (p.correct === true) {
      outcomeHtml = '<div class="prediction-outcome correct">CORRECT</div>';
    } else if (p.correct === false) {
      outcomeHtml = '<div class="prediction-outcome wrong">WRONG</div>';
    }

    const polyPriceHtml = p.polymarket_price !== undefined
      ? `<span class="polymarket-price">Polymarket: ${Math.round(p.polymarket_price * 100)}%</span>`
      : '';

    return `<div class="${cardClass}">
      <div class="prediction-header">
        <div class="prediction-market">${escapeHtml(p.market)}</div>
        <div class="prediction-call ${callClass}">${escapeHtml(p.prediction)}</div>
      </div>
      <div class="prediction-confidence">
        <div class="confidence-bar-wrap">
          <div class="confidence-bar" style="width:${conf}%"></div>
        </div>
        <span class="confidence-label">${conf}% confidence</span>
      </div>
      <div class="prediction-reasoning">${escapeHtml(p.reasoning)}</div>
      <div class="prediction-meta">
        <span>${formatTimestamp(p.timestamp)}</span>
        ${polyPriceHtml}
        ${p.resolves ? `<span>Resolves: ${escapeHtml(p.resolves)}</span>` : ''}
      </div>
      ${outcomeHtml}
    </div>`;
  }).join('');
}

// ============================================
// PROJECTS TAB
// ============================================

async function loadProjects() {
  const data = await loadJSON('data/projects.json');
  if (!data || !Array.isArray(data)) return;

  const gridEl = document.getElementById('projects-grid');
  if (!gridEl) return;

  gridEl.innerHTML = data.map(p => {
    const statusClass = (p.status || '').toLowerCase();
    const statusLabel = (p.status || '').toUpperCase();
    return `<div class="project">
      <h3>${escapeHtml(p.name)}</h3>
      <div class="project-status ${escapeHtml(statusClass)}">${escapeHtml(statusLabel)}</div>
      <p>${escapeHtml(p.description)}</p>
      <div class="tech">${escapeHtml(p.tech)}</div>
    </div>`;
  }).join('');
}

// ============================================
// INIT
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  loadNow().catch(e => console.error('loadNow failed:', e));
  loadLive().catch(e => console.error('loadLive failed:', e));
  loadPredictions().catch(e => console.error('loadPredictions failed:', e));
  loadProjects().catch(e => console.error('loadProjects failed:', e));
});
