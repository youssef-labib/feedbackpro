'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

const MOTION_SELECTOR = [
  '[data-reveal]',
  '.section-head',
  '.auth-card',
  '.save-banner',
  '.dashboard-header',
  '.admin-header',
  '.feedback-header',
  '.mobile-tabbar',
].join(', ')

export default function PageMotion() {
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const targets = Array.from(document.querySelectorAll(MOTION_SELECTOR)) as HTMLElement[]
    let frameA = 0
    let frameB = 0

    let fallbackOrder = 0

    for (const element of targets) {
      const customOrderValue = element.dataset.motionOrder
      const customOrder = customOrderValue ? Number(customOrderValue) : Number.NaN
      const order = Number.isFinite(customOrder) ? customOrder : fallbackOrder % 5

      element.dataset.motionBound = 'true'
      element.dataset.motionState = 'hidden'
      element.style.setProperty('--motion-delay', `${order * 45}ms`)
      fallbackOrder += 1
    }

    frameA = window.requestAnimationFrame(() => {
      frameB = window.requestAnimationFrame(() => {
        for (const element of targets) {
          element.dataset.motionState = 'visible'
        }
      })
    })

    return () => {
      window.cancelAnimationFrame(frameA)
      window.cancelAnimationFrame(frameB)
    }
  }, [pathname])

  return null
}
