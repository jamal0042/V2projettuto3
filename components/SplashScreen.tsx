'use client'

import { useEffect, useState } from 'react'
import { Library } from 'lucide-react'

const STORAGE_KEY = 'biblius-splash-shown'

export default function SplashScreen() {
  const [phase, setPhase] = useState<'visible' | 'exiting' | 'hidden'>('visible')

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      if (window.sessionStorage.getItem(STORAGE_KEY)) {
        setPhase('hidden')
        return
      }
    } catch {
      /* stockage indisponible : laisser le splash jouer */
    }
    const hideAt = setTimeout(() => setPhase('exiting'), 1500)
    const removeAt = setTimeout(() => {
      setPhase('hidden')
      try {
        window.sessionStorage.setItem(STORAGE_KEY, '1')
      } catch {
        /* ignore */
      }
    }, 1950)
    return () => {
      clearTimeout(hideAt)
      clearTimeout(removeAt)
    }
  }, [])

  if (phase === 'hidden') return null

  return (
    <div className={`splash-screen ${phase === 'exiting' ? 'splash-hide' : ''}`} aria-hidden="true">
      <div style={{ textAlign: 'center' }}>
        <div className="splash-logo">
          <Library size={36} strokeWidth={2.4} />
        </div>
        <div className="splash-name">Biblius</div>
        <div className="splash-tag">Library OS</div>
        <div className="splash-bar">
          <i />
        </div>
      </div>
    </div>
  )
}