import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// --- Config & guards ---
const CFG_ALL = window.ADMIN_CONFIG || {};
const CFG = CFG_ALL.firebase || null;
const ALLOWED = (CFG_ALL.allowedEmails || []).map(e => String(e || '').trim().toLowerCase());
const CLD = CFG_ALL.cloudinary || {};

const els = {
  setupWarning: document.getElementById('setupWarning'),
  authPanel: document.getElementById('authPanel'),
  adminApp: document.getElementById('adminApp'),
  userInfo: document.getElementById('userInfo'),
  userEmail: document.getElementById('userEmail'),
  btnSignOut: document.getElementById('btnSignOut'),
  btnEmailSignIn: document.getElementById('btnEmailSignIn'),
  btnGoogleSignIn: document.getElementById('btnGoogleSignIn'),
  email: document.getElementById('email'),
  password: document.getElementById('password'),
  authError: document.getElementById('authError'),
  sections: document.getElementById('sections'),
  view: document.getElementById('view'),
  viewTitle: document.getElementById('viewTitle'),
  viewActions: document.getElementById('viewActions')
};

if (!CFG) {
  // Show setup warning and stop
  els.setupWarning && els.setupWarning.classList.remove('d-none');
  // Disable sign-in buttons to avoid errors
  if (els.btnEmailSignIn) els.btnEmailSignIn.disabled = true;
  if (els.btnGoogleSignIn) els.btnGoogleSignIn.disabled = true;
  throw new Error('Admin config missing: create admin-config.js from admin-config.sample.js');
}

// Firebase init
const app = initializeApp(CFG);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Auth ---
const isAllowed = (email) => {
  if (!email) return false;
  const e = String(email).toLowerCase();
  return ALLOWED.includes(e);
};

const setLoading = (btn, loading) => {
  if (!btn) return;
  btn.disabled = !!loading;
  if (loading) {
    btn.dataset.prevText = btn.textContent;
    btn.textContent = 'Please wait...';
  } else if (btn.dataset.prevText) {
    btn.textContent = btn.dataset.prevText;
    delete btn.dataset.prevText;
  }
};

els.btnEmailSignIn?.addEventListener('click', async () => {
  els.authError.textContent = '';
  try {
    setLoading(els.btnEmailSignIn, true);
    const email = (els.email?.value || '').trim();
    const pass = els.password?.value || '';
    if (!email || !pass) throw new Error('Email and password are required');
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    if (!isAllowed(cred.user?.email)) throw new Error('You are not authorized for admin access.');
  } catch (err) {
    els.authError.textContent = (err && err.message) || 'Sign in failed';
  } finally {
    setLoading(els.btnEmailSignIn, false);
  }
});

els.btnGoogleSignIn?.addEventListener('click', async () => {
  els.authError.textContent = '';
  try {
    setLoading(els.btnGoogleSignIn, true);
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    if (!isAllowed(cred.user?.email)) throw new Error('You are not authorized for admin access.');
  } catch (err) {
    els.authError.textContent = (err && err.message) || 'Sign in failed';
  } finally {
    setLoading(els.btnGoogleSignIn, false);
  }
});

els.btnSignOut?.addEventListener('click', () => signOut(auth));

onAuthStateChanged(auth, async (user) => {
  const authed = !!user && isAllowed(user.email);
  els.userInfo?.classList.toggle('d-none', !authed);
  els.authPanel?.classList.toggle('d-none', authed);
  els.adminApp?.classList.toggle('d-none', !authed);
  if (authed) {
    els.userEmail && (els.userEmail.textContent = user.email || '');
    // default section
    const activeBtn = els.sections?.querySelector('.list-group-item.active');
    const sec = activeBtn?.dataset.section || 'company';
    renderSection(sec);
  } else {
    els.userEmail && (els.userEmail.textContent = '');
  }
});

// --- Helpers ---
const q = (sel, root = document) => root.querySelector(sel);
const qa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const parseLines = (text) => (text || '')
  .split(/\r?\n|,/)
  .map(s => s.trim())
  .filter(Boolean);

const toTextarea = (arr) => Array.isArray(arr) ? arr.join('\n') : '';

const safe = (v, d='') => (v == null ? d : v);

