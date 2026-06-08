/**
 * Shared constants and helpers for ThreadDetail / CommentNode.
 * Extracted to reduce ThreadDetail.tsx from ~1008 lines.
 */

export const formatDate = (d: string | undefined) =>
  new Date(d ?? Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

// Reddit-style depth colors — each nesting level gets a distinct accent
export const DEPTH_COLORS = [
  'border-accent',
  'border-emerald-400',
  'border-amber-400',
  'border-rose-400',
  'border-violet-400',
];

export const DEPTH_BARS = [
  'bg-accent',
  'bg-emerald-400',
  'bg-amber-400',
  'bg-rose-400',
  'bg-violet-400',
];

export const LIFECYCLE_CONFIG: Record<string, { label: string; cls: string; dot?: string; icon?: string }> = {
  open:               { label: 'Open',          cls: 'bg-white/5 text-ink-soft border-white/10',                  dot: 'bg-ink-faint',   icon: '○' },
  answered:           { label: 'Solved',         cls: 'bg-accent/10 text-accent border-accent/25',                dot: 'bg-accent',      icon: '✓' },
  community_accepted: { label: 'Community ✓',    cls: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/25', dot: 'bg-emerald-400', icon: '✦' },
  ai_validated:       { label: 'AI Validated',   cls: 'bg-violet-400/10 text-violet-400 border-violet-400/25',    dot: 'bg-violet-400',  icon: '✧' },
  admin_accepted:     { label: 'Admin Approved', cls: 'bg-blue-400/10 text-blue-400 border-blue-400/25',          dot: 'bg-blue-400',    icon: '✦' },
  converted_to_faq:   { label: 'Official FAQ',   cls: 'bg-amber-400/10 text-amber-400 border-amber-400/25',       dot: 'bg-amber-400',   icon: '★' },
};

// Count total descendants recursively
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function countReplies(comment: any): number {
  const replies: any[] = comment.replies ?? [];
  return replies.length + replies.reduce((s, r) => s + countReplies(r), 0);
}