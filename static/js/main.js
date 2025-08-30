// Reveal on scroll
(function(){
  const els = document.querySelectorAll('.reveal');
  // assign stagger index per container
  const containers = document.querySelectorAll('section, .container, .row');
  containers.forEach(c => {
    const items = Array.from(c.querySelectorAll('.reveal'));
    items.forEach((el, i) => el.style.setProperty('--stagger', i));
  });
  if(!('IntersectionObserver' in window)){
    els.forEach(e=>e.classList.add('show'));
    return;
  }
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(en=>{
      if(en.isIntersecting){
        en.target.classList.add('show');
        io.unobserve(en.target);
      }
    });
  },{threshold:0.15});
  els.forEach(e=>io.observe(e));
})();

// Set hero background from data attribute
(function(){
  const h = document.querySelector('.js-hero');
  if(h && h.dataset.bg){
    h.style.backgroundImage = `url(${h.dataset.bg})`;
  }
  const reactive = document.querySelector('.hero-reactive-bg');
  if(reactive && reactive.dataset.reactiveBg){
    reactive.style.setProperty('--hero-bg', `url('${reactive.dataset.reactiveBg}')`);
  }
})();

// Newsletter footer form: redirect to contact with prefilled email and auto-fill on contact page
(function(){
  const form = document.getElementById('newsletterForm');
  if(form){
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const email = (form.querySelector('input[name="email"]').value || '').trim();
      if(!email) return;
      const url = new URL(window.location.origin + '/contact/');
      url.searchParams.set('email', email);
      window.location.href = url.toString();
    });
  }
  // If on contact page and ?email= is present, prefill the email field
  const params = new URLSearchParams(window.location.search);
  const preset = params.get('email');
  if(preset){
    const emailInput = document.querySelector('form input[name="email"], form input#id_email');
    if(emailInput && !emailInput.value){ emailInput.value = preset; }
  }
})();

// Hide logo marquee if no visible logos
(function(){
  const marquee = document.querySelector('.logo-marquee');
  if(!marquee) return;
  const imgs = marquee.querySelectorAll('.logo-track img');
  const evaluate = ()=>{
    const anyVisible = Array.from(imgs).some(img=> img.offsetParent !== null);
    if(!anyVisible){ marquee.style.display = 'none'; }
  };
  window.addEventListener('load', ()=> setTimeout(evaluate, 100));
})();

// Dark mode toggle with persistence + system preference + meta theme-color sync + dropdown options
(function(){
  const key = 'theme-preference';
  const root = document.documentElement;
  const btn = document.getElementById('themeToggle');
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  const sys = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
  const optLight = document.getElementById('themeLight');
  const optDark = document.getElementById('themeDark');
  const optSystem = document.getElementById('themeSystem');
  let sysHandler = null;

  const setMeta = (val)=>{
    if(!metaTheme) return;
    metaTheme.setAttribute('content', val === 'dark' ? '#0f131a' : '#0d6efd');
  };

  const updateThemeImages = (isDark)=>{
    document.querySelectorAll('img[data-theme-src-light][data-theme-src-dark]').forEach(img=>{
      const next = isDark ? img.getAttribute('data-theme-src-dark') : img.getAttribute('data-theme-src-light');
      if(next && img.getAttribute('src') !== next){ img.setAttribute('src', next); }
    });
  };

  const apply = (val)=>{
    const isDark = (val === 'dark');
    // smooth transition
    root.classList.add('theme-transition');
    window.setTimeout(()=> root.classList.remove('theme-transition'), 180);

    if(isDark){
      root.setAttribute('data-theme','dark');
      if(btn){
        btn.innerHTML = '<i class="fa-solid fa-sun"></i>';
        btn.setAttribute('aria-pressed','true');
        btn.setAttribute('title','Switch to light mode');
      }
    }else{
      root.removeAttribute('data-theme');
      if(btn){
        btn.innerHTML = '<i class="fa-solid fa-moon"></i>';
        btn.setAttribute('aria-pressed','false');
        btn.setAttribute('title','Switch to dark mode');
      }
    }
    setMeta(isDark ? 'dark' : 'light');
    updateThemeImages(isDark);
  };

  const saved = localStorage.getItem(key);
  if(saved === 'dark' || saved === 'light'){
    apply(saved);
  }else{
    // No explicit choice: follow system and react to changes
    const prefersDark = sys && sys.matches;
    apply(prefersDark ? 'dark' : 'light');
    if(sys){
      sysHandler = (e)=> apply(e.matches ? 'dark' : 'light');
      if(sys.addEventListener){ sys.addEventListener('change', sysHandler); }
      else if(sys.addListener){ sys.addListener(sysHandler); }
    }
  }

  const detachSys = ()=>{
    if(!sys || !sysHandler) return;
    if(sys.removeEventListener){ sys.removeEventListener('change', sysHandler); }
    else if(sys.removeListener){ sys.removeListener(sysHandler); }
    sysHandler = null;
  };

  const setPreference = (mode)=>{
    if(mode === 'light' || mode === 'dark'){
      localStorage.setItem(key, mode);
      detachSys();
      apply(mode);
    }else{ // system
      localStorage.removeItem(key);
      const useDark = sys && sys.matches;
      apply(useDark ? 'dark' : 'light');
      // attach system listener
      if(sys){
        sysHandler = (e)=> apply(e.matches ? 'dark' : 'light');
        if(sys.addEventListener){ sys.addEventListener('change', sysHandler); }
        else if(sys.addListener){ sys.addListener(sysHandler); }
      }
    }
  };

  // Backward compatibility: clicking main button toggles light/dark explicitly
  btn && btn.addEventListener('click',()=>{
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    setPreference(next);
  });
  optLight && optLight.addEventListener('click', ()=> setPreference('light'));
  optDark && optDark.addEventListener('click', ()=> setPreference('dark'));
  optSystem && optSystem.addEventListener('click', ()=> setPreference('system'));
})();

