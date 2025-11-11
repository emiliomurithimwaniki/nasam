import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const fallbackData = {
  company: {
    name: "NASAM HI-TECH ELECTRICALS",
    tagline: "Electrical Contractor",
    intro: "NASAM HI-TECH ELECTRICALS designs and delivers dependable electrical and solar infrastructure that keeps homes and businesses running, no matter the demands placed on them.",
    phones: ["+254 722 52 17 52", "+254 722 31 92 92"],
    email: "info@nasam.co.ke",
    whatsapp: "+254722319292",
    locations: [
      "Samnima House, Nairobi, Kenya",
      "Marua A Building, Opp. Samrat Supermarket, Nyeri"
    ],
    social: {
      facebook: "https://facebook.com",
      x: "https://twitter.com",
      instagram: "https://www.instagram.com",
      linkedin: "https://www.linkedin.com"
    }
  },
  branding: {
    logoLight: "assets/img/logo-placeholder.svg",
    logoDark: "assets/img/logo-placeholder.svg",
    favicon: "assets/img/logo-placeholder.svg",
    ogImage: "https://res.cloudinary.com/demo/image/upload/v1690000000/solar-panels.jpg"
  },
  hero: {
    badge: "Quality • Innovation • Customer Satisfaction",
    title: "Electrical Engineering",
    accent: "& Solar Power",
    lead: "Safe, reliable, and efficient systems for homes, businesses, and industry. Delivered by certified professionals with strict adherence to IEE standards.",
    primaryCtaText: "Our Services",
    primaryCtaUrl: "#services",
    secondaryCtaText: "Request a Quote",
    secondaryCtaUrl: "#contact"
  },
  heroPhotos: [
    {
      url: "https://res.cloudinary.com/demo/image/upload/v1690000000/solar-panels.jpg",
      alt: "Solar installation",
      title: "Commercial rooftop solar",
      caption: "50kW hybrid solar array in Nairobi"
    },
    {
      url: "https://res.cloudinary.com/demo/image/upload/v1690000000/electrical-room.jpg",
      alt: "Electrical control room",
      title: "Industrial MCC upgrade",
      caption: "Turnkey electrical installation for manufacturing plant"
    }
  ],
  categories: [
    {
      id: "solar",
      name: "Solar PV Systems",
      description: "Design, installation, and maintenance of hybrid and grid-tied solar plants.",
      images: [
        "https://res.cloudinary.com/demo/image/upload/v1690000000/solar-panels.jpg"
      ]
    },
    {
      id: "electrical",
      name: "Electrical Installations",
      description: "Turnkey electrical contracting for commercial, industrial, and residential projects.",
      images: [
        "https://res.cloudinary.com/demo/image/upload/v1690000000/electrical-room.jpg"
      ]
    },
    {
      id: "security",
      name: "Security & Surveillance",
      description: "Integrated CCTV, access control, and smart monitoring solutions.",
      images: [
        "https://res.cloudinary.com/demo/image/upload/v1690000000/security-cameras.jpg"
      ]
    }
  ],
  projects: [
    {
      id: "hospital-solar",
      title: "Hospital Solar Upgrade",
      description: "Hybrid solar + generator integration providing uninterrupted power to critical wards.",
      image: "https://res.cloudinary.com/demo/image/upload/v1690000000/hospital-solar.jpg",
      sector: "Healthcare",
      location: "Nairobi, Kenya",
      completedOn: "2024",
      capacity: "50 kW",
      longDescription: "A mission-critical hybrid solar system providing life-saving backup for intensive care units, theatres, and on-call facilities. NASAM HI-TECH designed redundancies that guarantee uninterrupted power even under fluctuating grid conditions.",
      highlights: [
        "Seamless switchover between solar, grid, and generator feeds",
        "24/7 monitoring with remote fault diagnostics"
      ],
      gallery: [
        "https://res.cloudinary.com/demo/image/upload/v1690000000/hospital-solar.jpg",
        "https://res.cloudinary.com/demo/image/upload/v1690000000/solar-panels.jpg"
      ],
      ctaText: "Request a solar audit",
      ctaUrl: "#contact"
    },
    {
      id: "commercial-reticulation",
      title: "Commercial Reticulation",
      description: "Energy-efficient electrical upgrade for a multi-storey office complex in Nairobi.",
      image: "https://res.cloudinary.com/demo/image/upload/v1690000000/commercial-electric.jpg",
      sector: "Commercial",
      location: "Nairobi CBD",
      completedOn: "2023",
      scope: "Power distribution & lighting",
      longDescription: "End-to-end modernization of the electrical backbone, upgrading aging switchgear, distribution panels, and lighting to meet new tenancy needs while minimizing downtime for occupants.",
      highlights: [
        "Reduced energy consumption by 28% through smart controls",
        "Integrated backup systems for critical floors"
      ],
      gallery: [
        "https://res.cloudinary.com/demo/image/upload/v1690000000/commercial-electric.jpg",
        "https://res.cloudinary.com/demo/image/upload/v1690000000/electrical-room.jpg"
      ],
      ctaText: "Book a site assessment",
      ctaUrl: "#contact"
    },
    {
      id: "national-cctv",
      title: "National CCTV Network",
      description: "Smart surveillance and access control for a nationwide retail chain.",
      image: "https://res.cloudinary.com/demo/image/upload/v1690000000/security-monitoring.jpg",
      sector: "Retail",
      location: "Kenya (32 outlets)",
      completedOn: "2022",
      scope: "Security & surveillance",
      longDescription: "Designed and deployed a unified surveillance and access control platform across 32 locations with centralized monitoring, ensuring consistent standards and rapid incident response.",
      highlights: [
        "Centralized command center with live analytics",
        "Biometric access control integrated across branches"
      ],
      gallery: [
        "https://res.cloudinary.com/demo/image/upload/v1690000000/security-monitoring.jpg",
        "https://res.cloudinary.com/demo/image/upload/v1690000000/security-cameras.jpg"
      ],
      ctaText: "Schedule a security audit",
      ctaUrl: "#contact"
    }
  ],
  reviews: [
    {
      name: "Faith K.",
      category: "Commercial Client",
      comment: "Professional team and flawless execution on our energy upgrade.",
      rating: 5
    },
    {
      name: "James N.",
      category: "Industrial Client",
      comment: "Responsive support and reliable workmanship from start to finish.",
      rating: 5
    }
  ]
};

