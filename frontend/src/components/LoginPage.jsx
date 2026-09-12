import React, { useState } from 'react';

export default function LoginPage({ initialTab = 'login', onAuthSuccess, onBackToLanding }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'login' or 'signup'
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Sign Up form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [recheckPassword, setRecheckPassword] = useState('');

  // Log In form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

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

      setSuccessMsg('Account created successfully! Entering Workspace...');
      localStorage.setItem('geochange_token', data.token);
      localStorage.setItem('geochange_user', JSON.stringify(data.user));

      setTimeout(() => {
        onAuthSuccess(data.user);
      }, 800);
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

      setSuccessMsg('Logged in successfully! Entering Workspace...');
      localStorage.setItem('geochange_token', data.token);
      localStorage.setItem('geochange_user', JSON.stringify(data.user));

      setTimeout(() => {
        onAuthSuccess(data.user);
      }, 800);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cosmic-auth-container">
      {/* Background Decorative Vector Planets */}
      <div className="planet-graphic planet-large auth-planet-1">
        <div className="planet-stripes"></div>
      </div>
      <div className="planet-graphic planet-cyan auth-planet-2">
        <div className="planet-stripes-cyan"></div>
      </div>

      <div className="cosmic-auth-card">
        {/* Back to Landing Page Button */}
        <button className="auth-back-btn" onClick={onBackToLanding}>
          ← Back to Landing Page
        </button>

        {/* Brand Header */}
        <div className="auth-brand-header">
          <div className="cosmic-brand">
            <div className="cosmic-brand-dot"></div>
            <span className="cosmic-brand-text">GEO BI TEMPORAL</span>
          </div>
          <p className="auth-subtitle">Bi-Temporal Geospatial Intelligence Platform</p>
        </div>

        {/* Nav Tabs */}
        <div className="auth-nav-tabs">
          <button
            className={`auth-nav-tab ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => { setActiveTab('login'); setErrorMsg(''); setSuccessMsg(''); }}
          >
            LOG IN
          </button>
          <button
            className={`auth-nav-tab ${activeTab === 'signup' ? 'active' : ''}`}
            onClick={() => { setActiveTab('signup'); setErrorMsg(''); setSuccessMsg(''); }}
          >
            NEW USER (SIGN UP)
          </button>
        </div>

        {/* Error / Success Notifications */}
        {errorMsg && <div className="cosmic-alert alert-error">⚠️ {errorMsg}</div>}
        {successMsg && <div className="cosmic-alert alert-success">✅ {successMsg}</div>}

        {/* Log In Form */}
        {activeTab === 'login' ? (
          <form className="auth-form-body" onSubmit={handleLogin}>
            <div className="auth-field-group">
              <label>Email ID</label>
              <input
                type="email"
                placeholder="name@example.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
            </div>

            <div className="auth-field-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="cosmic-btn-pill cosmic-btn-solid auth-submit-btn" disabled={loading}>
              {loading ? 'AUTHENTICATING...' : 'LOG IN TO WORKSPACE'}
            </button>
          </form>
        ) : (
          /* Sign Up Form */
          <form className="auth-form-body" onSubmit={handleSignup}>
            <div className="auth-field-row">
              <div className="auth-field-group">
                <label>First Name</label>
                <input
                  type="text"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="auth-field-group">
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

            <div className="auth-field-group">
              <label>Username</label>
              <input
                type="text"
                placeholder="johndoe99"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="auth-field-group">
              <label>Email ID</label>
              <input
                type="email"
                placeholder="john@example.com"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                required
              />
            </div>

            <div className="auth-field-row">
              <div className="auth-field-group">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  required
                />
              </div>
              <div className="auth-field-group">
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

            <button type="submit" className="cosmic-btn-pill cosmic-btn-solid auth-submit-btn" disabled={loading}>
              {loading ? 'CREATING ACCOUNT...' : 'SIGN UP & ACCESS WORKSPACE'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
