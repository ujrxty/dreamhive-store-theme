/* DreamHive motion — vanilla scroll/reveal system.
   No dependencies. Handles [data-reveal], [data-split], [data-parallax],
   [data-image-reveal], [data-magnetic], carousel nav, sticky-scroll story.
   Respects prefers-reduced-motion. */
(function () {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Reveal on scroll ----
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

  document.querySelectorAll('[data-reveal], [data-image-reveal]').forEach(el => io.observe(el));

  // ---- Split text ----
  document.querySelectorAll('[data-split]').forEach(el => {
    const mode = el.getAttribute('data-split') || 'words';
    const text = el.textContent.trim();
    el.textContent = '';
    if (mode === 'chars') {
      [...text].forEach((c, i) => {
        const s = document.createElement('span');
        s.className = 'split-char';
        s.textContent = c === ' ' ? ' ' : c;
        s.style.transitionDelay = (i * 25) + 'ms';
        el.appendChild(s);
      });
    } else {
      text.split(/\s+/).forEach((w, i) => {
        const s = document.createElement('span');
        s.className = 'split-word';
        s.textContent = w;
        s.style.transitionDelay = (i * 60) + 'ms';
        el.appendChild(s);
        if (i < text.split(/\s+/).length - 1) el.appendChild(document.createTextNode(' '));
      });
    }
    io.observe(el);
  });

  // ---- Parallax on scroll ----
  if (!prefersReduced) {
    const parallaxEls = document.querySelectorAll('[data-parallax]');
    if (parallaxEls.length) {
      let ticking = false;
      const update = () => {
        parallaxEls.forEach(el => {
          const speed = parseFloat(el.getAttribute('data-parallax')) || 0.2;
          const rect = el.getBoundingClientRect();
          const inView = rect.bottom > 0 && rect.top < window.innerHeight;
          if (inView) {
            const y = (rect.top - window.innerHeight / 2) * speed * -1;
            el.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
          }
        });
        ticking = false;
      };
      window.addEventListener('scroll', () => {
        if (!ticking) { requestAnimationFrame(update); ticking = true; }
      }, { passive: true });
      update();
    }
  }

  // ---- Magnetic buttons ----
  if (!prefersReduced && window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('[data-magnetic]').forEach(btn => {
      const strength = parseFloat(btn.getAttribute('data-magnetic')) || 0.3;
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) * strength;
        const y = (e.clientY - rect.top - rect.height / 2) * strength;
        btn.style.transform = `translate(${x}px, ${y}px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
  }

  // ---- Horizontal carousel nav ----
  document.querySelectorAll('[data-carousel]').forEach(root => {
    const track = root.querySelector('.carousel');
    const prev = root.querySelector('[data-carousel-prev]');
    const next = root.querySelector('[data-carousel-next]');
    if (!track) return;
    const scrollBy = () => track.clientWidth * 0.6;
    prev && prev.addEventListener('click', () => track.scrollBy({ left: -scrollBy(), behavior: 'smooth' }));
    next && next.addEventListener('click', () => track.scrollBy({ left: scrollBy(), behavior: 'smooth' }));
  });

  // ---- Sticky-scroll story: switches media as user scrolls text ----
  document.querySelectorAll('[data-sticky-scroll]').forEach(root => {
    const mediaImgs = root.querySelectorAll('[data-sticky-media] img');
    const steps = root.querySelectorAll('[data-sticky-step]');
    if (!mediaImgs.length || !steps.length) return;

    const stepIo = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const idx = parseInt(entry.target.getAttribute('data-sticky-step'), 10);
          mediaImgs.forEach((img, i) => img.classList.toggle('active', i === idx));
        }
      });
    }, { threshold: 0.55 });
    steps.forEach(s => stepIo.observe(s));
    if (mediaImgs[0]) mediaImgs[0].classList.add('active');
  });

  // ---- Header hide on scroll down, show on scroll up ----
  const header = document.querySelector('.site-header');
  if (header) {
    let lastY = window.scrollY;
    let hidden = false;
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y > 200 && y > lastY && !hidden) {
        header.style.transform = 'translateY(-100%)';
        header.style.transition = 'transform 300ms ease';
        hidden = true;
      } else if (y < lastY && hidden) {
        header.style.transform = '';
        hidden = false;
      }
      lastY = y;
    }, { passive: true });
  }
})();
