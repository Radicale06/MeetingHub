import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Video, Shield, Cloud, Bot, Settings, Users } from 'lucide-react';
import './LandingPage.css';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="mh-landing-page">
      {/* Top Navigation */}
      <header className="mh-landing-nav">
        <div className="mh-logo">
          <div className="mh-logo-icon"><Video size={16} color="white" /></div>
          <h2>MeetingHub</h2>
        </div>
        <nav className="mh-nav-links">
          <a href="#features">Product</a>
          <a href="#solutions">Solutions</a>
          <a href="#pricing">Pricing</a>
          <a href="#resources">Resources</a>
        </nav>
        <div className="mh-nav-auth">
          <Button variant="ghost" onClick={() => navigate('/login')}>Log in</Button>
          <Button onClick={() => navigate('/signup')}>Sign up free</Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mh-hero-section">
        <div className="mh-hero-content">
          <div className="mh-badge"><span>New</span> Introducing AI Smart Summaries</div>
          <h1 className="mh-hero-title">Seamless video meetings for modern teams.</h1>
          <p className="mh-hero-subtitle">
            MeetingHub brings crystal-clear HD video, automated AI summaries, and effortless scheduling into one professional platform designed for growth.
          </p>
          <div className="mh-hero-cta">
            <Button size="lg" onClick={() => navigate('/signup')}>Start for free</Button>
            <Button variant="outline" size="lg" className="bg-white" onClick={() => navigate('/signup')}>Book a demo</Button>
          </div>
          <div className="mh-hero-trust">
            <span>✓ No credit card required</span>
            <span>✓ 14-day free trial</span>
          </div>
        </div>
        <div className="mh-hero-image">
          {/* Using the generated placeholder or dashboard image */}
          <div className="mh-browser-mockup">
            <div className="mh-browser-top">
              <span className="dot"></span><span className="dot"></span><span className="dot"></span>
            </div>
            <img src="/hero-mockup.png" alt="App Preview" className="mh-mockup-img" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="mh-features-section">
        <div className="mh-features-header">
          <h2>Everything you need to run highly effective meetings</h2>
          <p>Stop juggling multiple tools. MeetingHub provides an end-to-end solution from scheduling to intelligent post-meeting reports.</p>
        </div>

        <div className="mh-features-grid">
          <Card className="mh-feature-card">
            <div className="mh-feature-icon"><Video size={24} color="white" /></div>
            <h3>Crystal Clear HD Video</h3>
            <p>Experience lag-free, high-definition video conferencing that makes you feel like you're in the same room with your team.</p>
          </Card>
          <Card className="mh-feature-card">
            <div className="mh-feature-icon"><Bot size={24} color="white" /></div>
            <h3>AI-Powered Summaries</h3>
            <p>Never take notes again. Our AI automatically generates comprehensive reports, action items, and transcripts for every meeting.</p>
          </Card>
          <Card className="mh-feature-card">
            <div className="mh-feature-icon"><Settings size={24} color="white" /></div>
            <h3>Effortless Scheduling</h3>
            <p>Share your availability link and let clients book time with you instantly. Seamlessly integrates with Google and Outlook calendars.</p>
          </Card>
          <Card className="mh-feature-card">
            <div className="mh-feature-icon"><Users size={24} color="white" /></div>
            <h3>Advanced Collaboration</h3>
            <p>Interactive whiteboards, screen sharing, and real-time document editing built directly into your meeting environment.</p>
          </Card>
          <Card className="mh-feature-card">
            <div className="mh-feature-icon"><Shield size={24} color="white" /></div>
            <h3>Enterprise-Grade Security</h3>
            <p>End-to-end encryption, waiting rooms, and advanced host controls keep your sensitive conversations completely secure.</p>
          </Card>
          <Card className="mh-feature-card">
            <div className="mh-feature-icon"><Cloud size={24} color="white" /></div>
            <h3>Cloud Recordings</h3>
            <p>Record sessions with one click and access them instantly from your secure dashboard. Share recordings with specific permissions.</p>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section id="pricing" className="mh-cta-section">
        <h2>Ready to upgrade your meetings?</h2>
        <p>Join thousands of professional teams who have transformed their remote collaboration with MeetingHub.</p>
        <Button size="lg" onClick={() => navigate('/signup')}>Get Started Free</Button>
        <p className="mh-cta-fineprint">Basic plan is free forever. Cancel anytime.</p>
      </section>

      {/* Language Section */}
      <section id="solutions" className="mh-language-section">
        <h2>Work in the language your team prefers</h2>
        <p>MeetingHub supports localized experiences across scheduling, meeting controls, AI summaries, and post-meeting reports so global teams can collaborate with clarity.</p>

        <div className="mh-languages-grid">
          <Card className="mh-lang-card">
            <div className="mh-lang-top">
              <span className="mh-lang-badge">Default workspace language</span>
            </div>
            <h3>English</h3>
            <p>Best for international teams using shared dashboards, meeting invites, and AI-generated reports.</p>
          </Card>
          <Card className="mh-lang-card">
            <div className="mh-lang-top">
              <span className="mh-lang-badge blue">Team collaboration</span>
              <span className="mh-lang-code">FR</span>
            </div>
            <h3>French</h3>
            <p>Localized menus, invitations, and recording reports for teams working with French-speaking clients.</p>
          </Card>
          <Card className="mh-lang-card">
            <div className="mh-lang-top">
              <span className="mh-lang-badge blue">Regional experience</span>
              <span className="mh-lang-code">AR</span>
            </div>
            <h3>Arabic</h3>
            <p>Deliver a familiar meeting experience with translated interface labels, summary reports, and controls.</p>
          </Card>
        </div>
      </section>

      <footer id="resources" className="mh-footer">
        <div className="mh-footer-top">
          <div className="mh-footer-brand">
            <div className="mh-logo">
              <div className="mh-logo-icon"><Video size={16} color="white" /></div>
              <h2>MeetingHub</h2>
            </div>
            <p>The all-in-one professional meeting platform for modern, distributed teams.</p>
          </div>
          <div className="mh-footer-links">
            <div>
              <h4>Product</h4>
              <a href="#features">Features</a><a href="#solutions">Integrations</a><a href="#pricing">Pricing</a><a href="#resources">Changelog</a>
            </div>
            <div>
              <h4>Resources</h4>
              <a href="#resources">Help Center</a><a href="#resources">API Documentation</a><a href="#resources">Community</a><a href="#resources">Blog</a>
            </div>
            <div>
              <h4>Company</h4>
              <button className="mh-link-btn" onClick={() => navigate('/signup')}>About Us</button>
              <button className="mh-link-btn" onClick={() => navigate('/signup')}>Careers</button>
              <button className="mh-link-btn" onClick={() => navigate('/signup')}>Privacy Policy</button>
              <button className="mh-link-btn" onClick={() => navigate('/signup')}>Terms of Service</button>
            </div>
          </div>
        </div>
        <div className="mh-footer-bottom">
          <p>© 2026 MeetingHub Inc. All rights reserved.</p>
          <div className="mh-footer-legal">
            <button className="mh-link-btn" onClick={() => navigate('/signup')}>Privacy</button>
            <button className="mh-link-btn" onClick={() => navigate('/signup')}>Terms</button>
            <button className="mh-link-btn" onClick={() => navigate('/signup')}>Security</button>
          </div>
        </div>
      </footer>
    </div>
  );
};
