/**
 * profile_form.js
 *
 * Builds and manages the user profile creation / edit form.
 * Handles: DOM rendering, validation, tag assignment, and API submission.
 *
 * Usage:
 *   import { createProfileForm } from './profile_form.js';
 *
 *   const { form, getValues, reset } = createProfileForm(
 *     document.getElementById('form-root'),
 *     {
 *       onSubmit: async (data) => { ... },
 *       initialValues: { name: 'Jane', profession: 'Frontend Development', ... },
 *       apiBase: 'http://localhost:8000',
 *     }
 *   );
 */

import { assignUserTags } from '../globe_visualization.js';

// ── Constants ──────────────────────────────────────────────────────────────────

const PROFESSIONS = [
  'Frontend Development', 'Backend Engineering', 'Mobile Development',
  'DevOps & Cloud', 'Data Science & ML', 'UX & Design', 'Security',
  'Blockchain', 'Game Development', 'Agriculture', 'Healthcare',
  'Education', 'Finance', 'Construction', 'Manufacturing', 'Retail', 'Hospitality',
];

const SOCIAL_PLATFORMS = [
  { key: 'linkedin_url',    label: 'LinkedIn',   placeholder: 'https://linkedin.com/in/username' },
  { key: 'github_username', label: 'GitHub',     placeholder: 'github-username' },
  { key: 'twitter_handle',  label: 'Twitter / X', placeholder: '@handle' },
  { key: 'portfolio_url',   label: 'Portfolio',  placeholder: 'https://yoursite.com' },
  { key: 'behance_url',     label: 'Behance',    placeholder: 'https://behance.net/username' },
  { key: 'dribbble_url',    label: 'Dribbble',   placeholder: 'https://dribbble.com/username' },
];

// ── Styles ─────────────────────────────────────────────────────────────────────

function injectStyles() {
  if (document.getElementById('pf-form-styles')) return;
  const style = document.createElement('style');
  style.id = 'pf-form-styles';
  style.textContent = `
    .pf-form {
      font-family: 'JetBrains Mono', monospace;
      background: #f6f4ef;
      padding: 36px;
      border-radius: 16px;
      max-width: 580px;
      border: 2px solid #1710E6;
      box-shadow: 0 8px 32px rgba(23,16,230,0.10);
    }
    .pf-title {
      font-family: 'Instrument Serif', serif;
      font-size: 26px;
      color: #1710E6;
      margin: 0 0 28px;
      font-style: italic;
    }
    .pf-field    { margin-bottom: 20px; }
    .pf-label    { display: block; font-size: 11px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
    .pf-required::after { content: ' *'; color: #ef4444; }
    .pf-input {
      width: 100%; padding: 10px 14px;
      border: 2px solid #d4d1c7; border-radius: 8px;
      background: #fff; font-family: inherit; font-size: 13px; color: #1a1a1a;
      box-sizing: border-box; transition: border-color 0.15s;
    }
    .pf-input:focus { outline: none; border-color: #1710E6; }
    .pf-select    { appearance: none; cursor: pointer; }
    .pf-avatar-wrap { display: flex; align-items: center; gap: 16px; }
    .pf-avatar-preview {
      width: 64px; height: 64px; border-radius: 50%;
      background: #1710E6; display: flex; align-items: center;
      justify-content: center; font-size: 22px; color: #fff;
      font-weight: 700; overflow: hidden; flex-shrink: 0;
      border: 2px solid #8DC651;
    }
    .pf-avatar-preview img { width: 100%; height: 100%; object-fit: cover; }
    .pf-upload-btn {
      padding: 8px 14px; background: #fff; border: 2px solid #d4d1c7;
      border-radius: 8px; font-family: inherit; font-size: 12px; cursor: pointer;
    }
    .pf-upload-btn:hover { border-color: #1710E6; }
    .pf-tags-wrap { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; min-height: 28px; }
    .pf-tag {
      display: inline-flex; align-items: center; gap: 4px;
      background: #1710E6; color: #fff; border-radius: 999px;
      padding: 4px 10px; font-size: 11px;
    }
    .pf-tag-remove {
      background: none; border: none; color: #fff; cursor: pointer;
      font-size: 14px; line-height: 1; padding: 0; margin-left: 2px; opacity: 0.75;
    }
    .pf-tag-remove:hover { opacity: 1; }
    .pf-tag-input-row { display: flex; gap: 8px; }
    .pf-tag-input-row .pf-input { flex: 1; }
    .pf-tag-add-btn {
      padding: 10px 16px; background: #8DC651; color: #fff;
      border: none; border-radius: 8px; cursor: pointer;
      font-family: inherit; font-size: 12px; white-space: nowrap; font-weight: 700;
    }
    .pf-tag-add-btn:hover { background: #74b03c; }
    .pf-section-title {
      font-size: 11px; color: #6B7280; text-transform: uppercase;
      letter-spacing: 0.08em; border-bottom: 1px solid #d4d1c7;
      padding-bottom: 8px; margin: 28px 0 16px;
    }
    .pf-submit {
      width: 100%; padding: 14px; background: #1710E6; color: #f6f4ef;
      border: none; border-radius: 8px; font-family: inherit; font-size: 14px;
      font-weight: 700; cursor: pointer; letter-spacing: 0.03em;
      transition: background 0.15s; margin-top: 8px;
    }
    .pf-submit:hover   { background: #1208c8; }
    .pf-submit:disabled { background: #a0a0a0; cursor: not-allowed; }
    .pf-error { font-size: 11px; color: #ef4444; margin-top: 4px; display: none; }
    .pf-error.visible  { display: block; }

    /* Auto-assigned tag preview */
    .pf-tag-loc   { background: #1710E6; }
    .pf-tag-prof  { background: #8DC651; color: #1a1a1a; }
    .pf-tag-skill { background: #6b7280; }
    .pf-tag-preview-wrap { display: flex; flex-wrap: wrap; gap: 6px; min-height: 28px; }
    .pf-tag-hint { font-size: 11px; color: #9a8f82; font-style: italic; }

    .pf-success {
      background: #f0fdf4; border: 1.5px solid #86efac;
      border-radius: 8px; padding: 12px 16px;
      color: #166534; font-size: 13px; margin-top: 16px; display: none;
    }
    .pf-success.visible { display: block; }
  `;
  document.head.appendChild(style);
}

