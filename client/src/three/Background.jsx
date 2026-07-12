import { useEffect, useRef } from 'react'
import * as THREE from 'three'

// Animated 3D particle network — financial data visualization aesthetic
export default function ThreeBackground() {
  const mountRef = useRef(null)

  useEffect(() => {
    const el = mountRef.current
    if (!el) return

    // ── Scene setup ──────────────────────────────────────────────────────
    const scene    = new THREE.Scene()
    const camera   = new THREE.PerspectiveCamera(60, el.clientWidth / el.clientHeight, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })

    renderer.setSize(el.clientWidth, el.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    el.appendChild(renderer.domElement)
    camera.position.z = 80

    // ── Particles ────────────────────────────────────────────────────────
    const PARTICLE_COUNT = 120
    const positions = []
    const velocities = []

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions.push(
        (Math.random() - 0.5) * 180,
        (Math.random() - 0.5) * 120,
        (Math.random() - 0.5) * 80
      )
      velocities.push(
        (Math.random() - 0.5) * 0.04,
        (Math.random() - 0.5) * 0.04,
        (Math.random() - 0.5) * 0.02
      )
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))

    const mat = new THREE.PointsMaterial({
      color: 0x4f8ef7,
      size: 1.2,
      transparent: true,
      opacity: 0.7,
      sizeAttenuation: true,
    })

    const particles = new THREE.Points(geo, mat)
    scene.add(particles)

    // ── Connection lines ──────────────────────────────────────────────────
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x4f8ef7,
      transparent: true,
      opacity: 0.08,
    })

    // ── Mouse parallax ────────────────────────────────────────────────────
    let mouseX = 0
    let mouseY = 0
    const onMouseMove = (e) => {
      mouseX = (e.clientX / window.innerWidth  - 0.5) * 0.3
      mouseY = (e.clientY / window.innerHeight - 0.5) * 0.3
    }
    window.addEventListener('mousemove', onMouseMove)

    // ── Resize handler ────────────────────────────────────────────────────
    const onResize = () => {
      camera.aspect = el.clientWidth / el.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(el.clientWidth, el.clientHeight)
    }
    window.addEventListener('resize', onResize)

    // ── Animation loop ────────────────────────────────────────────────────
    let frameId
    let linesMesh = null

    const animate = () => {
      frameId = requestAnimationFrame(animate)

      const pos = geo.attributes.position.array

      // Update particle positions
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const ix = i * 3, iy = i * 3 + 1, iz = i * 3 + 2
        pos[ix] += velocities[i * 3]
        pos[iy] += velocities[i * 3 + 1]
        pos[iz] += velocities[i * 3 + 2]

        // Bounce off boundaries
        if (Math.abs(pos[ix]) > 90)  velocities[i * 3]     *= -1
        if (Math.abs(pos[iy]) > 60)  velocities[i * 3 + 1] *= -1
        if (Math.abs(pos[iz]) > 40)  velocities[i * 3 + 2] *= -1
      }
      geo.attributes.position.needsUpdate = true

      // Rebuild connection lines every 3 frames for performance
      if (frameId % 3 === 0) {
        if (linesMesh) { scene.remove(linesMesh); linesMesh.geometry.dispose() }
        const linePositions = []
        const CONNECT_DIST = 28

        for (let i = 0; i < PARTICLE_COUNT; i++) {
          for (let j = i + 1; j < PARTICLE_COUNT; j++) {
            const dx = pos[i*3]   - pos[j*3]
            const dy = pos[i*3+1] - pos[j*3+1]
            const dz = pos[i*3+2] - pos[j*3+2]
            const dist = Math.sqrt(dx*dx + dy*dy + dz*dz)

            if (dist < CONNECT_DIST) {
              linePositions.push(pos[i*3], pos[i*3+1], pos[i*3+2])
              linePositions.push(pos[j*3], pos[j*3+1], pos[j*3+2])
            }
          }
        }

        if (linePositions.length > 0) {
          const lineGeo = new THREE.BufferGeometry()
          lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3))
          linesMesh = new THREE.LineSegments(lineGeo, lineMat)
          scene.add(linesMesh)
        }
      }

      // Smooth camera follow mouse
      camera.position.x += (mouseX * 12 - camera.position.x) * 0.03
      camera.position.y += (-mouseY * 8  - camera.position.y) * 0.03
      camera.lookAt(scene.position)

      renderer.render(scene, camera)
    }

    animate()

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', onResize)
      
      // Explicitly dispose Three.js objects to prevent memory leaks
      geo.dispose()
      mat.dispose()
      lineMat.dispose()
      if (linesMesh) {
        linesMesh.geometry.dispose()
      }
      
      renderer.dispose()
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div
      ref={mountRef}
      style={{
        position: 'fixed', inset: 0,
        zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 30% 20%, #0d1240 0%, #070714 50%, #0a0108 100%)',
      }}
    />
  )
}