const categoryGalleryStore = new Map();
const projectStore = new Map();
let firebaseAppInstance = null;
let firestoreDbInstance = null;
let firebaseConfigCache = null;
let lazySectionObserver = null;
let lazySectionMutationObserver = null;

function ensureFirebase(config) {
  if (!config) return null;
  if (!firebaseConfigCache) {
    firebaseConfigCache = config;
  }
  if (!firebaseAppInstance) {
    firebaseAppInstance = getApps().length ? getApps()[0] : initializeApp(config);
  }
  if (!firestoreDbInstance) {
    firestoreDbInstance = getFirestore(firebaseAppInstance);
  }
  return firestoreDbInstance;
}

function slugify(value, fallback = "") {
  const base = String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  if (base) return base;
  return fallback;
}

function renderProjectDetailSections() {
  const detailContainer = document.getElementById("projectDetailsList");
  if (!detailContainer) return;

  const sectionsHtml = Array.from(projectStore.entries())
    .map(([projectId, data], index) => {
      const primaryImage = data.images?.[0]?.url || fallbackData.projects[0]?.image || fallbackData.branding.ogImage;
      const hasGallery = Array.isArray(data.images) && data.images.length > 1;
      const galleryHtml = hasGallery
        ? `<div class="d-flex gap-2 flex-wrap mt-3">${data.images
            .slice(0, 4)
            .map((img, idx) => `
              <a href="${img.url}" target="_blank" rel="noopener" class="thumbnail-link" aria-label="Open project image ${idx + 1}">
                <img src="${img.url}" alt="${img.alt || data.title}" class="project-thumb">
              </a>`)
            .join("")}${data.images.length > 4 ? `<span class="badge text-bg-primary align-self-center">+${data.images.length - 4} more</span>` : ""}</div>`
        : "";

      const metaHtml = Array.isArray(data.meta) && data.meta.length
        ? `<ul class="list-unstyled row g-3" id="project-${projectId}-meta">
            ${data.meta
              .map((item) => `
                <li class="col-sm-6 col-lg-4">
                  <div class="border rounded-3 p-3 h-100">
                    <div class="text-muted small text-uppercase">${item.label}</div>
                    <div class="fw-semibold">${item.value}</div>
                  </div>
                </li>`)
              .join("")}
          </ul>`
        : "";

      const highlightsHtml = Array.isArray(data.highlights) && data.highlights.length
        ? `<ul class="list-unstyled d-flex flex-column gap-2" id="project-${projectId}-highlights">
            ${data.highlights
              .map((point) => `
                <li class="d-flex align-items-start gap-2">
                  <i class="fa-solid fa-circle-check text-success mt-1"></i>
                  <span>${point}</span>
                </li>`)
              .join("")}
          </ul>`
        : "";

      const subtitleHtml = data.subtitle
        ? `<p class="text-muted mb-3">${data.subtitle}</p>`
        : "";

      const ctaHtml = data.cta?.text
        ? `<a class="btn btn-accent" href="${data.cta.url || '#contact'}">${data.cta.text} <i class="fa-solid fa-arrow-right ms-1"></i></a>`
        : "";

      return `
        <article class="project-detail-section py-5 border-top" id="project-${projectId}" data-project-order="${index + 1}" tabindex="-1">
          <div class="container">
            <div class="row g-5 align-items-center">
              <div class="col-lg-6">
                <div class="ratio ratio-16x9 rounded overflow-hidden shadow-sm">
                  <img src="${primaryImage}" alt="${data.title}" class="w-100 h-100" style="object-fit:cover;">
                </div>
                ${galleryHtml}
              </div>
              <div class="col-lg-6">
                <span class="badge text-bg-primary-soft mb-2">Project ${index + 1}</span>
                <h2 class="h3 fw-semibold mb-2">${data.title}</h2>
                ${subtitleHtml}
                <p class="text-muted">${data.description || "Project details coming soon."}</p>
                ${metaHtml}
                ${highlightsHtml}
                ${ctaHtml ? `<div class="mt-4">${ctaHtml}</div>` : ""}
              </div>
            </div>
          </div>
        </article>`;
    })
    .join("");

  detailContainer.innerHTML = sectionsHtml;
}

function focusProjectFromHash(options = { behavior: "smooth" }) {
  if (typeof window === "undefined") return;
  const { behavior } = options;
  const hash = window.location.hash;
  if (!hash || hash.length <= 1) return;
  const targetId = hash.substring(1);
  const target = document.getElementById(targetId);
  if (!target) return;

  target.scrollIntoView({ behavior, block: "start" });
  if (typeof target.focus === "function") {
    try {
      target.focus({ preventScroll: true });
    } catch (error) {
      target.focus();
    }
  }
  target.classList.add("project-scroll-highlight");
  window.setTimeout(() => target.classList.remove("project-scroll-highlight"), 2000);
}

