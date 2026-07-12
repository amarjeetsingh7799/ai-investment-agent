import { useRef, useCallback } from 'react'

// Gives any card a smooth 3D tilt effect that follows the mouse
export function useTilt(strength = 12) {
  const ref = useRef(null)
  const rafId = useRef(null)

  const onMouseMove = useCallback((e) => {
    const card = ref.current
    if (!card) return

    if (rafId.current) cancelAnimationFrame(rafId.current)

    rafId.current = requestAnimationFrame(() => {
      const rect   = card.getBoundingClientRect()
      const cx     = rect.left + rect.width  / 2
      const cy     = rect.top  + rect.height / 2
      const dx     = (e.clientX - cx) / (rect.width  / 2)
      const dy     = (e.clientY - cy) / (rect.height / 2)
      const rotateX = -dy * strength
      const rotateY =  dx * strength

      card.style.transform = `perspective(800px) translateZ(0) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02,1.02,1.02)`
    })
  }, [strength])

  const onMouseLeave = useCallback(() => {
    const card = ref.current
    if (!card) return
    if (rafId.current) cancelAnimationFrame(rafId.current)
    card.style.transform = 'perspective(800px) translateZ(0) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)'
  }, [])

  return { ref, onMouseMove, onMouseLeave }
}
