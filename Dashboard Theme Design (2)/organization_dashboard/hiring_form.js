/**
 * hiring_form.js
 *
 * Hiring form UI builder for organizations.
 * Handles form creation, question management, candidate rendering,
 * response submission, and CSV export.
 *
 * Exports:
 *   createHiringFormBuilder(container, options) → { getPayload, reset, validate }
 *   renderFormForCandidate(container, form, options) → { getAnswers, submit }
 *   exportResponsesAsCSV(responses, filename)   → void
 */

import { submitHiringForm, buildHiringFormPayload, downloadFormResponsesCSV } from './organization_dashboard.js';

// ── Design tokens ──────────────────────────────────────────────────────────────

const C = {
  bg:     '#f6f4ef',
  blue:   '#1710E6',
  lime:   '#8DC651',
  border: '#d1d5db',
  text:   '#111827',
  muted:  '#6b7280',
  white:  '#ffffff',
  error:  '#ef4444',
  mono:   "'JetBrains Mono', monospace",
  serif:  "'Instrument Serif', serif",
};

const BASE_INPUT = `
  width: 100%;
  padding: 8px 12px;
  border: 1.5px solid ${C.border};
  border-radius: 6px;
  font-family: ${C.mono};
  font-size: 13px;
  background: ${C.white};
  color: ${C.text};
  box-sizing: border-box;
  outline: none;
  transition: border-color 0.15s;
`.trim();

function inputFocus(el) {
  el.style.borderColor = C.blue;
}
function inputBlur(el) {
  el.style.borderColor = C.border;
}
function applyBaseInput(el) {
  el.style.cssText += BASE_INPUT;
  el.addEventListener('focus', () => inputFocus(el));
  el.addEventListener('blur',  () => inputBlur(el));
}

function label(text, required = false) {
  const el = document.createElement('label');
  el.style.cssText = `
    display: block;
    font-family: ${C.mono};
    font-size: 12px;
    font-weight: 600;
    color: ${C.text};
    margin-bottom: 4px;
    letter-spacing: 0.03em;
  `.trim();
  el.innerHTML = required ? `${text} <span style="color:${C.error}">*</span>` : text;
  return el;
}

function errorMsg(text) {
  const el = document.createElement('p');
  el.style.cssText = `
    color: ${C.error};
    font-family: ${C.mono};
    font-size: 11px;
    margin: 3px 0 0 0;
  `.trim();
  el.textContent = text;
  return el;
}

function fieldWrap(children = []) {
  const div = document.createElement('div');
  div.style.marginBottom = '16px';
  children.forEach(c => div.appendChild(c));
  return div;
}

function btn(text, variant = 'primary') {
  const el = document.createElement('button');
  el.type = 'button';
  el.textContent = text;

  const styles = {
    primary: `background:${C.blue}; color:${C.white}; border:none;`,
    secondary: `background:${C.white}; color:${C.blue}; border:1.5px solid ${C.blue};`,
    danger: `background:${C.white}; color:${C.error}; border:1.5px solid ${C.error};`,
    lime: `background:${C.lime}; color:${C.white}; border:none;`,
  };

  el.style.cssText = `
    ${styles[variant] ?? styles.primary}
    padding: 8px 16px;
    border-radius: 6px;
    font-family: ${C.mono};
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s;
  `.trim();

  el.addEventListener('mouseenter', () => { el.style.opacity = '0.85'; });
  el.addEventListener('mouseleave', () => { el.style.opacity = '1'; });
  return el;
}

// ── Word / char limit counter ──────────────────────────────────────────────────

const WORD_LIMITS = {
  'short-text': 50,
  'long-text':  300,
  'textarea':   300,
  'text':       150,
  'choice':     null,
  'checkbox':   null,
};

function attachWordLimit(inputEl, limitWords) {
  if (!limitWords) return;

  const counter = document.createElement('div');
  counter.style.cssText = `
    font-family: ${C.mono};
    font-size: 10px;
    color: ${C.muted};
    text-align: right;
    margin-top: 2px;
  `.trim();

  function update() {
    const words = inputEl.value.trim().split(/\s+/).filter(Boolean).length;
    const over  = words > limitWords;
    counter.textContent = `${words} / ${limitWords} words`;
    counter.style.color = over ? C.error : C.muted;
  }

  update();
  inputEl.addEventListener('input', update);
  return counter;
}

