import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
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
          <h1>Where conversations come alive.</h1>
          <p>Share your thoughts, follow people you care about, and discover what's trending — all in one place.</p>
        </div>
        <div className="feat">
          <div className="f"><span className="dot" /> Real-time feed of posts from people you follow</div>
          <div className="f"><span className="dot" /> Discover new voices on the Explore page</div>
          <div className="f"><span className="dot" /> Build your profile and grow your audience</div>
        </div>
      </div>

      <div className="auth-form-wrap">
        <div className="auth-card fade-in">
          <h2>Welcome back</h2>
          <p className="sub">Sign in to your account to continue.</p>
          {error && <div className="error-box">{error}</div>}
          <form onSubmit={submit}>
            <div className="field">
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
            </div>
            <button className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <div className="auth-switch">
            Don't have an account? <Link to="/signup">Sign up</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
