const appOrigin = ['8000', '5173', ''].includes(location.port) ? '' : `${location.protocol}//${location.hostname}:5173`;
document.querySelectorAll('[data-app]').forEach(link => { link.href = appOrigin + link.dataset.app; });
const observer = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) { entry.target.classList.remove('reveal-pending'); observer.unobserve(entry.target); }
}), { threshold: 0.08 });
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.querySelectorAll('[data-reveal]').forEach(el => { el.classList.add('reveal-pending'); observer.observe(el); });
}
for (const [selector, count] of [['.waveform', 66], ['.mini-wave', 24]]) {
  const parent = document.querySelector(selector);
  for (let i = 0; i < count; i++) { const bar = document.createElement('i'); bar.style.height = `${4 + Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.3)) * 16}px`; bar.style.setProperty('--delay', `${i * 0.025}s`); parent.append(bar); }
}
let elapsed = 0, timer;
const play = document.getElementById('preview-play');
play.addEventListener('click', () => {
  const active = !timer;
  document.querySelector('.profile-preview').classList.toggle('playing', active);
  play.setAttribute('aria-label', active ? 'Pause introduction preview' : 'Play interactive introduction preview');
  play.innerHTML = active ? '<span aria-hidden="true">Ⅱ</span>' : '<span aria-hidden="true">▶</span>';
  if (timer) { clearInterval(timer); timer = undefined; return; }
  const captions = ['“Good work starts with a real introduction.”', '“I’m Alex. I design useful things for people.”', '“Here’s how I think, build, and collaborate.”'];
  timer = setInterval(() => {
    elapsed = (elapsed + 1) % 13;
    document.getElementById('preview-time').textContent = `0:${String(elapsed).padStart(2, '0')} / 0:12`;
    document.getElementById('preview-caption').textContent = captions[Math.min(2, Math.floor(elapsed / 4))];
    if (elapsed === 12) play.click();
  }, 1000);
});
const previews = { design: ['Senior Product Designer', 'Forma Studio · Hybrid'], engineering: ['Frontend Engineer', 'Northstar Labs · Remote'], product: ['Product Manager', 'Goodwork Co. · Hybrid'] };
document.querySelectorAll('[data-category]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-category]').forEach(b => { b.classList.toggle('selected', b === button); b.setAttribute('aria-pressed', String(b === button)); });
  const [title, company] = previews[button.dataset.category];
  document.getElementById('demo-job-title').textContent = title;
  document.getElementById('demo-job-company').textContent = company;
  document.querySelector('.mini-job').href = `${appOrigin}/jobs?domainId=${button.dataset.category}`;
}));