// Cloudinary unsigned upload (optional)
async function cloudinaryUpload(file) {
  if (!file) throw new Error('No file');
  if (!CLD.cloud_name || !CLD.unsigned_upload_preset) {
    throw new Error('Cloudinary not configured. Set cloud_name and unsigned_upload_preset in admin-config.js');
  }
  const url = `https://api.cloudinary.com/v1_1/${encodeURIComponent(CLD.cloud_name)}/auto/upload`;
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', CLD.unsigned_upload_preset);
  const resp = await fetch(url, { method: 'POST', body: fd });
  if (!resp.ok) throw new Error('Upload failed');
  const data = await resp.json();
  return data.secure_url || data.url;
}

// Firestore helpers
async function readDoc(pathArr) { // [collection, id] or [collection, id, subcollection, subId]
  const ref = doc(db, ...pathArr);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}
async function saveDoc(pathArr, data) {
  const ref = doc(db, ...pathArr);
  await setDoc(ref, data, { merge: true });
}
async function listCollection(path) { // path string like 'heroPhotos'
  const ref = collection(db, path);
  const snaps = await getDocs(ref);
  return snaps.docs.map(d => ({ id: d.id, ...d.data() }));
}
async function listCollectionOrdered(path, field, asc=true, lim=null) {
  const base = collection(db, path);
  const qy = lim ? query(base, orderBy(field, asc ? 'asc':'desc'), limit(lim)) : query(base, orderBy(field, asc ? 'asc':'desc'));
  const snaps = await getDocs(qy);
  return snaps.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Section switching
els.sections?.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-section]');
  if (!btn) return;
  qa('#sections .list-group-item').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderSection(btn.dataset.section);
});

async function renderSection(key) {
  els.viewActions.innerHTML = '';
  if (key === 'company') return renderCompany();
  if (key === 'branding') return renderBranding();
  if (key === 'hero') return renderHero();
  if (key === 'hero-photos') return renderHeroPhotos();
  if (key === 'categories') return renderCategories();
  if (key === 'projects') return renderProjects();
  if (key === 'reviews') return renderReviews();
  els.viewTitle.textContent = 'Unknown';
  els.view.innerHTML = '<div class="text-muted">Select a section.</div>';
}

