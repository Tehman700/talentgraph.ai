/**
 * MainDashboard.tsx
 *
 * Primary dashboard integrating:
 *  - Talent Network mode: globe + profile cards, user networking
 *  - Hire Talent mode: globe + ranked candidates with bulk selection + apply form
 *  - My Dashboard mode: user/org personal management panel
 */

import { useState, useMemo, useCallback } from 'react';
import {
  Globe2, Users, Briefcase, LayoutDashboard, Search, Filter,
  X, ExternalLink, Send, Download, Plus, ChevronRight,
  Linkedin, Github, Mail, Star, Award, MapPin, Clock, Check,
  CheckSquare, Square, Bell, FileText, Trash2,
} from 'lucide-react';
import { InteractiveGlobe, DEMO_WORKERS } from './InteractiveGlobe';
import type { Worker } from './InteractiveGlobe';

// ── Types ─────────────────────────────────────────────────────────────────────

type Mode      = 'talent' | 'hire' | 'dashboard';
type UserType  = 'user' | 'org';
type DashTab   = 'overview' | 'forms' | 'connections' | 'jobs';

interface Filters {
  location:    string;
  profession:  string;
  skill:       string;
  minExp:      number;
  education:   string;
}

interface HiringQuestion {
  id:      string;
  text:    string;
  type:    'text' | 'choice';
  options: string[];
}

interface HiringFormState {
  jobTitle:       string;
  jobDescription: string;
  company:        string;
  requiredSkills: string;
  minExperience:  number;
  questions:      HiringQuestion[];
}

interface BulkSendStatus {
  phase:   'idle' | 'sending' | 'done' | 'error';
  formId?: string;
  count:   number;
  error?:  string;
}

// ── Shared design tokens ───────────────────────────────────────────────────────

const C = {
  bg:     '#f6f4ef',
  blue:   '#1710E6',
  lime:   '#8DC651',
  text:   '#1a1a1a',
  muted:  '#6B7280',
  white:  '#ffffff',
  border: '#d4d1c7',
  red:    '#ef4444',
  amber:  '#f59e0b',
  mono:   "'JetBrains Mono', monospace" as const,
  serif:  "'Instrument Serif', serif"   as const,
};

const ALL_LOCATIONS   = ['all', ...Array.from(new Set(DEMO_WORKERS.map(w => w.country)))];
const ALL_PROFESSIONS = ['all', ...Array.from(new Set(DEMO_WORKERS.map(w => w.sector)))];
const ALL_SKILLS      = ['all', ...Array.from(new Set(DEMO_WORKERS.flatMap(w => w.skills)))];
const EDU_LEVELS      = ['all', 'none', 'primary', 'secondary', 'tertiary'];

// ── Demo data ──────────────────────────────────────────────────────────────────

const DEMO_FORMS = [
  { id: 'f1', jobTitle: 'Senior React Developer', company: 'TechCorp',  responses: 3, sent_to: 8, created_at: '2026-04-20' },
  { id: 'f2', jobTitle: 'UX Designer',            company: 'DesignHub', responses: 1, sent_to: 5, created_at: '2026-04-22' },
];

const DEMO_CONNECTIONS = [
  { id: 'c1', name: 'Amara Nakato',   status: 'accepted', profession: 'Market Vendor',   country: 'Uganda' },
  { id: 'c2', name: 'Fatima Rahman',  status: 'pending',  profession: 'Garment Worker',  country: 'Bangladesh' },
];

// Pending notifications shown on the candidate's dashboard
const DEMO_NOTIFICATIONS = [
  { id: 'n1', org: 'TechCorp',  role: 'Senior Developer Position',  received: '2026-04-24', status: 'pending',   formId: 'f1' },
  { id: 'n2', org: 'DesignHub', role: 'UX Designer Role',           received: '2026-04-22', status: 'submitted', formId: 'f2' },
];

// ═════════════════════════════════════════════════════════════════════════════
// MainDashboard
// ═════════════════════════════════════════════════════════════════════════════