// ── Single question builder ────────────────────────────────────────────────────

let questionIndex = 0;

function createQuestionBlock(initial = {}, onRemove) {
  questionIndex++;
  const idx = questionIndex;

  const wrap = document.createElement('div');
  wrap.style.cssText = `
    background: ${C.white};
    border: 1.5px solid ${C.border};
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 12px;
    position: relative;
  `.trim();

  // Header row
  const header = document.createElement('div');
  header.style.cssText = 'display:flex; align-items:center; gap:8px; margin-bottom:12px;';

  const idxBadge = document.createElement('span');
  idxBadge.style.cssText = `
    background: ${C.blue};
    color: ${C.white};
    font-family: ${C.mono};
    font-size: 11px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 12px;
  `.trim();
  idxBadge.textContent = `Q${idx}`;

  const typeSelect = document.createElement('select');
  applyBaseInput(typeSelect);
  typeSelect.style.width = 'auto';
  typeSelect.style.flexShrink = '0';
  [
    ['text',      'Short Text'],
    ['long-text', 'Long Text'],
    ['choice',    'Multiple Choice'],
    ['checkbox',  'Checkboxes'],
  ].forEach(([val, lbl]) => {
    const opt = document.createElement('option');
    opt.value       = val;
    opt.textContent = lbl;
    if (val === (initial.type ?? 'text')) opt.selected = true;
    typeSelect.appendChild(opt);
  });

  const removeBtn = btn('Remove', 'danger');
  removeBtn.style.marginLeft = 'auto';
  removeBtn.style.padding = '4px 10px';
  removeBtn.style.fontSize = '11px';
  removeBtn.addEventListener('click', () => {
    wrap.remove();
    if (onRemove) onRemove();
  });

  header.appendChild(idxBadge);
  header.appendChild(typeSelect);
  header.appendChild(removeBtn);
  wrap.appendChild(header);

  // Question text
  const questionInput = document.createElement('input');
  questionInput.type        = 'text';
  questionInput.placeholder = 'Enter your question…';
  questionInput.value       = initial.text ?? '';
  applyBaseInput(questionInput);

  const questionField = fieldWrap([label('Question', true), questionInput]);
  wrap.appendChild(questionField);

  // Required toggle
  const reqRow = document.createElement('div');
  reqRow.style.cssText = 'display:flex; align-items:center; gap:8px; margin-bottom:12px;';
  const reqCheck = document.createElement('input');
  reqCheck.type    = 'checkbox';
  reqCheck.checked = initial.required ?? true;
  reqCheck.style.accentColor = C.blue;
  const reqLabel = document.createElement('label');
  reqLabel.style.cssText = `font-family:${C.mono}; font-size:12px; color:${C.muted};`;
  reqLabel.textContent = 'Required';
  reqRow.appendChild(reqCheck);
  reqRow.appendChild(reqLabel);
  wrap.appendChild(reqRow);

  // Options container (for choice/checkbox)
  const optionsWrap = document.createElement('div');
  wrap.appendChild(optionsWrap);

  const optionInputs = [];

  function rebuildOptions() {
    optionsWrap.innerHTML = '';
    optionInputs.length   = 0;

    const type = typeSelect.value;
    if (type !== 'choice' && type !== 'checkbox') return;

    const optLabel = document.createElement('div');
    optLabel.style.cssText = `font-family:${C.mono}; font-size:12px; font-weight:600; margin-bottom:6px;`;
    optLabel.textContent = 'Answer options:';
    optionsWrap.appendChild(optLabel);

    const initialOpts = initial.options?.length ? initial.options : ['Option 1', 'Option 2'];
    initialOpts.forEach((opt, i) => addOption(opt));

    const addOptBtn = btn('+ Add option', 'secondary');
    addOptBtn.style.padding = '4px 10px';
    addOptBtn.style.fontSize = '11px';
    addOptBtn.style.marginTop = '4px';
    addOptBtn.addEventListener('click', () => addOption(''));
    optionsWrap.appendChild(addOptBtn);
  }

  function addOption(value = '') {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex; align-items:center; gap:6px; margin-bottom:6px;';

    const input = document.createElement('input');
    input.type        = 'text';
    input.value       = value;
    input.placeholder = 'Option text…';
    applyBaseInput(input);
    optionInputs.push(input);

    const del = document.createElement('button');
    del.type        = 'button';
    del.textContent = '×';
    del.style.cssText = `
      background: none;
      border: none;
      color: ${C.error};
      font-size: 18px;
      cursor: pointer;
      padding: 0 4px;
      line-height: 1;
    `.trim();
    del.addEventListener('click', () => {
      const i = optionInputs.indexOf(input);
      if (i !== -1) optionInputs.splice(i, 1);
      row.remove();
    });

    row.appendChild(input);
    row.appendChild(del);

    // Insert before the "+ Add option" button if it exists
    const addBtn = optionsWrap.querySelector('button');
    if (addBtn) {
      optionsWrap.insertBefore(row, addBtn);
    } else {
      optionsWrap.appendChild(row);
    }
  }

  typeSelect.addEventListener('change', rebuildOptions);
  rebuildOptions();

  // Expose getValues
  wrap.getValues = () => ({
    id:       `q_${idx}_${Date.now()}`,
    text:     questionInput.value.trim(),
    type:     typeSelect.value,
    required: reqCheck.checked,
    options:  optionInputs.map(i => i.value.trim()).filter(Boolean),
  });

  wrap.isValid = () => {
    if (!questionInput.value.trim()) {
      questionInput.style.borderColor = C.error;
      return false;
    }
    return true;
  };

  return wrap;
}

