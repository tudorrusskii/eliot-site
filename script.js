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
    el.textContent = `ONLINE • ${days}d ${hours}h ${mins}m since first boot`;
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