// --- Company ---
async function renderCompany() {
  els.viewTitle.textContent = 'Company';
  let data = {};
  try {
    data = await readDoc(['siteContent','company']) || {};
  } catch (err) {
    console.error('Failed to load company content', err);
  }
  els.view.innerHTML = `
    <form id="companyForm" class="row g-3">
      <div class="col-md-6">
        <label class="form-label">Name</label>
        <input type="text" class="form-control" id="cName" value="${safe(data.name)}">
      </div>
      <div class="col-md-6">
        <label class="form-label">Tagline</label>
        <input type="text" class="form-control" id="cTagline" value="${safe(data.tagline)}">
      </div>
      <div class="col-12">
        <label class="form-label">Intro / About</label>
        <textarea class="form-control" id="cIntro" rows="4" placeholder="Short company description">${safe(data.intro)}</textarea>
      </div>
      <div class="col-md-6">
        <label class="form-label">Email</label>
        <input type="email" class="form-control" id="cEmail" value="${safe(data.email)}">
      </div>
      <div class="col-md-6">
        <label class="form-label">WhatsApp</label>
        <input type="text" class="form-control" id="cWhats" value="${safe(data.whatsapp)}" placeholder="+2547...">
      </div>
      <div class="col-md-6">
        <label class="form-label">Phones (comma or new line)</label>
        <textarea class="form-control" rows="3" id="cPhones">${toTextarea(data.phones)}</textarea>
      </div>
      <div class="col-md-6">
        <label class="form-label">Locations (one per line)</label>
        <textarea class="form-control" rows="3" id="cLocs">${toTextarea(data.locations)}</textarea>
      </div>
      <div class="col-12">
        <div class="row g-3">
          <div class="col-12">
            <h6 class="mb-0">Official Links</h6>
            <p class="text-muted small mb-2">Provide full URLs for company profiles.</p>
          </div>
          <div class="col-md-6 col-lg-3">
            <label class="form-label">Facebook</label>
            <input type="url" class="form-control" id="cFacebook" value="${safe(data.social?.facebook)}" placeholder="https://facebook.com/...">
          </div>
          <div class="col-md-6 col-lg-3">
            <label class="form-label">Instagram</label>
            <input type="url" class="form-control" id="cInstagram" value="${safe(data.social?.instagram)}" placeholder="https://www.instagram.com/...">
          </div>
          <div class="col-md-6 col-lg-3">
            <label class="form-label">LinkedIn</label>
            <input type="url" class="form-control" id="cLinkedIn" value="${safe(data.social?.linkedin)}" placeholder="https://www.linkedin.com/...">
          </div>
          <div class="col-md-6 col-lg-3">
            <label class="form-label">X (Twitter)</label>
            <input type="url" class="form-control" id="cX" value="${safe(data.social?.x)}" placeholder="https://x.com/...">
          </div>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" id="saveCompany">Save</button>
      </div>
    </form>`;

  q('#saveCompany')?.addEventListener('click', async (e) => {
    e.preventDefault();
    const clean = (value) => (value || '').trim();
    const payload = {
      name: clean(q('#cName')?.value),
      tagline: clean(q('#cTagline')?.value),
      intro: clean(q('#cIntro')?.value),
      email: clean(q('#cEmail')?.value),
      whatsapp: clean(q('#cWhats')?.value),
      phones: parseLines(q('#cPhones')?.value || ''),
      locations: parseLines(q('#cLocs')?.value || '')
    };
    const rawSocial = {
      facebook: clean(q('#cFacebook')?.value),
      instagram: clean(q('#cInstagram')?.value),
      linkedin: clean(q('#cLinkedIn')?.value),
      x: clean(q('#cX')?.value)
    };
    const social = Object.fromEntries(Object.entries(rawSocial).filter(([, val]) => !!val));
    payload.social = social;
    const btn = e.currentTarget;
    try {
      setLoading(btn, true);
      await saveDoc(['siteContent','company'], payload);
      alert('Saved');
    } catch (err) {
      alert('Save failed: ' + (err?.message || err));
    } finally {
      setLoading(btn, false);
    }
  });
}

// --- Branding ---
async function renderBranding() {
  els.viewTitle.textContent = 'Branding';
  let data = {};
  try {
    data = await readDoc(['siteContent','branding']) || {};
  } catch (err) {
    console.error('Failed to load branding content', err);
  }
  els.view.innerHTML = `
    <form id="brandingForm" class="row g-3">
      <div class="col-md-6">
        <label class="form-label">Logo (light)</label>
        <div class="input-group">
          <input type="url" class="form-control" id="bLogoLight" value="${safe(data.logoLight)}" placeholder="https://...">
          <button class="btn btn-outline-secondary" type="button" id="upLogoLight">Upload</button>
        </div>
      </div>
      <div class="col-md-6">
        <label class="form-label">Logo (dark)</label>
        <div class="input-group">
          <input type="url" class="form-control" id="bLogoDark" value="${safe(data.logoDark || data.logoLight)}" placeholder="https://...">
          <button class="btn btn-outline-secondary" type="button" id="upLogoDark">Upload</button>
        </div>
      </div>
      <div class="col-md-6">
        <label class="form-label">Favicon</label>
        <div class="input-group">
          <input type="url" class="form-control" id="bFavicon" value="${safe(data.favicon || data.logoLight)}">
          <button class="btn btn-outline-secondary" type="button" id="upFavicon">Upload</button>
        </div>
      </div>
      <div class="col-md-6">
        <label class="form-label">OG Image</label>
        <div class="input-group">
          <input type="url" class="form-control" id="bOg" value="${safe(data.ogImage || data.logoLight)}">
          <button class="btn btn-outline-secondary" type="button" id="upOg">Upload</button>
        </div>
      </div>
      <div class="col-12 cloudinary-hint">Uploads use Cloudinary unsigned preset if configured in admin-config.js.</div>
      <div class="form-actions">
        <button class="btn btn-primary" id="saveBranding">Save</button>
      </div>
    </form>`;

  const bindUpload = (btnSel, inputSel) => {
    q(btnSel)?.addEventListener('click', async () => {
      try {
        const picker = document.createElement('input');
        picker.type = 'file';
        picker.accept = 'image/*';
        picker.onchange = async () => {
          const file = picker.files?.[0];
          if (!file) return;
          const url = await cloudinaryUpload(file);
          q(inputSel).value = url;
        };
        picker.click();
      } catch (err) {
        alert('Upload failed: ' + (err?.message || err));
      }
    });
  };
  bindUpload('#upLogoLight', '#bLogoLight');
  bindUpload('#upLogoDark', '#bLogoDark');
  bindUpload('#upFavicon', '#bFavicon');
  bindUpload('#upOg', '#bOg');

  q('#saveBranding')?.addEventListener('click', async (e) => {
    e.preventDefault();
    const payload = {
      logoLight: q('#bLogoLight')?.value || '',
      logoDark: q('#bLogoDark')?.value || '',
      favicon: q('#bFavicon')?.value || '',
      ogImage: q('#bOg')?.value || ''
    };
    const btn = e.currentTarget;
    try {
      setLoading(btn, true);
      await saveDoc(['siteContent','branding'], payload);
      alert('Saved');
    } catch (err) {
      alert('Save failed: ' + (err?.message || err));
    } finally {
      setLoading(btn, false);
    }
  });
}