function getLazySectionObserver() {
  if (lazySectionObserver || typeof window === "undefined") {
    return lazySectionObserver;
  }
  if (!("IntersectionObserver" in window)) {
    return null;
  }

  lazySectionObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting || entry.intersectionRatio > 0) {
        entry.target.classList.add("lazy-section-visible");
        observer.unobserve(entry.target);
      }
    });
  }, {
    rootMargin: "0px 0px -10% 0px",
    threshold: 0.15
  });

  return lazySectionObserver;
}

function registerLazySection(section) {
  if (!section || section.dataset.lazy === "off" || section.dataset.lazy === "disabled") {
    return;
  }

  section.classList.add("lazy-section");

  if (section.classList.contains("lazy-section-visible")) {
    return;
  }

  const observer = getLazySectionObserver();
  if (!observer) {
    section.classList.add("lazy-section-visible");
    return;
  }

  observer.observe(section);
}

function observeDomForLazySections() {
  if (lazySectionMutationObserver || typeof window === "undefined" || !("MutationObserver" in window)) {
    return;
  }

  lazySectionMutationObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof Element)) return;
        if (node.tagName === "SECTION") {
          registerLazySection(node);
        } else {
          node.querySelectorAll?.("section").forEach((section) => registerLazySection(section));
        }
      });
    });
  });

  lazySectionMutationObserver.observe(document.body, { childList: true, subtree: true });
}

function initLazySections() {
  if (typeof document === "undefined") return;

  const sections = Array.from(document.querySelectorAll("section"));
  if (!sections.length) return;

  sections.forEach(registerLazySection);

  if (!("IntersectionObserver" in window)) {
    sections.forEach((section) => section.classList.add("lazy-section-visible"));
    return;
  }

  observeDomForLazySections();
}

function normalizeCategoryImages(category) {
  const name = category?.name || "Gallery";
  const rawImages = Array.isArray(category?.images) && category.images.length
    ? category.images
    : Array.isArray(category?.image)
      ? category.image
      : [category?.image || fallbackData.branding.ogImage].filter(Boolean);

  return rawImages
    .map((image, idx) => {
      if (!image) return null;
      if (typeof image === "string") {
        return {
          url: image,
          alt: `${name} photo ${idx + 1}`,
          caption: ""
        };
      }
      if (typeof image === "object") {
        const url = image.url || image.src || image.image || "";
        if (!url) return null;
        return {
          url,
          alt: image.alt || image.title || `${name} photo ${idx + 1}`,
          caption: image.caption || image.description || ""
        };
      }
      return null;
    })
    .filter(Boolean);
}

function normalizeProjectImages(project) {
  const title = project?.title || "Project";
  const imageSources = [];

  if (Array.isArray(project?.gallery) && project.gallery.length) {
    imageSources.push(...project.gallery);
  }
  if (Array.isArray(project?.images) && project.images.length) {
    imageSources.push(...project.images);
  }
  [project?.coverImage, project?.image].forEach((src) => {
    if (src) imageSources.push(src);
  });

  const seen = new Set();
  const normalized = imageSources
    .map((image, idx) => {
      if (!image) return null;

      if (typeof image === "string") {
        if (seen.has(image)) return null;
        seen.add(image);
        return {
          url: image,
          alt: `${title} photo ${idx + 1}`,
          caption: ""
        };
      }

      if (typeof image === "object") {
        const url = image.url || image.src || image.image || "";
        if (!url || seen.has(url)) return null;
        seen.add(url);
        return {
          url,
          alt: image.alt || image.title || `${title} photo ${idx + 1}`,
          caption: image.caption || image.description || ""
        };
      }

      return null;
    })
    .filter(Boolean);

  if (!normalized.length) {
    const fallbackUrl = fallbackData.projects[0]?.image || fallbackData.branding.ogImage;
    normalized.push({
      url: fallbackUrl,
      alt: `${title} photo`,
      caption: ""
    });
  }

  return normalized;
}

function buildProjectMeta(project) {
  const labelMap = [
    ["sector", "Sector"],
    ["location", "Location"],
    ["completedOn", "Completed"],
    ["capacity", "Capacity"],
    ["scope", "Scope"],
    ["status", "Status"],
    ["client", "Client"],
    ["duration", "Duration"]
  ];

  return labelMap
    .map(([key, label]) => {
      const value = project?.[key];
      if (!value) return null;
      const formatted = Array.isArray(value) ? value.filter(Boolean).join(", ") : value;
      if (!formatted) return null;
      return { label, value: formatted };
    })
    .filter(Boolean);
}

function textContent(el, value) {
  if (el && typeof value === "string") {
    el.textContent = value;
  }
}

function setHref(el, value) {
  if (el && typeof value === "string") {
    el.setAttribute("href", value);
  }
}

function setSrc(el, value) {
  if (el && typeof value === "string") {
    el.setAttribute("src", value);
  }
}

function setSkeletonLoading(active, { delay = 0 } = {}) {
  const overlay = document.getElementById("skeletonOverlay");
  const body = document.body;
  if (!body) return;

  const toggle = () => {
    if (active) {
      body.classList.add("is-loading");
      if (overlay) overlay.setAttribute("aria-hidden", "false");
    } else {
      if (overlay) overlay.setAttribute("aria-hidden", "true");
      body.classList.remove("is-loading");
    }
  };

  if (delay > 0) {
    window.setTimeout(toggle, delay);
  } else {
    toggle();
  }
}