// ── Organization: Hiring form builder ─────────────────────────────────────────

/**
 * Render a full hiring form builder UI inside `container`.
 *
 * @param {HTMLElement} container      DOM node to mount into
 * @param {Object}      options
 *   @param {string[]}  options.targetUserIds  Pre-selected candidate IDs
 *   @param {Function}  options.onSuccess      Called with API response on submit
 *   @param {Function}  options.onError        Called with Error on failure
 *   @param {string}    options.apiBase        API base URL (default '')
 * @returns {{ getPayload, validate, reset }}
 */
export function createHiringFormBuilder(container, options = {}) {
  const { targetUserIds = [], onSuccess, onError, apiBase = '' } = options;

  container.innerHTML = '';
  container.style.cssText = `
    background: ${C.bg};
    padding: 24px;
    border-radius: 12px;
    font-family: ${C.mono};
    max-width: 780px;
  `.trim();

  // ── Form meta section ──────────────────────────────────────────────────────

  const metaSection = document.createElement('div');
  metaSection.style.marginBottom = '28px';

  const metaTitle = document.createElement('h3');
  metaTitle.style.cssText = `
    font-family: ${C.serif};
    font-size: 20px;
    color: ${C.blue};
    margin: 0 0 16px 0;
  `.trim();
  metaTitle.textContent = 'Job Details';
  metaSection.appendChild(metaTitle);

  function textInput(placeholder, initial = '') {
    const el = document.createElement('input');
    el.type        = 'text';
    el.placeholder = placeholder;
    el.value       = initial;
    applyBaseInput(el);
    return el;
  }

  function textArea(placeholder, rows = 4, initial = '') {
    const el = document.createElement('textarea');
    el.placeholder = placeholder;
    el.rows        = rows;
    el.value       = initial;
    applyBaseInput(el);
    el.style.resize = 'vertical';
    return el;
  }

  const jobTitleInput  = textInput('Job title (e.g. Senior Frontend Engineer)');
  const companyInput   = textInput('Company / Organisation name');
  const deadlineInput  = document.createElement('input');
  deadlineInput.type   = 'date';
  applyBaseInput(deadlineInput);
  const jobDescInput   = textArea('Job description — paste your JD here. The more detail, the better the candidate match.', 6);

  metaSection.appendChild(fieldWrap([label('Job Title', true), jobTitleInput]));
  metaSection.appendChild(fieldWrap([label('Company'), companyInput]));
  metaSection.appendChild(fieldWrap([label('Application Deadline'), deadlineInput]));
  metaSection.appendChild(fieldWrap([label('Job Description'), jobDescInput]));
  container.appendChild(metaSection);

  // ── Questions section ──────────────────────────────────────────────────────

  const qSection = document.createElement('div');
  qSection.style.marginBottom = '24px';

  const qTitle = document.createElement('h3');
  qTitle.style.cssText = `
    font-family: ${C.serif};
    font-size: 20px;
    color: ${C.blue};
    margin: 0 0 4px 0;
  `.trim();
  qTitle.textContent = 'Screening Questions';

  const qSubtitle = document.createElement('p');
  qSubtitle.style.cssText = `font-size:12px; color:${C.muted}; margin:0 0 14px 0;`;
  qSubtitle.textContent = 'Add questions candidates must answer when submitting this form.';

  const questionsContainer = document.createElement('div');

  qSection.appendChild(qTitle);
  qSection.appendChild(qSubtitle);
  qSection.appendChild(questionsContainer);
  container.appendChild(qSection);

  // Default starter questions
  const DEFAULT_QUESTIONS = [
    { text: 'Why are you interested in this role?', type: 'long-text', required: true },
    { text: 'What is your current notice period?', type: 'text', required: true },
    { text: 'Are you open to relocation?', type: 'choice', required: false, options: ['Yes', 'No', 'Depends on the offer'] },
  ];

  const questionBlocks = [];

  function addQuestion(initial = {}) {
    const block = createQuestionBlock(initial, () => {
      const i = questionBlocks.indexOf(block);
      if (i !== -1) questionBlocks.splice(i, 1);
    });
    questionBlocks.push(block);
    questionsContainer.appendChild(block);
  }

  DEFAULT_QUESTIONS.forEach(q => addQuestion(q));

  const addQBtn = btn('+ Add question', 'secondary');
  addQBtn.style.marginBottom = '24px';
  addQBtn.addEventListener('click', () => addQuestion());
  container.appendChild(addQBtn);

  // ── Candidates section ─────────────────────────────────────────────────────

  const candidatesNote = document.createElement('p');
  candidatesNote.style.cssText = `
    font-size: 12px;
    color: ${C.muted};
    margin: 0 0 24px 0;
    background: ${C.white};
    border: 1px solid ${C.border};
    border-radius: 6px;
    padding: 10px 14px;
  `.trim();
  candidatesNote.innerHTML = `
    <strong style="color:${C.text}">Sending to:</strong>
    ${targetUserIds.length
      ? `${targetUserIds.length} selected candidate${targetUserIds.length > 1 ? 's' : ''}`
      : '<em>No candidates selected — go to the Hire Talent tab and use "Send Form" buttons to target candidates.</em>'
    }
  `.trim();
  container.appendChild(candidatesNote);

  // ── Submit / status ────────────────────────────────────────────────────────

  const statusEl = document.createElement('p');
  statusEl.style.cssText = `
    font-size: 12px;
    margin: 0 0 12px 0;
    min-height: 18px;
    color: ${C.muted};
  `.trim();

  const submitBtn = btn('Send Hiring Form', 'lime');
  submitBtn.style.marginRight = '10px';

  const resetBtnEl = btn('Clear form', 'secondary');

  const footerRow = document.createElement('div');
  footerRow.style.cssText = 'display:flex; align-items:center; gap:12px; flex-wrap:wrap;';
  footerRow.appendChild(submitBtn);
  footerRow.appendChild(resetBtnEl);

  container.appendChild(statusEl);
  container.appendChild(footerRow);

  // ── Logic ──────────────────────────────────────────────────────────────────

  function getPayload() {
    const formMeta = {
      jobTitle:       jobTitleInput.value.trim(),
      jobDescription: jobDescInput.value.trim(),
      company:        companyInput.value.trim(),
      deadline:       deadlineInput.value || null,
    };
    const questions = questionBlocks.map(b => b.getValues()).filter(q => q.text);
    return buildHiringFormPayload(formMeta, questions, targetUserIds);
  }

  function validate() {
    let ok = true;

    if (!jobTitleInput.value.trim()) {
      jobTitleInput.style.borderColor = C.error;
      ok = false;
    }

    questionBlocks.forEach(b => {
      if (!b.isValid()) ok = false;
    });

    return ok;
  }

  function reset() {
    jobTitleInput.value  = '';
    companyInput.value   = '';
    deadlineInput.value  = '';
    jobDescInput.value   = '';
    questionsContainer.innerHTML = '';
    questionBlocks.length = 0;
    statusEl.textContent = '';
    questionIndex = 0;
    DEFAULT_QUESTIONS.forEach(q => addQuestion(q));
  }

  submitBtn.addEventListener('click', async () => {
    if (!validate()) {
      statusEl.style.color  = C.error;
      statusEl.textContent  = 'Please fill in all required fields.';
      return;
    }

    submitBtn.disabled    = true;
    submitBtn.textContent = 'Sending…';
    statusEl.style.color  = C.muted;
    statusEl.textContent  = 'Submitting form…';

    try {
      const payload = getPayload();
      const result  = await submitHiringForm(payload, { apiBase });
      statusEl.style.color  = C.lime;
      statusEl.textContent  = `Form sent! ID: ${result.form_id} · Notified: ${result.notified_count ?? 0} candidate(s)`;
      if (onSuccess) onSuccess(result);
    } catch (err) {
      statusEl.style.color  = C.error;
      statusEl.textContent  = `Error: ${err.message}`;
      if (onError) onError(err);
    } finally {
      submitBtn.disabled    = false;
      submitBtn.textContent = 'Send Hiring Form';
    }
  });

  resetBtnEl.addEventListener('click', reset);

  return { getPayload, validate, reset };
}

