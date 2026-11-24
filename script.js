const $ = s => document.querySelector(s);
const list = str => (str || '').split(',').map(s => s.trim()).filter(Boolean);
function h(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v;
    else if (k === 'text') e.textContent = v;
    else e.setAttribute(k, v);
  }
  kids.flat().forEach(k => e.append(k));
  return e;
}
const safeUrl = u => /^(https?:|mailto:|tel:|#|images\/|[\w.-]+\.(jpg|jpeg|png|webp|svg))/i.test(u || '') ? u : '#';

async function load() {
  try {
    const r = await fetch('data.json?v=' + Date.now());
    if (!r.ok) throw new Error(r.status);
    render(await r.json());
  } catch (e) {
    document.body.insertAdjacentHTML('afterbegin',
      '<p style="padding:20px;background:#fee;color:#900">data.json load hoy nai. Local e kaj korle Live Server ba "python -m http.server" diye run koro.</p>');
  }
}

function render(d) {
  const p = d.profile, c = d.contact;
  document.title = `${p.name} | ${p.role.split('·')[0].trim()}`;
  $('#logo').textContent = p.shortName + '.';
  $('#status').style.display = p.available ? '' : 'none';
  $('#statusText').textContent = p.availableText;
  $('#heroSub').textContent = p.heroSub;
  $('#photo').src = p.photo; $('#photo').alt = p.name;
  $('#location').textContent = p.location;
  $('#aboutTitle').textContent = p.aboutTitle;
  $('#aboutText').textContent = p.about;
  $('#eduDegree').textContent = p.educationDegree;
  $('#eduNote').textContent = p.educationNote;

  // hero headline: word-by-word rise
  const hero = $('#heroTitle'); hero.textContent = ''; hero.setAttribute('aria-label', p.heroTitle);
  p.heroTitle.split(' ').forEach((w, i) => {
    const s = h('span', { text: w }); s.style.setProperty('--i', i);
    hero.append(h('span', { class: 'w', 'aria-hidden': 'true' }, s));
  });
  typeRoles(list(p.role.replace(/·/g, ',')));

  // skills
  const grid = $('#skillGrid'); grid.textContent = '';
  d.expertise.forEach((x, i) => {
    const el = h('div', { class: 'skill reveal' }, h('h3', { text: x.title }), h('p', { text: x.items }));
    el.style.setProperty('--d', i); grid.append(el);
  });
  const soft = $('#soft'); soft.textContent = '';
  list(d.softSkills).forEach(s => soft.append(h('span', { class: 'chip reveal', text: s })));


  // projects
  const pg = $('#projectGrid'); pg.textContent = '';
  d.projects.forEach((pr, i) => {
    const thumb = h('div', { class: 'thumb' });
    if (pr.image) thumb.append(h('img', { src: pr.image, alt: pr.title, loading: 'lazy' }));
    else thumb.textContent = pr.title.slice(0, 2).toUpperCase();
    const tags = h('div', { class: 'tags' }, list(pr.tags).map(t => h('span', { text: t })));
    const card = h('a', { class: 'card reveal', href: safeUrl(pr.url), target: '_blank', rel: 'noopener' },
      thumb,
      h('div', { class: 'card-body' },
        h('small', { text: pr.category }), h('h3', { text: pr.title }), h('p', { text: pr.description }), tags,
        h('span', { class: 'visit' }, 'Visit live site ', h('i', { text: '↗' }))));
    card.style.setProperty('--d', i); pg.append(card);
  });

  // contact
  $('#mail').textContent = c.email; $('#mail').href = 'mailto:' + c.email;
  const links = $('#links'); links.textContent = '';
  [['Call', 'tel:' + c.phone.replace(/\s/g, ''), c.phone], ['Facebook', c.facebook], ['LinkedIn', c.linkedin], ['GitHub', c.github]]
    .forEach(([label, url, shown]) => url && url !== 'tel:' && links.append(h('a', { href: safeUrl(url), target: '_blank', rel: 'noopener', text: shown || label })));
  $('#footer').textContent = `© ${new Date().getFullYear()} ${p.name}`;

  initMotion();
}

/* typing animation */
let typeTimer;
function typeRoles(roles) {
  clearTimeout(typeTimer);
  const out = $('#typed'); let i = 0, j = 0, del = false;
  if (matchMedia('(prefers-reduced-motion:reduce)').matches) { out.textContent = roles.join(' · '); return; }
  (function tick() {
    const word = roles[i];
    out.textContent = word.slice(0, j);
    if (!del && j === word.length) { del = true; typeTimer = setTimeout(tick, 1600); return; }
    if (del && j === 0) { del = false; i = (i + 1) % roles.length; }
    j += del ? -1 : 1;
    typeTimer = setTimeout(tick, del ? 35 : 70);
  })();
}

/* scroll reveal, progress bar, active nav, card tilt */
let io;
function initMotion() {
  io && io.disconnect();
  io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .15 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      card.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => card.style.transform = '');
  });
}
addEventListener('scroll', () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  $('#progress').style.width = (scrollY / max * 100) + '%';
  $('#nav').classList.toggle('scrolled', scrollY > 10);
  let cur = '';
  document.querySelectorAll('main section[id]').forEach(s => { if (scrollY >= s.offsetTop - 140) cur = s.id; });
  document.querySelectorAll('.nav nav a:not(.pill)').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + cur));
}, { passive: true });

load();