function updateBranding(branding) {
  if (!branding) return;
  const logoLight = branding.logoLight || fallbackData.branding.logoLight;
  const logoDark = branding.logoDark || logoLight;
  const favicon = branding.favicon || logoLight;
  const ogImage = branding.ogImage || favicon;

  ["brandingLogo", "footerLogo"].forEach((id) => {
    const img = document.getElementById(id);
    if (img) {
      img.setAttribute("data-theme-src-light", logoLight);
      img.setAttribute("data-theme-src-dark", logoDark);
      setSrc(img, logoLight);
    }
  });

  const faviconLink = document.getElementById("faviconLink");
  if (faviconLink) {
    faviconLink.setAttribute("href", favicon);
  }

  const ogImageEls = document.querySelectorAll('meta[property="og:image"], meta[name="twitter:image"]');
  ogImageEls.forEach((meta) => meta.setAttribute("content", ogImage));
}

function updateCompany(company) {
  if (!company) return;
  document.querySelectorAll("[data-company-field]").forEach((el) => {
    const field = el.getAttribute("data-company-field");
    if (field && field in company) {
      textContent(el, company[field]);
    }
  });

  if (Array.isArray(company.phones) && company.phones.length) {
    const phoneLinks = document.querySelectorAll("[data-company-phone-link]");
    phoneLinks.forEach((link) => {
      setHref(link, `tel:${company.phones[company.phones.length - 1].replace(/\s+/g, '')}`);
    });

    const phoneText = document.querySelector("[data-company-phones]");
    if (phoneText) {
      phoneText.textContent = company.phones.join(", ");
    }

    const phoneDisplay = document.querySelector("[data-company-phone-text]");
    if (phoneDisplay) {
      phoneDisplay.textContent = company.phones[company.phones.length - 1];
    }
  }

  if (company.email) {
    document.querySelectorAll("[data-company-email-link]").forEach((el) => {
      setHref(el, `mailto:${company.email}`);
      if (el.hasAttribute("data-company-email")) {
        textContent(el, company.email);
      }
    });
  }

  if (company.whatsapp) {
    const whatsappHref = `https://wa.me/${company.whatsapp.replace(/[^0-9]/g, "")}`;
    document.querySelectorAll("[data-company-whatsapp-link]").forEach((el) => setHref(el, whatsappHref));
  }

  if (Array.isArray(company.locations)) {
    const list = document.querySelector("[data-company-locations]");
    if (list) {
      list.innerHTML = company.locations
        .map((loc) => `<li><i class="fa-solid fa-location-dot me-2"></i>${loc}</li>`)
        .join("");
    }
  }
}

function updateHero(hero, heroPhotos) {
  const heroData = hero || fallbackData.hero;
  if (!heroData) return;

  const heroTitle = document.getElementById("heroTitle");
  if (heroTitle) {
    const accent = heroData.accent ? `<span class="text-gradient" id="heroAccent">${heroData.accent}</span>` : "";
    heroTitle.innerHTML = `${heroData.title ?? ""} ${accent}`.trim();
  }

  textContent(document.getElementById("heroBadge"), heroData.badge);
  textContent(document.getElementById("heroLead"), heroData.lead);

  const primaryCta = document.getElementById("heroPrimaryCta");
  if (primaryCta) {
    setHref(primaryCta, heroData.primaryCtaUrl || "#services");
    textContent(primaryCta, heroData.primaryCtaText || "Explore Services");
  }

  const secondaryCta = document.getElementById("heroSecondaryCta");
  if (secondaryCta) {
    setHref(secondaryCta, heroData.secondaryCtaUrl || "#contact");
    textContent(secondaryCta, heroData.secondaryCtaText || "Request a Quote");
  }

  renderHeroCarousel(Array.isArray(heroPhotos) && heroPhotos.length ? heroPhotos : fallbackData.heroPhotos);
}

function renderHeroCarousel(photos) {
  const container = document.getElementById("heroCarouselContainer");
  const carousel = document.getElementById("heroCarousel");
  if (!container || !carousel) return;

  if (!photos || !photos.length) {
    container.innerHTML = `<div class="hero-photo js-hero parallax" data-bg="assets/img/fallback-hero.jpg"></div>`;
    return;
  }

  const indicators = photos
    .map((_, idx) => `<button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="${idx}" class="${idx === 0 ? "active" : ""}" aria-label="Slide ${idx + 1}" aria-current="${idx === 0 ? "true" : "false"}"></button>`)
    .join("");

  const slides = photos
    .map((photo, idx) => {
      const indicatorCaption = photo.caption ? `<p class="mb-0 small">${photo.caption}</p>` : "";
      const indicatorTitle = photo.title ? `<h5 class="mb-1">${photo.title}</h5>` : "";
      const captionHtml = indicatorCaption || indicatorTitle
        ? `<div class="carousel-caption d-none d-md-block bg-dark bg-opacity-50 rounded p-2">${indicatorTitle}${indicatorCaption}</div>`
        : "";
      return `
        <div class="carousel-item ${idx === 0 ? "active" : ""}">
          <img src="${photo.url}" class="d-block w-100" alt="${photo.alt || photo.title || "Hero image"}" style="object-fit: cover; height: 460px;">
          ${captionHtml}
        </div>`;
    })
    .join("");

  carousel.innerHTML = `
    <div class="carousel-indicators">${indicators}</div>
    <div class="carousel-inner" style="max-height: 460px;">${slides}</div>
    <button class="carousel-control-prev" type="button" data-bs-target="#heroCarousel" data-bs-slide="prev">
      <span class="carousel-control-prev-icon" aria-hidden="true"></span>
      <span class="visually-hidden">Previous</span>
    </button>
    <button class="carousel-control-next" type="button" data-bs-target="#heroCarousel" data-bs-slide="next">
      <span class="carousel-control-next-icon" aria-hidden="true"></span>
      <span class="visually-hidden">Next</span>
    </button>`;

  const heroSection = document.querySelector(".hero-reactive-bg");
  if (heroSection && photos[0]?.url) {
    heroSection.dataset.reactiveBg = photos[0].url;
    heroSection.style.setProperty("--hero-bg", `url('${photos[0].url}')`);
  }
}