// ── Candidate: form renderer ───────────────────────────────────────────────────

/**
 * Render a hiring form for a candidate to fill in.
 *
 * @param {HTMLElement} container  DOM node to mount into
 * @param {Object}      form       Form object from GET /api/hiring/forms/:id
 * @param {Object}      options
 *   @param {Function}  options.onSuccess     Called with response on submit
 *   @param {Function}  options.onError       Called with Error on failure
 *   @param {string}    options.apiBase
 *   @param {Object}    options.candidateInfo { name?, email? } prefill
 * @returns {{ getAnswers, submit }}
 */
export function renderFormForCandidate(container, form, options = {}) {
  const { onSuccess, onError, apiBase = '', candidateInfo = {} } = options;

  container.innerHTML = '';
  container.style.cssText = `
    background: ${C.white};
    padding: 28px;
    border-radius: 12px;
    font-family: ${C.mono};
    max-width: 680px;
    border: 1.5px solid ${C.border};
  `.trim();

  // Header
  const titleEl = document.createElement('h2');
  titleEl.style.cssText = `
    font-family: ${C.serif};
    font-size: 22px;
    color: ${C.blue};
    margin: 0 0 4px 0;
  `.trim();
  titleEl.textContent = form.job_title ?? 'Hiring Form';

  const companyEl = document.createElement('p');
  companyEl.style.cssText = `font-size:13px; color:${C.muted}; margin:0 0 20px 0;`;
  companyEl.textContent = form.company
    ? `${form.company}${form.deadline ? ` · Deadline: ${form.deadline}` : ''}`
    : '';

  const descEl = document.createElement('p');
  descEl.style.cssText = `
    font-size: 13px;
    color: ${C.text};
    background: ${C.bg};
    border-radius: 6px;
    padding: 12px;
    margin: 0 0 24px 0;
    white-space: pre-wrap;
  `.trim();
  descEl.textContent = form.job_description ?? '';

  container.appendChild(titleEl);
  if (companyEl.textContent) container.appendChild(companyEl);
  if (descEl.textContent) container.appendChild(descEl);

  // Candidate info
  const nameInput  = document.createElement('input');
  nameInput.type        = 'text';
  nameInput.placeholder = 'Your full name';
  nameInput.value       = candidateInfo.name ?? '';
  applyBaseInput(nameInput);

  const emailInput = document.createElement('input');
  emailInput.type        = 'email';
  emailInput.placeholder = 'Your email address';
  emailInput.value       = candidateInfo.email ?? '';
  applyBaseInput(emailInput);

  container.appendChild(fieldWrap([label('Full Name', true), nameInput]));
  container.appendChild(fieldWrap([label('Email', true), emailInput]));

  // Questions
  const questions = Array.isArray(form.questions) ? form.questions : [];
  const answerInputs = [];

  questions.forEach((q, qi) => {
    const qWrap = document.createElement('div');
    qWrap.style.cssText = `
      background: ${C.bg};
      border-radius: 8px;
      padding: 14px;
      margin-bottom: 16px;
    `.trim();

    const qLabel = document.createElement('p');
    qLabel.style.cssText = `
      font-size: 13px;
      font-weight: 600;
      color: ${C.text};
      margin: 0 0 8px 0;
    `.trim();
    qLabel.innerHTML = `${qi + 1}. ${q.text}${q.required ? ` <span style="color:${C.error}">*</span>` : ''}`;
    qWrap.appendChild(qLabel);

    let inputEl;

    if (q.type === 'choice') {
      const select = document.createElement('select');
      applyBaseInput(select);
      const blank = document.createElement('option');
      blank.value = ''; blank.textContent = '— Select —';
      select.appendChild(blank);
      (q.options ?? []).forEach(opt => {
        const o = document.createElement('option');
        o.value       = opt;
        o.textContent = opt;
        select.appendChild(o);
      });
      inputEl = select;
    } else if (q.type === 'checkbox') {
      const checkWrap = document.createElement('div');
      const values = [];
      (q.options ?? []).forEach(opt => {
        const row = document.createElement('label');
        row.style.cssText = `display:flex; align-items:center; gap:8px; margin-bottom:6px; cursor:pointer;`;
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.value = opt;
        cb.style.accentColor = C.blue;
        cb.addEventListener('change', () => {
          if (cb.checked && !values.includes(opt)) values.push(opt);
          else { const i = values.indexOf(opt); if (i !== -1) values.splice(i, 1); }
        });
        const span = document.createElement('span');
        span.style.cssText = `font-size:13px; color:${C.text};`;
        span.textContent = opt;
        row.appendChild(cb);
        row.appendChild(span);
        checkWrap.appendChild(row);
      });
      checkWrap._getValues = () => values.join(', ');
      inputEl = checkWrap;
    } else if (q.type === 'long-text' || q.type === 'textarea') {
      const ta = document.createElement('textarea');
      ta.placeholder = 'Your answer…';
      ta.rows        = 5;
      applyBaseInput(ta);
      ta.style.resize = 'vertical';
      const wordLimit = WORD_LIMITS[q.type];
      if (wordLimit) {
        const counter = attachWordLimit(ta, wordLimit);
        if (counter) qWrap.appendChild(qLabel); // already appended
        inputEl = ta;
        qWrap.appendChild(ta);
        if (counter) qWrap.appendChild(counter);
        answerInputs.push({ questionId: q.id, el: ta, required: q.required });
        container.appendChild(qWrap);
        return; // skip generic append below
      }
      inputEl = ta;
    } else {
      const inp = document.createElement('input');
      inp.type        = 'text';
      inp.placeholder = 'Your answer…';
      applyBaseInput(inp);
      inputEl = inp;
    }

    qWrap.appendChild(inputEl);
    answerInputs.push({ questionId: q.id, el: inputEl, required: q.required });
    container.appendChild(qWrap);
  });

  // Status + submit
  const statusEl = document.createElement('p');
  statusEl.style.cssText = `font-size:12px; color:${C.muted}; margin:12px 0 0 0; min-height:18px;`;

  const submitBtn = btn('Submit Application', 'lime');
  submitBtn.style.marginTop = '12px';

  container.appendChild(submitBtn);
  container.appendChild(statusEl);

  function getAnswers() {
    return answerInputs.map(({ questionId, el }) => {
      const answer = typeof el._getValues === 'function'
        ? el._getValues()
        : el.value ?? '';
      return { question_id: questionId, answer: String(answer).trim() };
    });
  }

  async function submit() {
    // Validate required
    let valid = true;

    if (!nameInput.value.trim()) {
      nameInput.style.borderColor = C.error;
      valid = false;
    }
    if (!emailInput.value.trim()) {
      emailInput.style.borderColor = C.error;
      valid = false;
    }

    answerInputs.forEach(({ el, required }) => {
      if (!required) return;
      const val = typeof el._getValues === 'function' ? el._getValues() : el.value ?? '';
      if (!val.trim()) {
        if (el.style) el.style.borderColor = C.error;
        valid = false;
      }
    });

    if (!valid) {
      statusEl.style.color = C.error;
      statusEl.textContent = 'Please fill in all required fields.';
      return null;
    }

    submitBtn.disabled    = true;
    submitBtn.textContent = 'Submitting…';
    statusEl.style.color  = C.muted;
    statusEl.textContent  = 'Sending your application…';

    const payload = {
      answers:         getAnswers(),
      candidate_name:  nameInput.value.trim(),
      candidate_email: emailInput.value.trim(),
    };

    try {
      const res = await fetch(`${apiBase}/api/hiring/forms/${form.id}/respond`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail ?? res.statusText);
      }

      const result = await res.json();
      statusEl.style.color  = C.lime;
      statusEl.textContent  = 'Application submitted! We will be in touch.';
      submitBtn.textContent = '✓ Submitted';
      if (onSuccess) onSuccess(result);
      return result;
    } catch (err) {
      statusEl.style.color  = C.error;
      statusEl.textContent  = `Submission failed: ${err.message}`;
      submitBtn.disabled    = false;
      submitBtn.textContent = 'Submit Application';
      if (onError) onError(err);
      return null;
    }
  }

  submitBtn.addEventListener('click', submit);

  return { getAnswers, submit };
}

