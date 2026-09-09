    'use client'

    import { FormEvent, useEffect, useState } from 'react'
    import {
    ArrowLeft, ArrowRight, Bell, Check, Database, Eye, EyeOff,
    FileText, GraduationCap, Library, Loader2, LockKeyhole, Mail,
    Moon, Phone, Shield, Sun, User, AlertCircle
    } from 'lucide-react'
    import { useRouter } from 'next/navigation'
    import { createClient } from '@/lib/supabase/client'

    type Mode = 'login' | 'register'
    type MemberRole = 'student' | 'teacher' | 'librarian' | 'admin' | 'external'
    type MemberStatus = 'active' | 'pending' | 'suspended' | 'inactive'

    interface MemberForm {
    first_name: string; last_name: string; email: string; role: MemberRole; matricule: string;
    phone: string; birth_date: string; address: string; city: string;
    department: string; level: string; speciality: string;
    max_loans: number; max_loans_duration: number; max_digital_loans: number; status: MemberStatus;
    email_notifications: boolean; sms_notifications: boolean; notes: string;
    }

    const initialForm: MemberForm = {
    first_name: '', last_name: '', email: '', role: 'student', matricule: '',
    phone: '', birth_date: '', address: '', city: '',
    department: '', level: '', speciality: '',
    max_loans: 5, max_loans_duration: 14, max_digital_loans: 3, status: 'active',
    email_notifications: true, sms_notifications: false, notes: ''
    }

    const steps = [
    { id: 1, label: 'Identité', icon: User },
    { id: 2, label: 'Contact', icon: Phone },
    { id: 3, label: 'Académique', icon: GraduationCap },
    { id: 4, label: 'Prêts', icon: Shield },
    { id: 5, label: 'Préférences', icon: Bell },
    ]

    const roles: { value: MemberRole; label: string }[] = [
    { value: 'student', label: 'Étudiant' },
    { value: 'teacher', label: 'Enseignant' },
    { value: 'librarian', label: 'Bibliothécaire' },
    { value: 'admin', label: 'Administrateur' },
    { value: 'external', label: 'Externe' },
    ]

    const statuses: { value: MemberStatus; label: string; color: string }[] = [
    { value: 'active', label: 'Actif', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { value: 'pending', label: 'En attente', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { value: 'suspended', label: 'Suspendu', color: 'bg-red-50 text-red-700 border-red-200' },
    { value: 'inactive', label: 'Inactif', color: 'bg-gray-50 text-gray-700 border-gray-200' },
    ]

    // ✅ COMPOSANT TOGGLE SÉPARÉ ET TYPER EXPLICITEMENT
    interface ToggleProps {
    label: string
    checked: boolean
    onChange: (checked: boolean) => void
    }

    function Toggle({ label, checked, onChange }: ToggleProps) {
    return (
        <label className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-md cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition">
        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{label}</span>
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`relative w-9 h-5 rounded-full transition ${checked ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}
        >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-4' : ''}`} />
        </button>
        </label>
    )
    }

    export default function AuthForm() {
    const router = useRouter()
    const [mode, setMode] = useState<Mode>('login')
    const [step, setStep] = useState(1)

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [form, setForm] = useState<MemberForm>(initialForm)
    const [busy, setBusy] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const [darkMode, setDarkMode] = useState(false)

    useEffect(() => {
        const supabase = createClient()
        // ✅ CORRECTION ICI : ajout de ": any"
        supabase.auth.getSession().then(({ data }: any) => {
        if (data?.session?.user) router.replace('/dashboard')
        })
        const savedTheme = window.localStorage.getItem('biblius-auth-theme')
        setDarkMode(savedTheme ? savedTheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches)
    }, [router])

    function toggleTheme() {
        setDarkMode((current) => {
        const next = !current
        window.localStorage.setItem('biblius-auth-theme', next ? 'dark' : 'light')
        return next
        })
    }

    function changeMode(nextMode: Mode) {
        setMode(nextMode)
        setStep(1)
        setError('')
        setMessage('')
    }

    const update = (field: keyof MemberForm, value: any) =>
        setForm((prev) => ({ ...prev, [field]: value }))

    const canNext = (): boolean => {
        if (step === 1) return Boolean(form.first_name.trim() && form.last_name.trim() && form.email.trim())
        if (step === 2) return Boolean(form.phone.trim() || form.city.trim())
        return true
    }

    const next = () => { if (canNext()) setStep((s) => Math.min(s + 1, 5)) }
    const prev = () => setStep((s) => Math.max(s - 1, 1))

    async function handleLogin(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setBusy(true); setError(''); setMessage('')
        const supabase = createClient()
        const result = await supabase.auth.signInWithPassword({ email, password })
        if (result.error) { setError(result.error.message) }
        else { router.replace('/dashboard'); router.refresh() }
        setBusy(false)
    }

    async function handleGoogleLogin() {
        setBusy(true); setError('')
        const supabase = createClient()
        const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
        })
        if (oauthError) { setError(oauthError.message); setBusy(false) }
    }

    async function handleRegisterSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setBusy(true); setError(''); setMessage('')
        const supabase = createClient()

        try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: form.email.trim(),
            password,
            options: { data: { full_name: `${form.first_name} ${form.last_name}`, role: form.role } },
        })
        if (authError || !authData.user) throw new Error(authError?.message || 'Création du compte impossible')

        const { error: memberError } = await supabase.from('members').insert({
            id: authData.user.id,
            first_name: form.first_name.trim(),
            last_name: form.last_name.trim(),
            email: form.email.trim(),
            role: form.role,
            matricule: form.matricule.trim() || null,
            phone: form.phone.trim() || null,
            birth_date: form.birth_date || null,
            address: form.address.trim() || null,
            city: form.city.trim() || null,
            department: form.department.trim() || null,
            level: form.level.trim() || null,
            speciality: form.speciality.trim() || null,
            max_loans: form.max_loans,
            max_loans_duration: form.max_loans_duration,
            max_digital_loans: form.max_digital_loans,
            status: form.status,
            email_notifications: form.email_notifications,
            sms_notifications: form.sms_notifications,
            notes: form.notes.trim() || null,
            invite_status: 'pending',
            invite_sent_at: new Date().toISOString(),
        })
        if (memberError) throw new Error(memberError.message)

        setMessage(authData.session ? `Compte créé pour ${form.email}.` : `Compte créé. Consultez votre boîte mail pour confirmer ${form.email}.`)
        setForm(initialForm); setStep(1); setMode('login')
        } catch (err: any) {
        setError(err.message || 'Erreur lors de la création')
        } finally {
        setBusy(false)
        }
    }

    const Input = ({ label, ...props }: any) => (
        <label className="block">
        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1 block">{label}</span>
        <input
            {...props}
            className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-slate-900 dark:text-slate-100"
        />
        </label>
    )

    const Select = ({ label, children, ...props }: any) => (
        <label className="block">
        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1 block">{label}</span>
        <select
            {...props}
            className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-slate-900 dark:text-slate-100"
        >
            {children}
        </select>
        </label>
    )

    const renderStep = () => {
        switch (step) {
        case 1:
            return (
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                <Input label="Prénom *" value={form.first_name} onChange={(e: any) => update('first_name', e.target.value)} placeholder="Marie" />
                <Input label="Nom *" value={form.last_name} onChange={(e: any) => update('last_name', e.target.value)} placeholder="Curie" />
                </div>
                <Input label="Email *" type="email" value={form.email} onChange={(e: any) => update('email', e.target.value)} placeholder="marie@universite.fr" />
                <Input label="Mot de passe *" type="password" minLength={6} value={password} onChange={(e: any) => setPassword(e.target.value)} placeholder="Au moins 6 caractères" />
                <div className="grid grid-cols-2 gap-3">
                <Select label="Rôle" value={form.role} onChange={(e: any) => update('role', e.target.value)}>
                    {roles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </Select>
                <Input label="Matricule" value={form.matricule} onChange={(e: any) => update('matricule', e.target.value)} placeholder="MAT-001" />
                </div>
            </div>
            )
        case 2:
            return (
            <div className="space-y-3">
                <Input label="Téléphone" type="tel" value={form.phone} onChange={(e: any) => update('phone', e.target.value)} placeholder="+33 6 12 34 56 78" />
                <Input label="Date de naissance" type="date" value={form.birth_date} onChange={(e: any) => update('birth_date', e.target.value)} />
                <Input label="Adresse" value={form.address} onChange={(e: any) => update('address', e.target.value)} placeholder="12 rue de la Paix" />
                <Input label="Ville" value={form.city} onChange={(e: any) => update('city', e.target.value)} placeholder="Lyon" />
            </div>
            )
        case 3:
            return (
            <div className="space-y-3">
                <Input label="Département" value={form.department} onChange={(e: any) => update('department', e.target.value)} placeholder="Informatique" />
                <div className="grid grid-cols-2 gap-3">
                <Input label="Niveau" value={form.level} onChange={(e: any) => update('level', e.target.value)} placeholder="L3, M1..." />
                <Input label="Spécialité" value={form.speciality} onChange={(e: any) => update('speciality', e.target.value)} placeholder="IA" />
                </div>
            </div>
            )
        case 4:
            return (
            <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                <Input label="Max prêts" type="number" min={0} value={form.max_loans} onChange={(e: any) => update('max_loans', parseInt(e.target.value) || 0)} />
                <Input label="Durée (j)" type="number" min={0} value={form.max_loans_duration} onChange={(e: any) => update('max_loans_duration', parseInt(e.target.value) || 0)} />
                <Input label="Max numériques" type="number" min={0} value={form.max_digital_loans} onChange={(e: any) => update('max_digital_loans', parseInt(e.target.value) || 0)} />
                </div>
                <div>
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">Statut</span>
                <div className="grid grid-cols-2 gap-1.5">
                    {statuses.map((s) => (
                    <button
                        key={s.value}
                        type="button"
                        onClick={() => update('status', s.value)}
                        className={`px-2 py-1.5 text-[10px] font-semibold rounded-md border transition ${
                        form.status === s.value ? s.color + ' ring-1 ring-blue-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                    >
                        {s.label}
                    </button>
                    ))}
                </div>
                </div>
            </div>
            )
        case 5:
            return (
            <div className="space-y-3">
                {/* ✅ CORRECTION ICI : Typage explicite du boolean */}
                <Toggle 
                label="Notifications email" 
                checked={form.email_notifications} 
                onChange={(checked: boolean) => update('email_notifications', checked)} 
                />
                <Toggle 
                label="Notifications SMS" 
                checked={form.sms_notifications} 
                onChange={(checked: boolean) => update('sms_notifications', checked)} 
                />
                <label className="block">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1 block">Notes</span>
                <textarea
                    value={form.notes}
                    onChange={(e: any) => update('notes', e.target.value)}
                    rows={3}
                    placeholder="Infos supplémentaires..."
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-slate-900 dark:text-slate-100 resize-none"
                />
                </label>
            </div>
            )
        }
    }

    const StepIcon = steps[step - 1]?.icon || User

    return (
        <main className={darkMode ? 'auth-shell auth-dark' : 'auth-shell'} suppressHydrationWarning>
        <section className="mesh-stage" aria-hidden="true">
            <div className="mesh-glow mesh-glow-one" />
            <div className="mesh-glow mesh-glow-two" />
            <div className="agent-mesh">
            {Array.from({ length: 13 }, (_, index) => (
                <span className={`mesh-node node-${index + 1}`} key={index} />
            ))}
            <i className="mesh-link link-one" /><i className="mesh-link link-two" />
            <i className="mesh-link link-three" /><i className="mesh-link link-four" />
            <i className="mesh-link link-five" /><i className="mesh-link link-six" />
            </div>
        </section>

        <section className="auth-panel">
            <div className="auth-header">
            <div className="auth-brand">
                <span className="auth-brand-mark"><Library size={14} /></span>
                <span><strong>Biblius</strong><small>Library OS</small></span>
            </div>
            <button type="button" className="auth-theme-toggle" onClick={toggleTheme}>
                {darkMode ? <Sun size={13} /> : <Moon size={13} />}
            </button>
            </div>

            <h1 className="auth-title">
            {mode === 'login' ? 'Connexion' : `Inscription · ${steps[step - 1]?.label || ''}`}
            </h1>

            <div className="auth-tabs" role="tablist">
            <button className={mode === 'login' ? 'auth-tab active' : 'auth-tab'} onClick={() => changeMode('login')}>Connexion</button>
            <button className={mode === 'register' ? 'auth-tab active' : 'auth-tab'} onClick={() => changeMode('register')}>Inscription</button>
            </div>

            {mode === 'register' && (
            <div className="auth-stepper">
                {steps.map((s, idx) => {
                const Icon = s.icon
                const isActive = s.id === step
                const isDone = s.id < step
                return (
                    <div key={s.id} className="stepper-item">
                    <div className={`stepper-dot ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}>
                        {isDone ? <Check size={11} /> : <Icon size={11} />}
                    </div>
                    {idx < steps.length - 1 && <div className={`stepper-line ${isDone ? 'done' : ''}`} />}
                    </div>
                )
                })}
            </div>
            )}

            {mode === 'login' && (
            <form className="auth-form" onSubmit={handleLogin}>
                <label>
                <div className="auth-input">
                    <Mail size={13} />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
                </div>
                </label>
                <label>
                <div className="auth-input">
                    <LockKeyhole size={13} />
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe" minLength={6} required />
                    <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                </div>
                </label>
                {error && <p className="auth-feedback error">{error}</p>}
                {message && <p className="auth-feedback success"><Check size={12} /> {message}</p>}
                <button className="auth-submit" type="submit" disabled={busy}>
                {busy ? <Loader2 className="spin" size={14} /> : <>Se connecter <ArrowRight size={14} /></>}
                </button>
                <div className="auth-divider"><span>ou</span></div>
                <button className="oauth-button" type="button" onClick={handleGoogleLogin} disabled={busy}>
                <span className="google-mark">G</span> Google
                </button>
            </form>
            )}

            {mode === 'register' && (
            <form className="auth-form" onSubmit={handleRegisterSubmit}>
                {renderStep()}
                {error && (
                <div className="auth-feedback error" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <AlertCircle size={12} /> {error}
                </div>
                )}
                {message && <p className="auth-feedback success"><Check size={12} /> {message}</p>}

                <div className="auth-nav">
                {step > 1 && (
                    <button type="button" className="auth-nav-prev" onClick={prev} disabled={busy}>
                    <ArrowLeft size={13} />
                    </button>
                )}
                {step < 5 ? (
                    <button type="button" className="auth-submit" onClick={next} disabled={!canNext()}>
                    Suivant <ArrowRight size={13} />
                    </button>
                ) : (
                    <button type="submit" className="auth-submit auth-submit-final" disabled={busy}>
                    {busy ? <Loader2 className="spin" size={14} /> : <>Créer <Check size={14} /></>}
                    </button>
                )}
                </div>
            </form>
            )}

            <p className="auth-footer">En continuant, vous acceptez les conditions d'utilisation de Biblius.</p>
        </section>

        <style jsx>{`
            .auth-shell {
            --auth-panel: #ffffff; --auth-text: #172033; --auth-heading: #14223b; --auth-muted: #778197;
            --auth-line: #e2e8f0; --auth-input: #f8fafc; --auth-tab-bg: #f1f5f9; --auth-tab-active: #ffffff;
            position: relative; min-height: 100vh; display: flex; align-items: center; justify-content: center;
            overflow: hidden; background: #eef3fb;
            }
            .auth-shell.auth-dark {
            --auth-panel: #1e293b; --auth-text: #e2e8f0; --auth-heading: #f8fafc; --auth-muted: #94a3b8;
            --auth-line: #334155; --auth-input: #0f172a; --auth-tab-bg: #0f172a; --auth-tab-active: #334155;
            background: #0b1120;
            }
            .mesh-stage { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
            .mesh-glow { position: absolute; border-radius: 50%; filter: blur(100px); opacity: 0.5; }
            .mesh-glow-one { width: 500px; height: 500px; background: radial-gradient(circle, #3d6df2 0%, transparent 70%); top: -150px; left: -150px; animation: meshFloat 14s ease-in-out infinite; }
            .mesh-glow-two { width: 450px; height: 450px; background: radial-gradient(circle, #e8ae57 0%, transparent 70%); bottom: -120px; right: -120px; animation: meshFloat 18s ease-in-out infinite reverse; }
            .agent-mesh { position: absolute; inset: 0; }
            .mesh-node { position: absolute; width: 6px; height: 6px; border-radius: 50%; background: #3d6df2; box-shadow: 0 0 10px #3d6df2; animation: meshPulse 3s ease-in-out infinite; }
            .mesh-node:nth-child(odd) { background: #e8ae57; box-shadow: 0 0 10px #e8ae57; }
            .node-1 { top: 15%; left: 10%; } .node-2 { top: 25%; left: 85%; animation-delay: 0.4s; }
            .node-3 { top: 45%; left: 20%; animation-delay: 0.8s; } .node-4 { top: 60%; left: 75%; animation-delay: 1.2s; }
            .node-5 { top: 80%; left: 30%; animation-delay: 1.6s; } .node-6 { top: 10%; left: 55%; animation-delay: 0.2s; }
            .node-7 { top: 70%; left: 50%; animation-delay: 0.6s; } .node-8 { top: 35%; left: 40%; animation-delay: 1s; }
            .node-9 { top: 50%; left: 65%; animation-delay: 1.4s; } .node-10 { top: 90%; left: 70%; animation-delay: 1.8s; }
            .node-11 { top: 5%; left: 30%; animation-delay: 0.3s; } .node-12 { top: 85%; left: 15%; animation-delay: 0.7s; }
            .node-13 { top: 40%; left: 90%; animation-delay: 1.1s; }
            .mesh-link { position: absolute; height: 1px; background: linear-gradient(90deg, transparent, #3d6df260, transparent); }
            .link-one { top: 20%; left: 10%; width: 200px; transform: rotate(15deg); } .link-two { top: 30%; left: 40%; width: 260px; transform: rotate(-10deg); }
            .link-three { top: 50%; left: 20%; width: 180px; transform: rotate(25deg); } .link-four { top: 65%; left: 50%; width: 220px; transform: rotate(-20deg); }
            .link-five { top: 75%; left: 30%; width: 160px; transform: rotate(10deg); } .link-six { top: 15%; left: 55%; width: 240px; transform: rotate(-15deg); }
            .auth-panel { position: relative; z-index: 10; background: var(--auth-panel); color: var(--auth-text); border-radius: 12px; padding: 18px; width: 100%; max-width: 340px; box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08); }
            .auth-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
            .auth-brand { display: flex; align-items: center; gap: 6px; }
            .auth-brand-mark { display: grid; place-items: center; width: 26px; height: 26px; background: #3d6df2; color: white; border-radius: 6px; }
            .auth-brand strong { font-size: 13px; color: var(--auth-heading); display: block; line-height: 1; }
            .auth-brand small { font-size: 9px; color: var(--auth-muted); line-height: 1; }
            .auth-theme-toggle { width: 26px; height: 26px; border: 1px solid var(--auth-line); border-radius: 6px; background: transparent; color: var(--auth-muted); cursor: pointer; display: grid; place-items: center; }
            .auth-title { font-size: 16px; font-weight: 700; color: var(--auth-heading); margin: 0 0 10px 0; }
            .auth-tabs { display: flex; background: var(--auth-tab-bg); border-radius: 6px; padding: 2px; margin-bottom: 10px; }
            .auth-tab { flex: 1; padding: 5px; border: none; background: transparent; color: var(--auth-muted); font-size: 11px; font-weight: 600; border-radius: 5px; cursor: pointer; }
            .auth-tab.active { background: var(--auth-tab-active); color: var(--auth-heading); box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
            .auth-stepper { display: flex; align-items: center; margin-bottom: 12px; padding: 0 4px; }
            .stepper-item { display: flex; align-items: center; flex: 1; }
            .stepper-dot { width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center; background: var(--auth-tab-bg); color: var(--auth-muted); font-size: 10px; font-weight: 600; transition: all 0.2s ease; }
            .stepper-dot.active { background: #3d6df2; color: white; box-shadow: 0 0 0 3px rgba(61,109,242,0.2); }
            .stepper-dot.done { background: #10b981; color: white; }
            .stepper-line { flex: 1; height: 2px; background: var(--auth-line); margin: 0 4px; }
            .stepper-line.done { background: #10b981; }
            .auth-form label { display: block; margin-bottom: 6px; }
            .auth-input { display: flex; align-items: center; gap: 7px; border: 1px solid var(--auth-line); border-radius: 6px; padding: 7px 9px; background: var(--auth-input); transition: border-color 0.2s; }
            .auth-input:focus-within { border-color: #3d6df2; }
            .auth-input input { flex: 1; border: none; outline: none; background: transparent; color: var(--auth-text); font-size: 12px; }
            .auth-input input::placeholder { color: var(--auth-muted); opacity: 0.7; }
            .password-toggle { background: none; border: none; color: var(--auth-muted); cursor: pointer; padding: 0; display: grid; place-items: center; }
            .auth-feedback { font-size: 10px; margin: 6px 0; display: flex; align-items: center; gap: 4px; }
            .auth-feedback.error { color: #e53e3e; }
            .auth-feedback.success { color: #38a169; }
            .auth-submit { width: 100%; height: 34px; display: flex; align-items: center; justify-content: center; gap: 5px; background: #3d6df2; color: white; border: none; border-radius: 6px; font-weight: 600; font-size: 12px; cursor: pointer; margin-top: 2px; }
            .auth-submit:hover:not(:disabled) { background: #2b5bd6; }
            .auth-submit:disabled { opacity: 0.7; cursor: wait; }
            .auth-submit-final { background: #10b981; }
            .auth-submit-final:hover:not(:disabled) { background: #059669; }
            .spin { animation: spin 1s linear infinite; }
            @keyframes spin { to { transform: rotate(360deg); } }
            .auth-nav { display: flex; gap: 6px; margin-top: 4px; }
            .auth-nav-prev { width: 34px; height: 34px; display: grid; place-items: center; background: var(--auth-input); border: 1px solid var(--auth-line); border-radius: 6px; color: var(--auth-muted); cursor: pointer; }
            .auth-nav-prev:hover:not(:disabled) { background: var(--auth-tab-bg); }
            .auth-divider { display: flex; align-items: center; gap: 8px; margin: 8px 0; color: var(--auth-muted); font-size: 9px; }
            .auth-divider::before, .auth-divider::after { content: ''; height: 1px; flex: 1; background: var(--auth-line); }
            .oauth-button { width: 100%; height: 34px; display: flex; align-items: center; justify-content: center; gap: 7px; border: 1px solid var(--auth-line); border-radius: 6px; background: var(--auth-input); color: var(--auth-text); font-size: 11px; font-weight: 600; cursor: pointer; }
            .oauth-button:hover:not(:disabled) { border-color: #7b9af5; background: #3d6df20d; }
            .oauth-button:disabled { opacity: 0.6; cursor: wait; }
            .google-mark { width: 15px; height: 15px; border: 1px solid #4285f4; border-radius: 50%; color: #4285f4; font-size: 9px; font-weight: 800; display: grid; place-items: center; font-family: Arial, sans-serif; }
            .auth-footer { text-align: center; margin-top: 10px; font-size: 9px; color: var(--auth-muted); line-height: 1.4; }
            @keyframes meshFloat { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(30px, -20px) scale(1.05); } }
            @keyframes meshPulse { 0%, 100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.3); } }
            @media (max-width: 800px) { .auth-panel { padding: 16px; margin: 12px; } }
        `}</style>
        </main>
    )
    }