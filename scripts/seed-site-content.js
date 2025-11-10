#!/usr/bin/env node
// Usage: node scripts/seed-site-content.js path/to/serviceAccountKey.json
// The script will upsert the default siteContent documents used by the NASAM admin panel.

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const [, , keyPath] = process.argv;
if (!keyPath) {
  console.error("Missing service account key path.\nExample: node scripts/seed-site-content.js creds.json");
  process.exit(1);
}

async function bootstrap() {
  const absoluteKeyPath = resolve(process.cwd(), keyPath);
  const raw = await readFile(absoluteKeyPath, "utf8");
  const serviceAccount = JSON.parse(raw);

  initializeApp({
    credential: cert(serviceAccount)
  });

  const db = getFirestore();
  const siteContentDoc = db.collection("siteContent");

  const payload = {
    company: {
      name: "NASAM HI-TECH ELECTRICALS",
      tagline: "Electrical Contractor",
      intro: "NASAM HI-TECH ELECTRICALS designs and delivers dependable electrical and solar infrastructure that keeps homes and businesses running, no matter the demands placed on them.",
      email: "info@nasam.co.ke",
      whatsapp: "+254722319292",
      phones: ["+254 722 52 17 52", "+254 722 31 92 92"],
      locations: [
        "Samnima House, Nairobi, Kenya",
        "Marua A Building, Opp. Samrat Supermarket, Nyeri"
      ],
      social: {
        facebook: "https://facebook.com/",
        instagram: "https://www.instagram.com/",
        linkedin: "https://www.linkedin.com/",
        x: "https://x.com/"
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
      }
    ],
    reviews: [
      {
        name: "Faith K.",
        category: "Commercial Client",
        comment: "Professional team and flawless execution on our energy upgrade.",
        rating: 5
      }
    ]
  };

  const writes = Object.entries(payload).map(([docId, data]) => {
    return siteContentDoc.doc(docId).set(data, { merge: true });
  });

  await Promise.all(writes);
  console.log("Seeded siteContent documents successfully.");
}

bootstrap().catch((err) => {
  console.error("Failed to seed Firestore:", err);
  process.exit(1);
});
