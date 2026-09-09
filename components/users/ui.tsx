'use client'

import { Loader2, X } from 'lucide-react'
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md'
  loading?: boolean
}) {
  const variants: Record<string, string> = {
    primary:
      'bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:hover:bg-blue-600',
    secondary:
      'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200',
    ghost:
      'bg-transparent hover:bg-slate-100 text-slate-600 dark:hover:bg-slate-800 dark:text-slate-300',
    danger:
      'bg-red-600 hover:bg-red-700 text-white shadow-sm disabled:hover:bg-red-600',
    success:
      'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm disabled:hover:bg-emerald-600',
  }
  const sizes: Record<string, string> = {
    sm: 'px-2.5 py-1.5 text-xs gap-1.5 rounded-lg',
    md: 'px-4 py-2 text-sm gap-2 rounded-lg',
  }
  return (
    <button
      className={`inline-flex items-center justify-center font-medium transition disabled:opacity-60 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  )
}

export function Badge({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 border px-2 py-0.5 text-[11px] font-semibold rounded-md whitespace-nowrap ${className}`}
    >
      {children}
    </span>
  )
}

export function Field({
  label,
  children,
  hint,
  required,
  className = '',
}: {
  label: string
  children: ReactNode
  hint?: string
  required?: boolean
  className?: string
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 block">
        {label} {required && <span className="text-blue-600">*</span>}
      </span>
      {children}
      {hint && <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">{hint}</span>}
    </label>
  )
}

export const inputClass =
  'w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition'

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${inputClass} ${className}`} {...props} />
}

export function Select({ className = '', children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`${inputClass} ${className}`} {...props}>
      {children}
    </select>
  )
}

export function Textarea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${inputClass} resize-none ${className}`} {...props} />
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  danger,
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children?: ReactNode
  footer?: ReactNode
  danger?: boolean
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className={`text-base font-bold ${danger ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'}`}>
              {title}
            </h3>
            {description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </div>
        {children && <div className="mb-5">{children}</div>}
        {footer && <div className="flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  )
}

export function EmptyState({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3 text-slate-400 dark:text-slate-500">
        {icon}
      </div>
      <b className="text-sm text-slate-800 dark:text-slate-200">{title}</b>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">{description}</p>
    </div>
  )
}