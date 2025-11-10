import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit
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
      title: "Hospital Solar Upgrade",
      description: "Hybrid solar + generator integration providing uninterrupted power to critical wards.",
      image: "https://res.cloudinary.com/demo/image/upload/v1690000000/hospital-solar.jpg"
    },
    {
      title: "Commercial Reticulation",
      description: "Energy-efficient electrical upgrade for a multi-storey office complex in Nairobi.",
      image: "https://res.cloudinary.com/demo/image/upload/v1690000000/commercial-electric.jpg"
    },
    {
      title: "National CCTV Network",
      description: "Smart surveillance and access control for a nationwide retail chain.",
      image: "https://res.cloudinary.com/demo/image/upload/v1690000000/security-monitoring.jpg"
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

  if (!Array.isArray(categories) || !categories.length) {
    grid.innerHTML = "";
    if (empty) empty.classList.remove("d-none");
    return;
  }

  const cards = categories
    .map((category) => {
      const images = Array.isArray(category.images) && category.images.length ? category.images : [
        "https://res.cloudinary.com/demo/image/upload/v1690000000/solar-panels.jpg"
      ];
      const carouselId = `cat-${category.id || crypto.randomUUID()}`;
      const carouselSlides = images
        .map((src, idx) => `
          <div class="carousel-item ${idx === 0 ? "active" : ""}">
            <div class="ratio ratio-16x9">
              <img src="${src}" class="d-block w-100 h-100" style="object-fit:cover;" alt="${category.name}">
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
                <a class="btn btn-outline-primary btn-sm" href="#projects"><i class="fa-regular fa-images me-1"></i>View Gallery</a>
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
  if (!grid) return;

  if (!Array.isArray(projects) || !projects.length) {
    grid.innerHTML = "<p class=\"text-muted\">Projects coming soon.</p>";
    return;
  }

  grid.innerHTML = projects
    .map((project) => `
      <div class="col-md-4">
        <div class="card h-100 shadow-sm">
          <div class="ratio ratio-4x3">
            <img src="${project.image || fallbackData.projects[0].image}" class="w-100 h-100" style="object-fit:cover;" alt="${project.title}">
          </div>
          <div class="card-body">
            <h5 class="card-title">${project.title}</h5>
            <p class="card-text text-muted">${project.description || "Project description coming soon."}</p>
          </div>
        </div>
      </div>`)
    .join("");
}

function renderReviews(reviews) {
  const carousel = document.querySelector("#testimonialsCarousel .carousel-inner");
  if (!carousel) return;

  if (!Array.isArray(reviews) || !reviews.length) {
    carousel.innerHTML = `
      <div class="carousel-item active">
        <div class="text-center py-4">
          <p class="mb-0">No reviews yet. Be the first to share your experience!</p>
        </div>
      </div>`;
    return;
  }

  carousel.innerHTML = reviews
    .map((review, idx) => `
      <div class="carousel-item ${idx === 0 ? "active" : ""}">
        <div class="d-flex flex-column gap-3 align-items-center text-center">
          <div class="d-flex align-items-center justify-content-center gap-3">
            <div class="d-flex" aria-label="${review.rating || 5} out of 5 stars">
              ${Array.from({ length: 5 }).map((_, starIdx) => `
                <i class="fa-solid fa-star${starIdx < (review.rating || 5) ? " text-warning" : " text-secondary"}"></i>`).join("")}
            </div>
            <small class="text-muted">${review.category || "Client"}</small>
          </div>
          <blockquote class="mb-0">
            <p class="lead mb-1">“${review.comment || "Great service!"}”</p>
            <footer class="text-muted">${review.name || "Client"}</footer>
          </blockquote>
        </div>
      </div>`)
    .join("");
}

function applyContent(content) {
  updateBranding(content.branding);
  updateCompany(content.company);
  updateHero(content.hero, content.heroPhotos);
  renderCategories(content.categories);
  renderProjects(content.projects);
  renderReviews(content.reviews);
}

async function fetchFirebaseContent(firebaseConfig) {
  if (!firebaseConfig) {
    console.warn("Firebase config not provided. Using fallback content.");
    return null;
  }

  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

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
  const firebaseConfig = window.NASAM_FIREBASE_CONFIG || window.FIREBASE_CONFIG || null;
  const preloadedContent = window.NASAM_CONTENT || null;

  if (preloadedContent) {
    applyContent({ ...fallbackData, ...preloadedContent });
    return;
  }

  const remoteContent = await fetchFirebaseContent(firebaseConfig);
  if (remoteContent) {
    applyContent({ ...fallbackData, ...remoteContent });
  } else {
    applyContent(fallbackData);
  }
}

document.addEventListener("DOMContentLoaded", bootstrap);