// ── CSV export (client-side) ───────────────────────────────────────────────────

function csvCell(value) {
  const str = String(value ?? '').replace(/"/g, '""');
  return /[,"\r\n]/.test(str) ? `"${str}"` : str;
}

/**
 * Export an array of form response objects to a CSV file (browser download).
 *
 * @param {Array}  responses  From GET /api/hiring/forms/:id/responses
 * @param {string} filename   Default: 'hiring_responses.csv'
 */
export function exportResponsesAsCSV(responses = [], filename = 'hiring_responses.csv') {
  if (!responses.length) {
    console.warn('[hiring_form] No responses to export.');
    return;
  }

  // Core columns
  const coreKeys  = ['candidate_name', 'candidate_email', 'submitted_at'];

  // Flatten question IDs from all responses
  const allQIds = [];
  for (const r of responses) {
    const answers = Array.isArray(r.answers) ? r.answers : [];
    for (const a of answers) {
      if (a.question_id && !allQIds.includes(a.question_id)) {
        allQIds.push(a.question_id);
      }
    }
  }

  const headers = [
    'Candidate Name',
    'Email',
    'Submitted At',
    ...allQIds.map(id => `Q: ${id}`),
  ];

  const rows = responses.map(r => {
    const answers = Array.isArray(r.answers) ? r.answers : [];
    const ansMap  = Object.fromEntries(answers.map(a => [a.question_id, a.answer ?? '']));
    return [
      r.candidate_name  ?? '',
      r.candidate_email ?? '',
      r.submitted_at    ?? '',
      ...allQIds.map(id => ansMap[id] ?? ''),
    ].map(csvCell).join(',');
  });

  const bom = '﻿'; // UTF-8 BOM for Excel
  const csv = bom + [headers.map(csvCell).join(','), ...rows].join('\r\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Convenience wrapper — download the pre-built CSV from the backend.
 *
 * @param {string} formId
 * @param {Object} options  { apiBase?, filename? }
 */
export async function downloadBackendCSV(formId, options = {}) {
  return downloadFormResponsesCSV(formId, options);
}
