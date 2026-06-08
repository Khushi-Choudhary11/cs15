import React, { useEffect, useRef, useState } from 'react';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import api, { friendlyError } from '../../utils/api';
import { buildTransformedUrl, type CloudinaryAsset } from '../../hooks/useCloudinaryUpload';
import type { Post, Comment } from '../../types/ui';

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatDate = (d: string | undefined) =>
  new Date(d ?? Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const formatTime = (d: string | undefined) =>
  new Date(d ?? Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

interface PostDetailDialogProps {
  post: Post;
  onClose: () => void;
  currentUserId: string;
  userRole: string;
}

// ── Lifecycle config — dark-mode-aware tokens only ────────────────────────────
const LIFECYCLE_CONFIG: Record<string, { label: string; cls: string; dot: string; icon: string }> = {
  open:               { label: 'Open',          cls: 'bg-white/5 text-ink-soft border-white/10',                 dot: 'bg-ink-faint',   icon: '○' },
  answered:           { label: 'Solved',         cls: 'bg-accent/10 text-accent border-accent/25',               dot: 'bg-accent',      icon: '✓' },
  community_accepted: { label: 'Community ✓',    cls: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/25', dot: 'bg-emerald-400', icon: '✦' },
  ai_validated:       { label: 'AI Validated',   cls: 'bg-violet-400/10 text-violet-400 border-violet-400/25',   dot: 'bg-violet-400',  icon: '✧' },
  admin_accepted:     { label: 'Admin Approved', cls: 'bg-blue-400/10 text-blue-400 border-blue-400/25',         dot: 'bg-blue-400',    icon: '✦' },
  converted_to_faq:   { label: 'Official FAQ',   cls: 'bg-amber-400/10 text-amber-400 border-amber-400/25',      dot: 'bg-amber-400',   icon: '★' },
};

// ── Attachment Lightbox ───────────────────────────────────────────────────────
interface LightboxProps { assets: CloudinaryAsset[]; startIndex: number; onClose: () => void; }
function AttachmentLightbox({ assets, startIndex, onClose }: LightboxProps) {
  const [idx, setIdx] = useState(startIndex);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setIdx(i => (i + 1) % assets.length);
      if (e.key === 'ArrowLeft') setIdx(i => (i - 1 + assets.length) % assets.length);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [assets.length, onClose]);
  const a = assets[idx];
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-md" onClick={onClose}>
      <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-lg font-bold transition-colors" onClick={onClose}>✕</button>
      {assets.length > 1 && <>
        <button className="absolute left-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xl transition-colors" onClick={e => { e.stopPropagation(); setIdx(i => (i - 1 + assets.length) % assets.length); }}>‹</button>
        <button className="absolute right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xl transition-colors" onClick={e => { e.stopPropagation(); setIdx(i => (i + 1) % assets.length); }}>›</button>
      </>}
      <img
        src={buildTransformedUrl(a.url, 'w_1600,c_limit,q_auto,f_auto')}
        alt={`Attachment ${idx + 1}`}
        className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl shadow-2xl ring-1 ring-white/10"
        onClick={e => e.stopPropagation()}
      />
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
        {assets.map((_, i) => (
          <button key={i} onClick={e => { e.stopPropagation(); setIdx(i); }}
            className={`h-1.5 rounded-full transition-all duration-200 ${i === idx ? 'bg-white w-4' : 'bg-white/35 hover:bg-white/60 w-1.5'}`} />
        ))}
      </div>
      <span className="absolute bottom-5 right-5 text-xs text-white/50 tabular-nums">{idx + 1} / {assets.length}</span>
    </div>
  );
}

// ── Attachment Grid ───────────────────────────────────────────────────────────
interface AttachmentGridProps { assets: CloudinaryAsset[]; onPreview: (index: number) => void; }
function AttachmentGrid({ assets, onPreview }: AttachmentGridProps) {
  if (!assets.length) return null;
  const visible = assets.slice(0, 4);
  const extra = assets.length - 4;
  return (
    <div className="mt-5 grid gap-2.5" style={{ gridTemplateColumns: assets.length === 1 ? '1fr' : 'repeat(2, 1fr)' }}>
      {visible.map((a, i) => (
        <button
          key={a.publicId}
          onClick={() => onPreview(i)}
          className="relative rounded-2xl overflow-hidden border border-accent/15 bg-mist aspect-video
            hover:border-accent/40 transition-all duration-300 group"
          style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.2)' }}
        >
          <img
            src={buildTransformedUrl(a.url, 'w_800,h_450,c_fill,q_auto,f_auto')}
            alt={`Attachment ${i + 1}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-200 flex items-center justify-center">
            <div className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 scale-90 group-hover:scale-100">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-white">
                <path d="M10 2H14V6M6 10H2V14M14 2L9 7M2 14L7 9" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          {/* Subtle green glow on hover */}
          <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{ boxShadow: 'inset 0 0 0 1px rgba(34,197,94,0.25), 0 0 20px rgba(34,197,94,0.10)' }} />
        </button>
      ))}
      {extra > 0 && (
        <button
          onClick={() => onPreview(4)}
          className="relative rounded-2xl overflow-hidden border border-border bg-card/60 aspect-video hover:bg-card hover:border-border-medium transition-all flex items-center justify-center"
        >
          <span className="text-base font-semibold text-ink-soft">+{extra} more</span>
        </button>
      )}
    </div>
  );
}

// ── DNA Strip ─────────────────────────────────────────────────────────────────
function DnaStrip({ dna }: { dna: NonNullable<Post['dna']> }) {
  return (
    <div className="flex flex-wrap items-center gap-2 mt-4 pt-3.5 border-t border-border/50">
      <span className="text-[10px] font-semibold text-ink-faint uppercase tracking-widest">Solution DNA</span>
      {dna.steps.length > 0 && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20 text-xs font-medium text-accent">
          {dna.steps.length} step{dna.steps.length !== 1 ? 's' : ''}
        </span>
      )}
      {dna.tools.slice(0, 3).map((tool, i) => (
        <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-full bg-card border border-border text-xs text-ink-soft">{tool}</span>
      ))}
      {dna.tools.length > 3 && <span className="text-xs text-ink-faint">+{dna.tools.length - 3}</span>}
      {dna.timeToComplete && (
        <span className="inline-flex items-center gap-1.5 text-xs text-ink-faint">
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.3">
            <circle cx="5.5" cy="5.5" r="4.5"/><path d="M5.5 3.5V5.5L7 7" strokeLinecap="round"/>
          </svg>
          {dna.timeToComplete}
        </span>
      )}
      {dna.difficulty && (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
          dna.difficulty === 'Easy'     ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/25' :
          dna.difficulty === 'Moderate' ? 'bg-amber-400/10 text-amber-400 border-amber-400/25' :
                                          'bg-red-400/10 text-red-400 border-red-400/25'
        }`}>{dna.difficulty}</span>
      )}
    </div>
  );
}

// ── Answer Card ───────────────────────────────────────────────────────────────
function AnswerCard({ post, currentUserId, userRole, onPostUpdate }: {
  post: Post; currentUserId: string; userRole: string; onPostUpdate: (p: Post) => void;
}) {
  const [showDnaEditor, setShowDnaEditor] = useState(false);
  const [dnaSteps, setDnaSteps] = useState('');
  const [dnaTools, setDnaTools] = useState('');
  const [dnaTime, setDnaTime] = useState('');
  const [dnaDifficulty, setDnaDifficulty] = useState<'Easy' | 'Moderate' | 'Tricky'>('Moderate');
  const [dnaSaving, setDnaSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const isEditor = userRole === 'admin' || userRole === 'moderator' || post.answerAuthorId === currentUserId;
  const isExpert = post.answerIsExpert;

  return (
    <div className={`rounded-2xl border p-5 ${
      isExpert
        ? 'bg-amber-400/[0.06] border-amber-400/20'
        : 'bg-accent/[0.06] border-accent/20'
    }`}>
      {/* Answer header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isExpert ? 'bg-amber-400/15' : 'bg-accent/15'
        }`}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill={isExpert ? '#FBBF24' : '#22C55E'}>
            <path d="M7 1L8.5 5H13L9.5 7.5L10.8 12L7 9.5L3.2 12L4.5 7.5L1 5H5.5L7 1Z"/>
          </svg>
        </div>
        <span className={`text-xs font-semibold uppercase tracking-wide ${isExpert ? 'text-amber-400' : 'text-accent'}`}>
          {isExpert ? '⭐ Expert Mentor Answer' : 'Official Answer'}
        </span>
        {post.answerAuthorId && (
          <span className="ml-auto text-[10px] font-medium text-ink-faint bg-card/60 px-2 py-0.5 rounded-full border border-border/60">Staff</span>
        )}
      </div>

      <p className="text-sm text-ink/85 leading-[1.8]">{post.answer}</p>
      {post.dna && <DnaStrip dna={post.dna} />}

      {isEditor && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => {
              setDnaSteps(post.dna?.steps.join('\n') || '');
              setDnaTools(post.dna?.tools.join(', ') || '');
              setDnaTime(post.dna?.timeToComplete || '');
              setDnaDifficulty(post.dna?.difficulty || 'Moderate');
              setShowDnaEditor(v => !v);
            }}
            className="text-[11px] text-accent/60 hover:text-accent font-medium flex items-center gap-1.5 transition-all px-2.5 py-1.5 rounded-lg hover:bg-accent/8"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.3">
              <path d="M7.5 1.5L8.5 2.5L3 8L1 8.5L1.5 6.5L7.5 1.5Z" strokeLinejoin="round"/>
            </svg>
            {post.dna ? 'Edit DNA' : 'Add DNA'}
          </button>
        </div>
      )}

      {showDnaEditor && (
        <div className="mt-3 p-4 rounded-xl border border-accent/20 bg-card/70 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-accent">Solution DNA</span>
            <button onClick={() => setShowDnaEditor(false)}
              className="w-6 h-6 flex items-center justify-center rounded-full text-ink-faint hover:text-ink hover:bg-white/8 transition-all text-sm">✕</button>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-ink-faint uppercase tracking-widest mb-1.5 block">Steps (one per line)</label>
            <textarea value={dnaSteps} onChange={e => setDnaSteps(e.target.value)} rows={3}
              placeholder="Step 1: Do this&#10;Step 2: Then do that"
              className="w-full rounded-xl border border-border bg-mist/60 px-3 py-2 text-xs text-ink placeholder-ink-faint focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 resize-none transition-all"/>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-ink-faint uppercase tracking-widest mb-1.5 block">Tools (comma-separated)</label>
            <input type="text" value={dnaTools} onChange={e => setDnaTools(e.target.value)}
              placeholder="VS Code, Git, Terminal"
              className="w-full rounded-xl border border-border bg-mist/60 px-3 py-2 text-xs text-ink placeholder-ink-faint focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all"/>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[10px] font-semibold text-ink-faint uppercase tracking-widest mb-1.5 block">Time</label>
              <input type="text" value={dnaTime} onChange={e => setDnaTime(e.target.value)}
                placeholder="30 mins"
                className="w-full rounded-xl border border-border bg-mist/60 px-3 py-2 text-xs text-ink placeholder-ink-faint focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all"/>
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-semibold text-ink-faint uppercase tracking-widest mb-1.5 block">Difficulty</label>
              <select value={dnaDifficulty} onChange={e => setDnaDifficulty(e.target.value as 'Easy' | 'Moderate' | 'Tricky')}
                className="w-full rounded-xl border border-border bg-mist/60 px-3 py-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all">
                <option>Easy</option><option>Moderate</option><option>Tricky</option>
              </select>
            </div>
          </div>
          {actionError && <p className="text-xs text-danger">{actionError}</p>}
          <div className="flex gap-2 justify-end pt-1">
            <Button type="button" variant="secondary" size="sm" onClick={() => setShowDnaEditor(false)}>Cancel</Button>
            <Button type="button" size="sm" loading={dnaSaving}
              onClick={async () => {
                setDnaSaving(true);
                try {
                  const dna = {
                    steps: dnaSteps.split('\n').map((s: string) => s.trim()).filter(Boolean),
                    tools: dnaTools.split(',').map((t: string) => t.trim()).filter(Boolean),
                    timeToComplete: dnaTime.trim() || undefined,
                    difficulty: dnaDifficulty,
                  };
                  await api.patch(`/community/${post._id}/dna`, dna);
                  onPostUpdate({ ...post, dna });
                  setShowDnaEditor(false);
                } catch (e) {
                  const msg = friendlyError(e, 'Failed to save DNA.');
                  setActionError(msg);
                  setTimeout(() => setActionError(null), 3000);
                } finally { setDnaSaving(false); }
              }}>
              Save DNA
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Lifecycle Timeline ────────────────────────────────────────────────────────
function LifecycleTimeline({ history }: {
  history: Array<{ from: string; to: string; changedAt: string; note?: string }>;
}) {
  if (!history || history.length === 0) return null;

  return (
    <div className="mt-7 pt-6 border-t border-border/50">
      <h3 className="text-[11px] font-semibold text-ink-faint uppercase tracking-widest mb-5 flex items-center gap-2">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" className="text-accent/50">
          <circle cx="6" cy="6" r="5"/><path d="M6 3.5V6L7.5 7.5" strokeLinecap="round"/>
        </svg>
        Lifecycle History
      </h3>

      <div className="relative pl-6">
        {/* Vertical connector line */}
        <div className="absolute left-[9px] top-2 bottom-2 w-px"
          style={{ background: 'linear-gradient(to bottom, rgba(34,197,94,0.35), rgba(31,42,38,0.6), transparent)' }} />

        <div className="space-y-5">
          {history.map((event, i) => {
            const cfg = LIFECYCLE_CONFIG[event.to] ?? {
              dot: 'bg-ink-faint', cls: 'bg-white/5 text-ink-soft border-white/10', icon: '○', label: event.to,
            };
            const isLatest = i === history.length - 1;

            return (
              <div key={i} className="relative flex gap-3.5 items-start">
                {/* Timeline dot */}
                <div className={`absolute -left-6 mt-[3px] w-[18px] h-[18px] rounded-full flex items-center justify-center flex-shrink-0
                  ${cfg.dot} border-2 border-[var(--modal-bg)]
                  ${isLatest ? 'shadow-[0_0_10px_rgba(34,197,94,0.35)]' : ''}`}>
                  {isLatest && (
                    <div className="absolute inset-0 rounded-full animate-ping opacity-40"
                      style={{ background: 'rgba(34,197,94,0.3)' }} />
                  )}
                </div>

                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${cfg.cls}`}>
                      {cfg.icon} {cfg.label}
                    </span>
                    {event.from && event.from !== event.to && (() => {
                      const fromCfg = LIFECYCLE_CONFIG[event.from];
                      return fromCfg ? (
                        <span className="text-[10px] text-ink-faint flex items-center gap-1">
                          from
                          <span className={`font-medium ${fromCfg.cls.split(' ').find(c => c.startsWith('text-')) ?? 'text-ink-soft'}`}>
                            {fromCfg.label}
                          </span>
                        </span>
                      ) : null;
                    })()}
                    <span className="text-[10px] text-ink-faint ml-auto tabular-nums">{formatDate(event.changedAt)}</span>
                  </div>
                  {event.note && (
                    <p className="mt-1.5 text-[11px] text-ink-soft/75 leading-relaxed pl-0.5">{event.note}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Comment Item ──────────────────────────────────────────────────────────────
function CommentItem({ comment, post, currentUserId, userRole, onUpdate }: {
  comment: Comment;
  post: Post;
  currentUserId: string;
  userRole: string;
  onUpdate: (comments: Comment[]) => void;
}) {
  const cUpvotes   = comment.upvotes?.length ?? 0;
  const cDownvotes = comment.downvotes?.length ?? 0;
  const netScore   = cUpvotes - cDownvotes;
  const hasUpvoted = comment.upvotes?.some(
    u => (typeof u === 'object' ? (u as { _id?: string })._id || u : u)?.toString() === currentUserId
  ) ?? false;
  const hasDownvoted = comment.downvotes?.some(
    u => (typeof u === 'object' ? (u as { _id?: string })._id || u : u)?.toString() === currentUserId
  ) ?? false;
  const commentOpacity = netScore >= 0 ? 1 : Math.max(0.15, 1 - (Math.abs(netScore) * 0.2));
  const canResolve  = userRole === 'admin' || userRole === 'moderator';
  const isPostAuthor = post.author?._id === currentUserId;
  const [replyOpen, setReplyOpen]     = useState(false);
  const [replyText, setReplyText]     = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleUpvote = async () => {
    const res = await api.post<{ upvotedByMe: boolean }>(
      `/community/${post._id}/comments/${comment._id}/upvote`
    );
    onUpdate((post.comments as Comment[]).map(c =>
      c._id === comment._id ? {
        ...c,
        upvotes: res.data.upvotedByMe
          ? [...(c.upvotes || []), currentUserId]
          : (c.upvotes || []).filter(u => (typeof u === 'object' ? (u as { _id?: string })._id : u)?.toString() !== currentUserId),
        downvotes: (c.downvotes || []).filter(u => (typeof u === 'object' ? (u as { _id?: string })._id : u)?.toString() !== currentUserId),
      } : c
    ));
  };

  const handleDownvote = async () => {
    const res = await api.post<{ deleted?: boolean; downvotedByMe: boolean }>(
      `/community/${post._id}/comments/${comment._id}/downvote`
    );
    if (res.data.deleted) {
      try { new Audio('/fahhhhh.mp3').play(); } catch (_) {}
      onUpdate((post.comments as Comment[]).filter(c => c._id !== comment._id));
      return;
    }
    onUpdate((post.comments as Comment[]).map(c =>
      c._id === comment._id ? {
        ...c,
        downvotes: res.data.downvotedByMe
          ? [...(c.downvotes || []), currentUserId]
          : (c.downvotes || []).filter(u => (typeof u === 'object' ? (u as { _id?: string })._id : u)?.toString() !== currentUserId),
        upvotes: (c.upvotes || []).filter(u => (typeof u === 'object' ? (u as { _id?: string })._id : u)?.toString() !== currentUserId),
      } : c
    ));
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setReplyLoading(true);
    try {
      const res = await api.post<{ comment: Comment }>(
        `/community/${post._id}/comments`,
        { body: replyText, parentId: comment._id }
      );
      onUpdate([...((post.comments as Comment[]) || []), res.data.comment]);
      setReplyText('');
      setReplyOpen(false);
    } catch (e) {
      const msg = friendlyError(e, 'Reply failed.');
      setActionError(msg);
      setTimeout(() => setActionError(null), 3000);
    } finally { setReplyLoading(false); }
  };

  const handleVerify = async () => {
    const res = await api.patch<{ verified: boolean }>(
      `/community/${post._id}/comments/${comment._id}/verify`
    );
    onUpdate((post.comments as Comment[]).map(c =>
      c._id === comment._id ? { ...c, verified: res.data.verified } : c
    ));
  };

  const handleAccept = async () => {
    const res = await api.patch<{ post: Post }>(
      `/community/${post._id}/comments/${comment._id}/accept-answer`
    );
    onUpdate((res.data as any).comments || []);
  };

  return (
    <div className="flex items-start gap-3 transition-opacity duration-300" style={{ opacity: commentOpacity }}>
      <Avatar name={comment.author?.name} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="bg-card/50 border border-border/60 rounded-2xl px-4 py-3.5 hover:border-border transition-colors duration-200">
          {/* Comment meta */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-sm font-semibold text-ink">{comment.author?.name || 'User'}</span>
            {comment.verified && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-[10px] font-semibold text-accent">
                <svg width="8" height="8" viewBox="0 0 10 10" fill="currentColor"><path d="M5 0L6.2 3.1H9.5L6.9 5L7.8 8.1L5 6.3L2.2 8.1L3.1 5L0.5 3.1H3.8L5 0Z"/></svg>
                Verified
              </span>
            )}
            {comment.isFirstResponder && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-[10px] font-semibold text-amber-400">
                🏅 First Responder
              </span>
            )}
            <span className="text-xs text-ink-faint ml-auto">{formatDate(comment.createdAt)}</span>
            {comment.createdAt && (
              <span className="text-[10px] text-ink-faint">· {formatTime(comment.createdAt)}</span>
            )}
          </div>

          <p className="text-sm text-ink/80 leading-[1.75]">{comment.body}</p>

          {/* Comment actions */}
          <div className="flex items-center gap-1 mt-3 flex-wrap">
            <button onClick={handleUpvote}
              className={`inline-flex items-center gap-1.5 text-xs font-medium transition-all px-2 py-1 rounded-lg ${
                hasUpvoted ? 'text-accent bg-accent/10 hover:bg-accent/15' : 'text-ink-faint hover:text-ink hover:bg-white/5'
              }`}>
              <span className="text-sm">{hasUpvoted ? '🔥' : '👍'}</span>
              {cUpvotes > 0 && <span className="tabular-nums">{cUpvotes}</span>}
            </button>
            <button onClick={handleDownvote}
              className={`inline-flex items-center gap-1.5 text-xs font-medium transition-all px-2 py-1 rounded-lg ${
                hasDownvoted ? 'text-danger bg-danger/10 hover:bg-danger/15' : 'text-ink-faint hover:text-ink hover:bg-white/5'
              }`}>
              <span className="text-sm">{hasDownvoted ? '💀' : '👎'}</span>
              {cDownvotes > 0 && <span className="tabular-nums">{cDownvotes}</span>}
            </button>
            {currentUserId && (
              <button onClick={() => setReplyOpen(v => !v)}
                className={`text-xs transition-all flex items-center gap-1.5 px-2 py-1 rounded-lg ${
                  replyOpen ? 'text-accent bg-accent/10' : 'text-ink-faint hover:text-ink hover:bg-white/5'
                }`}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M1 2.5C1 1.67 1.67 1 2.5 1h7C10.33 1 11 1.67 11 2.5v5C11 8.33 10.33 9 9.5 9H7l-2 2V9H2.5C1.67 9 1 8.33 1 7.5v-5z" strokeLinejoin="round"/>
                </svg>
                Reply
              </button>
            )}
            {canResolve && (
              <button onClick={handleVerify}
                className="ml-auto text-[10px] text-ink-faint hover:text-accent transition-all px-2 py-1 rounded-lg hover:bg-accent/8">
                {comment.verified ? 'Unverify' : '✅ Verify'}
              </button>
            )}
            {!post.answer && isPostAuthor && (
              <button onClick={handleAccept}
                className="text-[10px] text-ink-faint hover:text-accent transition-all flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-accent/8">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1.5 5.5L4 8L8.5 2"/>
                </svg>
                Accept
              </button>
            )}
          </div>

          {actionError && <p className="mt-2 text-xs text-danger">{actionError}</p>}

          {replyOpen && (
            <form onSubmit={handleReply} className="mt-3 flex gap-2 items-start pt-3 border-t border-border/50">
              <input value={replyText} onChange={e => setReplyText(e.target.value)}
                placeholder="Write a reply…"
                autoFocus
                className="flex-1 rounded-xl border border-border/70 bg-mist/40 px-3 py-2 text-xs text-ink placeholder-ink-faint focus:outline-none focus:ring-2 focus:ring-accent/35 focus:border-accent/40 transition-all"/>
              <Button type="submit" size="sm" loading={replyLoading} disabled={!replyText.trim()} className="flex-shrink-0">Reply</Button>
            </form>
          )}
        </div>

        {/* Nested replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2 ml-4 pl-4 border-l-2 border-accent/15 space-y-2">
            {comment.replies.map(r => (
              <div key={r._id} className="flex items-start gap-2.5">
                <Avatar name={r.author?.name} size="xs" />
                <div className="flex-1 bg-card/40 border border-border/40 rounded-xl px-3.5 py-2.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[11px] font-semibold text-ink">{r.author?.name || 'User'}</span>
                    <span className="text-[10px] text-ink-faint">{formatDate(r.createdAt)}</span>
                  </div>
                  <p className="text-xs text-ink/75 leading-relaxed">{r.body}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Export ────────────────────────────────────────────────────────────────
export default function PostDetailDialog({ post: initialPost, onClose, currentUserId, userRole }: PostDetailDialogProps) {
  const dialogRef     = useRef<HTMLDialogElement>(null);
  const [post, setPost]                     = useState<Post>(initialPost);
  const [commentText, setCommentText]       = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [resolveText, setResolveText]       = useState('');
  const [resolveLoading, setResolveLoading] = useState(false);
  const [expertHelpLoading, setExpertHelpLoading] = useState(false);
  const [actionError, setActionError]       = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason]     = useState('');
  const [reportLoading, setReportLoading]   = useState(false);
  const [lightboxAssets, setLightboxAssets] = useState<CloudinaryAsset[]>([]);
  const [lightboxIndex, setLightboxIndex]   = useState(0);

  const isAnswered     = post.status === 'answered';
  const upvoteCount    = post.upvotes?.length ?? 0;
  const hasUpvoted     = post.upvotes?.some(
    id => (typeof id === 'object' ? (id as { _id?: string })._id || id : id)?.toString() === currentUserId
  ) ?? false;
  const canResolve     = userRole === 'admin' || userRole === 'moderator';
  const attachments    = (post as Post & { attachments?: CloudinaryAsset[] }).attachments ?? [];
  const lifecycleHistory = post.lifecycle?.statusHistory ?? [];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    const handleClose = () => onClose();
    dialog.addEventListener('close', handleClose);
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      const handleBackdrop = (e: MouseEvent) => {
        if (e.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        const inside = rect.top <= e.clientY && e.clientY <= rect.top + rect.height
          && rect.left <= e.clientX && e.clientX <= rect.left + rect.width;
        if (!inside) dialog.close();
      };
      dialog.addEventListener('click', handleBackdrop);
      return () => { dialog.removeEventListener('close', handleClose); dialog.removeEventListener('click', handleBackdrop); };
    }
    return () => dialog.removeEventListener('close', handleClose);
  }, [onClose]);

  const handlePostUpdate = (updated: Post) => setPost(updated);

  const handleUpvote = async () => {
    const prev = post.upvotes || [];
    const isUpvoted = prev.some(id => (typeof id === 'object' ? (id as { _id?: string })._id || id : id)?.toString() === currentUserId);
    const next = isUpvoted
      ? prev.filter(id => (typeof id === 'object' ? (id as { _id?: string })._id : id)?.toString() !== currentUserId)
      : [...prev, currentUserId];
    setPost(p => ({ ...p, upvotes: next }));
    try {
      const res = await api.post<{ upvotedByMe: boolean }>(`/community/${post._id}/upvote`);
      setPost(p => ({ ...p, upvotes: res.data.upvotedByMe
        ? [...prev.filter(id => (typeof id === 'object' ? (id as { _id?: string })._id : id)?.toString() !== currentUserId), currentUserId]
        : prev.filter(id => (typeof id === 'object' ? (id as { _id?: string })._id : id)?.toString() !== currentUserId)
      }));
    } catch {
      setPost(p => ({ ...p, upvotes: prev }));
      setActionError('Upvote failed.');
      setTimeout(() => setActionError(null), 3000);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || commentLoading) return;
    setCommentLoading(true);
    try {
      const res = await api.post<{ comment: Comment }>(`/community/${post._id}/comments`, { body: commentText });
      setPost(p => ({ ...p, comments: [...(p.comments || []), res.data.comment] }));
      setCommentText('');
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Comment failed.';
      setActionError(msg);
      setTimeout(() => setActionError(null), 3000);
    } finally { setCommentLoading(false); }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolveText.trim() || resolveLoading) return;
    setResolveLoading(true);
    try {
      const res = await api.patch<{ post: Post }>(`/community/${post._id}/resolve`, { answer: resolveText });
      setPost(res.data.post);
      setShowResolveForm(false);
      setResolveText('');
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Could not mark as resolved.';
      setActionError(msg);
      setTimeout(() => setActionError(null), 3000);
    } finally { setResolveLoading(false); }
  };

  const handleRequestExpert = async () => {
    if (expertHelpLoading) return;
    setExpertHelpLoading(true);
    try { await api.post(`/community/${post._id}/request-expert`); }
    catch (e) {
      const msg = friendlyError(e, 'Request failed. Please try again.');
      setActionError(msg);
      setTimeout(() => setActionError(null), 3000);
    } finally { setExpertHelpLoading(false); }
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason.trim()) return;
    setReportLoading(true);
    try {
      await api.post(`/community/${post._id}/report`, { reason: reportReason });
      setShowReportModal(false);
      setReportReason('');
      const banner = document.createElement('div');
      banner.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 bg-accent/10 border border-accent/25 rounded-xl text-sm text-accent font-medium shadow-float backdrop-blur-sm';
      banner.textContent = 'Report submitted. Thank you.';
      document.body.appendChild(banner);
      setTimeout(() => banner.remove(), 3000);
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to submit report.';
      setActionError(msg);
      setTimeout(() => setActionError(null), 4000);
    } finally { setReportLoading(false); }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/community?post=${post._id}`;
    if (navigator.share) {
      navigator.share({ title: post.title, url });
    } else {
      navigator.clipboard.writeText(url);
      const banner = document.createElement('div');
      banner.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 bg-card border border-border rounded-xl text-sm text-ink font-medium shadow-float';
      banner.textContent = 'Link copied to clipboard!';
      document.body.appendChild(banner);
      setTimeout(() => banner.remove(), 2500);
    }
  };

  return (
    <>
      {/* ── Overlay — reuses the exact .search-overlay DOM div approach.
           Renders as a real positioned element (not ::backdrop) so the
           same blur(16/20px) + dark tint that powers the search experience
           applies here identically. onClick closes the dialog. ──────── */}
      <div
        className="search-overlay"
        aria-hidden="true"
        onClick={() => dialogRef.current?.close()}
      />

      {/* ── Dialog shell ──────────────────────────────────────────────────── */}
      <dialog
        ref={dialogRef}
        closedby="any"
        aria-labelledby="post-dialog-title"
        className="dialog-shell dialog-panel post-detail-dialog p-0 bg-[var(--modal-bg)] border border-white/[0.07]"
        style={{
          maxWidth: '60rem',
          width: '96vw',
          maxHeight: '90vh',
          boxShadow: '0 32px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(34,197,94,0.07)',
        }}
      >
        {/* Error banner */}
        {actionError && (
          <div className="mx-5 mt-4 px-4 py-2.5 bg-danger/8 border border-danger/20 rounded-xl text-xs text-danger flex items-center justify-between gap-2 animate-fade-in">
            <span>{actionError}</span>
            <button onClick={() => setActionError(null)} className="text-danger/60 hover:text-danger font-bold text-sm flex-shrink-0">✕</button>
          </div>
        )}

        {/* ── Fixed Header ──────────────────────────────────────────────── */}
        <div className="dialog-header flex items-start justify-between gap-4 px-6 pt-6 pb-5 border-b border-white/[0.06]">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            {/* Status icon badge */}
            <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center mt-0.5 ${
              isAnswered
                ? 'bg-accent/10 text-accent'
                : 'bg-amber-400/10 text-amber-400'
            }`} style={isAnswered ? { boxShadow: '0 0 18px rgba(34,197,94,0.15)' } : {}}>
              {isAnswered ? (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M4 10L8.5 14.5L16 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.8"/>
                  <path d="M10 7V11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  <circle cx="10" cy="13.5" r="1" fill="currentColor"/>
                </svg>
              )}
            </div>

            <div className="min-w-0 flex-1">
              {/* Post title */}
              <h2 id="post-dialog-title"
                className="text-[17px] font-semibold text-ink leading-snug tracking-[-0.012em]">
                {post.title}
              </h2>

              {/* Metadata row */}
              <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                {/* Status pill */}
                <span className={`inline-flex items-center gap-1 px-2.5 py-[3px] rounded-full border text-[11px] font-semibold ${
                  isAnswered
                    ? 'bg-accent/10 text-accent border-accent/25'
                    : 'bg-amber-400/10 text-amber-400 border-amber-400/25'
                }`}>
                  {isAnswered ? '✓ Solved' : '○ Open'}
                </span>

                {/* Lifecycle pill */}
                {post.lifecycle?.status && LIFECYCLE_CONFIG[post.lifecycle.status] && (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-[3px] rounded-full border text-[11px] font-semibold ${LIFECYCLE_CONFIG[post.lifecycle.status].cls}`}>
                    {LIFECYCLE_CONFIG[post.lifecycle.status].icon} {LIFECYCLE_CONFIG[post.lifecycle.status].label}
                  </span>
                )}

                {/* Divider */}
                <span className="w-px h-3 bg-border/60 mx-0.5" />

                {/* Author */}
                <span className="text-xs text-ink-faint">
                  by <span className="text-ink-soft font-medium">{post.author?.name || 'Student'}</span>
                </span>
                <span className="text-[10px] text-ink-faint/50">·</span>
                <span className="text-xs text-ink-faint">{formatDate(post.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={() => dialogRef.current?.close()}
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-ink-faint hover:text-ink bg-white/5 hover:bg-white/10 transition-all mt-0.5"
            aria-label="Close"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M2 2L11 11M11 2L2 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* ── Scrollable Body ───────────────────────────────────────────── */}
        <div className="dialog-scroll">
          <div className="px-6 py-6">

            {/* Post body card */}
            <div
              className="bg-card/60 rounded-2xl border border-border/60 p-5"
              style={{ borderLeft: '2px solid rgba(34,197,94,0.30)' }}
            >
              <p className="text-sm text-ink/90 leading-[1.85] whitespace-pre-wrap">{post.body}</p>
              <AttachmentGrid
                assets={attachments}
                onPreview={i => { setLightboxIndex(i); setLightboxAssets(attachments); }}
              />
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-1.5">
                {post.tags.map((tag: string) => (
                  <span key={tag}
                    className="inline-flex items-center px-2.5 py-1 rounded-full bg-accent/8 border border-accent/18 text-xs font-medium text-accent/80">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* ── Action Bar ────────────────────────────────────────────── */}
            <div className="mt-5 flex items-center gap-2 flex-wrap">

              {/* Upvote pill */}
              <div className="flex items-center rounded-xl border border-border/60 overflow-hidden bg-card/40">
                <button
                  onClick={handleUpvote}
                  className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium transition-all duration-150 ${
                    hasUpvoted
                      ? 'bg-accent/12 text-accent'
                      : 'text-ink-soft hover:text-ink hover:bg-white/5'
                  }`}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14"
                    fill={hasUpvoted ? 'currentColor' : 'none'}
                    stroke="currentColor" strokeWidth="1.5">
                    <path d="M7 1L8.8 4.8H13L9.8 7.6L11 12L7 9.2L3 12L4.2 7.6L1 4.8H5.2L7 1Z" strokeLinejoin="round"/>
                  </svg>
                  <span className="tabular-nums">{upvoteCount}</span>
                </button>
              </div>

              {/* Comment count */}
              <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border/60 text-sm text-ink-faint bg-card/40">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M1 3C1 2.17 1.67 1.5 2.5 1.5h9C12.33 1.5 13 2.17 13 3v6C13 9.83 12.33 10.5 11.5 10.5H8.5L5.5 13V10.5H2.5C1.67 10.5 1 9.83 1 9V3z" strokeLinejoin="round"/>
                </svg>
                <span className="tabular-nums">{post.comments?.length ?? 0}</span>
              </div>

              {/* Save + Share pill */}
              {currentUserId && (
                <div className="flex items-center rounded-xl border border-border/60 overflow-hidden bg-card/40">
                  <button
                    onClick={async () => {
                      await api.post(`/community/${post._id}/bookmark`);
                      const b = document.createElement('div');
                      b.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 bg-card border border-border rounded-xl text-xs text-ink font-medium shadow-float';
                      b.textContent = 'Bookmarked';
                      document.body.appendChild(b);
                      setTimeout(() => b.remove(), 2000);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-sm text-ink-soft hover:text-ink hover:bg-white/5 transition-all border-r border-border/50"
                    title="Save"
                  >
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M3 2C3 1.17 3.67 0.5 4.5 0.5h5C10.33 0.5 11 1.17 11 2v9L8 8.5 5 11V2z" strokeLinejoin="round"/>
                    </svg>
                    Save
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-sm text-ink-soft hover:text-ink hover:bg-white/5 transition-all"
                    title="Share"
                  >
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="11" cy="2.5" r="1.5"/><circle cx="3" cy="7" r="1.5"/><circle cx="11" cy="11.5" r="1.5"/>
                      <path d="M4.5 6.3L9.5 3.2M4.5 7.7L9.5 10.8" strokeLinecap="round"/>
                    </svg>
                    Share
                  </button>
                </div>
              )}

              {/* Admin: Mark Resolved */}
              {canResolve && !isAnswered && (
                <Button variant="primary" size="sm" onClick={() => setShowResolveForm(v => !v)}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M2 6L5 9L10 3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Mark Resolved
                </Button>
              )}

              {/* Student: Request Expert */}
              {!canResolve && !isAnswered && currentUserId && post.author?._id !== currentUserId && (
                <Button variant="secondary" size="sm" onClick={handleRequestExpert} loading={expertHelpLoading}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M6 1L7.5 4.5H11.5L8.5 7.5L9.5 11L6 8.5L2.5 11L3.5 7.5L0.5 4.5H4.5L6 1Z"/>
                  </svg>
                  Request Expert
                </Button>
              )}

              {/* Report — far right */}
              {currentUserId && post.author?._id !== currentUserId && (
                <button
                  onClick={() => setShowReportModal(true)}
                  className="ml-auto inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-ink-faint/50 hover:text-red-400 hover:bg-red-400/8 transition-all"
                >
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4">
                    <path d="M6 1v5.5M6 9v.5" strokeLinecap="round"/>
                    <path d="M2.5 11h7L6 1 2.5 11z" strokeLinejoin="round"/>
                  </svg>
                  Report
                </button>
              )}
            </div>

            {/* Time-Trial banners */}
            {post.timeTrialStatus === 'pending' && (
              <div className="mt-4 px-4 py-3 rounded-xl bg-amber-400/8 border border-amber-400/20 flex items-center gap-2.5">
                <span className="text-base">⏱</span>
                <span className="text-sm text-amber-400 font-medium">First Responder active</span>
              </div>
            )}
            {post.timeTrialStatus === 'awarded' && (
              <div className="mt-4 px-4 py-3 rounded-xl bg-yellow-400/8 border border-yellow-400/20 flex items-center gap-2.5">
                <span className="text-base">🏅</span>
                <span className="text-sm text-yellow-400 font-medium">Awarded to First Responder</span>
              </div>
            )}

            {/* Official Answer */}
            {isAnswered && post.answer && (
              <div className="mt-6">
                <AnswerCard
                  post={post}
                  currentUserId={currentUserId}
                  userRole={userRole}
                  onPostUpdate={handlePostUpdate}
                />
              </div>
            )}

            {/* Resolve Form (admin/mod) */}
            {showResolveForm && (
              <form onSubmit={handleResolve} className="mt-5 rounded-2xl border border-accent/20 bg-accent/[0.04] p-5">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-6 h-6 rounded-lg bg-accent/15 flex items-center justify-center flex-shrink-0">
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent">
                      <path d="M2 6L5 9L10 3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <label className="text-sm font-semibold text-accent">Write the official answer</label>
                </div>
                <textarea value={resolveText} onChange={e => setResolveText(e.target.value)} rows={4}
                  placeholder="Provide a clear, helpful answer..."
                  className="w-full rounded-xl border border-accent/20 bg-card/60 px-4 py-3 text-sm text-ink placeholder-ink-faint focus:outline-none focus:ring-2 focus:ring-accent/35 focus:border-accent/40 resize-none transition-all leading-relaxed"/>
                <div className="flex gap-2 mt-3">
                  <Button type="submit" size="sm" loading={resolveLoading} disabled={!resolveText.trim()}>Save Answer</Button>
                  <Button type="button" variant="secondary" size="sm" onClick={() => setShowResolveForm(false)}>Cancel</Button>
                </div>
              </form>
            )}

            {/* Lifecycle Timeline */}
            {lifecycleHistory.length > 0 && (
              <LifecycleTimeline history={lifecycleHistory} />
            )}

            {/* ── Discussion / Comments ─────────────────────────────── */}
            <div className="mt-8 pt-6 border-t border-border/50">
              <div className="flex items-center gap-3 mb-5">
                <h3 className="text-sm font-semibold text-ink">Discussion</h3>
                {(post.comments?.length ?? 0) > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-card border border-border text-xs font-medium text-ink-faint tabular-nums">
                    {post.comments?.length}
                  </span>
                )}
              </div>

              {!post.comments || post.comments.length === 0 ? (
                <div className="py-10 text-center">
                  <div className="w-10 h-10 rounded-2xl bg-card border border-border/60 flex items-center justify-center mx-auto mb-3">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" className="text-ink-faint">
                      <path d="M2 4.5C2 3.67 2.67 3 3.5 3h11C15.33 3 16 3.67 16 4.5v7C16 12.33 15.33 13 14.5 13H11L8.5 16 6 13H3.5C2.67 13 2 12.33 2 11.5v-7z" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <p className="text-sm text-ink-faint">No comments yet.</p>
                  <p className="text-xs text-ink-faint/50 mt-1">Be the first to join the discussion.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {post.comments.map((c, i) => (
                    <CommentItem
                      key={c._id || i}
                      comment={c as Comment}
                      post={post}
                      currentUserId={currentUserId}
                      userRole={userRole}
                      onUpdate={comments => setPost(p => ({ ...p, comments }))}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ── Comment Composer ──────────────────────────────────── */}
            {currentUserId && (
              <div className="mt-5 bg-card/40 border border-border/50 rounded-2xl p-4">
                <form onSubmit={handleComment}>
                  <div className="flex items-start gap-3">
                    <Avatar name={undefined} size="sm" />
                    <div className="flex-1 min-w-0">
                      <textarea
                        value={commentText}
                        onChange={e => setCommentText(e.target.value)}
                        rows={3}
                        placeholder="Share your thoughts or ask a follow-up…"
                        className="w-full rounded-xl border border-border/60 bg-mist/40 px-4 py-3 text-sm text-ink placeholder-ink-faint
                          focus:outline-none focus:ring-2 focus:ring-accent/35 focus:border-accent/40 focus:bg-card/60
                          transition-all duration-200 resize-none leading-relaxed"
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (commentText.trim()) handleComment(e as unknown as React.FormEvent);
                          }
                        }}
                      />
                      <div className="flex items-center justify-between mt-2.5">
                        <p className="text-[11px] text-ink-faint/60">↵ Enter to post · ⇧ Shift+Enter for newline</p>
                        <Button
                          type="submit"
                          size="sm"
                          disabled={!commentText.trim()}
                          loading={commentLoading}
                          className="flex-shrink-0"
                        >
                          Post
                        </Button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>

        {/* ── Report Modal ──────────────────────────────────────────────── */}
        {showReportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowReportModal(false)}>
            <div className="bg-[var(--modal-bg)] rounded-2xl border border-white/[0.07] w-full max-w-sm mx-4 p-6"
              style={{ boxShadow: '0 24px 60px rgba(0,0,0,0.6)' }}
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-red-400/10 flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" className="text-red-400">
                      <path d="M6 1v5.5M6 9v.5" strokeLinecap="round"/>
                      <path d="M2.5 11h7L6 1 2.5 11z" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-ink">Report Post</h3>
                </div>
                <button onClick={() => { setShowReportModal(false); setReportReason(''); }}
                  className="w-7 h-7 flex items-center justify-center rounded-full text-ink-faint hover:text-ink hover:bg-white/8 transition-all">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
              <form onSubmit={handleReport} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-ink-soft mb-2 block">Why are you reporting this?</label>
                  <textarea value={reportReason} onChange={e => setReportReason(e.target.value)} rows={3}
                    placeholder="Spam, harassment, inappropriate content..."
                    className="w-full rounded-xl border border-border/60 bg-mist/60 px-3 py-2.5 text-sm text-ink placeholder-ink-faint focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 resize-none transition-all"
                    autoFocus/>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="secondary" size="sm"
                    onClick={() => { setShowReportModal(false); setReportReason(''); }}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="danger" size="sm" loading={reportLoading} disabled={!reportReason.trim()}>
                    Submit Report
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </dialog>

      {/* Lightbox — outside dialog, full viewport */}
      {lightboxAssets.length > 0 && (
        <AttachmentLightbox
          assets={lightboxAssets}
          startIndex={lightboxIndex}
          onClose={() => setLightboxAssets([])}
        />
      )}
    </>
  );
}