// --- Hero ---
async function renderHero() {
  els.viewTitle.textContent = 'Hero';
  let data = {};
  try {
    data = await readDoc(['siteContent','hero']) || {};
  } catch (err) {
    console.error('Failed to load hero content', err);
  }
  els.view.innerHTML = `
    <form id="heroForm" class="row g-3">
      <div class="col-md-6">
        <label class="form-label">Badge</label>
        <input type="text" class="form-control" id="hBadge" value="${safe(data.badge)}">
      </div>
      <div class="col-md-6">
        <label class="form-label">Title</label>
        <input type="text" class="form-control" id="hTitle" value="${safe(data.title)}">
      </div>
      <div class="col-md-6">
        <label class="form-label">Accent</label>
        <input type="text" class="form-control" id="hAccent" value="${safe(data.accent)}">
      </div>
      <div class="col-12">
        <label class="form-label">Lead</label>
        <textarea class="form-control" id="hLead" rows="3">${safe(data.lead)}</textarea>
      </div>
      <div class="col-md-6">
        <label class="form-label">Primary CTA Text</label>
        <input type="text" class="form-control" id="hPText" value="${safe(data.primaryCtaText)}">
      </div>
      <div class="col-md-6">
        <label class="form-label">Primary CTA URL</label>
        <input type="url" class="form-control" id="hPUrl" value="${safe(data.primaryCtaUrl)}">
      </div>
      <div class="col-md-6">
        <label class="form-label">Secondary CTA Text</label>
        <input type="text" class="form-control" id="hSText" value="${safe(data.secondaryCtaText)}">
      </div>
      <div class="col-md-6">
        <label class="form-label">Secondary CTA URL</label>
        <input type="url" class="form-control" id="hSUrl" value="${safe(data.secondaryCtaUrl)}">
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" id="saveHero">Save</button>
      </div>
    </form>`;

  q('#saveHero')?.addEventListener('click', async (e) => {
    e.preventDefault();
    const payload = {
      badge: q('#hBadge')?.value || '',
      title: q('#hTitle')?.value || '',
      accent: q('#hAccent')?.value || '',
      lead: q('#hLead')?.value || '',
      primaryCtaText: q('#hPText')?.value || '',
      primaryCtaUrl: q('#hPUrl')?.value || '',
      secondaryCtaText: q('#hSText')?.value || '',
      secondaryCtaUrl: q('#hSUrl')?.value || ''
    };
    const btn = e.currentTarget;
    try {
      setLoading(btn, true);
      await saveDoc(['siteContent','hero'], payload);
      alert('Saved');
    } catch (err) {
      alert('Save failed: ' + (err?.message || err));
    } finally {
      setLoading(btn, false);
    }
  });
}