function renderCategories(categories) {
  const grid = document.getElementById("categoriesGrid");
  const empty = document.getElementById("categoriesEmpty");
  if (!grid) return;

  categoryGalleryStore.clear();

  if (!Array.isArray(categories) || !categories.length) {
    grid.innerHTML = "";
    if (empty) empty.classList.remove("d-none");
    return;
  }

  const cards = categories
    .map((category) => {
      const catId = category.id || crypto.randomUUID();
      const normalizedImages = normalizeCategoryImages(category);
      if (!normalizedImages.length) {
        normalizedImages.push({
          url: fallbackData.branding.ogImage,
          alt: category.name || "Gallery image",
          caption: ""
        });
      }

      categoryGalleryStore.set(String(catId), {
        title: category.name || "Gallery",
        images: normalizedImages
      });

      const carouselId = `cat-${catId}`;
      const carouselSlides = normalizedImages
        .map((src, idx) => `
          <div class="carousel-item ${idx === 0 ? "active" : ""}">
            <div class="ratio ratio-16x9">
              <img src="${src.url}" class="d-block w-100 h-100" style="object-fit:cover;" alt="${src.alt || category.name}">
            </div>
          </div>`)
        .join("");

      return `
        <div class="col-12 col-sm-6 col-lg-4">
          <div class="card h-100 shadow-sm">
            <div id="${carouselId}" class="carousel slide rounded-top overflow-hidden" data-bs-ride="carousel" data-bs-interval="6000" data-bs-pause="false" aria-label="${category.name} photos carousel">
              <div class="carousel-inner">${carouselSlides}</div>
            </div>
            <div class="card-body">
              <h5 class="card-title mb-1">${category.name}</h5>
              <p class="card-text text-muted mb-0">${category.description || "Learn more about this solution."}</p>
              <div class="mt-3 d-flex gap-2 flex-wrap">
                <button type="button" class="btn btn-outline-primary btn-sm btn-view-gallery" data-gallery-id="${catId}" data-bs-toggle="modal" data-bs-target="#categoryGalleryModal"><i class="fa-regular fa-images me-1"></i>View Gallery</button>
                <a class="btn btn-accent btn-sm" href="#contact">Learn More <i class="fa-solid fa-arrow-right ms-1"></i></a>
              </div>
            </div>
          </div>
        </div>`;
    })
    .join("");

  grid.innerHTML = cards;
  if (empty) empty.classList.add("d-none");
}

function renderProjects(projects) {
  const grid = document.getElementById("projectsGrid");
  const empty = document.getElementById("projectsEmpty");

  projectStore.clear();

  if (!Array.isArray(projects) || !projects.length) {
    if (grid) {
      grid.innerHTML = "";
    }
    if (empty) {
      empty.classList.remove("d-none");
    }
    window.NASAM_PROJECT_STORE = projectStore;
    document.dispatchEvent(new CustomEvent("nasam:projects-rendered", {
      detail: {
        projectIds: []
      }
    }));
    return;
  }

  const cards = projects
    .map((project, index) => {
      const fallbackId = `project-${index + 1}`;
      const projectId = String(project.id || project.slug || project.key || slugify(project.title, fallbackId));
      const images = normalizeProjectImages(project);
      const coverImage = images[0]?.url || fallbackData.projects[0].image;
      const meta = buildProjectMeta(project);
      const highlights = Array.isArray(project?.highlights)
        ? project.highlights.filter(Boolean)
        : project?.highlights
          ? [project.highlights]
          : [];
      const description = project.longDescription || project.details || project.description || "Project details coming soon.";
      const shortDescription = project.description || project.summary || "Project description coming soon.";
      const subtitle = project.subtitle || project.tagline || project.sector || "";
      const ctaText = project.ctaText || "Request a quote";
      const ctaUrl = project.ctaUrl || "#contact";

      projectStore.set(String(projectId), {
        title: project.title || "Project",
        description,
        images,
        meta,
        highlights,
        subtitle,
        cta: {
          text: ctaText,
          url: ctaUrl
        }
      });

      return `
        <div class="col-md-4" id="project-card-${projectId}" data-project-id="${projectId}">
          <div class="card h-100 shadow-sm">
            <div class="ratio ratio-4x3">
              <img src="${coverImage}" class="w-100 h-100" style="object-fit:cover;" alt="${project.title || "Project image"}">
            </div>
            <div class="card-body d-flex flex-column">
              <div>
                <h5 class="card-title">${project.title || "Project"}</h5>
                <p class="card-text text-muted">${shortDescription}</p>
              </div>
              <div class="mt-3 d-flex gap-2 flex-wrap">
                <a class="btn btn-outline-primary btn-sm" href="projects.html#project-${projectId}"><i class="fa-regular fa-folder-open me-1"></i>View Project</a>
                <a class="btn btn-accent btn-sm" href="${ctaUrl}">${ctaText} <i class="fa-solid fa-arrow-right ms-1"></i></a>
              </div>
            </div>
          </div>
        </div>`;
    })
    .join("");

  if (grid) {
    grid.innerHTML = cards;
  }
  if (empty) {
    empty.classList.add("d-none");
  }
  window.NASAM_PROJECT_STORE = projectStore;
  renderProjectDetailSections();
  initLazySections();
  document.dispatchEvent(new CustomEvent("nasam:projects-rendered", {
    detail: {
      projectIds: Array.from(projectStore.keys())
    }
  }));
}

