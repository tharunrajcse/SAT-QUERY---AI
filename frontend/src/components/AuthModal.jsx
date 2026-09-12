import React, { useState } from 'react';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [activeTab, setActiveTab] = useState('signup'); // 'signup' or 'login'
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Signup fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [recheckPassword, setRecheckPassword] = useState('');

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  if (!isOpen) return null;

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (signupPassword !== recheckPassword) {
      setErrorMsg('Passwords do not match! Please recheck your password.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          username: username,
          email: signupEmail,
          password: signupPassword,
          recheck_password: recheckPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Signup failed');
      }

      setSuccessMsg(data.message || 'Account created successfully!');
      localStorage.setItem('geochange_token', data.token);
      localStorage.setItem('geochange_user', JSON.stringify(data.user));

      setTimeout(() => {
        onAuthSuccess(data.user);
        onClose();
      }, 1000);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Login failed');
      }

      setSuccessMsg(data.message || 'Logged in successfully!');
      localStorage.setItem('geochange_token', data.token);
      localStorage.setItem('geochange_user', JSON.stringify(data.user));

      setTimeout(() => {
        onAuthSuccess(data.user);
        onClose();
      }, 1000);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>&times;</button>

        <div className="auth-tabs">
          <button
            className={`auth-tab-btn ${activeTab === 'signup' ? 'active' : ''}`}
            onClick={() => { setActiveTab('signup'); setErrorMsg(''); setSuccessMsg(''); }}
          >
            New User (Sign Up)
          </button>
          <button
            className={`auth-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => { setActiveTab('login'); setErrorMsg(''); setSuccessMsg(''); }}
          >
            Already Have an Account (Log In)
          </button>
        </div>

        {errorMsg && <div className="auth-alert error-alert">{errorMsg}</div>}
        {successMsg && <div className="auth-alert success-alert">{successMsg}</div>}

        {activeTab === 'signup' ? (
          <form className="auth-form" onSubmit={handleSignup}>
            <div className="form-row-2">
              <div className="input-group">
                <label>First Name</label>
                <input
                  type="text"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <label>Last Name</label>
                <input
                  type="text"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label>Username</label>
              <input
                type="text"
                placeholder="johndoe99"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label>Email ID</label>
              <input
                type="email"
                placeholder="john@example.com"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-row-2">
              <div className="input-group">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <label>Recheck Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={recheckPassword}
                  onChange={(e) => setRecheckPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Creating Account...' : 'Sign Up & Connect'}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleLogin}>
            <div className="input-group">
              <label>Email ID</label>
              <input
                type="email"
                placeholder="john@example.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Logging In...' : 'Log In'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