export default function MainDashboard() {
  // ── State ─────────────────────────────────────────────────────────────────
  const [mode, setMode]               = useState<Mode>('talent');
  const [userType, setUserType]       = useState<UserType>('user');
  const [dashTab, setDashTab]         = useState<DashTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters]         = useState<Filters>({
    location: 'all', profession: 'all', skill: 'all', minExp: 0, education: 'all',
  });

  // Single-profile actions
  const [selectedWorker, setSelectedWorker]   = useState<Worker | null>(null);
  const [hiringFormTarget, setHiringFormTarget] = useState<Worker | null>(null);
  const [showHiringForm, setShowHiringForm]   = useState(false);
  const [formSent, setFormSent]               = useState(false);
  const [connectSent, setConnectSent]         = useState<string | null>(null);
  const [rightPanelOpen, setRightPanelOpen]   = useState(true);

  // ── Bulk selection state ──────────────────────────────────────────────────
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [showBulkForm, setShowBulkForm]              = useState(false);
  const [bulkStatus, setBulkStatus]                  = useState<BulkSendStatus>({ phase: 'idle', count: 0 });

  // Hiring form template (shared by single + bulk send)
  const [hiringForm, setHiringForm] = useState<HiringFormState>({
    jobTitle: '', jobDescription: '', company: '', requiredSkills: '', minExperience: 0,
    questions: [
      { id: 'q0', text: 'Tell us about your most relevant experience.', type: 'text', options: [] },
      { id: 'q1', text: 'What is your current notice period?',           type: 'text', options: [] },
      { id: 'q2', text: 'Are you open to relocation?',                   type: 'text', options: [] },
    ],
  });

  // Active form notifications for candidate view (from UserFormsTab)
  const [notifications, setNotifications] = useState(DEMO_NOTIFICATIONS);
  const [openFormId, setOpenFormId]       = useState<string | null>(null);

  // ── Derived lists ─────────────────────────────────────────────────────────
  const filteredWorkers = useMemo(() => {
    let ws = DEMO_WORKERS;
    if (filters.location   !== 'all') ws = ws.filter(w => w.country   === filters.location);
    if (filters.profession !== 'all') ws = ws.filter(w => w.sector    === filters.profession);
    if (filters.skill      !== 'all') ws = ws.filter(w => w.skills.includes(filters.skill));
    if (filters.education  !== 'all') ws = ws.filter(w => w.education === filters.education);
    if (filters.minExp > 0)           ws = ws.filter(w => w.experienceYears >= filters.minExp);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      ws = ws.filter(w =>
        w.name.toLowerCase().includes(q) ||
        w.occupation.toLowerCase().includes(q) ||
        w.sector.toLowerCase().includes(q) ||
        w.skills.some(s => s.toLowerCase().includes(q))
      );
    }
    return ws;
  }, [filters, searchQuery]);

  const rankedCandidates = useMemo(() => {
    if (mode !== 'hire') return filteredWorkers;
    const req = hiringForm.requiredSkills.split(',').map(s => s.trim()).filter(Boolean);
    return [...filteredWorkers]
      .map(w => {
        const matched = req.filter(r => w.skills.some(s => s.toLowerCase().includes(r.toLowerCase())));
        const score   = req.length > 0 ? matched.length / req.length : (w.matchScore ?? 0.5);
        return { ...w, orgMatchScore: score };
      })
      .sort((a, b) => (b.orgMatchScore ?? 0) - (a.orgMatchScore ?? 0));
  }, [filteredWorkers, mode, hiringForm.requiredSkills]);

  const displayedCandidates = mode === 'hire' ? rankedCandidates : filteredWorkers;

  // ── Handlers: selection ───────────────────────────────────────────────────
  const toggleCandidate = useCallback((id: string) => {
    setSelectedCandidates(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback((workers: (Worker & { orgMatchScore?: number })[]) => {
    setSelectedCandidates(prev =>
      prev.size === workers.length
        ? new Set()
        : new Set(workers.map(w => w.id))
    );
  }, []);

  const clearSelection = useCallback(() => setSelectedCandidates(new Set()), []);

  // ── Handlers: single-form send ────────────────────────────────────────────
  const handleSendForm = (target: Worker) => {
    setHiringFormTarget(target);
    setSelectedWorker(null);
    setShowHiringForm(true);
    setFormSent(false);
  };

  const handleConnect = (w: Worker) => {
    setConnectSent(w.id);
  };

  const handleFormSubmit = async () => {
    await new Promise(r => setTimeout(r, 800));
    setFormSent(true);
    setTimeout(() => { setShowHiringForm(false); setHiringFormTarget(null); setFormSent(false); }, 1600);
  };

  // ── Handlers: bulk send ───────────────────────────────────────────────────
  const handleOpenBulkForm = () => {
    if (selectedCandidates.size === 0) return;
    setBulkStatus({ phase: 'idle', count: selectedCandidates.size });
    setShowBulkForm(true);
  };

  const handleBulkFormSubmit = async () => {
    if (!hiringForm.jobTitle.trim()) return;
    setBulkStatus(s => ({ ...s, phase: 'sending' }));

    try {
      // POST /api/organization/send-apply-form
      const payload = {
        job_title:       hiringForm.jobTitle,
        job_description: hiringForm.jobDescription,
        company:         hiringForm.company,
        questions:       hiringForm.questions.filter(q => q.text.trim()).map((q, i) => ({
          id:       q.id ?? `q_${i}`,
          text:     q.text,
          type:     q.type,
          options:  q.options,
          required: true,
        })),
        candidate_ids: Array.from(selectedCandidates),
      };

      const res = await fetch('/api/organization/send-apply-form', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      }).catch(() => null);

      // Graceful degradation if backend not live
      const result = res?.ok ? await res.json() : { form_id: `demo_${Date.now()}`, notified_count: selectedCandidates.size };

      setBulkStatus({ phase: 'done', count: result.notified_count ?? selectedCandidates.size, formId: result.form_id });
      setTimeout(() => {
        setShowBulkForm(false);
        clearSelection();
        setBulkStatus({ phase: 'idle', count: 0 });
      }, 2200);

    } catch (err: any) {
      setBulkStatus(s => ({ ...s, phase: 'error', error: err.message }));
    }
  };

  // ── Handlers: form questions ──────────────────────────────────────────────
  const addQuestion = () => setHiringForm(f => ({
    ...f,
    questions: [...f.questions, { id: `q${f.questions.length}`, text: '', type: 'text', options: [] }],
  }));

  const updateQuestion = (idx: number, text: string) => setHiringForm(f => ({
    ...f, questions: f.questions.map((q, i) => i === idx ? { ...q, text } : q),
  }));

  const removeQuestion = (idx: number) => setHiringForm(f => ({
    ...f, questions: f.questions.filter((_, i) => i !== idx),
  }));

  // ── CSV export ────────────────────────────────────────────────────────────
  const exportCSV = () => {
    const rows = [['Candidate', 'Email', 'Answer 1', 'Status'], ['Fatima Rahman', 'fatima@example.com', 'I have 6 years in garment quality control…', 'Reviewed']];
    const csv  = rows.map(r => r.join(',')).join('\n');
    const a    = document.createElement('a');
    a.href     = `data:text/csv;charset=utf-8,﻿${encodeURIComponent(csv)}`;
    a.download = 'hiring_responses.csv';
    a.click();
  };

  // ── Pending notification count for candidate ──────────────────────────────
  const pendingForms = notifications.filter(n => n.status === 'pending').length;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: C.bg, fontFamily: C.mono, overflow: 'hidden' }}>

      {/* ── TOP NAV ── */}
      <TopBar
        mode={mode} setMode={setMode}
        userType={userType} setUserType={setUserType}
        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        rightPanelOpen={rightPanelOpen} setRightPanelOpen={setRightPanelOpen}
        filteredCount={filteredWorkers.length}
        pendingForms={userType === 'user' ? pendingForms : 0}
        onNotificationClick={() => { setMode('dashboard'); setDashTab('forms'); }}
      />

      {/* ── MAIN BODY ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

        {/* ── LEFT FILTER PANEL ── */}
        <FilterPanel
          filters={filters} setFilters={setFilters}
          mode={mode} userType={userType}
          hiringForm={hiringForm} setHiringForm={setHiringForm}
          filteredCount={filteredWorkers.length}
        />

        {/* ── GLOBE CENTER ── */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <InteractiveGlobe
            onWorkerSelect={w => setSelectedWorker(w)}
            externalFilters={{
              location:  filters.location,
              sector:    filters.profession !== 'all' ? filters.profession : undefined,
              education: filters.education !== 'all' ? filters.education : undefined,
              skill:     filters.skill !== 'all' ? filters.skill : undefined,
            }}
            hideFilterPanel
          />
          <div style={{
            position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(246,244,239,0.92)', backdropFilter: 'blur(8px)',
            border: `1.5px solid ${C.border}`, borderRadius: 999,
            padding: '6px 18px', fontSize: 11, color: C.muted,
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          }}>
            Click any point to open profile · Hover to preview
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        {rightPanelOpen && (
          <RightPanel
            mode={mode} userType={userType}
            workers={displayedCandidates}
            selectedCandidates={selectedCandidates}
            onToggleCandidate={toggleCandidate}
            onSelectAll={() => handleSelectAll(displayedCandidates)}
            onClearSelection={clearSelection}
            onOpenBulkForm={handleOpenBulkForm}
            onViewProfile={setSelectedWorker}
            onSendForm={handleSendForm}
            onConnect={handleConnect}
            connectSent={connectSent}
          />
        )}
      </div>

      {/* ── DASHBOARD OVERLAY ── */}
      {mode === 'dashboard' && (
        <DashboardOverlay
          userType={userType} setUserType={setUserType}
          dashTab={dashTab} setDashTab={setDashTab}
          onClose={() => setMode('talent')}
          onExportCSV={exportCSV}
          notifications={notifications}
          openFormId={openFormId}
          onOpenForm={setOpenFormId}
          onDismissForm={(id: string) => setNotifications(prev => prev.filter(n => n.id !== id))}
          onMarkSubmitted={(id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'submitted' } : n))}
        />
      )}

      {/* ── PROFILE MODAL ── */}
      {selectedWorker && (
        <ProfileModal
          worker={selectedWorker}
          userType={userType}
          onClose={() => setSelectedWorker(null)}
          onSendForm={handleSendForm}
          onConnect={handleConnect}
          connectSent={connectSent}
        />
      )}

      {/* ── SINGLE HIRING FORM MODAL ── */}
      {showHiringForm && (
        <HiringFormModal
          target={hiringFormTarget}
          targets={null}
          form={hiringForm} setForm={setHiringForm}
          sent={formSent}
          onSubmit={handleFormSubmit}
          onClose={() => { setShowHiringForm(false); setHiringFormTarget(null); }}
          addQuestion={addQuestion}
          updateQuestion={updateQuestion}
          removeQuestion={removeQuestion}
        />
      )}

      {/* ── BULK HIRING FORM MODAL ── */}
      {showBulkForm && (
        <HiringFormModal
          target={null}
          targets={Array.from(selectedCandidates).map(id => displayedCandidates.find(w => w.id === id)!).filter(Boolean)}
          form={hiringForm} setForm={setHiringForm}
          sent={bulkStatus.phase === 'done'}
          sendingPhase={bulkStatus.phase}
          bulkError={bulkStatus.error}
          onSubmit={handleBulkFormSubmit}
          onClose={() => { setShowBulkForm(false); setBulkStatus({ phase: 'idle', count: 0 }); }}
          addQuestion={addQuestion}
          updateQuestion={updateQuestion}
          removeQuestion={removeQuestion}
        />
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// TopBar
// ═════════════════════════════════════════════════════════════════════════════

function TopBar({ mode, setMode, userType, setUserType, searchQuery, setSearchQuery, rightPanelOpen, setRightPanelOpen, filteredCount, pendingForms, onNotificationClick }: any) {
  const modeBtn = (m: Mode, icon: React.ReactNode, label: string) => (
    <button onClick={() => setMode(m)} style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '7px 16px', borderRadius: 8,
      background: mode === m ? C.blue : 'transparent',
      color: mode === m ? '#fff' : C.muted,
      border: `1.5px solid ${mode === m ? C.blue : C.border}`,
      cursor: 'pointer', fontSize: 12, fontFamily: C.mono, fontWeight: 700,
      transition: 'all 0.15s',
    }}>
      {icon} {label}
    </button>
  );

  return (
    <div style={{
      height: 56, display: 'flex', alignItems: 'center', gap: 16,
      padding: '0 20px', background: C.white,
      borderBottom: `1px solid ${C.border}`, flexShrink: 0,
      boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 8 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Globe2 size={16} color="#fff" />
        </div>
        <span style={{ fontFamily: C.serif, fontSize: 16, fontWeight: 700, color: C.blue, fontStyle: 'italic' }}>TalentGraph</span>
      </div>

      {/* Search */}
      <div style={{ flex: 1, maxWidth: 320, display: 'flex', alignItems: 'center', gap: 8, background: '#f3f3f5', borderRadius: 8, padding: '6px 12px' }}>
        <Search size={14} color={C.muted} />
        <input
          value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search by name, skill, profession…"
          style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 12, fontFamily: C.mono, width: '100%', color: C.text }}
        />
        {searchQuery && <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 0 }}><X size={13} /></button>}
      </div>

      <span style={{ fontSize: 11, color: C.muted }}>{filteredCount} profiles</span>

      {/* Mode switcher */}
      <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
        {modeBtn('talent',    <Users size={13} />,          'Talent Network')}
        {modeBtn('hire',      <Briefcase size={13} />,      'Hire Talent')}
        {modeBtn('dashboard', <LayoutDashboard size={13} />, 'My Dashboard')}
      </div>

      {/* User type + notification bell + right panel toggle */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <select
          value={userType} onChange={e => setUserType(e.target.value as UserType)}
          style={{ padding: '5px 10px', borderRadius: 6, border: `1.5px solid ${C.border}`, fontSize: 11, fontFamily: C.mono, background: C.white, cursor: 'pointer', color: C.text }}
        >
          <option value="user">User</option>
          <option value="org">Organization</option>
        </select>

        {/* Notification bell (user only) */}
        {userType === 'user' && (
          <button onClick={onNotificationClick} style={{
            position: 'relative', padding: '6px 8px',
            border: `1.5px solid ${pendingForms > 0 ? C.amber : C.border}`,
            borderRadius: 6, background: pendingForms > 0 ? '#fffbeb' : C.white,
            cursor: 'pointer', display: 'flex', alignItems: 'center',
          }}>
            <Bell size={14} color={pendingForms > 0 ? C.amber : C.muted} />
            {pendingForms > 0 && (
              <span style={{
                position: 'absolute', top: -5, right: -5,
                background: C.red, color: '#fff', borderRadius: '50%',
                width: 16, height: 16, fontSize: 9, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {pendingForms}
              </span>
            )}
          </button>
        )}

        <button onClick={() => setRightPanelOpen(!rightPanelOpen)} style={{
          padding: '6px 10px', borderRadius: 6,
          border: `1.5px solid ${C.border}`, background: rightPanelOpen ? C.lime : C.white,
          cursor: 'pointer', color: rightPanelOpen ? '#fff' : C.muted, display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <Filter size={13} />
        </button>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// FilterPanel (left sidebar)
// ═════════════════════════════════════════════════════════════════════════════

function FilterPanel({ filters, setFilters, mode, userType, hiringForm, setHiringForm, filteredCount }: any) {
  const sel = (label: string, key: keyof Filters, opts: string[]) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>{label}</label>
      <select
        value={filters[key] as string}
        onChange={e => setFilters((f: Filters) => ({ ...f, [key]: e.target.value }))}
        style={{ width: '100%', padding: '7px 10px', border: `1.5px solid ${C.border}`, borderRadius: 7, fontSize: 11, fontFamily: C.mono, background: C.white, color: C.text, cursor: 'pointer' }}
      >
        {opts.map(o => <option key={o} value={o}>{o === 'all' ? `All ${label}s` : o}</option>)}
      </select>
    </div>
  );

  return (
    <div style={{
      width: 256, flexShrink: 0,
      background: C.white, borderRight: `1px solid ${C.border}`,
      overflowY: 'auto', padding: 16,
      display: 'flex', flexDirection: 'column', gap: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
        <Filter size={14} color={C.blue} />
        <span style={{ fontSize: 11, fontWeight: 700, color: C.blue, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {mode === 'hire' ? 'Hire Filters' : 'Talent Filters'}
        </span>
      </div>

      {sel('Location', 'location', ALL_LOCATIONS)}
      {sel('Profession', 'profession', ALL_PROFESSIONS)}
      {sel('Skill', 'skill', ALL_SKILLS)}
      {sel('Education', 'education', EDU_LEVELS)}

      <div style={{ marginBottom: 14 }}>
        <label style={{ display: 'block', fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>
          Min. Experience (years)
        </label>
        <input
          type="number" min={0} max={30}
          value={filters.minExp}
          onChange={e => setFilters((f: Filters) => ({ ...f, minExp: Number(e.target.value) }))}
          style={{ width: '100%', padding: '7px 10px', border: `1.5px solid ${C.border}`, borderRadius: 7, fontSize: 11, fontFamily: C.mono, background: C.white, color: C.text, boxSizing: 'border-box' }}
        />
      </div>

      {/* Hire-mode job criteria */}
      {mode === 'hire' && (
        <>
          <div style={{ borderTop: `1px solid ${C.border}`, margin: '8px 0 14px' }} />
          <div style={{ fontSize: 10, fontWeight: 700, color: C.blue, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
            Job Requirements
          </div>

          {(['jobTitle', 'company', 'requiredSkills'] as const).map((field, i) => (
            <div key={field} style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>
                {['Job Title', 'Company', 'Required Skills (comma-separated)'][i]}
              </label>
              <input
                value={hiringForm[field]}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHiringForm((f: HiringFormState) => ({ ...f, [field]: e.target.value }))}
                placeholder={['e.g. Senior React Developer', 'Your organization name', 'React, TypeScript, Node.js'][i]}
                style={{ width: '100%', padding: '7px 10px', border: `1.5px solid ${C.border}`, borderRadius: 7, fontSize: 11, fontFamily: C.mono, background: C.white, color: C.text, boxSizing: 'border-box' }}
              />
            </div>
          ))}
        </>
      )}

      <button
        onClick={() => setFilters({ location: 'all', profession: 'all', skill: 'all', minExp: 0, education: 'all' })}
        style={{ marginTop: 'auto', padding: '8px', borderRadius: 7, border: `1.5px solid ${C.border}`, background: 'transparent', color: C.muted, cursor: 'pointer', fontSize: 11, fontFamily: C.mono, width: '100%' }}
      >
        Reset Filters
      </button>

      <div style={{ textAlign: 'center', marginTop: 10, fontSize: 11, color: C.muted }}>
        <span style={{ color: C.blue, fontWeight: 700, fontSize: 18 }}>{filteredCount}</span> results
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// RightPanel — profile list or ranked candidates with bulk selection
// ═════════════════════════════════════════════════════════════════════════════

function RightPanel({
  mode, userType, workers,
  selectedCandidates, onToggleCandidate, onSelectAll, onClearSelection, onOpenBulkForm,
  onViewProfile, onSendForm, onConnect, connectSent,
}: any) {
  const isBulkMode  = mode === 'hire' && userType === 'org';
  const selCount    = selectedCandidates.size;
  const allSelected = workers.length > 0 && selCount === workers.length;
  const someSelected = selCount > 0 && selCount < workers.length;

  return (
    <div style={{
      width: 328, flexShrink: 0,
      background: C.white, borderLeft: `1px solid ${C.border}`,
      overflowY: 'auto', display: 'flex', flexDirection: 'column',
    }}>
      {/* Panel header */}
      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, background: C.white, zIndex: 2 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.blue, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {mode === 'hire' ? '🎯 Ranked Candidates' : '👥 Talent Network'}
        </div>
        <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
          {workers.length} {mode === 'hire' ? 'candidates sorted by match' : 'profiles found'}
        </div>
      </div>

      {/* Bulk action toolbar — only in hire + org mode */}
      {isBulkMode && (
        <div style={{
          padding: '10px 14px',
          borderBottom: `1px solid ${C.border}`,
          background: selCount > 0 ? '#f0f9ff' : C.bg,
          display: 'flex', alignItems: 'center', gap: 10,
          position: 'sticky', top: 57, zIndex: 2,
          transition: 'background 0.2s',
        }}>
          {/* Select All checkbox */}
          <button
            onClick={onSelectAll}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', flexShrink: 0 }}
            title={allSelected ? 'Deselect all' : 'Select all'}
          >
            {allSelected
              ? <CheckSquare size={17} color={C.blue} fill={C.blue} />
              : someSelected
                ? <CheckSquare size={17} color={C.blue} />
                : <Square size={17} color={C.muted} />
            }
          </button>

          <span style={{ fontSize: 11, color: selCount > 0 ? C.blue : C.muted, fontWeight: selCount > 0 ? 700 : 400, flex: 1 }}>
            {selCount > 0 ? `${selCount} selected` : 'Select candidates'}
          </span>

          {selCount > 0 && (
            <button onClick={onClearSelection} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 2 }}>
              <X size={13} />
            </button>
          )}

          {/* Send Apply Form CTA */}
          <button
            onClick={onOpenBulkForm}
            disabled={selCount === 0}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 12px', borderRadius: 7,
              background: selCount > 0 ? C.lime : '#d1d5db',
              color: selCount > 0 ? '#fff' : C.muted,
              border: 'none', cursor: selCount > 0 ? 'pointer' : 'not-allowed',
              fontSize: 10, fontFamily: C.mono, fontWeight: 700,
              whiteSpace: 'nowrap', transition: 'background 0.2s',
            }}
          >
            <Send size={11} />
            Send Apply Form
            {selCount > 0 && (
              <span style={{ background: 'rgba(255,255,255,0.3)', borderRadius: 10, padding: '0 5px', fontSize: 9 }}>
                {selCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Cards */}
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {workers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: C.muted, fontSize: 12 }}>
            No profiles match the current filters.
          </div>
        ) : workers.map((w: Worker & { orgMatchScore?: number }) => (
          <CandidateCard
            key={w.id} worker={w} mode={mode} userType={userType}
            selected={selectedCandidates.has(w.id)}
            onToggleSelect={() => onToggleCandidate(w.id)}
            onViewProfile={onViewProfile}
            onSendForm={onSendForm}
            onConnect={onConnect}
            connectSent={connectSent}
          />
        ))}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// CandidateCard
// ═════════════════════════════════════════════════════════════════════════════

function CandidateCard({ worker: w, mode, userType, selected, onToggleSelect, onViewProfile, onSendForm, onConnect, connectSent }: any) {
  const isBulkMode  = mode === 'hire' && userType === 'org';
  const score       = w.orgMatchScore ?? w.matchScore;
  const scoreColor  = score >= 0.8 ? C.lime : score >= 0.6 ? C.amber : score >= 0.4 ? '#f97316' : C.red;
  const initials    = w.name.split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase();
  const sent        = connectSent === w.id;

  return (
    <div
      style={{
        background: selected ? '#f0f9ff' : C.bg,
        borderRadius: 10, padding: '12px 14px',
        border: `1.5px solid ${selected ? C.blue : C.border}`,
        cursor: 'pointer', position: 'relative',
        transition: 'border-color 0.15s, box-shadow 0.15s, background 0.15s',
        boxShadow: selected ? `0 0 0 3px rgba(23,16,230,0.08)` : 'none',
      }}
      onMouseEnter={e => {
        if (!selected) {
          (e.currentTarget as HTMLDivElement).style.borderColor = C.lime;
          (e.currentTarget as HTMLDivElement).style.boxShadow = `0 2px 12px rgba(141,198,81,0.18)`;
        }
      }}
      onMouseLeave={e => {
        if (!selected) {
          (e.currentTarget as HTMLDivElement).style.borderColor = C.border;
          (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
        }
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>

        {/* Checkbox (bulk mode only) */}
        {isBulkMode && (
          <button
            onClick={e => { e.stopPropagation(); onToggleSelect(); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', flexShrink: 0, marginTop: 2 }}
          >
            {selected
              ? <CheckSquare size={16} color={C.blue} fill={C.blue} />
              : <Square size={16} color={C.muted} />
            }
          </button>
        )}

        {/* Avatar */}
        <div style={{
          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
          background: selected ? C.blue : '#3b3b6b', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, border: selected ? `2px solid ${C.lime}` : 'none',
          transition: 'background 0.15s',
        }}>
          {initials}
        </div>

        {/* Name / role / location */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: C.text, fontFamily: C.serif, fontStyle: 'italic' }}>{w.name}</div>
          <div style={{ fontSize: 10, color: C.blue, fontWeight: 600, marginTop: 1 }}>{w.occupation}</div>
          <div style={{ fontSize: 10, color: C.muted, display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
            <MapPin size={9} /> {w.country} · {w.experienceYears}y exp
          </div>
        </div>

        {/* Score */}
        {score != null && (
          <div style={{ flexShrink: 0, textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: scoreColor }}>{Math.round(score * 100)}%</div>
            <div style={{ fontSize: 8, color: C.muted, textTransform: 'uppercase' }}>{mode === 'hire' ? 'match' : 'score'}</div>
          </div>
        )}
      </div>

      {/* Skills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 10 }}>
        {w.skills.slice(0, 4).map((s: string) => (
          <span key={s} style={{ background: selected ? 'rgba(23,16,230,0.08)' : '#e8e3db', color: C.text, borderRadius: 4, padding: '2px 6px', fontSize: 9, textTransform: 'uppercase' }}>{s}</span>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => onViewProfile(w)} style={{
          flex: 1, padding: '6px', border: `1.5px solid ${C.blue}`, borderRadius: 6,
          background: 'transparent', color: C.blue, cursor: 'pointer',
          fontSize: 10, fontFamily: C.mono, fontWeight: 700,
        }}>
          View Profile
        </button>

        {userType === 'org' && mode === 'hire' ? (
          <button
            onClick={e => { e.stopPropagation(); onToggleSelect(); }}
            style={{
              flex: 1, padding: '6px', border: `1.5px solid ${selected ? C.blue : C.border}`, borderRadius: 6,
              background: selected ? C.blue : 'transparent',
              color: selected ? '#fff' : C.muted,
              cursor: 'pointer', fontSize: 10, fontFamily: C.mono, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            }}
          >
            {selected ? <><Check size={10} /> Selected</> : <><CheckSquare size={10} /> Select</>}
          </button>
        ) : (
          <button onClick={() => onConnect(w)} style={{
            flex: 1, padding: '6px', border: `1.5px solid ${sent ? C.lime : C.border}`, borderRadius: 6,
            background: sent ? C.lime : 'transparent', color: sent ? '#fff' : C.muted, cursor: 'pointer',
            fontSize: 10, fontFamily: C.mono, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          }}>
            {sent ? <><Check size={10} /> Sent</> : <><Linkedin size={10} /> Connect</>}
          </button>
        )}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ProfileModal — full profile detail overlay
// ═════════════════════════════════════════════════════════════════════════════

function ProfileModal({ worker: w, userType, onClose, onSendForm, onConnect, connectSent }: any) {
  const initials = w.name.split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase();
  const sent     = connectSent === w.id;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }} onClick={onClose}>
      <div style={{
        background: C.white, borderRadius: 16, width: '100%', maxWidth: 520,
        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
        border: `2px solid ${C.lime}`,
      }} onClick={e => e.stopPropagation()}>

        <div style={{ background: C.blue, borderRadius: '14px 14px 0 0', padding: '24px', display: 'flex', alignItems: 'flex-start', gap: 16, position: 'relative' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: C.lime, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: C.text, flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: C.serif, fontSize: 22, fontWeight: 700, color: '#fff', fontStyle: 'italic' }}>{w.name}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>{w.occupation}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 4, display: 'flex', gap: 12 }}>
              <span><MapPin size={9} style={{ display: 'inline' }} /> {w.country}</span>
              <span><Clock size={9} style={{ display: 'inline' }} /> {w.experienceYears} years exp</span>
              <span><Award size={9} style={{ display: 'inline' }} /> {w.education}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6, padding: 6, cursor: 'pointer', color: '#fff' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: 24 }}>
          {w.matchScore != null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: '10px 14px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #86efac' }}>
              <Star size={16} color={C.lime} fill={C.lime} />
              <div>
                <span style={{ fontWeight: 700, fontSize: 18, color: C.lime }}>{Math.round(w.matchScore * 100)}%</span>
                <span style={{ fontSize: 12, color: C.muted, marginLeft: 8 }}>opportunity match score</span>
              </div>
            </div>
          )}

          <Section title="Sector / Industry">
            <span style={{ background: '#e8e3db', padding: '4px 10px', borderRadius: 6, fontSize: 12, color: C.text }}>{w.sector}</span>
          </Section>

          <Section title="Skills">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {w.skills.map((s: string) => (
                <span key={s} style={{ background: C.blue, color: '#fff', borderRadius: 6, padding: '4px 10px', fontSize: 11, textTransform: 'uppercase' }}>{s}</span>
              ))}
            </div>
          </Section>

          <Section title="Connect">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {w.linkedin_url && (
                <a href={w.linkedin_url} target="_blank" rel="noopener" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#0A66C2', color: '#fff', borderRadius: 7, textDecoration: 'none', fontSize: 12, fontWeight: 700 }}>
                  <Linkedin size={13} /> LinkedIn
                </a>
              )}
              {w.github_username && (
                <a href={`https://github.com/${w.github_username}`} target="_blank" rel="noopener" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#24292e', color: '#fff', borderRadius: 7, textDecoration: 'none', fontSize: 12, fontWeight: 700 }}>
                  <Github size={13} /> GitHub
                </a>
              )}
              {!w.linkedin_url && !w.github_username && (
                <span style={{ fontSize: 12, color: C.muted }}>No social links available.</span>
              )}
            </div>
          </Section>

          {(w.resume_url || w.profile_slug) && (
            <Section title="ATS Resume">
              <a href={w.resume_url || `/resume/${w.profile_slug || w.id}`} target="_blank" rel="noopener"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: C.blue, color: '#fff', borderRadius: 7, textDecoration: 'none', fontSize: 12, fontWeight: 700 }}>
                <ExternalLink size={13} /> View ATS Resume
              </a>
            </Section>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 24, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
            {userType === 'org' ? (
              <button onClick={() => onSendForm(w)} style={{
                flex: 1, padding: '10px', background: C.blue, color: '#fff',
                border: 'none', borderRadius: 8, cursor: 'pointer',
                fontFamily: C.mono, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                <Send size={14} /> Send Apply Form
              </button>
            ) : (
              <button onClick={() => onConnect(w)} style={{
                flex: 1, padding: '10px', background: sent ? C.lime : C.blue, color: '#fff',
                border: 'none', borderRadius: 8, cursor: 'pointer',
                fontFamily: C.mono, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                {sent ? <><Check size={14} /> Request Sent</> : <><Mail size={14} /> Connect</>}
              </button>
            )}
            <button onClick={onClose} style={{ padding: '10px 18px', background: 'transparent', color: C.muted, border: `1.5px solid ${C.border}`, borderRadius: 8, cursor: 'pointer', fontFamily: C.mono, fontSize: 13 }}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// HiringFormModal — single or bulk send
// ═════════════════════════════════════════════════════════════════════════════

function HiringFormModal({ target, targets, form, setForm, sent, sendingPhase, bulkError, onSubmit, onClose, addQuestion, updateQuestion, removeQuestion }: any) {
  const [submitting, setSubmitting] = useState(false);

  const isBulk       = Array.isArray(targets) && targets.length > 0;
  const recipientCount = isBulk ? targets.length : 1;
  const isDone       = sent || sendingPhase === 'done';
  const isError      = sendingPhase === 'error';

  const handleSubmit = async () => {
    setSubmitting(true);
    await onSubmit();
    setSubmitting(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={onClose}>
      <div style={{ background: C.white, borderRadius: 16, width: '100%', maxWidth: 580, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.3)', border: `2px solid ${C.blue}` }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: C.serif, fontSize: 18, fontStyle: 'italic', color: C.blue }}>
              {isBulk ? 'Send Apply Form to Multiple Candidates' : 'Send Apply Form'}
            </div>
            {isBulk ? (
              <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {targets.slice(0, 5).map((t: Worker) => (
                  <span key={t.id} style={{ background: '#e8f0fe', color: C.blue, borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 600 }}>
                    {t.name}
                  </span>
                ))}
                {targets.length > 5 && (
                  <span style={{ background: C.bg, color: C.muted, borderRadius: 20, padding: '2px 8px', fontSize: 10 }}>
                    +{targets.length - 5} more
                  </span>
                )}
              </div>
            ) : target ? (
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>To: {target.name} · {target.occupation}</div>
            ) : null}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, marginLeft: 12, flexShrink: 0 }}><X size={18} /></button>
        </div>

        {/* Recipient count banner */}
        {isBulk && !isDone && !isError && (
          <div style={{ padding: '10px 24px', background: '#e8f0fe', borderBottom: `1px solid #c7d7f7`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Send size={13} color={C.blue} />
            <span style={{ fontSize: 12, color: C.blue, fontWeight: 600 }}>
              This form will be sent to <strong>{recipientCount} candidate{recipientCount > 1 ? 's' : ''}</strong>. Each will receive a dashboard notification with a link to fill it out.
            </span>
          </div>
        )}

        {isDone ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <div style={{ fontFamily: C.serif, fontSize: 20, color: C.blue, fontStyle: 'italic', marginBottom: 8 }}>
              {isBulk ? `Form sent to ${recipientCount} candidate${recipientCount > 1 ? 's' : ''}!` : 'Form Sent!'}
            </div>
            <div style={{ fontSize: 12, color: C.muted }}>
              Each candidate will receive a dashboard notification with a link to fill out the form.
            </div>
          </div>
        ) : isError ? (
          <div style={{ padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontSize: 14, color: C.red, marginBottom: 8 }}>Send failed</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>{bulkError ?? 'An unexpected error occurred.'}</div>
            <button onClick={onClose} style={{ padding: '8px 20px', background: C.blue, color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontFamily: C.mono, fontSize: 12, fontWeight: 700 }}>
              Close
            </button>
          </div>
        ) : (
          <div style={{ padding: 24 }}>
            {/* Job details */}
            <FormField label="Job Title *">
              <input value={form.jobTitle} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((f: HiringFormState) => ({ ...f, jobTitle: e.target.value }))}
                placeholder="e.g. Senior React Developer" style={inputStyle} />
            </FormField>

            <FormField label="Company Name">
              <input value={form.company} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((f: HiringFormState) => ({ ...f, company: e.target.value }))}
                placeholder="Your organization" style={inputStyle} />
            </FormField>

            <FormField label="Job Description">
              <textarea value={form.jobDescription} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm((f: HiringFormState) => ({ ...f, jobDescription: e.target.value }))}
                placeholder="Describe the role, responsibilities, and what you're looking for…"
                rows={3} style={{ ...inputStyle, resize: 'vertical' } as any} />
            </FormField>

            {/* Questions */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.blue, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Form Questions
                </div>
                <span style={{ fontSize: 10, color: C.muted }}>{form.questions.length} question{form.questions.length !== 1 ? 's' : ''}</span>
              </div>
              {form.questions.map((q: HiringQuestion, i: number) => (
                <div key={q.id} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 11, color: C.muted, paddingTop: 8, minWidth: 20, fontWeight: 700 }}>{i + 1}.</span>
                  <input
                    value={q.text} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateQuestion(i, e.target.value)}
                    placeholder={`Question ${i + 1}`}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  {form.questions.length > 1 && (
                    <button onClick={() => removeQuestion(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.red, paddingTop: 8 }}><X size={14} /></button>
                  )}
                </div>
              ))}
              <button onClick={addQuestion} style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px',
                background: 'transparent', border: `1.5px dashed ${C.border}`, borderRadius: 7,
                color: C.muted, cursor: 'pointer', fontSize: 11, fontFamily: C.mono, width: '100%', justifyContent: 'center',
              }}>
                <Plus size={12} /> Add Question
              </button>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
              <button onClick={handleSubmit} disabled={submitting || !form.jobTitle}
                style={{
                  flex: 1, padding: '11px',
                  background: form.jobTitle ? (isBulk ? C.lime : C.blue) : '#a0a0a0',
                  color: '#fff', border: 'none', borderRadius: 8,
                  cursor: form.jobTitle ? 'pointer' : 'not-allowed',
                  fontFamily: C.mono, fontSize: 13, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                {submitting
                  ? `Sending to ${recipientCount} candidate${recipientCount > 1 ? 's' : ''}…`
                  : <><Send size={14} /> {isBulk ? `Send to ${recipientCount} Candidate${recipientCount > 1 ? 's' : ''}` : 'Send to Candidate'}</>
                }
              </button>
              <button onClick={onClose} style={{ padding: '11px 18px', background: 'transparent', color: C.muted, border: `1.5px solid ${C.border}`, borderRadius: 8, cursor: 'pointer', fontFamily: C.mono, fontSize: 13 }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', border: `1.5px solid ${C.border}`, borderRadius: 7,
  fontSize: 12, fontFamily: C.mono, background: C.white, color: C.text, boxSizing: 'border-box',
  outline: 'none',
};

// ═════════════════════════════════════════════════════════════════════════════
// DashboardOverlay — user & org personal dashboard
// ═════════════════════════════════════════════════════════════════════════════

function DashboardOverlay({ userType, setUserType, dashTab, setDashTab, onClose, onExportCSV, notifications, onOpenForm, onDismissForm, onMarkSubmitted }: any) {
  const tabs: { id: DashTab; label: string }[] = userType === 'org'
    ? [{ id: 'overview', label: 'Overview' }, { id: 'forms', label: 'Hiring Forms' }, { id: 'jobs', label: 'Job Posts' }]
    : [{ id: 'overview', label: 'Overview' }, { id: 'forms', label: 'My Forms' }, { id: 'connections', label: 'Connections' }];

  const pendingCount = notifications?.filter((n: any) => n.status === 'pending').length ?? 0;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}
      onClick={onClose}>
      <div style={{ background: C.white, borderRadius: 18, width: '100%', maxWidth: 780, maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,0.28)', border: `2px solid ${C.blue}` }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '24px 28px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: C.serif, fontSize: 22, fontStyle: 'italic', color: C.blue }}>My Dashboard</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
              Viewing as: &nbsp;
              <select value={userType} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setUserType(e.target.value)} style={{ border: 'none', background: 'transparent', color: C.blue, fontWeight: 700, cursor: 'pointer', fontSize: 11, fontFamily: C.mono }}>
                <option value="user">Individual User</option>
                <option value="org">Organization</option>
              </select>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted }}><X size={20} /></button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${C.border}`, padding: '0 28px' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setDashTab(t.id)} style={{
              padding: '12px 20px', background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 12, fontFamily: C.mono, fontWeight: 700,
              color: dashTab === t.id ? C.blue : C.muted,
              borderBottom: `2px solid ${dashTab === t.id ? C.blue : 'transparent'}`,
              marginBottom: -1, position: 'relative',
            }}>
              {t.label}
              {t.id === 'forms' && userType === 'user' && pendingCount > 0 && (
                <span style={{
                  position: 'absolute', top: 8, right: 6,
                  background: C.red, color: '#fff', borderRadius: '50%',
                  width: 14, height: 14, fontSize: 8, fontWeight: 700,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ padding: 28 }}>
          {dashTab === 'overview' && <OverviewTab userType={userType} />}
          {dashTab === 'forms' && userType === 'org'  && <OrgFormsTab onExportCSV={onExportCSV} />}
          {dashTab === 'forms' && userType === 'user' && <UserFormsTab notifications={notifications} onOpenForm={onOpenForm} onDismissForm={onDismissForm} onMarkSubmitted={onMarkSubmitted} />}
          {dashTab === 'connections' && <ConnectionsTab />}
          {dashTab === 'jobs' && <JobPostsTab />}
        </div>
      </div>
    </div>
  );
}

// ── Dashboard Tab Components ───────────────────────────────────────────────────

function OverviewTab({ userType }: { userType: UserType }) {
  const stats = userType === 'org'
    ? [{ label: 'Active Job Posts', value: 2, color: C.blue }, { label: 'Forms Sent', value: 13, color: C.lime }, { label: 'Responses', value: 4, color: C.amber }, { label: 'Candidates Hired', value: 1, color: '#10b981' }]
    : [{ label: 'Profile Views', value: 47, color: C.blue }, { label: 'Connections', value: 2, color: C.lime }, { label: 'Forms Received', value: 3, color: C.amber }, { label: 'Resume Views', value: 12, color: '#10b981' }];

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {stats.map(s => (
          <div key={s.label} style={{ padding: '16px', background: C.bg, borderRadius: 10, border: `1.5px solid ${C.border}`, textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: '16px', background: C.bg, borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 12, color: C.muted, textAlign: 'center' }}>
        {userType === 'org'
          ? '📊 Your hiring pipeline is active. Switch to the Hire tab to find candidates and send apply forms in bulk.'
          : '🌍 Your profile is visible on the globe. Complete your resume for better visibility.'}
      </div>
    </div>
  );
}

function OrgFormsTab({ onExportCSV }: { onExportCSV: () => void }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: C.muted }}>{DEMO_FORMS.length} active hiring forms</div>
        <button onClick={onExportCSV} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', background: C.lime, color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontFamily: C.mono, fontWeight: 700 }}>
          <Download size={12} /> Export CSV
        </button>
      </div>
      {DEMO_FORMS.map(f => (
        <div key={f.id} style={{ padding: '14px 16px', background: C.bg, borderRadius: 10, border: `1.5px solid ${C.border}`, marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{f.jobTitle}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{f.company} · Created {f.created_at}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.blue }}>{f.responses}/{f.sent_to}</div>
              <div style={{ fontSize: 10, color: C.muted }}>responses</div>
            </div>
          </div>
          {/* Response progress bar */}
          <div style={{ marginTop: 10, height: 4, background: '#e5e7eb', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(f.responses / f.sent_to) * 100}%`, background: C.lime, borderRadius: 999 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function UserFormsTab({ notifications, onOpenForm, onDismissForm, onMarkSubmitted }: any) {
  const [activeFormId, setActiveFormId] = useState<string | null>(null);
  const [formAnswers, setFormAnswers] = useState<Record<string, string>>({});

  const pending   = (notifications ?? []).filter((n: any) => n.status === 'pending');
  const submitted = (notifications ?? []).filter((n: any) => n.status === 'submitted');

  const handleFillSubmit = (n: any) => {
    onMarkSubmitted(n.id);
    setActiveFormId(null);
    setFormAnswers({});
  };

  return (
    <div>
      {/* Pending forms */}
      {pending.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.amber, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Bell size={12} /> {pending.length} Pending Form{pending.length > 1 ? 's' : ''}
          </div>
          {pending.map((n: any) => (
            <div key={n.id}>
              {/* Notification banner */}
              <div style={{ padding: '14px 16px', background: '#fffbeb', borderRadius: 10, border: '1.5px solid #fcd34d', marginBottom: activeFormId === n.id ? 0 : 10, borderBottomLeftRadius: activeFormId === n.id ? 0 : 10, borderBottomRightRadius: activeFormId === n.id ? 0 : 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ background: C.amber, color: '#fff', borderRadius: 4, padding: '1px 7px', fontSize: 9, fontWeight: 700, textTransform: 'uppercase' }}>New</span>
                      <span style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{n.role}</span>
                    </div>
                    <div style={{ fontSize: 11, color: C.muted }}>
                      From: <strong style={{ color: C.blue }}>{n.org}</strong> · Received {n.received}
                    </div>
                    <div style={{ fontSize: 11, color: C.text, marginTop: 6 }}>
                      You've received an Apply Form from <strong>{n.org}</strong>. Fill it out to be considered for this role.
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                    <button
                      onClick={() => setActiveFormId(activeFormId === n.id ? null : n.id)}
                      style={{ padding: '7px 14px', background: C.blue, color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontFamily: C.mono, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <FileText size={11} /> {activeFormId === n.id ? 'Close Form' : 'Fill Out'}
                    </button>
                    <button onClick={() => onDismissForm(n.id)} style={{ padding: '5px 10px', background: 'transparent', color: C.muted, border: `1px solid ${C.border}`, borderRadius: 7, cursor: 'pointer', fontSize: 10, fontFamily: C.mono, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Trash2 size={9} /> Dismiss
                    </button>
                  </div>
                </div>
              </div>

              {/* Inline form */}
              {activeFormId === n.id && (
                <div style={{ background: '#fff', border: '1.5px solid #fcd34d', borderTop: 'none', borderRadius: '0 0 10px 10px', padding: 20, marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 16 }}>
                    Answer the questions below to submit your application to <strong style={{ color: C.blue }}>{n.org}</strong>.
                  </div>

                  {/* Inline demo questions */}
                  {['Tell us about your most relevant experience.', 'What is your current notice period?', 'Are you open to relocation?'].map((q, qi) => (
                    <div key={qi} style={{ marginBottom: 14 }}>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.text, marginBottom: 5 }}>
                        {qi + 1}. {q} <span style={{ color: C.red }}>*</span>
                      </label>
                      <textarea
                        value={formAnswers[`${n.id}_q${qi}`] ?? ''}
                        onChange={e => setFormAnswers(prev => ({ ...prev, [`${n.id}_q${qi}`]: e.target.value }))}
                        placeholder="Your answer…"
                        rows={2}
                        style={{ ...inputStyle, resize: 'vertical' } as any}
                      />
                    </div>
                  ))}

                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    <button onClick={() => handleFillSubmit(n)} style={{ flex: 1, padding: '9px', background: C.lime, color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontFamily: C.mono, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                      <Send size={12} /> Submit Application
                    </button>
                    <button onClick={() => setActiveFormId(null)} style={{ padding: '9px 14px', background: 'transparent', color: C.muted, border: `1.5px solid ${C.border}`, borderRadius: 7, cursor: 'pointer', fontFamily: C.mono, fontSize: 12 }}>
                      Save Draft
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Submitted forms */}
      {submitted.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
            Submitted
          </div>
          {submitted.map((n: any) => (
            <div key={n.id} style={{ padding: '14px 16px', background: C.bg, borderRadius: 10, border: `1.5px solid ${C.border}`, marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{n.role}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>From: {n.org} · Submitted {n.received}</div>
                </div>
                <span style={{ padding: '4px 10px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #86efac', borderRadius: 5, fontSize: 10, fontWeight: 700 }}>
                  ✓ Submitted
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {pending.length === 0 && submitted.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: C.muted, fontSize: 12 }}>
          No forms received yet. Make your profile visible on the globe to get noticed by organizations.
        </div>
      )}
    </div>
  );
}

function ConnectionsTab() {
  return (
    <div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>Your network connections</div>
      {DEMO_CONNECTIONS.map(c => (
        <div key={c.id} style={{ padding: '12px 14px', background: C.bg, borderRadius: 10, border: `1.5px solid ${C.border}`, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{c.name}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{c.profession} · {c.country}</div>
          </div>
          <span style={{
            padding: '4px 10px', borderRadius: 5, fontSize: 10, fontWeight: 700,
            background: c.status === 'accepted' ? '#f0fdf4' : '#fffbeb',
            color: c.status === 'accepted' ? '#16a34a' : '#d97706',
            border: `1px solid ${c.status === 'accepted' ? '#86efac' : '#fcd34d'}`,
          }}>
            {c.status === 'accepted' ? 'Connected' : 'Pending'}
          </span>
        </div>
      ))}
    </div>
  );
}

function JobPostsTab() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: C.muted }}>Active job postings</div>
        <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', background: C.blue, color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontFamily: C.mono, fontWeight: 700 }}>
          <Plus size={12} /> Post New Job
        </button>
      </div>
      {DEMO_FORMS.map(f => (
        <div key={f.id} style={{ padding: '14px 16px', background: C.bg, borderRadius: 10, border: `1.5px solid ${C.border}`, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{f.jobTitle}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{f.company} · {f.sent_to} candidates contacted</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button style={{ padding: '5px 10px', background: 'transparent', color: C.blue, border: `1.5px solid ${C.blue}`, borderRadius: 5, cursor: 'pointer', fontSize: 10, fontFamily: C.mono }}>Edit</button>
            <button style={{ padding: '5px 10px', background: 'transparent', color: C.red, border: `1.5px solid ${C.red}`, borderRadius: 5, cursor: 'pointer', fontSize: 10, fontFamily: C.mono }}>Close</button>
          </div>
        </div>
      ))}
    </div>
  );
}
