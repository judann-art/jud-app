import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../lib/auth';
import { fetchFeed, fetchLikeCounts, fetchCommentCounts, fetchMyLikes } from '../lib/api';
import type { PostWithProfile } from '../lib/supabase';
import Composer from '../components/Composer';
import PostCard from '../components/PostCard';

export default function Feed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const list = await fetchFeed(50);
      const ids = list.map((p) => p.id);
      const [likes, comments, mine] = await Promise.all([
        fetchLikeCounts(ids),
        fetchCommentCounts(ids),
        user ? fetchMyLikes(ids, user.id) : Promise.resolve<Record<string, boolean>>({}),
      ]);
      setPosts(list.map((p) => ({
        ...p,
        like_count: likes[p.id] || 0,
        comment_count: comments[p.id] || 0,
        liked_by_me: !!mine[p.id],
      })));
    } catch (e: any) {
      setError(e.message || 'Failed to load feed');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="fade-in">
      <div className="page-header">Home</div>
      <div className="page">
        <Composer onPosted={load} />
        {error && <div className="error-box">{error}</div>}
        {loading && <div className="loading"><div className="spinner" /></div>}
        {!loading && !error && posts.length === 0 && (
          <div className="empty">
            <div className="ico">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></svg>
            </div>
            <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Your feed is quiet</div>
            <div style={{ fontSize: 14 }}>Be the first to post, or explore to find people to follow.</div>
          </div>
        )}
        {posts.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </div>
    </div>
  );
}