// Counter animation when visible
(function(){
  const counters = document.querySelectorAll('.count[data-count]');
  if(!counters.length) return;
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(en=>{
      if(!en.isIntersecting) return;
      const el = en.target;
      const target = parseInt(el.getAttribute('data-count'),10) || 0;
      let cur = 0;
      const dur = 1200; // ms
      const start = performance.now();
      const step = (t)=>{
        const p = Math.min(1,(t-start)/dur);
        cur = Math.floor(p*target);
        el.textContent = cur.toLocaleString();
        if(p<1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      io.unobserve(el);
    });
  },{threshold:0.3});
  counters.forEach(c=>io.observe(c));
})();

// Subtle parallax background for .parallax elements
(function(){
  const els = document.querySelectorAll('.parallax');
  if(!els.length) return;
  let ticking = false;
  const update = ()=>{
    const y = window.scrollY || window.pageYOffset;
    els.forEach(el=>{
      const speed = 0.25;
      el.style.backgroundPosition = `center ${Math.round(-y*speed)}px`;
    });
    ticking = false;
  };
  window.addEventListener('scroll',()=>{
    if(!ticking){
      window.requestAnimationFrame(update);
      ticking = true;
    }
  },{passive:true});
  update();
})();

// Scroll progress bar
(function(){
  const bar = document.getElementById('scrollProgress');
  if(!bar) return;
  const onScroll = ()=>{
    const doc = document.documentElement;
    const h = doc.scrollHeight - doc.clientHeight;
    const p = h > 0 ? (doc.scrollTop / h) * 100 : 0;
    bar.style.width = p.toFixed(2) + '%';
  };
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();
})();

// Star rating input (reviews)
(function(){
  const container = document.querySelector('.star-input');
  if(!container) return;
  const stars = Array.from(container.querySelectorAll('.star'));
  const hidden = document.getElementById('ratingInput');
  let current = parseInt(hidden && hidden.value ? hidden.value : 5, 10);

  const apply = (val)=>{
    current = Math.max(1, Math.min(5, parseInt(val||current,10)));
    if(hidden) hidden.value = String(current);
    stars.forEach((btn, idx)=>{
      const active = (idx+1) <= current;
      btn.setAttribute('aria-checked', active ? 'true':'false');
      const icon = btn.querySelector('i');
      if(icon){
        icon.classList.toggle('fa-solid', active);
        icon.classList.toggle('fa-regular', !active);
        icon.classList.add('fa-star');
      }
    });
  };

  // init
  apply(current);

  // events
  stars.forEach((btn)=>{
    btn.addEventListener('click', ()=> apply(btn.dataset.value));
    btn.addEventListener('mouseenter', ()=> apply(btn.dataset.value));
    btn.addEventListener('focus', ()=> apply(btn.dataset.value));
  });
  container.addEventListener('mouseleave', ()=> apply(hidden.value));

  // keyboard support on the radiogroup
  container.addEventListener('keydown', (e)=>{
    const key = e.key;
    if(['ArrowLeft','ArrowDown','ArrowRight','ArrowUp','Home','End',' '].includes(key)){
      e.preventDefault();
      let next = current;
      if(key==='ArrowLeft' || key==='ArrowDown') next = Math.max(1, current-1);
      if(key==='ArrowRight' || key==='ArrowUp') next = Math.min(5, current+1);
      if(key==='Home') next = 1;
      if(key==='End') next = 5;
      if(key===' ') next = current; // space re-affirm
      apply(next);
      // move focus to the chosen star for SR users
      const target = stars[next-1];
      target && target.focus();
    }
  });
})();

// Hero carousel: randomize start and sync background for text column
(function(){
  const carouselEl = document.getElementById('heroCarousel');
  if(!carouselEl) return;

  const reactive = document.querySelector('.hero-reactive-bg');
  const setReactiveBg = ()=>{
    const active = carouselEl.querySelector('.carousel-item.active img');
    const src = active ? active.getAttribute('src') : null;
    if(reactive && src){
      reactive.style.setProperty('--hero-bg', `url('${src}')`);
    }
  };

  // Bootstrap 5 carousel API if available
  const hasBS = window.bootstrap && window.bootstrap.Carousel;
  if(hasBS){
    const inst = window.bootstrap.Carousel.getOrCreateInstance(carouselEl, {
      interval: 5000,
      pause: 'hover',
      ride: true,
      touch: true,
      wrap: true
    });
    // Randomize starting slide
    const items = carouselEl.querySelectorAll('.carousel-item');
    if(items.length > 1){
      const start = Math.floor(Math.random() * items.length);
      inst.to(start);
    }
    carouselEl.addEventListener('slid.bs.carousel', setReactiveBg);
    // Initial sync after first paint
    setTimeout(setReactiveBg, 50);
  }else{
    // Fallback: manual detection of active slide changes
    const observer = new MutationObserver(()=> setReactiveBg());
    observer.observe(carouselEl, {attributes:true, subtree:true, attributeFilter:['class']});
    setTimeout(setReactiveBg, 50);
  }
})();

