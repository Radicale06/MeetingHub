import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Avatar } from '../components/ui/Avatar';
import './AuthLogin.css';

export const AuthLogin: React.FC = () => {
  const navigate = useNavigate();

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login
    navigate('/dashboard');
  };

  return (
    <div className="mh-auth-container">
      <div className="mh-auth-left">
        {/* Background image is handled via CSS or absolute positioned img */}
        <div className="mh-auth-logo">
          <div className="mh-logo-icon mh-logo-icon-dark">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
          </div>
          <h1>MeetingHub</h1>
        </div>

        <div className="mh-auth-testimonial">
          <p className="mh-testimonial-text">
            "MeetingHub transformed how our remote team collaborates. The AI notes and instant recording summaries save us hours of manual work every week."
          </p>
          <div className="mh-testimonial-author">
            <Avatar src="/avatar-sarah.png" fallback="EP" size="sm" />
            <div className="mh-author-info">
              <strong>Eleanor Pena</strong>
              <span>VP of Engineering at TechFlow</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mh-auth-right">
        <div className="mh-auth-form-wrapper">
          <div className="mh-auth-header">
            <h2>Welcome back</h2>
            <p>Please enter your details to sign in.</p>
          </div>

          <div className="mh-social-login">
            <Button variant="outline" fullWidth>
              <svg width="18" height="18" viewBox="0 0 24 24" style={{marginRight: '8px'}}><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Google
            </Button>
            <Button variant="outline" fullWidth>
              <svg width="18" height="18" viewBox="0 0 21 21" style={{marginRight: '8px'}}><path fill="#f25022" d="M1 1h9v9H1z"/><path fill="#00a4ef" d="M1 11h9v9H1z"/><path fill="#7fba00" d="M11 1h9v9h-9z"/><path fill="#ffb900" d="M11 11h9v9h-9z"/></svg>
              Microsoft
            </Button>
          </div>

          <div className="mh-auth-divider">
            <span>or continue with email</span>
          </div>

          <form onSubmit={handleSignIn} className="mh-auth-form">
            <Input
              label="Email address"
              type="email"
              placeholder="name@company.com"
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
            />
            <div className="mh-auth-forgot">
              <Link to="/forgot-password">Forgot password?</Link>
            </div>

            <Button type="submit" fullWidth size="lg">Sign in</Button>
          </form>

          <p className="mh-auth-signup">
            Don't have an account? <Link to="/signup">Sign up for free</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
