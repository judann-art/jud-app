import { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchReels, fetchLikeCounts, fetchCommentCounts, fetchMyLikes, toggleLike, fetchComments, addComment } from '../lib/api';
import { useAuth } from '../lib/auth';
import { avatarFor, timeAgo } from '../lib/utils';
import type { PostWithProfile } from '../lib/supabase';

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21l7.7-7.6 1.1-1a5.5 5.5 0 0 0 0-7.8z" />
  </svg>
);
const MuteIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></svg>
);
const SoundIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M18.5 5.5a9 9 0 0 1 0 13" /></svg>
);
const CommentIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4L3 21l1.1-4A8.4 8.4 0 1 1 21 11.5z" /></svg>
);
const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
);

type Comment = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: { id: string; username: string; display_name: string; avatar_url: string };
};

export default function Reels() {
  const { user } = useAuth();
  const [reels, setReels] = useState<PostWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [commentsOpenIdx, setCommentsOpenIdx] = useState<number | null>(null);
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const list = await fetchReels(user.id, 30);
      const ids = list.map((p) => p.id);
      const [likes, commentCounts, mine] = await Promise.all([
        fetchLikeCounts(ids),
        fetchCommentCounts(ids),
        fetchMyLikes(ids, user.id),
      ]);
      setReels(list.map((p) => ({
        ...p,
        like_count: likes[p.id] || 0,
        comment_count: commentCounts[p.id] || 0,
        liked_by_me: !!mine[p.id],
      })));
    } catch (e: any) {
      setError(e.message || 'Failed to load reels');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = Number((entry.target as HTMLElement).dataset.index);
          if (entry.isIntersecting) {
            setActiveIndex(idx);
            videoRefs.current.forEach((v, i) => {
              if (!v) return;
              if (i === idx) {
                v.play().catch(() => {});
              } else {
                v.pause();
              }
            });
          }
        });
      },
      { threshold: 0.6 }
    );
    const els = containerRef.current?.querySelectorAll('[data-index]');
    els?.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [reels.length]);

  const toggleMute = () => {
    setMuted((m) => !m);
    videoRefs.current.forEach((v) => { if (v) v.muted = !muted ? true : false; });
  };

  const like = async (post: PostWithProfile, idx: number) => {
    if (!user) return;
    const liked = reels[idx].liked_by_me;
    setReels((prev) => prev.map((p, i) => i === idx ? {
      ...p,
      liked_by_me: !liked,
      like_count: p.like_count + (liked ? -1 : 1),
    } : p));
    try {
      await toggleLike(post.id, user.id, liked);
    } catch {
      setReels((prev) => prev.map((p, i) => i === idx ? {
        ...p,
        liked_by_me: liked,
        like_count: p.like_count + (liked ? 1 : -1),
      } : p));
    }
  };

  const openComments = async (idx: number) => {
    if (commentsOpenIdx === idx) {
      setCommentsOpenIdx(null);
      setComments(null);
      return;
    }
    setCommentsOpenIdx(idx);
    setComments(null);
    setCommentsLoading(true);
    try {
      const c = await fetchComments(reels[idx].id) as unknown as Comment[];
      setComments(c);
    } finally {
      setCommentsLoading(false);
    }
  };

  const submitComment = async (idx: number) => {
    if (!user || !commentText.trim()) return;
    setPostingComment(true);
    try {
      await addComment(reels[idx].id, user.id, commentText.trim());
      setCommentText('');
      const c = await fetchComments(reels[idx].id) as unknown as Comment[];
      setComments(c);
      setReels((prev) => prev.map((p, i) => i === idx ? {
        ...p,
        comment_count: p.comment_count + 1,
      } : p));
    } finally {
      setPostingComment(false);
    }
  };

  if (loading) return <div className="fade-in"><div className="page-header">Reels</div><div className="page"><div className="loading"><div className="spinner" /></div></div></div>;

  return (
    <div className="fade-in">
      <div className="page-header">Reels</div>
      <div className="page" style={{ maxWidth: 460 }}>
        {error && <div className="error-box">{error}</div>}
        {!error && reels.length === 0 && (
          <div className="empty">
            <div className="ico">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
            </div>
            <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>No reels yet</div>
            <div style={{ fontSize: 14 }}>Reels from people you follow will appear here. Follow more people to see their videos.</div>
          </div>
        )}
        <div className="reels-feed" ref={containerRef}>
          {reels.map((r, idx) => (
            <div className="reel" key={r.id} data-index={idx}>
              <video
                ref={(el) => { videoRefs.current[idx] = el; }}
                src={r.video_url}
                loop
                muted={muted}
                playsInline
                preload="metadata"
                onClick={() => {
                  const v = videoRefs.current[idx];
                  if (!v) return;
                  if (v.paused) v.play().catch(() => {}); else v.pause();
                }}
                onError={(e) => { (e.target as HTMLVideoElement).style.display = 'none'; }}
              />
              <div className="reel-overlay">
                <div className="reel-top">
                  <Link to={`/u/${r.profiles.username}`} className="reel-author">
                    <img src={avatarFor(r.profiles)} alt={r.profiles.display_name} />
                    <div>
                      <div className="dn">{r.profiles.display_name}</div>
                      <div className="un">@{r.profiles.username} · {timeAgo(r.created_at)}</div>
                    </div>
                  </Link>
                  <button className="reel-mute" onClick={toggleMute} aria-label="toggle sound">
                    {muted ? <MuteIcon /> : <SoundIcon />}
                  </button>
                </div>
                {r.content && <div className="reel-caption">{r.content}</div>}
                <div className="reel-side">
                  <button className={`reel-action ${r.liked_by_me ? 'liked' : ''}`} onClick={() => like(r, idx)}>
                    <HeartIcon filled={r.liked_by_me} />
                    <span>{r.like_count}</span>
                  </button>
                  <button className={`reel-action ${commentsOpenIdx === idx ? 'active' : ''}`} onClick={() => openComments(idx)}>
                    <CommentIcon />
                    <span>{r.comment_count}</span>
                  </button>
                </div>
              </div>

              {commentsOpenIdx === idx && (
                <div className="reel-comments-sheet">
                  <div className="rcs-head">
                    <span>Comments</span>
                    <button className="rcs-close" onClick={() => { setCommentsOpenIdx(null); setComments(null); }} aria-label="close">
                      <CloseIcon />
                    </button>
                  </div>
                  <div className="rcs-list">
                    {commentsLoading && <div style={{ color: 'var(--text-dim)', fontSize: 13, padding: '12px 0' }}>Loading…</div>}
                    {!commentsLoading && comments && comments.length === 0 && (
                      <div style={{ color: 'var(--text-dim)', fontSize: 13, padding: '12px 0' }}>No comments yet.</div>
                    )}
                    {!commentsLoading && comments && comments.map((c) => (
                      <div className="comment" key={c.id}>
                        <Link to={`/u/${c.profiles.username}`}>
                          <img src={avatarFor(c.profiles)} alt={c.profiles.display_name} />
                        </Link>
                        <div className="body">
                          <div className="head">
                            <Link to={`/u/${c.profiles.username}`} className="dn">{c.profiles.display_name}</Link>
                            <span className="un">@{c.profiles.username}</span>
                            <span className="time">{timeAgo(c.created_at)}</span>
                          </div>
                          <div className="txt">{c.content}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {user && (
                    <div className="rcs-input">
                      <input
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Add a comment…"
                        onKeyDown={(e) => { if (e.key === 'Enter') submitComment(idx); }}
                      />
                      <button className="btn btn-primary btn-sm" disabled={postingComment || !commentText.trim()} onClick={() => submitComment(idx)}>
                        {postingComment ? '…' : 'Reply'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