// Smooth scroll for in-page anchors (e.g., #quote)
(function(){
  const nav = document.querySelector('.navbar.sticky-top') || document.querySelector('.navbar');
  const getOffset = ()=> nav ? nav.offsetHeight : 0;
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click', (e)=>{
      const id = a.getAttribute('href');
      if(!id || id.length < 2) return; // skip '#'
      const target = document.querySelector(id);
      if(!target) return;
      e.preventDefault();
      const offset = getOffset();
      const top = Math.max(0, target.getBoundingClientRect().top + window.pageYOffset - offset - 8);
      window.scrollTo({ top, behavior: 'smooth' });
      // update URL hash without jumping
      history.pushState(null, '', id);
    });
  });
})();

// Universal lazy loading for images, iframes, and background images
(function(){
  const supportsIO = 'IntersectionObserver' in window;

  // Ensure passive lazy behavior on standard images/iframes
  document.querySelectorAll('img:not(.no-lazy)').forEach(img=>{
    if(!img.hasAttribute('loading')) img.setAttribute('loading','lazy');
    if(!img.hasAttribute('decoding')) img.setAttribute('decoding','async');
  });
  document.querySelectorAll('iframe:not(.no-lazy)').forEach(fr=>{
    if(!fr.hasAttribute('loading')) fr.setAttribute('loading','lazy');
  });

  if(!supportsIO){
    // Fallback: immediately hydrate data-src/srcset and bg images
    document.querySelectorAll('img[data-src], source[data-srcset]').forEach(el=>{
      if(el.dataset.src) el.src = el.dataset.src;
      if(el.dataset.srcset) el.srcset = el.dataset.srcset;
    });
    document.querySelectorAll('[data-lazy-bg], .lazy-bg[data-bg]').forEach(el=>{
      const url = el.getAttribute('data-lazy-bg') || el.getAttribute('data-bg');
      if(url) el.style.backgroundImage = `url('${url}')`;
    });
    return;
  }

  const io = new IntersectionObserver((entries)=>{
    entries.forEach(en=>{
      if(!en.isIntersecting) return;
      const el = en.target;
      // Images and sources with data-src/srcset
      if(el.tagName === 'IMG' || el.tagName === 'SOURCE'){
        if(el.dataset.src){ el.src = el.dataset.src; el.removeAttribute('data-src'); }
        if(el.dataset.srcset){ el.srcset = el.dataset.srcset; el.removeAttribute('data-srcset'); }
      }
      // Backgrounds
      if(el.hasAttribute('data-lazy-bg') || (el.classList.contains('lazy-bg') && el.hasAttribute('data-bg'))){
        const url = el.getAttribute('data-lazy-bg') || el.getAttribute('data-bg');
        if(url){ el.style.backgroundImage = `url('${url}')`; }
      }
      io.unobserve(el);
    });
  },{rootMargin:'150px 0px', threshold:0.01});

  // Observe candidates
  document.querySelectorAll('img[data-src], source[data-srcset], [data-lazy-bg], .lazy-bg[data-bg]')
    .forEach(el=> io.observe(el));
})();

// Back to top button and tilt effect
(function(){
  const topBtn = document.getElementById('backToTop');
  const onScroll = ()=>{
    const y = window.scrollY || window.pageYOffset;
    if(topBtn){
      if(y > 400){ topBtn.classList.add('show'); } else { topBtn.classList.remove('show'); }
    }
  };
  window.addEventListener('scroll', onScroll, {passive:true});
  topBtn && topBtn.addEventListener('click', (e)=>{
    e.preventDefault();
    window.scrollTo({top:0, behavior:'smooth'});
  });

  // Tilt on cards
  const cards = document.querySelectorAll('.svc-card');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!reduceMotion){
    cards.forEach(card=>{
      card.classList.add('tilt');
      const maxTilt = 8; // degrees
      const enter = ()=> card.style.transition = 'transform .15s ease';
      const leave = ()=>{ card.style.transform = ''; };
      const move = (e)=>{
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const rx = ((y/rect.height)-0.5) * -2 * maxTilt;
        const ry = ((x/rect.width)-0.5) * 2 * maxTilt;
        card.style.transform = `perspective(800px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
      };
      card.addEventListener('mouseenter', enter);
      card.addEventListener('mousemove', move);
      card.addEventListener('mouseleave', leave);
      card.addEventListener('touchend', leave);
    });
  }
  onScroll();
})();
