import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { PostWithProfile } from '../lib/supabase';
import { timeAgo, avatarFor } from '../lib/utils';
import { toggleLike, addComment, fetchComments } from '../lib/api';
import { useAuth } from '../lib/auth';

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21l7.7-7.6 1.1-1a5.5 5.5 0 0 0 0-7.8z" />
  </svg>
);
const CommentIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4L3 21l1.1-4A8.4 8.4 0 1 1 21 11.5z" />
  </svg>
);

type Comment = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: { id: string; username: string; display_name: string; avatar_url: string };
};

export default function PostCard({ post }: { post: PostWithProfile }) {
  const { user } = useAuth();
  const [likes, setLikes] = useState(post.like_count);
  const [liked, setLiked] = useState(post.liked_by_me);
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commenting, setCommenting] = useState(false);

  const like = async () => {
    if (!user) return;
    const newLiked = !liked;
    setLiked(newLiked);
    setLikes((n) => n + (newLiked ? 1 : -1));
    try {
      await toggleLike(post.id, user.id, liked);
    } catch {
      setLiked(!newLiked);
      setLikes((n) => n + (newLiked ? -1 : 1));
    }
  };

  const openComments = async () => {
    if (!showComments && comments === null) {
      const c = await fetchComments(post.id) as unknown as Comment[];
      setComments(c);
    }
    setShowComments(!showComments);
  };

  const submitComment = async () => {
    if (!user || !commentText.trim()) return;
    setCommenting(true);
    try {
      await addComment(post.id, user.id, commentText.trim());
      setCommentText('');
      const c = await fetchComments(post.id) as unknown as Comment[];
      setComments(c);
    } finally {
      setCommenting(false);
    }
  };

  return (
    <article className="post fade-in">
      <div className="post-head">
        <Link to={`/u/${post.profiles.username}`}>
          <img src={avatarFor(post.profiles)} alt={post.profiles.display_name} />
        </Link>
        <div className="post-head">
          <div className="names">
            <Link to={`/u/${post.profiles.username}`} className="dn">{post.profiles.display_name}</Link>
            <span className="un">@{post.profiles.username}</span>
          </div>
          <span className="time">{timeAgo(post.created_at)}</span>
        </div>
      </div>
      <div className="post-body">{post.content}</div>
      {post.image_url && (
        <div className="post-image">
          <img src={post.image_url} alt="" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        </div>
      )}
      <div className="post-actions">
        <button className={`action-btn ${liked ? 'liked' : ''}`} onClick={like}>
          <HeartIcon filled={liked} />
          <span>{likes}</span>
        </button>
        <button className="action-btn" onClick={openComments}>
          <CommentIcon />
          <span>{post.comment_count}</span>
        </button>
      </div>

      {showComments && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
          {comments && comments.length === 0 && (
            <div style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 10 }}>No comments yet.</div>
          )}
          {comments && comments.map((c) => (
            <div key={c.id} className="comment">
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
          {user && (
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment…"
                style={{
                  flex: 1, padding: '9px 12px', borderRadius: 10,
                  border: '1px solid var(--border)', background: 'var(--bg)',
                  color: 'var(--text)', fontSize: 14, outline: 'none',
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') submitComment(); }}
              />
              <button className="btn btn-primary btn-sm" disabled={commenting || !commentText.trim()} onClick={submitComment}>
                {commenting ? '…' : 'Reply'}
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