function renderReviews(reviews) {
  const sanitized = Array.isArray(reviews) ? reviews.filter(Boolean) : [];

  const carousel = document.querySelector("#testimonialsCarousel .carousel-inner");
  if (carousel) {
    if (sanitized.length) {
      const slidesHtml = sanitized.slice(0, 5).map((review, idx) => {
        const starsCount = Math.max(0, Math.min(5, Number(review.rating) || 0));
        const stars = new Array(starsCount).fill("<i class='fa-solid fa-star text-warning'></i>").join("") || "<i class='fa-solid fa-star text-warning'></i>".repeat(5);
        return `
          <div class="carousel-item ${idx === 0 ? "active" : ""}">
            <div class="d-flex flex-column gap-3 align-items-center text-center">
              <div class="d-flex align-items-center justify-content-center gap-3">
                <div class="d-flex" aria-label="${review.rating || 5} out of 5 stars">${stars}</div>
                ${review.category ? `<small class="text-muted">${review.category}</small>` : ""}
              </div>
              <blockquote class="mb-0">
                <p class="lead mb-1">“${review.comment || review.message || ""}”</p>
                <footer class="text-muted">${review.name || "Client"}</footer>
              </blockquote>
            </div>
          </div>`;
      }).join("");
      carousel.innerHTML = slidesHtml;
    } else {
      carousel.innerHTML = "";
    }
  }

  const container = document.getElementById("reviewsGrid");
  const emptyEl = document.getElementById("reviewsEmpty");
  const shoutOutList = document.querySelector("[data-reviews-shoutouts]");
  if (container) {
    if (sanitized.length) {
      container.innerHTML = sanitized
        .map((review) => {
          const starsCount = Math.max(0, Math.min(5, Number(review.rating) || 0));
          const stars = new Array(starsCount).fill("<i class='fa-solid fa-star'></i>").join("") || "<i class='fa-solid fa-star'></i>".repeat(5);
          const badge = review.category ? `<span class="badge bg-primary-subtle text-primary"><i class="fa-solid fa-tag me-1"></i>${review.category}</span>` : "";
          const meta = [review.project, review.location].filter(Boolean).join(" • ");
          return `
            <div class="col-md-6 col-lg-4">
              <article class="card h-100 shadow-sm">
                <div class="card-body d-flex flex-column">
                  <div class="d-flex align-items-center justify-content-between mb-2">
                    <strong>${review.name || "Client"}</strong>
                    ${badge}
                  </div>
                  <div class="text-warning mb-2" aria-label="${review.rating || 5} out of 5 stars">
                    ${stars}
                  </div>
                  <p class="flex-grow-1">“${review.comment || review.message || ""}”</p>
                  ${meta ? `<small class="text-muted">${meta}</small>` : ""}
                </div>
              </article>
            </div>`;
        })
        .join("");
      if (emptyEl) emptyEl.classList.add("d-none");
    } else {
      container.innerHTML = "";
      if (emptyEl) emptyEl.classList.remove("d-none");
    }
  }

  if (shoutOutList) {
    shoutOutList.innerHTML = "";
    const latest = sanitized
      .sort((a, b) => {
        const aTs = a.createdAt?.seconds || a.createdAt?._seconds || 0;
        const bTs = b.createdAt?.seconds || b.createdAt?._seconds || 0;
        return bTs - aTs;
      })
      .slice(0, 3);

    if (latest.length) {
      shoutOutList.innerHTML = latest
        .map((review) => {
          const time = review.createdAt?.toDate ? review.createdAt.toDate() : (review.createdAt?.seconds ? new Date(review.createdAt.seconds * 1000) : null);
          const formattedDate = time ? time.toLocaleDateString(undefined, { month: "long", year: "numeric" }) : "";
          const metaParts = [formattedDate, review.category, review.project, review.location].filter(Boolean);
          return `
            <div class="timeline-item mb-4">
              <div class="timeline-marker bg-primary"></div>
              <div class="timeline-content">
                <strong>${review.name || "Client"}</strong>
                <p class="mb-1 small text-muted">“${review.comment || review.message || ""}”</p>
                ${metaParts.length ? `<small class="text-muted">${metaParts.join(" • ")}</small>` : ""}
              </div>
            </div>`;
        })
        .join("");
    } else {
      shoutOutList.innerHTML = `
        <div class="timeline-item">
          <div class="timeline-marker bg-primary"></div>
          <div class="timeline-content">
            <strong>Be the first to share!</strong>
            <p class="mb-1 small text-muted">Submit a review and we&#39;ll feature highlights here.</p>
          </div>
        </div>`;
    }
  }
}

function applyContent(content) {
  updateBranding(content.branding);
  updateCompany(content.company);
  updateHero(content.hero, content.heroPhotos);
  renderCategories(content.categories);
  renderProjects(content.projects);
  renderReviews(content.reviews);
  initLazySections();
}