// --- Hero Photos ---
async function renderHeroPhotos() {
  els.viewTitle.textContent = 'Hero Photos';
  let list = [];
  try {
    list = await listCollection('heroPhotos');
  } catch (err) {
    console.error('Failed to load hero photos', err);
  }

  els.view.innerHTML = `
    <div class="section-toolbar mb-3">
      <button class="btn btn-primary btn-sm" id="addHp">Add Photo</button>
      <span class="spacer"></span>
      <span class="text-muted small">${list.length} items</span>
    </div>
    <div class="table-responsive">
      <table class="table table-sm align-middle">
        <thead><tr><th>Preview</th><th>Title</th><th>Alt</th><th>Caption</th><th>Order</th><th></th></tr></thead>
        <tbody id="hpBody"></tbody>
      </table>
    </div>`;

  const tbody = q('#hpBody');
  tbody.innerHTML = list.map(p => `
    <tr data-id="${p.id}">
      <td style="width:120px"><img src="${safe(p.url)}" alt="" style="height:60px;object-fit:cover;border-radius:6px"></td>
      <td>${safe(p.title)}</td>
      <td>${safe(p.alt)}</td>
      <td>${safe(p.caption)}</td>
      <td style="width:80px">${safe(p.order,'')}</td>
      <td class="text-end">
        <button class="icon-btn me-2" data-act="edit"><i class="fa-regular fa-pen-to-square"></i></button>
        <button class="icon-btn text-danger" data-act="del"><i class="fa-regular fa-trash-can"></i></button>
      </td>
    </tr>`).join('');

  q('#addHp')?.addEventListener('click', (e) => {
    e.preventDefault();
    showHpEditor();
  });

  tbody.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const tr = btn.closest('tr');
    const id = tr?.dataset.id;
    const item = list.find(x => x.id === id);
    if (btn.dataset.act === 'edit') return showHpEditor(item);
    if (btn.dataset.act === 'del') return confirmDelete('heroPhotos', id, () => renderHeroPhotos());
  });
}

function showHpEditor(item=null) {
  const editing = !!item;
  const html = `
  <div class="card mb-3">
    <div class="card-body">
      <h3 class="h6 mb-3">${editing ? 'Edit' : 'Add'} Photo</h3>
      <div class="row g-3">
        <div class="col-md-8">
          <label class="form-label">Image URL</label>
          <div class="input-group">
            <input type="url" class="form-control" id="hpUrl" value="${editing ? safe(item.url) : ''}" placeholder="https://...">
            <button class="btn btn-outline-secondary" type="button" id="hpUpload">Upload</button>
          </div>
        </div>
        <div class="col-md-4 d-flex align-items-end">
          <img id="hpPreview" src="${editing ? safe(item.url) : ''}" alt="" style="height:60px;object-fit:cover;border-radius:6px">
        </div>
        <div class="col-md-4">
          <label class="form-label">Title</label>
          <input type="text" class="form-control" id="hpTitle" value="${editing ? safe(item.title) : ''}">
        </div>
        <div class="col-md-4">
          <label class="form-label">Alt</label>
          <input type="text" class="form-control" id="hpAlt" value="${editing ? safe(item.alt) : ''}">
        </div>
        <div class="col-md-4">
          <label class="form-label">Order</label>
          <input type="number" class="form-control" id="hpOrder" value="${editing ? safe(item.order,'') : ''}">
        </div>
        <div class="col-12">
          <label class="form-label">Caption</label>
          <textarea class="form-control" id="hpCaption" rows="2">${editing ? safe(item.caption) : ''}</textarea>
        </div>
      </div>
      <div class="form-actions">
        ${editing ? '<button class="btn btn-outline-secondary" id="hpCancel">Cancel</button>' : ''}
        <button class="btn btn-primary" id="hpSave">${editing ? 'Update' : 'Add'}</button>
      </div>
    </div>
  </div>`;

  els.view.insertAdjacentHTML('afterbegin', html);
  const wrap = els.view.querySelector('.card');

  q('#hpUpload', wrap)?.addEventListener('click', async () => {
    try {
      const picker = document.createElement('input');
      picker.type = 'file';
      picker.accept = 'image/*';
      picker.onchange = async () => {
        const file = picker.files?.[0];
        if (!file) return;
        const url = await cloudinaryUpload(file);
        q('#hpUrl', wrap).value = url;
        q('#hpPreview', wrap).src = url;
      };
      picker.click();
    } catch (err) {
      alert('Upload failed: ' + (err?.message || err));
    }
  });

  q('#hpSave', wrap)?.addEventListener('click', async (e) => {
    e.preventDefault();
    const payload = {
      url: q('#hpUrl', wrap)?.value || '',
      title: q('#hpTitle', wrap)?.value || '',
      alt: q('#hpAlt', wrap)?.value || '',
      caption: q('#hpCaption', wrap)?.value || '',
      order: Number(q('#hpOrder', wrap)?.value || 0)
    };
    try {
      setLoading(e.currentTarget, true);
      if (editing) {
        await updateDoc(doc(db, 'heroPhotos', item.id), payload);
      } else {
        await addDoc(collection(db, 'heroPhotos'), payload);
      }
      alert('Saved');
      renderHeroPhotos();
    } catch (err) {
      alert('Save failed: ' + (err?.message || err));
    } finally {
      setLoading(e.currentTarget, false);
    }
  });

  q('#hpCancel', wrap)?.addEventListener('click', (e) => {
    e.preventDefault();
    wrap.remove();
  });
}

