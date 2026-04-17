// ── Mobile menu ────────────────────────────────────────────
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
hamburger?.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  mobileMenu.classList.toggle('open');
});
mobileMenu?.querySelectorAll('a').forEach(l => l.addEventListener('click', () => {
  hamburger.classList.remove('open');
  mobileMenu.classList.remove('open');
}));

// ── Nav scroll shadow ──────────────────────────────────────
const mainNav = document.getElementById('mainNav');
window.addEventListener('scroll', () => {
  mainNav?.classList.toggle('scrolled', window.scrollY > 8);
}, { passive: true });

// ── Active nav link ────────────────────────────────────────
const navLinks = document.querySelectorAll('.nav-links .nav-link');
document.querySelectorAll('section[id]').forEach(sec => {
  new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting)
        navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === `#${e.target.id}`));
    });
  }, { threshold: 0.35 }).observe(sec);
});

// ── Scroll reveal ──────────────────────────────────────────
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

// ── Step ring animations ───────────────────────────────────
// Set staggered transition-delay on each ring fill before observing
document.querySelectorAll('.step-circle').forEach((circle, i) => {
  const fill = circle.querySelector('.step-ring-fill');
  if (fill) fill.style.transitionDelay = `${i * 0.28}s`;
});

const circleObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('animated');
      circleObs.unobserve(e.target);
    }
  });
}, { threshold: 0.25, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.step-circle').forEach(el => circleObs.observe(el));

// ── Connector line ─────────────────────────────────────────
const lineFill = document.querySelector('.steps-line-fill');
if (lineFill) {
  new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) lineFill.classList.add('animated'); });
  }, { threshold: 0.2 }).observe(lineFill.parentElement);
}

// ── Feature Carousel (true infinite loop) ──────────────────
(function () {
  const track    = document.getElementById('fcTrack');
  const carousel = document.getElementById('fcCarousel');
  const prevBtn  = document.getElementById('fcPrev');
  const nextBtn  = document.getElementById('fcNext');
  const dotsWrap = document.getElementById('fcDots');
  if (!track || !carousel) return;

  const origCards = Array.from(track.children);
  const total     = origCards.length;
  let current     = 0;
  let cloneCount  = 0;
  let isJumping   = false;
  let autoTimer   = null;

  function vc() {
    const w = carousel.offsetWidth;
    if (w >= 860) return 3;
    if (w >= 520) return 2;
    return 1;
  }

  function cardW() {
    return track.children.length ? track.children[0].offsetWidth + 20 : 0;
  }

  function buildClones() {
    track.querySelectorAll('.fc-clone').forEach(c => c.remove());
    const n = vc();
    cloneCount = n;
    origCards.slice(-n).reverse().forEach(c => {
      const cl = c.cloneNode(true); cl.classList.add('fc-clone'); track.prepend(cl);
    });
    origCards.slice(0, n).forEach(c => {
      const cl = c.cloneNode(true); cl.classList.add('fc-clone'); track.append(cl);
    });
  }

  function setTransition(on) {
    track.style.transition = on ? 'transform .5s cubic-bezier(.4,0,.2,1)' : 'none';
  }

  function moveTo(index, animate) {
    setTransition(animate);
    current = index;
    track.style.transform = `translateX(-${current * cardW()}px)`;
    updateDots();
  }

  function realIndex() {
    return ((current - cloneCount) % total + total) % total;
  }

  function updateDots() {
    const ri = realIndex();
    dotsWrap.querySelectorAll('.fc-dot').forEach((d, i) => d.classList.toggle('active', i === ri));
  }

  function buildDots() {
    dotsWrap.innerHTML = '';
    for (let i = 0; i < total; i++) {
      const d = document.createElement('button');
      d.className = 'fc-dot';
      d.setAttribute('aria-label', `Card ${i + 1}`);
      d.addEventListener('click', () => { moveTo(cloneCount + i, true); resetAuto(); });
      dotsWrap.appendChild(d);
    }
  }

  function next() { moveTo(current + 1, true); }
  function prev() { moveTo(current - 1, true); }

  track.addEventListener('transitionend', () => {
    if (isJumping) return;
    const max = cloneCount + total - 1;
    if (current < cloneCount) {
      isJumping = true;
      moveTo(cloneCount + total - (cloneCount - current), false);
      requestAnimationFrame(() => requestAnimationFrame(() => { isJumping = false; }));
    } else if (current > max) {
      isJumping = true;
      moveTo(cloneCount + (current - max - 1), false);
      requestAnimationFrame(() => requestAnimationFrame(() => { isJumping = false; }));
    }
  });

  prevBtn?.addEventListener('click', () => { prev(); resetAuto(); });
  nextBtn?.addEventListener('click', () => { next(); resetAuto(); });

  function startAuto() { autoTimer = setInterval(next, 2800); }
  function stopAuto()  { clearInterval(autoTimer); }
  function resetAuto() { stopAuto(); startAuto(); }

  carousel.addEventListener('mouseenter', stopAuto);
  carousel.addEventListener('mouseleave', startAuto);

  let touchX = 0;
  carousel.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
  carousel.addEventListener('touchend', e => {
    const d = touchX - e.changedTouches[0].clientX;
    if (Math.abs(d) > 48) { d > 0 ? next() : prev(); resetAuto(); }
  });

  function init() {
    buildClones();
    buildDots();
    setTransition(false);
    current = cloneCount;
    track.style.transform = `translateX(-${current * cardW()}px)`;
    updateDots();
    requestAnimationFrame(() => requestAnimationFrame(() => setTransition(true)));
  }

  init();
  startAuto();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { stopAuto(); init(); startAuto(); }, 160);
  });
})();

// ── Circular icon spin-in ──────────────────────────────────
const iconObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in-view'); iconObs.unobserve(e.target); }
  });
}, { threshold: 0.3 });
document.querySelectorAll('.feature-card').forEach((card, i) => {
  const icon = card.querySelector('.fc-icon-circle');
  if (icon) icon.style.animationDelay = `${i * 0.07}s`;
  iconObs.observe(card);
});
