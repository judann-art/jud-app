import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  fetchProfileByUsername,
  fetchUserPosts,
  fetchFollowerCount,
  fetchFollowingCount,
  isFollowing,
  toggleFollow,
  fetchLikeCounts,
  fetchCommentCounts,
  fetchMyLikes,
} from '../lib/api';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { avatarFor } from '../lib/utils';
import type { PostWithProfile, Profile } from '../lib/supabase';
import PostCard from '../components/PostCard';

export default function Profile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user, profile: myProfile, refreshProfile } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [followingThem, setFollowingThem] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [saving, setSaving] = useState(false);

  const isMe = profile && user && profile.id === user.id;

  const load = useCallback(async () => {
    if (!username) return;
    setLoading(true);
    setError('');
    try {
      const p = await fetchProfileByUsername(username);
      if (!p) {
        setError('User not found');
        setLoading(false);
        return;
      }
      setProfile(p as Profile);
      setEditName(p.display_name);
      setEditBio(p.bio || '');
      setEditAvatar(p.avatar_url || '');

      const [ps, f, fg] = await Promise.all([
        fetchUserPosts(p.id),
        fetchFollowerCount(p.id),
        fetchFollowingCount(p.id),
      ]);
      setPosts(ps);
      setFollowers(f);
      setFollowing(fg);

      if (user && user.id !== p.id) {
        setFollowingThem(await isFollowing(user.id, p.id));
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [username, user]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    (async () => {
      if (posts.length === 0) return;
      const ids = posts.map((p) => p.id);
      const [likes, comments, mine] = await Promise.all([
        fetchLikeCounts(ids),
        fetchCommentCounts(ids),
        user ? fetchMyLikes(ids, user.id) : Promise.resolve<Record<string, boolean>>({}),
      ]);
      setPosts((prev) => prev.map((p) => ({
        ...p,
        like_count: likes[p.id] || 0,
        comment_count: comments[p.id] || 0,
        liked_by_me: !!mine[p.id],
      })));
    })();
  }, [posts.length, user]);

  const handleFollow = async () => {
    if (!user || !profile) return;
    const newF = !followingThem;
    setFollowingThem(newF);
    setFollowers((n) => n + (newF ? 1 : -1));
    try {
      await toggleFollow(user.id, profile.id, !newF);
    } catch {
      setFollowingThem(!newF);
      setFollowers((n) => n + (newF ? -1 : 1));
    }
  };

  const saveEdit = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: editName.trim() || profile.display_name,
        bio: editBio.trim(),
        avatar_url: editAvatar.trim(),
      })
      .eq('id', profile.id);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setEditing(false);
    await load();
    await refreshProfile();
    navigate(`/u/${username}`);
  };

  if (loading) return <div className="fade-in"><div className="page-header">@{username}</div><div className="page"><div className="loading"><div className="spinner" /></div></div></div>;
  if (error || !profile) return (
    <div className="fade-in">
      <div className="page-header">@{username}</div>
      <div className="page">
        <div className="empty">
          <div className="ico">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-7 8-7s8 3 8 7" /></svg>
          </div>
          <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{error || 'Profile not found'}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fade-in">
      <div className="page-header">@{profile.username}</div>
      <div className="page">
        <div className="profile-header">
          <div className="profile-top">
            <img className="profile-avatar" src={avatarFor(profile)} alt={profile.display_name} />
            <div className="profile-info">
              <div className="dn">{profile.display_name}</div>
              <div className="un">@{profile.username}</div>
              {profile.bio && <div className="bio">{profile.bio}</div>}
              <div className="profile-stats">
                <div className="stat"><span className="n">{posts.length}</span><span className="l">Posts</span></div>
                <div className="stat"><span className="n">{followers}</span><span className="l">Followers</span></div>
                <div className="stat"><span className="n">{following}</span><span className="l">Following</span></div>
              </div>
            </div>
          </div>
          <div className="profile-actions">
            {isMe ? (
              <button className="btn btn-ghost" onClick={() => setEditing(true)}>Edit profile</button>
            ) : user && (
              <button
                className={followingThem ? 'btn btn-ghost' : 'btn btn-primary'}
                onClick={handleFollow}
              >
                {followingThem ? 'Following' : 'Follow'}
              </button>
            )}
          </div>
        </div>

        {posts.length === 0 ? (
          <div className="empty">
            <div className="ico">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></svg>
            </div>
            <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>No posts yet</div>
            <div style={{ fontSize: 14 }}>{isMe ? 'Share your first post from the Home feed.' : 'This user has not posted yet.'}</div>
          </div>
        ) : (
          posts.map((p) => <PostCard key={p.id} post={p} />)
        )}
      </div>

      {editing && (
        <div className="modal-backdrop" onClick={() => setEditing(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Edit profile</h3>
              <button className="modal-close" onClick={() => setEditing(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="field">
                <label>Display name</label>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div className="field">
                <label>Bio</label>
                <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} placeholder="Tell people about yourself" />
              </div>
              <div className="field">
                <label>Avatar URL</label>
                <input value={editAvatar} onChange={(e) => setEditAvatar(e.target.value)} placeholder="https://…" />
              </div>
              <button className="btn btn-primary btn-block" disabled={saving} onClick={saveEdit}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