async function confirmDelete(col, id, onDone) {
  if (!confirm('Delete this item?')) return;
  try {
    await deleteDoc(doc(db, col, id));
    onDone && onDone();
  } catch (err) {
    alert('Delete failed: ' + (err?.message || err));
  }
}

// --- Categories ---
async function renderCategories() {
  els.viewTitle.textContent = 'Service Categories';
  let list = [];
  try {
    list = await listCollection('serviceCategories');
  } catch (err) {
    console.error('Failed to load service categories', err);
  }

  els.view.innerHTML = `
    <div class="row g-3">
      <div class="col-12">
        <div class="card">
          <div class="card-body">
            <h3 class="h6">Add / Edit Category</h3>
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Name</label>
                <input type="text" class="form-control" id="catName">
              </div>
              <div class="col-md-6">
                <label class="form-label">Slug (optional)</label>
                <input type="text" class="form-control" id="catSlug" placeholder="auto if blank">
              </div>
              <div class="col-12">
                <label class="form-label">Description</label>
                <textarea class="form-control" id="catDesc" rows="2"></textarea>
              </div>
              <div class="col-12">
                <label class="form-label">Images (one URL per line)</label>
                <div class="input-group">
                  <textarea class="form-control" id="catImages" rows="3"></textarea>
                  <button class="btn btn-outline-secondary" type="button" id="catUpload">Upload</button>
                </div>
                <div class="form-text">Use Upload to push to Cloudinary and append URL.</div>
              </div>
              <div class="form-actions">
                <button class="btn btn-secondary" id="catNew">New</button>
                <button class="btn btn-primary" id="catSave">Save</button>
              </div>
              <input type="hidden" id="catId">
            </div>
          </div>
        </div>
      </div>
      <div class="col-12">
        <div class="table-responsive">
          <table class="table table-sm align-middle">
            <thead><tr><th>Name</th><th>Images</th><th></th></tr></thead>
            <tbody id="catBody"></tbody>
          </table>
        </div>
      </div>
    </div>`;

  const tbody = q('#catBody');
  tbody.innerHTML = list.map(c => `
    <tr data-id="${c.id}">
      <td>
        <div class="fw-semibold">${safe(c.name)}</div>
        <div class="small text-muted">${safe(c.description)}</div>
      </td>
      <td>${Array.isArray(c.images) ? c.images.length : 0}</td>
      <td class="text-end">
        <button class="icon-btn me-2" data-act="edit"><i class="fa-regular fa-pen-to-square"></i></button>
        <button class="icon-btn text-danger" data-act="del"><i class="fa-regular fa-trash-can"></i></button>
      </td>
    </tr>`).join('');

  const setForm = (c=null) => {
    q('#catId').value = c?.id || '';
    q('#catName').value = c?.name || '';
    q('#catSlug').value = c?.slug || '';
    q('#catDesc').value = c?.description || '';
    q('#catImages').value = Array.isArray(c?.images) ? c.images.join('\n') : '';
  };

  q('#catNew')?.addEventListener('click', (e) => { e.preventDefault(); setForm(null); });

  q('#catSave')?.addEventListener('click', async (e) => {
    e.preventDefault();
    const id = q('#catId').value.trim();
    const name = q('#catName').value.trim();
    const slug = (q('#catSlug').value.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''));
    const desc = q('#catDesc').value.trim();
    const images = parseLines(q('#catImages').value);
    if (!name) return alert('Name is required');
    const payload = { name, slug, description: desc, images };
    try {
      setLoading(e.currentTarget, true);
      if (id) {
        await updateDoc(doc(db, 'serviceCategories', id), payload);
      } else {
        await addDoc(collection(db, 'serviceCategories'), payload);
      }
      alert('Saved');
      renderCategories();
    } catch (err) {
      alert('Save failed: ' + (err?.message || err));
    } finally {
      setLoading(e.currentTarget, false);
    }
  });

  tbody.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const tr = btn.closest('tr');
    const id = tr?.dataset.id;
    const item = list.find(x => x.id === id);
    if (btn.dataset.act === 'edit') return setForm(item);
    if (btn.dataset.act === 'del') return confirmDelete('serviceCategories', id, () => renderCategories());
  });

  q('#catUpload')?.addEventListener('click', async () => {
    try {
      const picker = document.createElement('input');
      picker.type = 'file';
      picker.accept = 'image/*';
      picker.onchange = async () => {
        const file = picker.files?.[0];
        if (!file) return;
        const url = await cloudinaryUpload(file);
        const ta = q('#catImages');
        ta.value = (ta.value ? (ta.value + '\n') : '') + url;
      };
      picker.click();
    } catch (err) {
      alert('Upload failed: ' + (err?.message || err));
    }
  });
}