function setupCategoryGalleryModal() {
  const modalEl = document.getElementById("categoryGalleryModal");
  const carouselEl = document.getElementById("categoryGalleryCarousel");
  if (!modalEl || !carouselEl) return;

  const titleEl = modalEl.querySelector("#categoryGalleryTitle");
  const indicatorsEl = carouselEl.querySelector(".carousel-indicators");
  const innerEl = carouselEl.querySelector(".carousel-inner");

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest(".btn-view-gallery");
    if (!trigger) return;

    const galleryId = trigger.getAttribute("data-gallery-id");
    const gallery = categoryGalleryStore.get(String(galleryId));
    if (!gallery || !gallery.images.length || !innerEl) {
      return;
    }

    if (titleEl) {
      titleEl.textContent = gallery.title || "Gallery";
    }

    const slidesHtml = gallery.images
      .map((img, idx) => `
        <div class="carousel-item ${idx === 0 ? "active" : ""}">
          <div class="ratio ratio-16x9">
            <img src="${img.url}" class="d-block w-100 h-100" style="object-fit:cover;" alt="${img.alt || gallery.title || "Gallery image"}">
          </div>
          ${img.caption ? `<div class="carousel-caption bg-dark bg-opacity-50 rounded-3 p-2">${img.caption}</div>` : ""}
        </div>`)
      .join("");

    innerEl.innerHTML = slidesHtml;

    if (indicatorsEl) {
      if (gallery.images.length > 1) {
        indicatorsEl.innerHTML = gallery.images
          .map((_, idx) => `<button type="button" data-bs-target="#categoryGalleryCarousel" data-bs-slide-to="${idx}" ${idx === 0 ? 'class="active" aria-current="true"' : ''} aria-label="Slide ${idx + 1}"></button>`)
          .join("");
        indicatorsEl.classList.remove("d-none");
      } else {
        indicatorsEl.innerHTML = "";
        indicatorsEl.classList.add("d-none");
      }
    }

    if (window.bootstrap && carouselEl) {
      const instance = window.bootstrap.Carousel.getOrCreateInstance(carouselEl, { interval: 5000 });
      instance.pause();
      instance.to(0);
    }
  });
}

function setupProjectDetailsModal() {
  const modalEl = document.getElementById("projectDetailsModal");
  if (!modalEl) return;

  const titleEl = modalEl.querySelector("#projectDetailsTitle");
  const subtitleEl = modalEl.querySelector("#projectDetailsSubtitle");
  const descriptionEl = modalEl.querySelector("#projectDetailsDescription");
  const metaWrapper = modalEl.querySelector("#projectDetailsMetaWrapper");
  const metaList = modalEl.querySelector("#projectDetailsMeta");
  const highlightsWrapper = modalEl.querySelector("#projectDetailsHighlightsWrapper");
  const highlightsList = modalEl.querySelector("#projectDetailsHighlights");
  const ctaBtn = modalEl.querySelector("#projectDetailsCta");
  const ctaLabel = modalEl.querySelector("#projectDetailsCtaLabel");
  const carouselEl = modalEl.querySelector("#projectDetailsCarousel");
  const indicatorsEl = carouselEl?.querySelector(".carousel-indicators") || null;
  const innerEl = carouselEl?.querySelector(".carousel-inner") || null;
  const controls = carouselEl ? Array.from(carouselEl.querySelectorAll(".carousel-control-prev, .carousel-control-next")) : [];

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest(".btn-view-project");
    if (!trigger) return;

    const projectId = trigger.getAttribute("data-project-id");
    const projectData = projectStore.get(String(projectId));
    if (!projectData) {
      return;
    }

    const { title, subtitle, description, images, meta, highlights, cta } = projectData;

    if (titleEl) {
      titleEl.textContent = title || "Project";
    }

    if (subtitleEl) {
      if (subtitle) {
        subtitleEl.textContent = subtitle;
        subtitleEl.classList.remove("d-none");
      } else {
        subtitleEl.textContent = "";
        subtitleEl.classList.add("d-none");
      }
    }

    if (descriptionEl) {
      descriptionEl.textContent = description || "";
    }

    if (metaList) {
      if (Array.isArray(meta) && meta.length) {
        metaList.innerHTML = meta
          .map((item) => `
            <li class="border rounded-3 p-2">
              <div class="text-muted small text-uppercase">${item.label}</div>
              <div class="fw-semibold">${item.value}</div>
            </li>`)
          .join("");
        metaWrapper?.classList.remove("d-none");
      } else {
        metaList.innerHTML = "";
        metaWrapper?.classList.add("d-none");
      }
    }

    if (highlightsList) {
      if (Array.isArray(highlights) && highlights.length) {
        highlightsList.innerHTML = highlights
          .map((point) => `
            <li class="d-flex align-items-start gap-2">
              <i class="fa-solid fa-circle-check text-success mt-1"></i>
              <span>${point}</span>
            </li>`)
          .join("");
        highlightsWrapper?.classList.remove("d-none");
      } else {
        highlightsList.innerHTML = "";
        highlightsWrapper?.classList.add("d-none");
      }
    }

    if (ctaBtn) {
      ctaBtn.setAttribute("href", cta?.url || "#contact");
      if (ctaLabel) {
        ctaLabel.textContent = cta?.text || "Request a quote";
      } else {
        ctaBtn.textContent = cta?.text || "Request a quote";
      }
    }

    if (carouselEl && innerEl) {
      const slidesHtml = (Array.isArray(images) && images.length ? images : normalizeProjectImages({ title, images: [] }))
        .map((img, idx) => `
          <div class="carousel-item ${idx === 0 ? "active" : ""}">
            <div class="ratio ratio-16x9">
              <img src="${img.url}" class="d-block w-100 h-100" style="object-fit:cover;" alt="${img.alt || title || "Project image"}">
            </div>
            ${img.caption ? `<div class="carousel-caption bg-dark bg-opacity-50 rounded-3 p-2">${img.caption}</div>` : ""}
          </div>`)
        .join("");

      innerEl.innerHTML = slidesHtml;

      if (indicatorsEl) {
        if (images.length > 1) {
          indicatorsEl.innerHTML = images
            .map((_, idx) => `<button type="button" data-bs-target="#projectDetailsCarousel" data-bs-slide-to="${idx}" ${idx === 0 ? 'class="active" aria-current="true"' : ""} aria-label="Slide ${idx + 1}"></button>`)
            .join("");
          indicatorsEl.classList.remove("d-none");
        } else {
          indicatorsEl.innerHTML = "";
          indicatorsEl.classList.add("d-none");
        }
      }

      controls.forEach((control) => {
        if (images.length > 1) {
          control.classList.remove("d-none");
        } else {
          control.classList.add("d-none");
        }
      });

      if (window.bootstrap) {
        const carousel = window.bootstrap.Carousel.getOrCreateInstance(carouselEl, { interval: 5000 });
        carousel.pause();
        carousel.to(0);
      }
    }
  });
}

