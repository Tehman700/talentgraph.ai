/**
 * profile_card.js
 *
 * Renders user profile cards in two modes:
 *   1. HTML string  → for react-globe.gl pointLabel (globe tooltips)
 *   2. Floating DOM element → for custom hover cards anywhere on the page
 *
 * Exports:
 *   buildProfileCardHTML(user)          → HTML string for globe tooltips
 *   showFloatingCard(user, clientX, clientY) → mounts a floating card
 *   hideFloatingCard()                  → removes the floating card
 *   initHoverCards(container, users)    → wires hover events on [data-user-id] elements
 */

import { getShareableResumeLink } from '../globe_visualization.js';

// ── Platform verification (from preferred_platforms.json) ─────────────────────

// Maps profession → primary platform. When the user has that platform connected
// we render a verified badge on the card.
const PROFESSION_PRIMARY_PLATFORM = {
  'Frontend Development':  'github',
  'Backend Engineering':   'github',
  'Mobile Development':    'github',
  'DevOps & Cloud':        'linkedin',
  'Data Science & ML':     'kaggle',
  'UX & Design':           'behance',
  'Security':              'linkedin',
  'Blockchain':            'github',
  'Game Development':      'github',
  'Agriculture':           'linkedin',
  'Healthcare':            'linkedin',
  'Education':             'linkedin',
  'Finance':               'linkedin',
  'Construction':          'linkedin',
  'Manufacturing':         'linkedin',
  'Retail':                'linkedin',
  'Hospitality':           'linkedin',
};

function getPrimaryPlatform(user) {
  const prof = user.profession ?? user.niche ?? user.occupation ?? '';
  return PROFESSION_PRIMARY_PLATFORM[prof] ?? null;
}

function hasPlatformConnected(user, platform) {
  if (!platform) return false;
  switch (platform) {
    case 'github':    return !!(user.github_username);
    case 'linkedin':  return !!(user.linkedin_url);
    case 'behance':   return !!(user.behance_url);
    case 'dribbble':  return !!(user.dribbble_url);
    case 'kaggle':    return !!(user.kaggle_url ?? user.kaggle_username);
    case 'portfolio': return !!(user.portfolio_url);
    default:          return false;
  }
}

function platformLabel(platform) {
  const labels = {
    github:    'GitHub',
    linkedin:  'LinkedIn',
    behance:   'Behance',
    dribbble:  'Dribbble',
    kaggle:    'Kaggle',
    portfolio: 'Portfolio',
  };
  return labels[platform] ?? platform;
}

// ── Design tokens (match InteractiveGlobe theme) ───────────────────────────────

const T = {
  bg:      '#f6f4ef',
  blue:    '#1710E6',
  lime:    '#8DC651',
  text:    '#1a1a1a',
  muted:   '#6B7280',
  white:   '#ffffff',
  border:  '2px solid #8DC651',
  font:    "'JetBrains Mono', monospace",
  serif:   "'Instrument Serif', serif",
  shadow:  '0 8px 28px rgba(141,198,81,0.25)',
};

// ── Globe tooltip HTML ─────────────────────────────────────────────────────────

/**
 * Build an HTML string for a react-globe.gl `pointLabel` tooltip.
 * All fields are optional — the card degrades gracefully.
 *
 * @param {Object} user  Talent profile
 * @returns {string}     HTML string
 */
