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

// Collapse navbar when clicking outside or after selecting a link (mobile)
(function(){
  const nav = document.getElementById('nav'); // .navbar-collapse
  const navbar = document.querySelector('.navbar');
  const toggler = navbar ? navbar.querySelector('.navbar-toggler') : null;
  if(!nav || !navbar) return;

  const isOpen = ()=> nav.classList.contains('show');
  const hide = ()=>{
    // Use Bootstrap Collapse if present
    const BS = window.bootstrap && window.bootstrap.Collapse;
    if(BS){ BS.getOrCreateInstance(nav).hide(); }
    else{
      nav.classList.remove('show');
    }
    toggler && toggler.setAttribute('aria-expanded','false');
  };

  // Click outside closes
  document.addEventListener('click', (e)=>{
    if(!isOpen()) return;
    const target = e.target;
    // Ignore clicks inside navbar or on toggler
    if(navbar.contains(target)) return;
    hide();
  });

  // ESC to close (optional, helpful)
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape' && isOpen()) hide();
  });

  // After selecting a nav link on mobile, collapse
  nav.querySelectorAll('.nav-link, .dropdown-item').forEach(el=>{
    el.addEventListener('click', ()=>{
      // Only collapse if toggler is visible (mobile view)
      const togglerVisible = toggler && window.getComputedStyle(toggler).display !== 'none';
      if(togglerVisible) hide();
    });
  });
})();

// Highlight active nav link based on current location
(function(){
  const navLinks = Array.from(document.querySelectorAll('#nav .nav-link')).filter(link=> !link.classList.contains('btn'));
  if(!navLinks.length) return;

  const trimPath = (pathname)=>{
    if(!pathname) return '/';
    let path = pathname.replace(/\\/g,'/');
    path = path.replace(/index\.html$/i,'');
    if(path.length > 1 && path.endsWith('/')){
      path = path.slice(0, -1);
    }
    return path || '/';
  };

  const updateActive = ()=>{
    const currentUrl = new URL(window.location.href);
    const curPath = trimPath(currentUrl.pathname);
    const curHash = currentUrl.hash;
    let best = null;

    navLinks.forEach(link=>{
      const href = link.getAttribute('href');
      if(!href) return;
      const targetUrl = new URL(href, window.location.href);
      const linkPath = trimPath(targetUrl.pathname);
      const linkHash = targetUrl.hash;
      let score = 0;

      if(linkPath === curPath){
        score += 4;
        if(linkHash){
          if(curHash && curHash === linkHash){
            score += 6;
          }else if(!curHash && (linkHash === '#hero' || linkHash === '#top')){
            score += 2;
          }
        }else if(!curHash){
          score += 2;
        }
      }

      if(score > 0 && (!best || score > best.score)){
        best = {link, score};
      }
    });

    navLinks.forEach(link=>{
      link.classList.remove('active');
      if(link.hasAttribute('aria-current')){
        link.removeAttribute('aria-current');
      }
    });

    if(best){
      best.link.classList.add('active');
      best.link.setAttribute('aria-current','page');
    }
  };

  updateActive();
  window.addEventListener('hashchange', updateActive);
  window.addEventListener('popstate', updateActive);
})();

// Inject developer credit banner below footer
(function(){
  const footer = document.querySelector('.site-footer');
  if(!footer || document.querySelector('.developer-credit')) return;

  const whatsappNumber = '254796031071';
  const whatsappText = encodeURIComponent("Hello Emitech, I'm interested in getting a website like the NASAM HI-TECH ELECTRICALS site. Let's discuss!");
  const emailSubject = encodeURIComponent('Website Inquiry - NASAM HI-TECH ELECTRICALS');
  const emailBody = encodeURIComponent("Hello Emitech,\n\nI'd love to get a website similar to the NASAM HI-TECH ELECTRICALS site. Please let me know the next steps.\n\nThank you!");

  const section = document.createElement('section');
  section.className = 'developer-credit';
  section.setAttribute('aria-label','Website developer credit');
  section.innerHTML = `
    <div class="container">
      <div class="credit-text">
        <span>Website developed by <strong>Emitech</strong>. Get yours here.</span>
        <div class="credit-actions">
          <a class="btn btn-whatsapp" href="https://wa.me/${whatsappNumber}?text=${whatsappText}" target="_blank" rel="noopener">Chat on WhatsApp</a>
          <a class="btn btn-outline-primary" href="mailto:emiliomurithi4@gmail.com?subject=${emailSubject}&body=${emailBody}">Email Emitech</a>
        </div>
        <div class="small credit-contact">Call/WhatsApp: <a href="tel:0796031071">0796031071</a> · Email: <a href="mailto:emiliomurithi4@gmail.com?subject=${emailSubject}&body=${emailBody}">emiliomurithi4@gmail.com</a></div>
      </div>
    </div>`;

  footer.insertAdjacentElement('afterend', section);
})();