async function fetchFirebaseContent(firebaseConfig) {
  if (!firebaseConfig) {
    console.warn("Firebase config not provided. Using fallback content.");
    return null;
  }

  try {
    firebaseConfigCache = firebaseConfigCache || firebaseConfig;
    const db = ensureFirebase(firebaseConfig);
    if (!db) return null;

    const [companyDoc, brandingDoc, heroDoc, heroPhotosSnap, categoriesSnap, projectsSnap, reviewsSnap] = await Promise.all([
      getDoc(doc(db, "siteContent", "company")),
      getDoc(doc(db, "siteContent", "branding")),
      getDoc(doc(db, "siteContent", "hero")),
      getDocs(collection(db, "heroPhotos")),
      getDocs(collection(db, "serviceCategories")),
      getDocs(query(collection(db, "projects"), orderBy("order", "asc"))),
      getDocs(query(collection(db, "reviews"), orderBy("rating", "desc"), limit(12)))
    ]);

    const company = companyDoc.exists() ? companyDoc.data() : null;
    const branding = brandingDoc.exists() ? brandingDoc.data() : null;
    const hero = heroDoc.exists() ? heroDoc.data() : null;
    const heroPhotos = heroPhotosSnap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    const categories = categoriesSnap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    const projects = projectsSnap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    const reviews = reviewsSnap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));

    return {
      company,
      branding,
      hero,
      heroPhotos,
      categories,
      projects,
      reviews
    };
  } catch (error) {
    console.error("Failed to load content from Firebase. Falling back to static data.", error);
    return null;
  }
}

async function bootstrap() {
  setSkeletonLoading(true);
  const firebaseConfig = window.NASAM_FIREBASE_CONFIG || window.FIREBASE_CONFIG || null;
  const preloadedContent = window.NASAM_CONTENT || null;

  if (firebaseConfig) {
    ensureFirebase(firebaseConfig);
  }

  if (preloadedContent) {
    applyContent({ ...fallbackData, ...preloadedContent });
    setSkeletonLoading(false, { delay: 180 });
    return;
  }

  const remoteContent = await fetchFirebaseContent(firebaseConfig);
  if (remoteContent) {
    applyContent({ ...fallbackData, ...remoteContent });
    setSkeletonLoading(false, { delay: 200 });
  } else {
    applyContent(fallbackData);
    setSkeletonLoading(false, { delay: 220 });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setupCategoryGalleryModal();
  setupProjectDetailsModal();
  initLazySections();
  bootstrap();
});

window.focusProjectFromHash = focusProjectFromHash;

async function submitReviewToFirebase(payload = {}) {
  const config = firebaseConfigCache || window.NASAM_FIREBASE_CONFIG || window.FIREBASE_CONFIG || null;
  const db = ensureFirebase(config);
  if (!db) {
    throw new Error("Firebase configuration unavailable.");
  }

  const reviewDoc = {
    name: (payload.name || "").trim(),
    category: (payload.category || "").trim(),
    comment: (payload.comment || "").trim(),
    rating: Number(payload.rating) || 0,
    permission: payload.permission || "internal",
    email: (payload.email || "").trim(),
    project: (payload.project || "").trim(),
    approved: false,
    source: "website",
    createdAt: serverTimestamp()
  };

  return addDoc(collection(db, "reviews"), reviewDoc);
}

window.NASAM_submitReview = submitReviewToFirebase;

async function submitContactInquiryToFirebase(payload = {}) {
  const config = firebaseConfigCache || window.NASAM_FIREBASE_CONFIG || window.FIREBASE_CONFIG || null;
  const db = ensureFirebase(config);
  if (!db) {
    throw new Error("Firebase configuration unavailable.");
  }

  const inquiryDoc = {
    name: (payload.name || "").trim(),
    email: (payload.email || "").trim(),
    phone: (payload.phone || "").trim(),
    projectType: (payload.projectType || "").trim(),
    message: (payload.message || "").trim(),
    company: (payload.company || "").trim(),
    source: payload.source || "website-contact-form",
    status: payload.status || "new",
    createdAt: serverTimestamp()
  };

  return addDoc(collection(db, "contactMessages"), inquiryDoc);
}

window.NASAM_submitContact = submitContactInquiryToFirebase;
