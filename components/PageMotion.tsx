'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

const MOTION_SELECTOR = [
  '[data-reveal]',
  '.section-head',
  '.hero-copy',
  '.hero-card',
  '.surface-card',
  '.metric-card',
  '.feature-card',
  '.price-card',
  '.summary-card',
  '.settings-card',
  '.table-card',
  '.review-card',
  '.empty-state',
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

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const element = entry.target as HTMLElement
          element.dataset.motionState = 'visible'
          observer.unobserve(element)
        }
      },
      {
        threshold: 0.16,
        rootMargin: '0px 0px -8% 0px',
      }
    )

    function bindTargets() {
      const targets = Array.from(document.querySelectorAll(MOTION_SELECTOR))
      let fallbackOrder = 0

      for (const target of targets) {
        const element = target as HTMLElement
        if (element.dataset.motionBound === 'true') continue

        const customOrder = Number(element.dataset.motionOrder ?? '')
        const order = Number.isFinite(customOrder) ? customOrder : fallbackOrder % 6

        element.dataset.motionBound = 'true'
        element.dataset.motionState = 'hidden'
        element.style.setProperty('--motion-delay', `${order * 70}ms`)

        observer.observe(element)
        fallbackOrder += 1
      }
    }

    bindTargets()
    const mutationObserver = new MutationObserver(() => bindTargets())
    mutationObserver.observe(document.body, { childList: true, subtree: true })

    return () => {
      mutationObserver.disconnect()
      observer.disconnect()
    }
  }, [pathname])

  return null
}
