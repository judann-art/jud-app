import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { createPost } from '../lib/api';
import { avatarFor } from '../lib/utils';

export default function Composer({ onPosted }: { onPosted: () => void }) {
  const { user, profile } = useAuth();
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

  if (!user || !profile) return null;

  const submit = async () => {
    if (!content.trim()) return;
    setPosting(true);
    setError('');
    try {
      await createPost(content.trim(), imageUrl.trim(), user.id, videoUrl.trim());
      setContent('');
      setImageUrl('');
      setVideoUrl('');
      onPosted();
    } catch (e: any) {
      setError(e.message || 'Failed to post');
    } finally {
      setPosting(false);
    }
  };

  const max = 280;
  const remaining = max - content.length;
  const over = remaining < 0;

  return (
    <div className="composer">
      <div className="composer-row">
        <img src={avatarFor(profile)} alt={profile.display_name} />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's happening?"
          maxLength={max + 50}
        />
      </div>
      {error && <div className="error-box">{error}</div>}
      <div className="composer-actions">
        <div className="composer-meta" style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 0 }}>
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Optional image URL"
            style={{
              background: 'transparent', border: 'none', color: 'var(--text-dim)',
              fontSize: 13, padding: 0,
            }}
          />
          <input
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="Optional video URL (appears in Reels)"
            style={{
              background: 'transparent', border: 'none', color: 'var(--text-dim)',
              fontSize: 13, padding: 0,
            }}
          />
        </div>
        <div className="right">
          <span style={{ fontSize: 13, color: over ? 'var(--error)' : 'var(--text-dim)' }}>{remaining}</span>
          <button
            className="btn btn-primary btn-sm"
            disabled={posting || !content.trim() || over}
            onClick={submit}
          >
            {posting ? 'Posting…' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  );
}