export function buildProfileCardHTML(user) {
  const name        = esc(user.name ?? 'Anonymous');
  const tagline     = esc(user.tagline ?? user.occupation ?? user.niche ?? user.profession ?? '');
  const location    = [user.city, user.country].filter(Boolean).map(esc).join(', ');
  const skills      = normalizeSkills(user.skills).slice(0, 4).map(esc);
  const expYears    = user.experience_years ?? user.experienceYears ?? null;
  const matchScore  = resolveMatchScore(user);
  const resumeUrl   = user.resumeUrl ?? user.resume_url ?? getShareableResumeLink(user);

  const initials = (user.name ?? '?')
    .split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?';

  const avatarInner = user.photo_url
    ? `<img src="${esc(user.photo_url)}" alt="${name}"
           style="width:100%;height:100%;object-fit:cover;display:block;">`
    : `<div style="width:100%;height:100%;display:flex;align-items:center;
                   justify-content:center;font-weight:700;font-size:16px;color:#fff;">
         ${initials}
       </div>`;

  // Platform verification badge
  const primaryPlatform = getPrimaryPlatform(user);
  const isVerified      = hasPlatformConnected(user, primaryPlatform);
  const verifiedBadge   = isVerified
    ? `<span title="Primary platform verified: ${platformLabel(primaryPlatform)}"
             style="display:inline-flex;align-items:center;gap:3px;
                    background:${T.lime};color:#1a1a1a;
                    font-size:8px;font-weight:700;padding:2px 6px;
                    border-radius:10px;margin-left:6px;vertical-align:middle;">
         ✓ ${esc(platformLabel(primaryPlatform))}
       </span>`
    : '';

  const socialBlock = buildSocialPills(user);
  const skillPills  = skills.map(s =>
    `<span style="background:${T.blue};color:#fff;padding:3px 7px;
                  border-radius:4px;font-size:9px;text-transform:uppercase;
                  letter-spacing:0.3px;">${s}</span>`
  ).join('');

  // Resume CTA — prominent two-row block
  const resumeBlock = resumeUrl ? `
    <div style="margin-top:12px;border-top:1px solid #e5e7eb;padding-top:10px;">
      <div style="font-size:9px;font-weight:600;color:${T.muted};
                  text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">
        ATS Resume
      </div>
      <div style="display:flex;gap:6px;">
        <a href="${esc(resumeUrl)}" target="_blank" rel="noopener"
           style="flex:1;display:block;padding:8px 10px;
                  background:${T.blue};color:#fff;border-radius:6px;
                  font-size:10px;font-weight:700;text-align:center;
                  text-decoration:none;letter-spacing:0.05em;">
          View Resume ↗
        </a>
        <button onclick="(function(btn){
                   navigator.clipboard.writeText('${esc(resumeUrl)}').then(function(){
                     btn.textContent='Copied!';
                     setTimeout(function(){btn.textContent='Copy Link';},1500);
                   });
                 })(this)"
                style="padding:8px 10px;background:${T.white};color:${T.blue};
                       border:1.5px solid ${T.blue};border-radius:6px;
                       font-size:10px;font-weight:700;cursor:pointer;
                       white-space:nowrap;letter-spacing:0.03em;">
          Copy Link
        </button>
      </div>
    </div>
  ` : '';

  return `
    <div style="
      background:${T.bg};padding:16px;border-radius:14px;
      border:${T.border};font-family:${T.font};
      min-width:240px;max-width:288px;
      box-shadow:${T.shadow};
    ">
      <!-- Header: avatar + name + tagline + location -->
      <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:12px;">
        <div style="
          width:48px;height:48px;border-radius:50%;flex-shrink:0;overflow:hidden;
          background:${T.blue};border:2px solid ${T.lime};
        ">${avatarInner}</div>
        <div style="flex:1;min-width:0;">
          <div style="
            font-family:${T.serif};font-weight:700;font-size:15px;color:${T.text};
            white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
          ">${name}${verifiedBadge}</div>
          ${tagline
            ? `<div style="color:${T.blue};font-size:11px;font-weight:600;margin-top:2px;">${tagline}</div>`
            : ''}
          ${location
            ? `<div style="color:${T.muted};font-size:10px;margin-top:2px;">${location}</div>`
            : ''}
        </div>
      </div>

      <!-- Stats: experience + match -->
      ${(expYears != null || matchScore != null) ? `
        <div style="display:flex;gap:8px;margin-bottom:10px;">
          ${expYears != null ? `
            <div style="background:${T.white};padding:6px 10px;border-radius:6px;flex:1;">
              <div style="color:${T.muted};font-size:9px;text-transform:uppercase;">Exp</div>
              <div style="color:${T.blue};font-size:13px;font-weight:700;">${expYears}y</div>
            </div>` : ''}
          ${matchScore != null ? `
            <div style="background:${T.white};padding:6px 10px;border-radius:6px;flex:1;">
              <div style="color:${T.muted};font-size:9px;text-transform:uppercase;">Match</div>
              <div style="color:${T.lime};font-size:13px;font-weight:700;">${matchScore}%</div>
            </div>` : ''}
        </div>
      ` : ''}

      <!-- Skills -->
      ${skills.length ? `
        <div style="color:${T.blue};font-size:9px;font-weight:600;
                    margin-bottom:5px;text-transform:uppercase;letter-spacing:0.05em;">
          Skills
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px;">
          ${skillPills}
        </div>
      ` : ''}

      <!-- Social links -->
      ${socialBlock}

      <!-- Resume CTA -->
      ${resumeBlock}
    </div>
  `;
}

// ── Social link pills ──────────────────────────────────────────────────────────

