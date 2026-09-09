'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  BookOpen, Library, Sparkles, Users, Shield, Zap,
  ArrowRight, Brain, Database, Globe, ChevronRight,
  Moon, Sun, Mail, MapPin
} from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const [darkMode, setDarkMode] = useState(false)
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    const supabase = createClient()
    // ✅ CORRECTION ICI : ajout de ": any" pour éviter l'erreur TypeScript
    supabase.auth.getSession().then(({ data }: any) => {
      setSession(data?.session || null)
    })
    const saved = window.localStorage.getItem('biblius-theme')
    setDarkMode(saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches)
  }, [])

  const toggleTheme = () => {
    setDarkMode((c) => {
      const next = !c
      window.localStorage.setItem('biblius-theme', next ? 'dark' : 'light')
      return next
    })
  }

  const features = [
    { icon: Brain, title: 'Classification IA', desc: 'Dewey automatique par intelligence artificielle' },
    { icon: Database, title: 'Catalogue intelligent', desc: 'Recherche sémantique et suggestions contextuelles' },
    { icon: Users, title: 'Multi-rôles', desc: 'Admin, bibliothécaire, enseignant, étudiant' },
    { icon: Globe, title: 'Bibliothèque numérique', desc: 'Ressources PDF, articles, thèses en ligne' },
    { icon: Shield, title: 'Circulation sécurisée', desc: 'Emprunts, retours, réservations, pénalités' },
    { icon: Zap, title: 'Temps réel', desc: 'Notifications email et SMS instantanées' },
  ]

  return (
    <main className={darkMode ? 'home-shell home-dark' : 'home-shell'} suppressHydrationWarning>
      {/* ====== ANIMATION MEMORY LABS ====== */}
      <section className="memory-labs" aria-hidden="true">
        <div className="memory-core" />
        {Array.from({ length: 24 }, (_, i) => (
          <div key={i} className={`memory-particle p-${i + 1}`}>
            {i % 3 === 0 ? <BookOpen size={14} /> : i % 3 === 1 ? <Sparkles size={10} /> : <div className="dot" />}
          </div>
        ))}
        {Array.from({ length: 8 }, (_, i) => (
          <div key={`link-${i}`} className={`memory-link link-${i + 1}`} />
        ))}
        <div className="memory-ring ring-1" />
        <div className="memory-ring ring-2" />
        <div className="memory-ring ring-3" />
        <div className="memory-grid" />
      </section>

      {/* ====== NAVBAR AMÉLIORÉE ====== */}
      <nav className="home-nav">
        <div className="nav-left">
          <div className="nav-brand" onClick={() => router.push('/')}>
            <div className="nav-logo">
              <Library size={18} />
            </div>
            <div>
              <strong>Biblius</strong>
              <small>Library OS · Memory Labs</small>
            </div>
          </div>
          
          {/* Navigation links - cachés sur mobile */}
          <div className="nav-links hidden md:flex">
            <a href="#features" className="nav-link">Fonctionnalités</a>
            <a href="#tarifs" className="nav-link">Tarifs</a>
            <a href="#apropos" className="nav-link">À propos</a>
            
            {/* BOUTON AGENT IA */}
            <button className="agent-ia-btn" onClick={() => router.push('/dashboard/agent-ia')}>
              <Sparkles size={14} />
              <span>Agent IA</span>
              <span className="agent-badge">NEW</span>
            </button>
          </div>
        </div>

        <div className="nav-right">
          <button onClick={toggleTheme} className="theme-btn" title={darkMode ? 'Mode clair' : 'Mode sombre'}>
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          
          {session ? (
            <Link href="/dashboard" className="nav-btn primary">
              Dashboard <ArrowRight size={14} />
            </Link>
          ) : (
            <>
              <Link href="/auth" className="nav-btn ghost hidden sm:inline-flex">Connexion</Link>
            </>
          )}
        </div>
      </nav>

      {/* ====== HERO ====== */}
      <section className="hero">
        <div className="hero-badge">
          <Sparkles size={12} />
          <span>Nouveau · Classification Dewey par IA</span>
        </div>
        <h1 className="hero-title">
          La bibliothèque qui <span className="gradient-text">se souvient</span>
          <br />
          de tout.
        </h1>
        <p className="hero-subtitle">
          Biblius transforme votre bibliothèque universitaire en un système intelligent :
          catalogue, circulation, membres et ressources numériques — le tout orchestré par une IA qui apprend de vos collections.
        </p>
        <div className="hero-cta">
          <Link href="/auth" className="cta-primary">
            Démarrer gratuitement <ChevronRight size={16} />
          </Link>
          <Link href="#features" className="cta-secondary">
            Voir les fonctionnalités
          </Link>
        </div>
        <div className="hero-stats">
          <div className="stat"><strong>12k+</strong><span>Documents indexés</span></div>
          <div className="stat-divider" />
          <div className="stat"><strong>8.9k</strong><span>Membres actifs</span></div>
          <div className="stat-divider" />
          <div className="stat"><strong>342</strong><span>Emprunts/jour</span></div>
        </div>
      </section>

      {/* ====== FEATURES ====== */}
      <section id="features" className="features">
        <div className="section-header">
          <h2>Une plateforme complète</h2>
          <p>Six piliers pour une bibliothèque moderne</p>
        </div>
        <div className="features-grid">
          {features.map((f, i) => {
            const Icon = f.icon
            return (
              <div key={i} className="feature-card">
                <div className="feature-icon"><Icon size={20} /></div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ====== FOOTER COMPLET ====== */}
      <footer className="home-footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-logo"><Library size={20} /></div>
            <div>
              <strong>Biblius</strong>
              <span>Library OS · Memory Labs</span>
              <p className="footer-tagline">
                La plateforme intelligente pour les bibliothèques universitaires modernes.
              </p>
              <div className="footer-contact">
                <a href="mailto:contact@biblius.io"><Mail size={14} /> contact@biblius.io</a>
                <a href="#"><MapPin size={14} /> Lyon, France</a>
              </div>
            </div>
          </div>
          <div className="footer-links">
            <div>
              <h4>Produit</h4>
              <a href="#features">Fonctionnalités</a>
              <a href="/pages/tarifs">Tarifs</a>
              <a href="/pages/changelog">Changelog</a>
              <a href="/pages/roadmap">Roadmap</a>
            </div>
            <div>
              <h4>Ressources</h4>
              <a href="/pages/documentation">Documentation</a>
              <a href="/pages/api">API</a>
              <a href="/pages/guides">Guides</a>
              <a href="/pages/tutoriels">Tutoriels</a>
            </div>
            <div>
              <h4>Entreprise</h4>
              <a href="/pages/a-propos">À propos</a>
              <a href="/pages/contact">Contact</a>
              <a href="/pages/blog">Blog</a>
              <a href="/pages/carrieres">Carrières</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 Biblius. Conçu pour les bibliothèques universitaires.</p>
          <div className="footer-legal">
            <a href="/pages/confidentialite">Confidentialité</a>
            <a href="/pages/conditions">Conditions</a>
            <a href="/pages/mentions-legales">Mentions légales</a>
          </div>
        </div>
      </footer>

      <style jsx>{`
        /* ====== SHELL ====== */
        .home-shell {
          --bg: #fafbff;
          --text: #0f172a;
          --muted: #64748b;
          --card: #ffffff;
          --border: #e2e8f0;
          --primary: #3d6df2;
          --primary-hover: #2b5bd6;
          --accent: #e8ae57;
          min-height: 100vh;
          background: var(--bg);
          color: var(--text);
          overflow-x: hidden;
          position: relative;
          transition: background 0.3s, color 0.3s;
        }
        .home-dark {
          --bg: #0a0f1e;
          --text: #e2e8f0;
          --muted: #94a3b8;
          --card: #111827;
          --border: #1e293b;
          --primary: #60a5fa;
          --primary-hover: #3b82f6;
          background: var(--bg);
        }

        /* ====== MEMORY LABS ANIMATION ====== */
        .memory-labs {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          overflow: hidden;
        }
        .memory-core {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(61,109,242,0.15) 0%, transparent 60%);
          border-radius: 50%;
          animation: corePulse 6s ease-in-out infinite;
        }
        .home-dark .memory-core {
          background: radial-gradient(circle, rgba(96,165,250,0.2) 0%, transparent 60%);
        }

        .memory-particle {
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
          opacity: 0.6;
          animation: particleFloat 12s ease-in-out infinite;
        }
        .memory-particle .dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--accent);
          box-shadow: 0 0 8px var(--accent);
        }
        .p-1 { top: 10%; left: 15%; animation-delay: 0s; }
        .p-2 { top: 20%; left: 80%; animation-delay: 1s; }
        .p-3 { top: 35%; left: 25%; animation-delay: 2s; }
        .p-4 { top: 50%; left: 70%; animation-delay: 3s; }
        .p-5 { top: 65%; left: 20%; animation-delay: 4s; }
        .p-6 { top: 75%; left: 85%; animation-delay: 5s; }
        .p-7 { top: 15%; left: 45%; animation-delay: 0.5s; }
        .p-8 { top: 40%; left: 90%; animation-delay: 1.5s; }
        .p-9 { top: 85%; left: 50%; animation-delay: 2.5s; }
        .p-10 { top: 5%; left: 60%; animation-delay: 3.5s; }
        .p-11 { top: 55%; left: 10%; animation-delay: 4.5s; }
        .p-12 { top: 90%; left: 30%; animation-delay: 5.5s; }
        .p-13 { top: 25%; left: 35%; animation-delay: 0.3s; }
        .p-14 { top: 45%; left: 55%; animation-delay: 1.3s; }
        .p-15 { top: 70%; left: 65%; animation-delay: 2.3s; }
        .p-16 { top: 30%; left: 70%; animation-delay: 3.3s; }
        .p-17 { top: 60%; left: 40%; animation-delay: 4.3s; }
        .p-18 { top: 80%; left: 75%; animation-delay: 5.3s; }
        .p-19 { top: 12%; left: 25%; animation-delay: 0.7s; }
        .p-20 { top: 48%; left: 15%; animation-delay: 1.7s; }
        .p-21 { top: 72%; left: 45%; animation-delay: 2.7s; }
        .p-22 { top: 38%; left: 85%; animation-delay: 3.7s; }
        .p-23 { top: 58%; left: 95%; animation-delay: 4.7s; }
        .p-24 { top: 88%; left: 60%; animation-delay: 5.7s; }

        .memory-link {
          position: absolute;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--primary), transparent);
          opacity: 0.2;
          animation: linkPulse 5s ease-in-out infinite;
        }
        .link-1 { top: 20%; left: 10%; width: 250px; transform: rotate(20deg); }
        .link-2 { top: 40%; left: 30%; width: 300px; transform: rotate(-15deg); animation-delay: 1s; }
        .link-3 { top: 60%; left: 50%; width: 220px; transform: rotate(30deg); animation-delay: 2s; }
        .link-4 { top: 30%; left: 60%; width: 280px; transform: rotate(-25deg); animation-delay: 3s; }
        .link-5 { top: 70%; left: 20%; width: 200px; transform: rotate(10deg); animation-delay: 4s; }
        .link-6 { top: 50%; left: 70%; width: 260px; transform: rotate(-10deg); animation-delay: 0.5s; }
        .link-7 { top: 80%; left: 40%; width: 240px; transform: rotate(15deg); animation-delay: 1.5s; }
        .link-8 { top: 15%; left: 70%; width: 210px; transform: rotate(-20deg); animation-delay: 2.5s; }

        .memory-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          border: 1px solid var(--primary);
          opacity: 0.1;
          animation: ringExpand 8s ease-out infinite;
        }
        .ring-1 { width: 300px; height: 300px; animation-delay: 0s; }
        .ring-2 { width: 500px; height: 500px; animation-delay: 2s; }
        .ring-3 { width: 700px; height: 700px; animation-delay: 4s; }

        .memory-grid {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(var(--border) 1px, transparent 1px),
            linear-gradient(90deg, var(--border) 1px, transparent 1px);
          background-size: 60px 60px;
          opacity: 0.3;
          mask-image: radial-gradient(circle at center, transparent 0%, black 70%);
          -webkit-mask-image: radial-gradient(circle at center, transparent 0%, black 70%);
        }

        @keyframes corePulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
          50% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
        }
        @keyframes particleFloat {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(20px, -30px) rotate(5deg); }
          50% { transform: translate(-10px, -50px) rotate(-3deg); }
          75% { transform: translate(15px, -20px) rotate(2deg); }
        }
        @keyframes linkPulse {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.4; }
        }
        @keyframes ringExpand {
          0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.3; }
          100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
        }

        /* ====== NAVBAR AMÉLIORÉE ====== */
        .home-nav {
          position: sticky;
          top: 0;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 40px;
          backdrop-filter: blur(16px) saturate(180%);
          background: rgba(250, 251, 255, 0.8);
          border-bottom: 1px solid var(--border);
          transition: all 0.3s;
        }
        .home-dark .home-nav { 
          background: rgba(10, 15, 30, 0.8); 
        }
        .nav-left, .nav-right {
          display: flex;
          align-items: center;
          gap: 24px;
        }
        .nav-brand { 
          display: flex; 
          align-items: center; 
          gap: 12px;
          cursor: pointer;
        }
        .nav-logo {
          width: 38px; 
          height: 38px;
          background: linear-gradient(135deg, var(--primary), #2563eb);
          color: white;
          border-radius: 10px;
          display: grid;
          place-items: center;
          box-shadow: 0 4px 12px rgba(61,109,242,0.3);
          transition: transform 0.2s;
        }
        .nav-logo:hover { transform: scale(1.05); }
        .nav-brand strong { 
          display: block; 
          font-size: 16px;
          font-weight: 700;
          letter-spacing: -0.3px;
        }
        .nav-brand small { 
          font-size: 11px; 
          color: var(--muted);
          font-weight: 500;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-left: 12px;
        }
        .nav-link {
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 500;
          color: var(--muted);
          text-decoration: none;
          border-radius: 8px;
          transition: all 0.2s;
        }
        .nav-link:hover {
          color: var(--text);
          background: rgba(61,109,242,0.08);
        }

        .agent-ia-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: linear-gradient(135deg, #8b5cf6, #a855f7);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          position: relative;
          overflow: hidden;
        }
        .agent-ia-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transform: translateX(-100%);
          transition: transform 0.6s;
        }
        .agent-ia-btn:hover::before {
          transform: translateX(100%);
        }
        .agent-ia-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(139,92,246,0.4);
        }
        .agent-badge {
          font-size: 9px;
          font-weight: 800;
          background: rgba(255,255,255,0.25);
          padding: 2px 6px;
          border-radius: 10px;
          letter-spacing: 0.5px;
        }

        .theme-btn {
          width: 36px; 
          height: 36px;
          border: 1px solid var(--border);
          border-radius: 10px;
          background: transparent;
          color: var(--muted);
          cursor: pointer;
          display: grid;
          place-items: center;
          transition: all 0.2s;
        }
        .theme-btn:hover { 
          color: var(--primary); 
          border-color: var(--primary);
          background: rgba(61,109,242,0.08);
          transform: rotate(12deg);
        }

        .nav-btn {
          padding: 9px 18px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }
        .nav-btn.ghost { 
          color: var(--text);
          background: transparent;
        }
        .nav-btn.ghost:hover { 
          background: var(--border);
        }
        .nav-btn.primary {
          background: linear-gradient(135deg, var(--primary), #2563eb);
          color: white;
          box-shadow: 0 4px 12px rgba(61,109,242,0.25);
        }
        .nav-btn.primary:hover { 
          background: linear-gradient(135deg, var(--primary-hover), #1d4ed8);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(61,109,242,0.35);
        }

        /* ====== HERO ====== */
        .hero {
          position: relative;
          z-index: 10;
          max-width: 900px;
          margin: 0 auto;
          padding: 80px 40px 60px;
          text-align: center;
        }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          background: rgba(61,109,242,0.1);
          color: var(--primary);
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 24px;
        }
        .hero-title {
          font-size: 56px;
          font-weight: 800;
          line-height: 1.1;
          letter-spacing: -1.5px;
          margin: 0 0 20px;
        }
        .gradient-text {
          background: linear-gradient(135deg, var(--primary), var(--accent));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-subtitle {
          font-size: 17px;
          color: var(--muted);
          line-height: 1.6;
          max-width: 640px;
          margin: 0 auto 36px;
        }
        .hero-cta {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 48px;
        }
        .cta-primary {
          padding: 12px 24px;
          background: var(--primary);
          color: white;
          border-radius: 10px;
          font-weight: 600;
          font-size: 14px;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }
        .cta-primary:hover { background: var(--primary-hover); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(61,109,242,0.3); }
        .cta-secondary {
          padding: 12px 24px;
          border: 1px solid var(--border);
          color: var(--text);
          border-radius: 10px;
          font-weight: 600;
          font-size: 14px;
          text-decoration: none;
          transition: all 0.2s;
        }
        .cta-secondary:hover { background: var(--border); }

        .hero-stats {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 32px;
          padding: 20px;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 12px;
          max-width: 500px;
          margin: 0 auto;
        }
        .stat { text-align: center; }
        .stat strong { display: block; font-size: 22px; font-weight: 800; color: var(--primary); }
        .stat span { font-size: 11px; color: var(--muted); }
        .stat-divider { width: 1px; height: 40px; background: var(--border); }

        /* ====== FEATURES ====== */
        .features {
          position: relative;
          z-index: 10;
          max-width: 1100px;
          margin: 0 auto;
          padding: 60px 40px 80px;
        }
        .section-header { text-align: center; margin-bottom: 48px; }
        .section-header h2 { font-size: 32px; font-weight: 800; margin: 0 0 8px; }
        .section-header p { color: var(--muted); font-size: 15px; margin: 0; }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }
        .feature-card {
          padding: 24px;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 12px;
          transition: all 0.3s;
        }
        .feature-card:hover {
          transform: translateY(-4px);
          border-color: var(--primary);
          box-shadow: 0 12px 32px rgba(61,109,242,0.1);
        }
        .feature-icon {
          width: 40px; height: 40px;
          background: rgba(61,109,242,0.1);
          color: var(--primary);
          border-radius: 10px;
          display: grid;
          place-items: center;
          margin-bottom: 16px;
        }
        .feature-card h3 { font-size: 16px; font-weight: 700; margin: 0 0 6px; }
        .feature-card p { font-size: 13px; color: var(--muted); margin: 0; line-height: 1.5; }

        /* ====== FOOTER ====== */
        .home-footer {
          position: relative;
          z-index: 10;
          margin-top: 80px;
          padding: 60px 40px 24px;
          background: var(--card);
          border-top: 1px solid var(--border);
        }
        .footer-grid {
          display: grid;
          grid-template-columns: 1.5fr 2fr;
          gap: 60px;
          max-width: 1100px;
          margin: 0 auto 40px;
        }
        .footer-brand { display: flex; gap: 16px; }
        .footer-logo {
          flex-shrink: 0;
          width: 44px; height: 44px;
          background: var(--primary);
          color: white;
          border-radius: 12px;
          display: grid;
          place-items: center;
        }
        .footer-brand > div { display: flex; flex-direction: column; gap: 4px; }
        .footer-brand strong { font-size: 18px; }
        .footer-brand > div > span { font-size: 11px; color: var(--muted); }
        .footer-tagline {
          font-size: 13px;
          color: var(--muted);
          line-height: 1.5;
          margin: 8px 0 12px;
        }
        .footer-contact {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: 12px;
        }
        .footer-contact a {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: var(--muted);
          text-decoration: none;
          transition: color 0.2s;
        }
        .footer-contact a:hover { color: var(--primary); }

        .footer-links {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        .footer-links h4 {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin: 0 0 14px;
          color: var(--text);
        }
        .footer-links a {
          display: block;
          font-size: 13px;
          color: var(--muted);
          text-decoration: none;
          margin-bottom: 10px;
          transition: color 0.2s;
        }
        .footer-links a:hover { color: var(--primary); }

        .footer-bottom {
          max-width: 1100px;
          margin: 0 auto;
          padding-top: 24px;
          border-top: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          font-size: 12px;
          color: var(--muted);
        }
        .footer-legal { display: flex; gap: 20px; }
        .footer-legal a {
          color: var(--muted);
          text-decoration: none;
          transition: color 0.2s;
        }
        .footer-legal a:hover { color: var(--primary); }

        @media (max-width: 768px) {
          .home-nav { 
            padding: 14px 20px;
            flex-wrap: wrap;
          }
          .nav-left {
            flex: 1;
            gap: 16px;
          }
          .nav-links {
            display: none !important;
          }
          .nav-right {
            gap: 8px;
          }
          .nav-brand small {
            display: none;
          }
          .hero { padding: 40px 20px; }
          .hero-title { font-size: 36px; }
          .hero-subtitle { font-size: 15px; }
          .features { padding: 40px 20px 60px; }
          .hero-stats { flex-direction: column; gap: 16px; }
          .stat-divider { width: 40px; height: 1px; }
          .home-footer { padding: 40px 20px 20px; margin-top: 40px; }
          .footer-grid { grid-template-columns: 1fr; gap: 32px; }
          .footer-links { grid-template-columns: repeat(3, 1fr); gap: 16px; }
          .footer-bottom { flex-direction: column; text-align: center; }
        }
      `}</style>
    </main>
  )
}