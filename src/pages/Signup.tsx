import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (cleanUsername.length < 3) {
      setError('Username must be at least 3 characters (letters, numbers, underscore).');
      setLoading(false);
      return;
    }

    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', cleanUsername)
      .maybeSingle();
    if (existing) {
      setError('That username is already taken.');
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const userId = data.user?.id;
    if (!userId) {
      setError('Sign up failed. Please try again.');
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        username: cleanUsername,
        display_name: displayName.trim() || cleanUsername,
        bio: '',
        avatar_url: '',
      });

    if (profileError) {
      setError('Account created but profile setup failed: ' + profileError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    navigate('/');
  };

  return (
    <div className="auth-wrap">
      <div className="auth-art">
        <div className="brand-big">
          <div className="logo">S</div>
          <div>socialhub</div>
        </div>
        <div className="pitch">
          <h1>Join the conversation.</h1>
          <p>Create your account, set up your profile, and start sharing with a community that listens.</p>
        </div>
        <div className="feat">
          <div className="f"><span className="dot" /> Free forever — no hidden fees</div>
          <div className="f"><span className="dot" /> Your space, your voice, your people</div>
          <div className="f"><span className="dot" /> Start posting in under a minute</div>
        </div>
      </div>

      <div className="auth-form-wrap">
        <div className="auth-card fade-in">
          <h2>Create your account</h2>
          <p className="sub">It only takes a moment.</p>
          {error && <div className="error-box">{error}</div>}
          <form onSubmit={submit}>
            <div className="field">
              <label>Display name</label>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="field">
              <label>Username</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="unique_handle" required />
            </div>
            <div className="field">
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="At least 6 characters" />
            </div>
            <button className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
          <div className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
