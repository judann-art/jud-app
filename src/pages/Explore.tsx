import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { searchProfiles, searchPosts, fetchLikeCounts, fetchCommentCounts, fetchMyLikes } from '../lib/api';
import { useAuth } from '../lib/auth';
import { avatarFor } from '../lib/utils';
import type { PostWithProfile, Profile } from '../lib/supabase';
import PostCard from '../components/PostCard';

export default function Explore() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'people' | 'posts'>('people');
  const [people, setPeople] = useState<Profile[]>([]);
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [loading, setLoading] = useState(false);

  const run = useCallback(async (q: string) => {
    if (!q.trim()) {
      setPeople([]);
      setPosts([]);
      return;
    }
    setLoading(true);
    try {
      const [p, ps] = await Promise.all([searchProfiles(q), searchPosts(q)]);
      setPeople(p as Profile[]);
      const ids = ps.map((x) => x.id);
      const [likes, comments, mine] = await Promise.all([
        fetchLikeCounts(ids),
        fetchCommentCounts(ids),
        user ? fetchMyLikes(ids, user.id) : Promise.resolve<Record<string, boolean>>({}),
      ]);
      setPosts(ps.map((x) => ({
        ...x,
        like_count: likes[x.id] || 0,
        comment_count: comments[x.id] || 0,
        liked_by_me: !!mine[x.id],
      })));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const t = setTimeout(() => run(query), 250);
    return () => clearTimeout(t);
  }, [query, run]);

  return (
    <div className="fade-in">
      <div className="page-header">Explore</div>
      <div className="page">
        <div className="search-bar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people and posts"
            autoFocus
          />
        </div>

        {!query.trim() && (
          <div className="empty">
            <div className="ico">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="9" /><polygon points="16 8 13 13 8 16 11 11 16 8" /></svg>
            </div>
            <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Find your people</div>
            <div style={{ fontSize: 14 }}>Search by name, username, or post content.</div>
          </div>
        )}

        {query.trim() && (
          <>
            <div className="tabs">
              <button className={`tab ${tab === 'people' ? 'active' : ''}`} onClick={() => setTab('people')}>People</button>
              <button className={`tab ${tab === 'posts' ? 'active' : ''}`} onClick={() => setTab('posts')}>Posts</button>
            </div>

            {loading && <div className="loading"><div className="spinner" /></div>}

            {!loading && tab === 'people' && (
              <div className="explore-section">
                {people.length === 0 && <div style={{ color: 'var(--text-dim)', fontSize: 14, padding: '20px 0' }}>No people found.</div>}
                {people.map((p) => (
                  <Link key={p.id} to={`/u/${p.username}`} className="profile-row">
                    <img src={avatarFor(p)} alt={p.display_name} />
                    <div className="info">
                      <div className="dn">{p.display_name}</div>
                      <div className="un">@{p.username}</div>
                      {p.bio && <div className="bio">{p.bio}</div>}
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {!loading && tab === 'posts' && (
              <div className="explore-section">
                {posts.length === 0 && <div style={{ color: 'var(--text-dim)', fontSize: 14, padding: '20px 0' }}>No posts found.</div>}
                {posts.map((p) => (
                  <PostCard key={p.id} post={p} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
