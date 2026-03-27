import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ArrowLeft } from 'lucide-react';
import './AuthLogin.css';

export const AuthForgotPassword: React.FC = () => {
  const navigate = useNavigate();

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Password reset link sent to your email!');
    navigate('/login');
  };

  return (
    <div className="mh-auth-container mh-auth-centered">
      {/* We reuse the left side design or just center the form for password recovery */}
      <div className="mh-auth-right" style={{flex: '1', display: 'flex', justifyContent: 'center'}}>
        <div className="mh-auth-form-wrapper" style={{width: '100%', maxWidth: '440px', padding: '2rem'}}>
          
          <Link to="/login" style={{display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500}}>
            <ArrowLeft size={16} /> Back to Sign in
          </Link>

          <div className="mh-auth-header">
            <h2>Forgot password?</h2>
            <p>No worries, we'll send you reset instructions.</p>
          </div>

          <form onSubmit={handleReset} className="mh-auth-form" style={{marginTop: '2rem'}}>
            <Input 
              label="Email address" 
              type="email" 
              placeholder="Enter your email" 
              required
            />
            <Button type="submit" fullWidth size="lg">Send reset link</Button>
          </form>

        </div>
      </div>
    </div>
  );
};