// --- Projects ---
async function renderProjects() {
  els.viewTitle.textContent = 'Projects';
  let list = [];
  try {
    list = await listCollectionOrdered('projects', 'order', true);
  } catch (err) {
    console.error('Failed to load ordered projects', err);
    try {
      list = await listCollection('projects');
    } catch (fallbackErr) {
      console.error('Failed to load projects', fallbackErr);
    }
  }

  els.view.innerHTML = `
    <div class="row g-3">
      <div class="col-12">
        <div class="card">
          <div class="card-body">
            <h3 class="h6">Add / Edit Project</h3>
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Title</label>
                <input type="text" class="form-control" id="prTitle">
              </div>
              <div class="col-md-3">
                <label class="form-label">Order</label>
                <input type="number" class="form-control" id="prOrder" value="0">
              </div>
              <div class="col-12">
                <label class="form-label">Description</label>
                <textarea class="form-control" id="prDesc" rows="2"></textarea>
              </div>
              <div class="col-12">
                <label class="form-label">Image URL</label>
                <div class="input-group">
                  <input type="url" class="form-control" id="prImg" placeholder="https://...">
                  <button class="btn btn-outline-secondary" type="button" id="prUpload">Upload</button>
                </div>
              </div>
              <div class="form-actions">
                <button class="btn btn-secondary" id="prNew">New</button>
                <button class="btn btn-primary" id="prSave">Save</button>
              </div>
              <input type="hidden" id="prId">
            </div>
          </div>
        </div>
      </div>
      <div class="col-12">
        <div class="table-responsive">
          <table class="table table-sm align-middle">
            <thead><tr><th>Title</th><th>Order</th><th>Image</th><th></th></tr></thead>
            <tbody id="prBody"></tbody>
          </table>
        </div>
      </div>
    </div>`;

  const tbody = q('#prBody');
  tbody.innerHTML = list.map(p => `
    <tr data-id="${p.id}">
      <td>
        <div class="fw-semibold">${safe(p.title)}</div>
        <div class="small text-muted">${safe(p.description)}</div>
      </td>
      <td style="width:80px">${safe(p.order,'')}</td>
      <td style="width:120px"><img src="${safe(p.image)}" alt="" style="height:60px;object-fit:cover;border-radius:6px"></td>
      <td class="text-end">
        <button class="icon-btn me-2" data-act="edit"><i class="fa-regular fa-pen-to-square"></i></button>
        <button class="icon-btn text-danger" data-act="del"><i class="fa-regular fa-trash-can"></i></button>
      </td>
    </tr>`).join('');

  const setForm = (p=null) => {
    q('#prId').value = p?.id || '';
    q('#prTitle').value = p?.title || '';
    q('#prOrder').value = p?.order || 0;
    q('#prDesc').value = p?.description || '';
    q('#prImg').value = p?.image || '';
  };

  q('#prNew')?.addEventListener('click', (e) => { e.preventDefault(); setForm(null); });

  q('#prSave')?.addEventListener('click', async (e) => {
    e.preventDefault();
    const id = q('#prId').value.trim();
    const title = q('#prTitle').value.trim();
    const order = Number(q('#prOrder').value || 0);
    const description = q('#prDesc').value.trim();
    const image = q('#prImg').value.trim();
    if (!title) return alert('Title is required');
    const payload = { title, order, description, image };
    try {
      setLoading(e.currentTarget, true);
      if (id) {
        await updateDoc(doc(db, 'projects', id), payload);
      } else {
        await addDoc(collection(db, 'projects'), payload);
      }
      alert('Saved');
      renderProjects();
    } catch (err) {
      alert('Save failed: ' + (err?.message || err));
    } finally {
      setLoading(e.currentTarget, false);
    }
  });

  tbody.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const tr = btn.closest('tr');
    const id = tr?.dataset.id;
    const item = list.find(x => x.id === id);
    if (btn.dataset.act === 'edit') return setForm(item);
    if (btn.dataset.act === 'del') return confirmDelete('projects', id, () => renderProjects());
  });

  q('#prUpload')?.addEventListener('click', async () => {
    try {
      const picker = document.createElement('input');
      picker.type = 'file';
      picker.accept = 'image/*';
      picker.onchange = async () => {
        const file = picker.files?.[0];
        if (!file) return;
        const url = await cloudinaryUpload(file);
        q('#prImg').value = url;
      };
      picker.click();
    } catch (err) {
      alert('Upload failed: ' + (err?.message || err));
    }
  });
}