// ── Main export ────────────────────────────────────────────────────────────────

/**
 * Create and mount a profile form inside `container`.
 *
 * @param   {HTMLElement} container
 * @param   {Object}      options
 * @param   {Function}    [options.onSubmit]      async (profileData) => {}
 * @param   {Object}      [options.initialValues] Pre-fill values
 * @param   {string}      [options.apiBase]       Backend base URL
 * @returns {{ form: HTMLElement, getValues: Function, reset: Function }}
 */
export function createProfileForm(container, options = {}) {
  const { onSubmit, initialValues = {}, apiBase = '' } = options;

  injectStyles();

  let skillTags = (initialValues.skills ?? []).map(s =>
    typeof s === 'string' ? s : (s.label ?? s.skill ?? '')
  ).filter(Boolean);
  let photoFile = null;

  // ── Build form HTML ────────────────────────────────────────────

  const form = document.createElement('form');
  form.className = 'pf-form';
  form.noValidate = true;
  form.innerHTML = `
    <h2 class="pf-title">Create Your Profile</h2>

    <!-- Photo -->
    <div class="pf-field">
      <label class="pf-label">Profile Photo</label>
      <div class="pf-avatar-wrap">
        <div class="pf-avatar-preview" id="pf-avatar-preview">?</div>
        <div>
          <input type="file" id="pf-photo" name="photo" accept="image/*" style="display:none">
          <button type="button" class="pf-upload-btn" id="pf-photo-btn">Upload Photo</button>
          <div style="font-size:10px;color:#9a8f82;margin-top:4px;">JPG / PNG / WebP · max 5 MB</div>
        </div>
      </div>
    </div>

    <!-- Name -->
    <div class="pf-field">
      <label class="pf-label pf-required" for="pf-name">Full Name</label>
      <input class="pf-input" type="text" id="pf-name" name="name"
        placeholder="Jane Smith" maxlength="80"
        value="${escAttr(initialValues.name ?? '')}">
      <div class="pf-error" id="pf-name-err">Name is required.</div>
    </div>

    <!-- Tagline -->
    <div class="pf-field">
      <label class="pf-label pf-required" for="pf-tagline">Tagline</label>
      <input class="pf-input" type="text" id="pf-tagline" name="tagline"
        placeholder="Full-stack Developer · Open to remote work" maxlength="120"
        value="${escAttr(initialValues.tagline ?? initialValues.bio ?? '')}">
      <div class="pf-error" id="pf-tagline-err">Tagline is required.</div>
    </div>

    <!-- Profession -->
    <div class="pf-field">
      <label class="pf-label pf-required" for="pf-profession">Profession / Niche</label>
      <select class="pf-input pf-select" id="pf-profession" name="profession">
        <option value="">— Select your profession —</option>
        ${PROFESSIONS.map(p =>
          `<option value="${escAttr(p)}"
            ${(initialValues.profession === p || initialValues.niche === p) ? 'selected' : ''}>
            ${escHtml(p)}
          </option>`
        ).join('')}
      </select>
      <div class="pf-error" id="pf-profession-err">Please select a profession.</div>
    </div>

    <!-- Location -->
    <div class="pf-field">
      <label class="pf-label pf-required" for="pf-location">Location (City, Country)</label>
      <input class="pf-input" type="text" id="pf-location" name="location"
        placeholder="Lahore, Pakistan" maxlength="100"
        value="${escAttr(initialValues.location ?? initialValues.detected_location ?? '')}">
      <div class="pf-error" id="pf-location-err">Location is required.</div>
    </div>

    <!-- Experience -->
    <div class="pf-field">
      <label class="pf-label" for="pf-experience">Years of Experience</label>
      <input class="pf-input" type="number" id="pf-experience" name="experience_years"
        min="0" max="60" placeholder="3"
        value="${escAttr(String(initialValues.experience_years ?? ''))}" >
    </div>

    <!-- Skills -->
    <div class="pf-section-title">Skills</div>
    <div class="pf-field">
      <label class="pf-label" for="pf-skill-input">Add Skills (press Enter or click +)</label>
      <div class="pf-tag-input-row">
        <input class="pf-input" type="text" id="pf-skill-input"
          placeholder="e.g. Python, AWS, Figma">
        <button type="button" class="pf-tag-add-btn" id="pf-skill-add">+ Add</button>
      </div>
      <div class="pf-tags-wrap" id="pf-skills-display"></div>
    </div>

    <!-- Social Media -->
    <div class="pf-section-title">Social Media Handles</div>
    ${SOCIAL_PLATFORMS.map(p => `
      <div class="pf-field">
        <label class="pf-label" for="pf-${p.key}">${escHtml(p.label)}</label>
        <input class="pf-input" type="text" id="pf-${p.key}" name="${p.key}"
          placeholder="${escAttr(p.placeholder)}"
          value="${escAttr(initialValues[p.key] ?? '')}">
      </div>
    `).join('')}

    <!-- Auto-assigned Tag Preview -->
    <div class="pf-section-title">Profile Tags (Auto-assigned)</div>
    <div class="pf-field">
      <div id="pf-tag-preview" class="pf-tag-preview-wrap">
        <span class="pf-tag-hint">Fill in the form to preview your tags.</span>
      </div>
    </div>

    <button type="submit" class="pf-submit" id="pf-submit-btn">
      Create Profile →
    </button>
    <div class="pf-success" id="pf-success">Profile created successfully!</div>
  `;

  container.appendChild(form);

  // ── Photo handling ────────────────────────────────────────────

  const photoInput  = form.querySelector('#pf-photo');
  const avatarPreview = form.querySelector('#pf-avatar-preview');

  form.querySelector('#pf-photo-btn').addEventListener('click', () => photoInput.click());

  photoInput.addEventListener('change', () => {
    const file = photoInput.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Photo must be under 5 MB.'); return; }
    photoFile = file;
    const url = URL.createObjectURL(file);
    avatarPreview.innerHTML = `<img src="${url}" alt="avatar preview">`;
  });

  // Update avatar initials when name changes
  form.querySelector('#pf-name').addEventListener('input', () => {
    if (!photoFile) {
      const name    = form.querySelector('#pf-name').value.trim();
      const initials = name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?';
      avatarPreview.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:22px;color:#fff;">${initials}</div>`;
    }
  });

  // ── Skills tag input ──────────────────────────────────────────

  const skillInput   = form.querySelector('#pf-skill-input');
  const skillDisplay = form.querySelector('#pf-skills-display');

  function renderSkillTags() {
    skillDisplay.innerHTML = skillTags.map((tag, i) => `
      <span class="pf-tag">
        ${escHtml(tag)}
        <button type="button" class="pf-tag-remove" data-idx="${i}" aria-label="Remove ${escAttr(tag)}">×</button>
      </span>
    `).join('');
    skillDisplay.querySelectorAll('.pf-tag-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        skillTags.splice(Number(btn.dataset.idx), 1);
        renderSkillTags();
        updateTagPreview();
      });
    });
    updateTagPreview();
  }

  function addSkill(value) {
    const trimmed = value.trim();
    if (trimmed && !skillTags.includes(trimmed)) {
      skillTags.push(trimmed);
      renderSkillTags();
    }
    skillInput.value = '';
    skillInput.focus();
  }

  form.querySelector('#pf-skill-add').addEventListener('click', () => addSkill(skillInput.value));
  skillInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput.value); }
  });

  renderSkillTags();

  // ── Auto tag preview ──────────────────────────────────────────

  function updateTagPreview() {
    const profile = {
      location:   form.querySelector('#pf-location').value,
      profession: form.querySelector('#pf-profession').value,
      skills:     skillTags,
    };
    const tags = assignUserTags(profile);
    const previewEl = form.querySelector('#pf-tag-preview');

    if (!tags.length) {
      previewEl.innerHTML = '<span class="pf-tag-hint">Fill in the form to preview your tags.</span>';
      return;
    }

    previewEl.innerHTML = tags.map(t => {
      const cls = t.type === 'location' ? 'pf-tag-loc'
                : t.type === 'profession' ? 'pf-tag-prof'
                : 'pf-tag-skill';
      return `<span class="pf-tag ${cls}" title="${escAttr(t.type)}">${escHtml(t.value)}</span>`;
    }).join('');
  }

  ['#pf-location', '#pf-profession'].forEach(sel => {
    form.querySelector(sel).addEventListener('change', updateTagPreview);
    form.querySelector(sel).addEventListener('input',  updateTagPreview);
  });

  // ── Validation ────────────────────────────────────────────────

  function validate(data) {
    let valid = true;
    const checks = [
      { field: data.name,       errId: 'pf-name-err',       msg: 'Name is required.'              },
      { field: data.tagline,    errId: 'pf-tagline-err',     msg: 'Tagline is required.'           },
      { field: data.profession, errId: 'pf-profession-err',  msg: 'Please select a profession.'   },
      { field: data.location,   errId: 'pf-location-err',    msg: 'Location is required.'         },
    ];
    for (const { field, errId } of checks) {
      const el = form.querySelector(`#${errId}`);
      if (!field || !String(field).trim()) {
        el.classList.add('visible');
        valid = false;
      } else {
        el.classList.remove('visible');
      }
    }
    return valid;
  }

  // ── Get form values ───────────────────────────────────────────

  function getValues() {
    const data = {
      name:             form.querySelector('#pf-name').value.trim(),
      tagline:          form.querySelector('#pf-tagline').value.trim(),
      profession:       form.querySelector('#pf-profession').value,
      niche:            form.querySelector('#pf-profession').value,
      location:         form.querySelector('#pf-location').value.trim(),
      experience_years: parseInt(form.querySelector('#pf-experience').value, 10) || 0,
      skills:           [...skillTags],
    };
    SOCIAL_PLATFORMS.forEach(p => {
      data[p.key] = form.querySelector(`#pf-${p.key}`).value.trim();
    });
    data.tags = assignUserTags(data);
    return data;
  }

  // ── Submit handler ────────────────────────────────────────────

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = getValues();
    if (!validate(data)) return;

    const btn     = form.querySelector('#pf-submit-btn');
    const success = form.querySelector('#pf-success');
    btn.disabled  = true;
    btn.textContent = 'Saving…';

    try {
      // Upload photo if provided
      if (photoFile) {
        const fd = new FormData();
        fd.append('file', photoFile);
        const res = await fetch(`${apiBase}/api/talent/upload-photo`, { method: 'POST', body: fd });
        if (res.ok) {
          const json = await res.json();
          data.photo_url = json.url;
        }
      }

      await onSubmit?.(data);

      success.classList.add('visible');
      btn.textContent = 'Profile Saved ✓';
    } catch (err) {
      console.error('Profile form submission failed:', err);
      btn.disabled    = false;
      btn.textContent = 'Create Profile →';
      alert(`Save failed: ${err.message}`);
    }
  });

  return {
    form,
    getValues,
    reset() {
      form.reset();
      skillTags = [];
      photoFile  = null;
      avatarPreview.innerHTML = '?';
      renderSkillTags();
      form.querySelector('#pf-success').classList.remove('visible');
      const btn = form.querySelector('#pf-submit-btn');
      btn.disabled    = false;
      btn.textContent = 'Create Profile →';
    },
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function escAttr(str) {
  return String(str ?? '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