function buildSocialPills(user) {
  const links = [];

  if (user.linkedin_url) {
    links.push({ href: user.linkedin_url, label: 'LinkedIn', bg: '#0A66C2', icon: 'in' });
  }
  if (user.github_username) {
    const href = user.github_username.startsWith('http')
      ? user.github_username
      : `https://github.com/${user.github_username}`;
    links.push({ href, label: 'GitHub', bg: '#24292e', icon: 'gh' });
  }
  if (user.portfolio_url) {
    links.push({ href: user.portfolio_url, label: 'Portfolio', bg: T.lime, icon: '↗', textColor: '#1a1a1a' });
  }
  if (user.twitter_handle) {
    const handle = user.twitter_handle.replace(/^@/, '');
    links.push({ href: `https://twitter.com/${handle}`, label: 'Twitter', bg: '#1DA1F2', icon: 'X' });
  }
  if (user.behance_url) {
    links.push({ href: user.behance_url, label: 'Behance', bg: '#1769ff', icon: 'Be' });
  }
  if (user.dribbble_url) {
    links.push({ href: user.dribbble_url, label: 'Dribbble', bg: '#ea4c89', icon: '◉' });
  }

  if (!links.length) return '';

  const pills = links.map(l => {
    const color = l.textColor ?? '#fff';
    return `<a href="${esc(l.href)}" target="_blank" rel="noopener"
               style="display:inline-flex;align-items:center;gap:4px;
                      padding:4px 9px;background:${l.bg};color:${color};
                      border-radius:5px;font-size:9px;font-weight:700;
                      text-decoration:none;letter-spacing:0.03em;">
               ${l.icon}&nbsp;${l.label}
             </a>`;
  }).join('');

  return `<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:4px;">${pills}</div>`;
}

// ── Floating DOM card ──────────────────────────────────────────────────────────

let _floatingCard = null;

function injectCardAnimation() {
  if (document.getElementById('pf-card-styles')) return;
  const style = document.createElement('style');
  style.id = 'pf-card-styles';
  style.textContent = `
    @keyframes pfCardIn {
      from { opacity: 0; transform: translateY(6px) scale(0.97); }
      to   { opacity: 1; transform: none; }
    }
    .pf-floating-card { animation: pfCardIn 0.15s ease; pointer-events: auto; }
  `;
  document.head.appendChild(style);
}

/**
 * Mount a floating profile card near the given screen coordinates.
 * The card is positioned to stay within the viewport.
 *
 * @param   {Object} user     Talent profile
 * @param   {number} clientX  Mouse X coordinate
 * @param   {number} clientY  Mouse Y coordinate
 * @returns {HTMLElement}     The mounted card element
 */
export function showFloatingCard(user, clientX, clientY) {
  hideFloatingCard();
  injectCardAnimation();

  const wrapper = document.createElement('div');
  wrapper.className = 'pf-floating-card';
  Object.assign(wrapper.style, {
    position:  'fixed',
    zIndex:    '9999',
    top:       `${clientY + 14}px`,
    left:      `${clientX + 14}px`,
  });
  wrapper.innerHTML = buildProfileCardHTML(user);

  document.body.appendChild(wrapper);
  _floatingCard = wrapper;

  // Keep inside viewport
  requestAnimationFrame(() => {
    if (!wrapper.isConnected) return;
    const rect = wrapper.getBoundingClientRect();
    if (rect.right  > window.innerWidth)  wrapper.style.left = `${clientX - rect.width  - 14}px`;
    if (rect.bottom > window.innerHeight) wrapper.style.top  = `${clientY - rect.height - 14}px`;
  });

  return wrapper;
}

/**
 * Remove the floating profile card if one is mounted.
 */
export function hideFloatingCard() {
  if (_floatingCard) {
    _floatingCard.remove();
    _floatingCard = null;
  }
}

/**
 * Update the floating card position (call on mousemove).
 *
 * @param {number} clientX
 * @param {number} clientY
 */
export function moveFloatingCard(clientX, clientY) {
  if (!_floatingCard) return;
  _floatingCard.style.top  = `${clientY + 14}px`;
  _floatingCard.style.left = `${clientX + 14}px`;
}

// ── Auto-wire hover cards on a container ──────────────────────────────────────

/**
 * Wire profile-card hover events on a container whose children carry
 * `data-user-id` attributes.
 *
 * @param {HTMLElement} container   Parent element
 * @param {Array}       users       Array of profile objects
 */
export function initHoverCards(container, users) {
  const byId = Object.fromEntries(users.map(u => [String(u.id ?? u.profile_slug), u]));

  container.addEventListener('mouseover', (e) => {
    const el = e.target.closest('[data-user-id]');
    if (!el) return;
    const user = byId[el.dataset.userId];
    if (user) showFloatingCard(user, e.clientX, e.clientY);
  });

  container.addEventListener('mousemove', (e) => {
    moveFloatingCard(e.clientX, e.clientY);
  });

  container.addEventListener('mouseout', (e) => {
    const el = e.target.closest('[data-user-id]');
    if (el && !el.contains(e.relatedTarget)) hideFloatingCard();
  });
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function normalizeSkills(skills) {
  if (!Array.isArray(skills)) return [];
  return skills
    .map(s => typeof s === 'string' ? s : (s.label ?? s.skill ?? ''))
    .filter(Boolean);
}

function resolveMatchScore(user) {
  const raw = user.match_score ?? user.matchScore ?? null;
  if (raw == null) return null;
  return Math.round(Number(raw) * (Number(raw) <= 1 ? 100 : 1));
}
