document.documentElement.classList.add('js');
const toggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('#main-nav');
function closeMenu() {
  nav?.classList.remove('is-open');
  toggle?.setAttribute('aria-expanded', 'false');
  toggle?.setAttribute('aria-label', 'Ouvrir le menu');
}
toggle?.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') !== 'true';
  nav.classList.toggle('is-open', open);
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
});
nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && toggle?.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    toggle.focus();
  }
});
document.addEventListener('click', event => {
  if (!event.target.closest('.site-header')) closeMenu();
});
matchMedia('(min-width: 761px)').addEventListener('change', event => {
  if (event.matches) closeMenu();
});
const demoTabs = [...document.querySelectorAll('.demo-tab')];
const descriptions = {
  trip: 'Note Week-end à Lisbonne, avec compte à rebours et liste de valise',
  groceries: 'Liste de courses avec prix, quantités et total automatique dans Bloknot',
  habits: 'Suivi des habitudes de lecture et de course à pied dans Bloknot',
  voice: 'Note vocale et sa transcription dans Bloknot'
};
let demoRequest = 0;
function activateTab(tab, focus = false) {
  const scene = tab.dataset.scene;
  demoTabs.forEach(item => {
    const selected = item === tab;
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
    document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
  });
  const screen = document.getElementById('demo-screen');
  const request = ++demoRequest;
  const source = `assets/screenshots/${scene}.webp`;
  screen.alt = `Aperçu illustré : ${descriptions[scene]}`;
  if (!screen.src.endsWith(`${scene}.webp`)) {
    screen.src = source;
    screen.decode().then(() => {
      if (request !== demoRequest || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      screen.getAnimations().forEach(animation => animation.cancel());
      screen.animate([{opacity:0.3, transform:'translateY(7px)'},{opacity:1, transform:'translateY(0)'}], {duration:300, easing:'ease-out'});
    }).catch(() => {});
  }
  if (focus) tab.focus();
}
if (demoTabs.length) activateTab(demoTabs[0]);
demoTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activateTab(tab));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % demoTabs.length;
    if (event.key === 'ArrowLeft') next = (index - 1 + demoTabs.length) % demoTabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = demoTabs.length - 1;
    if (next !== undefined) {
      event.preventDefault();
      activateTab(demoTabs[next], true);
    }
  });
});
const filters = [...document.querySelectorAll('[data-filter]')];
const cards = [...document.querySelectorAll('.feature-card')];
filters.forEach(button => button.addEventListener('click', () => {
  filters.forEach(filter => filter.setAttribute('aria-pressed', String(filter === button)));
  let count = 0;
  cards.forEach(card => {
    card.hidden = button.dataset.filter !== 'all' && card.dataset.category !== button.dataset.filter;
    if (!card.hidden) count++;
  });
  document.querySelector('.feature-count').textContent = `${count} blocs à découvrir`;
}));
// With scripting disabled, the full catalogue and all four example descriptions remain available.

// Gentle motion: the page remains readable if JavaScript or motion is disabled.
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const revealTargets = [...document.querySelectorAll('.section-heading, .intro-card, .demo-copy, .demo-visual, .feature-card, .organize-copy, .organize-art, .privacy-heading, .privacy-item, .faq-intro, .faq-list details, .download-card')];
let revealObserver;
function configureMotion() {
  revealObserver?.disconnect();
  revealTargets.forEach(element => element.classList.remove('reveal-pending'));
  if (motionPreference.matches || !('IntersectionObserver' in window)) return;
  revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.remove('reveal-pending');
      entry.target.classList.add('reveal-visible');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.06, rootMargin: '0px 0px -25px 0px' });
  revealTargets.forEach(element => {
    if (element.getBoundingClientRect().top < innerHeight - 25) return;
    element.classList.add('reveal-pending');
    revealObserver.observe(element);
  });
}
configureMotion();
motionPreference.addEventListener('change', configureMotion);
document.addEventListener('focusin', event => {
  event.target.closest('.reveal-pending')?.classList.remove('reveal-pending');
});
let scrollFramePending = false;
function updateScrollProgress() {
  const range = document.documentElement.scrollHeight - innerHeight;
  const progress = range > 0 ? Math.min(1, Math.max(0, scrollY / range)) : 0;
  document.querySelector('.site-header')?.style.setProperty('--scroll-progress', progress);
  scrollFramePending = false;
}
window.addEventListener('scroll', () => {
  if (!scrollFramePending) {
    scrollFramePending = true;
    requestAnimationFrame(updateScrollProgress);
  }
}, { passive: true });
window.addEventListener('resize', updateScrollProgress);
updateScrollProgress();
// The scroll marker tracks filters and accordions when the page length changes.
if ('ResizeObserver' in window) new ResizeObserver(updateScrollProgress).observe(document.body);