// Image lightbox via Bootstrap modal
(function(){
  const init = ()=>{
    const modalEl = document.getElementById('imageLightbox');
    if(!modalEl) return;
    const imgEl = modalEl.querySelector('#lightboxImg');
    const capEl = modalEl.querySelector('#lightboxCaption');
    let modal = null;

    const open = (src, alt)=>{
      if(!src) return;
      imgEl.src = src;
      imgEl.alt = alt || '';
      if(capEl){ capEl.textContent = alt || ''; }
      modal = window.bootstrap && window.bootstrap.Modal ? window.bootstrap.Modal.getOrCreateInstance(modalEl) : null;
      if(modal){
        modal.show();
      }else{
        // Fallback: manual show
        modalEl.style.display = 'block';
        modalEl.classList.add('show');
        modalEl.removeAttribute('aria-hidden');
        modalEl.setAttribute('aria-modal','true');
        // simple backdrop
        let bd = document.querySelector('.modal-backdrop');
        if(!bd){
          bd = document.createElement('div');
          bd.className = 'modal-backdrop fade show';
          document.body.appendChild(bd);
        }
      }
    };

    // Helper to get the best available image source
    const resolveSrc = (img)=> img.currentSrc || img.getAttribute('src') || img.getAttribute('data-src');

    // Determine if an image should open in lightbox
    const shouldLightbox = (img)=>{
      if(!img || !(img instanceof HTMLImageElement)) return false;
      if(img.closest('.no-lightbox') || img.classList.contains('no-lightbox') || img.hasAttribute('data-no-lightbox')) return false;
      // Skip very small images (likely icons)
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      if((w && h) && (w < 64 || h < 64)) return false;
      return true;
    };

    // Delegate clicks to any image (opt-out supported)
    document.addEventListener('click', (e)=>{
      const target = e.target;
      if(!(target instanceof Element)) return;
      const img = target.closest('img');
      if(!img) return;
      if(!shouldLightbox(img)) return;
      e.preventDefault();
      open(resolveSrc(img), img.getAttribute('alt'));
    });

    // Keyboard accessibility: Enter on focused images
    const closeFallback = ()=>{
      if(modal){ modal.hide && modal.hide(); return; }
      modalEl.classList.remove('show');
      modalEl.style.display = 'none';
      modalEl.setAttribute('aria-hidden','true');
      modalEl.removeAttribute('aria-modal');
      const bd = document.querySelector('.modal-backdrop');
      bd && bd.parentNode && bd.parentNode.removeChild(bd);
    };

    document.addEventListener('keydown', (e)=>{
      if(e.key !== 'Enter') return;
      const active = document.activeElement;
      if(active && active.matches && active.matches('img')){
        if(!shouldLightbox(active)) return;
        e.preventDefault();
        open(resolveSrc(active), active.getAttribute('alt'));
      }
    });

    // Close on Esc (fallback only)
    document.addEventListener('keydown', (e)=>{
      if(e.key === 'Escape') closeFallback();
    });
    // Close when clicking backdrop (fallback only)
    document.addEventListener('click', (e)=>{
      const bd = document.querySelector('.modal-backdrop');
      if(bd && e.target === bd){ closeFallback(); }
    });
  };

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  }else{
    init();
  }
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

  // Respect cache consent for persistence (localStorage)
  const getCookie = (name)=>{
    const key = name + '=';
    const parts = document.cookie.split(';');
    for(let i=0;i<parts.length;i++){
      let c = parts[i].trim();
      if(c.indexOf(key)===0) return decodeURIComponent(c.substring(key.length));
    }
    return null;
  };
  const cacheAllowed = (getCookie('cache-consent') || getCookie('cookie-consent')) !== 'declined';
  const storage = {
    getItem: (k)=> cacheAllowed ? window.localStorage.getItem(k) : null,
    setItem: (k,v)=>{ if(cacheAllowed) try{ window.localStorage.setItem(k,v);}catch(e){} },
    removeItem: (k)=>{ if(cacheAllowed) try{ window.localStorage.removeItem(k);}catch(e){} }
  };

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

  const saved = storage.getItem(key);
  if(saved === 'dark' || saved === 'light'){
    apply(saved);
  }else{
    // Default to light regardless of system preference
    apply('light');
    // Do not attach system listener by default
  }

  const detachSys = ()=>{
    if(!sys || !sysHandler) return;
    if(sys.removeEventListener){ sys.removeEventListener('change', sysHandler); }
    else if(sys.removeListener){ sys.removeListener(sysHandler); }
    sysHandler = null;
  };

  const setPreference = (mode)=>{
    if(mode === 'light' || mode === 'dark'){
      storage.setItem(key, mode);
      detachSys();
      apply(mode);
    }else{ // system
      storage.removeItem(key);
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

// Timed prompts based on time on page (no scroll required): 20s (rate), 45s (contact), 90s (contact)
(function(){
  const init = ()=>{
    const rateModalEl = document.getElementById('ratePromptModal');
    const contactModalEl = document.getElementById('contactPromptModal');
    if(!rateModalEl && !contactModalEl) return; // nothing to do

    // Respect cookie/cache consent for persistence
    const getCookie = (name)=>{
      const key = name + '=';
      const parts = document.cookie.split(';');
      for(let i=0;i<parts.length;i++){
        let c = parts[i].trim();
        if(c.indexOf(key)===0) return decodeURIComponent(c.substring(key.length));
      }
      return null;
    };
    const cacheAllowed = (getCookie('cache-consent') || getCookie('cookie-consent')) !== 'declined';
    const storage = cacheAllowed ? window.localStorage : window.sessionStorage;

    // Suppress prompts for a period after first shown
    const SUPPRESS_KEY = 'nasam-prompt-suppress-until';
    const now = Date.now();
    const untilStr = (storage && storage.getItem) ? storage.getItem(SUPPRESS_KEY) : null;
    const suppressUntil = untilStr ? parseInt(untilStr, 10) || 0 : 0;
    const isSuppressed = suppressUntil && now < suppressUntil;

    const setSuppressed = ()=>{
      try{
        if(!storage || !storage.setItem) return;
        // 24h suppression if localStorage allowed, else session-only (any value works)
        const ttl = cacheAllowed ? (now + 24*60*60*1000) : (now + 5*60*1000); // session fallback value is ignored on session end
        storage.setItem(SUPPRESS_KEY, String(ttl));
      }catch(e){ /* ignore */ }
    };

    // Per-page-view flags (reset on reload/navigation)
    const fired = {
      rate20: false,
      contact45: false,
      contact90: false,
    };

    const anyModalOpen = () => !!document.querySelector('.modal.show');

    // Queue showing a modal when safe (no overlapping)
    const tryShow = (el)=>{
      if(!el) return;
      if(isSuppressed) return; // do not show if within suppression window
      const showNow = ()=>{
        const inst = (window.bootstrap && window.bootstrap.Modal)
          ? window.bootstrap.Modal.getOrCreateInstance(el)
          : null;
        if(inst){ inst.show(); }
        else{
          // Fallback minimal show
          el.style.display = 'block';
          el.classList.add('show');
          el.removeAttribute('aria-hidden');
          el.setAttribute('aria-modal','true');
        }
        // once we show any prompt, suppress future prompts for the period
        setSuppressed();
      };
      if(!anyModalOpen()){
        showNow();
      }else{
        const once = ()=>{
          document.removeEventListener('hidden.bs.modal', once, true);
          // slight delay to allow backdrop cleanup
          setTimeout(()=>{ if(!anyModalOpen()) showNow(); }, 120);
        };
        document.addEventListener('hidden.bs.modal', once, true);
      }
    };

    // Schedule prompts on wall-clock time since page load
    const schedule = (ms, key, el)=>{
      if(!el) return; // skip if modal not present
      setTimeout(()=>{
        if(!fired[key]){
          fired[key] = true;
          tryShow(el);
        }
      }, ms);
    };

    // 20s -> rate; 45s -> contact; 90s -> contact again
    schedule(20000, 'rate20', rateModalEl);
    schedule(45000, 'contact45', contactModalEl);
    schedule(90000, 'contact90', contactModalEl);
  };

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  }else{
    init();
  }
})();

// Cookie consent management (init after DOMContentLoaded)
(function(){
  const init = ()=>{
    const banner = document.getElementById('cookieConsent');
    if(!banner) return;

    // Simple cookie helpers
    const setCookie = (name, value, days)=>{
      const d = new Date();
      d.setTime(d.getTime() + (days*24*60*60*1000));
      const expires = "expires=" + d.toUTCString();
      const secure = window.location.protocol === 'https:' ? '; Secure' : '';
      document.cookie = `${name}=${encodeURIComponent(value)}; ${expires}; path=/; SameSite=Lax${secure}`;
    };
    const getCookie = (name)=>{
      const key = name + '=';
      const parts = document.cookie.split(';');
      for(let i=0;i<parts.length;i++){
        let c = parts[i].trim();
        if(c.indexOf(key)===0) return decodeURIComponent(c.substring(key.length));
      }
      return null;
    };

    const params = new URLSearchParams(window.location.search);
    const forceShow = params.get('consent') === 'show';
    const choice = getCookie('cookie-consent');
    if(forceShow || !choice){
      banner.classList.add('show');
    }

    const hide = ()=> banner.classList.remove('show');
    const acceptBtn = document.getElementById('cookieAccept');
    const declineBtn = document.getElementById('cookieDecline');
    acceptBtn && acceptBtn.addEventListener('click', ()=>{
      setCookie('cookie-consent','accepted', 180); // 6 months
      setCookie('cache-consent','accepted', 180);
      hide();
      // Place to initialize optional tracking/analytics if ever added
    });
    declineBtn && declineBtn.addEventListener('click', ()=>{
      setCookie('cookie-consent','declined', 180);
      setCookie('cache-consent','declined', 180);
      hide();
    });
  };

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  }else{
    init();
  }
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
  const heroRoot = document.getElementById('hero');
  const setReactiveBg = ()=>{
    const active = carouselEl.querySelector('.carousel-item.active img');
    const src = active ? active.getAttribute('src') : null;
    if(reactive && src){
      reactive.style.setProperty('--hero-bg', `url('${src}')`);
    }
    if(heroRoot && src){
      heroRoot.style.setProperty('--hero-mobile-bg', `url('${src}')`);
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
  const PLACEHOLDER_PIXEL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

  const autoHydrateLazyImage = (img)=>{
    if(img.dataset.src || img.dataset.srcset) return;
    if(img.hasAttribute('data-priority')) return;
    if(img.classList.contains('brand-icon-img') || img.classList.contains('no-lazy')) return;
    const currentSrc = img.getAttribute('src');
    const currentSrcset = img.getAttribute('srcset');
    if(!currentSrc && !currentSrcset) return;
    if(currentSrc && currentSrc.startsWith('data:') && !currentSrcset) return;
    if(currentSrc){
      img.setAttribute('data-src', currentSrc);
    }
    if(currentSrcset){
      img.setAttribute('data-srcset', currentSrcset);
      img.removeAttribute('srcset');
    }
    const placeholder = img.getAttribute('data-placeholder') || PLACEHOLDER_PIXEL;
    if(currentSrc !== placeholder && placeholder){
      img.setAttribute('src', placeholder);
    }
  };

  // Ensure passive lazy behavior on standard images/iframes
  document.querySelectorAll('img:not(.no-lazy)').forEach(img=>{
    if(!img.hasAttribute('loading')) img.setAttribute('loading','lazy');
    if(!img.hasAttribute('decoding')) img.setAttribute('decoding','async');
    if(img.getAttribute('loading') === 'lazy') autoHydrateLazyImage(img);
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