// --- Reviews moderation ---
async function renderReviews() {
  els.viewTitle.textContent = 'Reviews';
  let list = [];
  try {
    list = await listCollectionOrdered('reviews', 'rating', false, 50);
  } catch (err) {
    console.error('Failed to load ordered reviews', err);
    try {
      list = await listCollection('reviews');
    } catch (fallbackErr) {
      console.error('Failed to load reviews', fallbackErr);
    }
  }
  els.view.innerHTML = `
    <div class="table-responsive">
      <table class="table table-sm align-middle">
        <thead><tr><th>Name</th><th>Category</th><th>Rating</th><th>Comment</th><th>Approved</th><th></th></tr></thead>
        <tbody id="rvBody"></tbody>
      </table>
    </div>`;
  const tbody = q('#rvBody');
  tbody.innerHTML = list.map(r => `
    <tr data-id="${r.id}">
      <td>${safe(r.name,'Client')}</td>
      <td>${safe(r.category,'')}</td>
      <td>${safe(r.rating,5)}</td>
      <td>${safe((r.comment||'').slice(0,120))}</td>
      <td>
        <div class="form-check form-switch">
          <input class="form-check-input" type="checkbox" ${r.is_approved ? 'checked' : ''} data-act="toggle">
        </div>
      </td>
      <td class="text-end">
        <button class="icon-btn text-danger" data-act="del"><i class="fa-regular fa-trash-can"></i></button>
      </td>
    </tr>`).join('');

  tbody.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const tr = btn.closest('tr');
    const id = tr?.dataset.id;
    if (btn.dataset.act === 'del') return confirmDelete('reviews', id, () => renderReviews());
  });
  tbody.addEventListener('change', async (e) => {
    const tg = e.target;
    if (tg?.dataset?.act !== 'toggle') return;
    const tr = tg.closest('tr');
    const id = tr?.dataset.id;
    try {
      await updateDoc(doc(db, 'reviews', id), { is_approved: !!tg.checked });
    } catch (err) {
      alert('Update failed: ' + (err?.message || err));
      tg.checked = !tg.checked;
    }
  });
}

// Initialize first view title (for visual consistency before auth)
els.viewTitle.textContent = 'Company';
