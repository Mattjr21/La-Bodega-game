import * as THREE from 'three'
import { ZONES } from './content.js'
import { createStoreScene } from './scene.js'
import { createCameraSystem } from './camera.js'
import { createUI } from './ui.js'
import { createInteraction } from './interaction.js'

const params = new URLSearchParams(location.search)
const isEmbed = params.get('embed') === '1'

const reducedMotion =
  window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
  params.get('reduced') === '1'

const lowCapability =
  navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 2

const state = {
  solved: new Set(),
  selected: null,
  mode: reducedMotion || lowCapability ? 'list' : 'explore', // explore | list
  started: true,
}

document.body.dataset.reducedMotion = String(reducedMotion)
if (isEmbed) document.body.classList.add('is-embed')

const canvas = document.getElementById('c')
const fallback = document.getElementById('fallback')
const hint = document.getElementById('hint')

let renderer
let store
let cam
let ui
let animating = false
let pageVisible = document.visibilityState !== 'hidden'
let needsFrame = true
let lastT = performance.now()
let confetti = []

function canUseWebGL() {
  try {
    const test = document.createElement('canvas')
    return !!(test.getContext('webgl') || test.getContext('experimental-webgl'))
  } catch {
    return false
  }
}

function getState() {
  return state
}

function isZoneLocked(zoneId) {
  const idx = ZONES.findIndex((z) => z.id === zoneId)
  if (idx <= 0) return false
  return !state.solved.has(ZONES[idx - 1].id)
}

function updateMarkers() {
  if (!store) return
  ZONES.forEach((z) => {
    if (state.solved.has(z.id)) store.setMarkerColor(z.id, 0x16a34a)
    else if (isZoneLocked(z.id)) store.setMarkerColor(z.id, 0xa8a29e)
    else store.setMarkerColor(z.id, z.colorHex)
  })
}

function selectZone(zoneId) {
  if (isZoneLocked(zoneId)) {
    ui.announce(`${ZONES.find((z) => z.id === zoneId)?.name || 'Zone'} is locked.`)
    return
  }
  state.selected = zoneId
  ui.renderZones()
  ui.showDetail(zoneId)
  const zone = ZONES.find((z) => z.id === zoneId)
  ui.announce(`Selected ${zone.name}. ${zone.problem}`)

  if (cam && state.mode === 'explore') {
    animating = true
    needsFrame = true
    cam.flyTo(zoneId, {
      reducedMotion,
      onComplete() {
        animating = false
        needsFrame = true
      },
    })
  }
}

function backOverview() {
  const had = state.selected
  state.selected = null
  ui.hideDetail()
  ui.renderZones()
  if (had) ui.announce('Returned to store overview.')

  if (cam && state.mode === 'explore') {
    animating = true
    needsFrame = true
    cam.returnOverview({
      reducedMotion,
      onComplete() {
        animating = false
        needsFrame = true
      },
    })
  }
}

function applyFix(zoneId) {
  if (!zoneId || state.solved.has(zoneId)) return
  if (isZoneLocked(zoneId)) {
    ui.announce('This zone is locked. Complete the previous zone first.')
    return
  }
  state.solved.add(zoneId)
  updateMarkers()
  ui.renderZones()
  ui.showDetail(zoneId)
  ui.updateProgress()
  const zone = ZONES.find((z) => z.id === zoneId)
  ui.announce(`Applied fix for ${zone.name}. ${zone.solution}`)

  if (!reducedMotion && state.mode === 'explore' && state.solved.size === ZONES.length) {
    spawnConfetti()
  }

  // StadiView flow: after applying, return to overview (list mode keeps detail visible)
  if (state.mode === 'explore') {
    setTimeout(() => backOverview(), reducedMotion ? 0 : 650)
  }
  needsFrame = true
}

function toggleMode() {
  state.mode = state.mode === 'list' ? 'explore' : 'list'
  document.body.dataset.viewMode = state.mode
  ui.renderZones()

  if (state.mode === 'list') {
    ui.announce('List walkthrough mode. Use the mission panel to complete all zones.')
    if (state.selected) ui.showDetail(state.selected)
    else ui.hideDetail()
  } else {
    if (!renderer) {
      ui.announce('3D explore unavailable. Staying in list mode.')
      state.mode = 'list'
      document.body.dataset.viewMode = 'list'
      ui.renderZones()
      return
    }
    ui.announce('3D explore mode. Select a zone to fly the camera in.')
    if (state.selected) {
      cam.flyTo(state.selected, { reducedMotion })
      ui.showDetail(state.selected)
    } else {
      cam.returnOverview({ reducedMotion })
      ui.hideDetail()
    }
  }
  needsFrame = true
}

function spawnConfetti() {
  if (!store) return
  const geo = new THREE.BoxGeometry(0.12, 0.12, 0.12)
  const colors = [0xff6b2c, 0x3b82f6, 0x22c55e, 0xf59e0b, 0xa855f7, 0x14b8a6]
  for (let i = 0; i < 40; i++) {
    const m = new THREE.Mesh(
      geo,
      new THREE.MeshStandardMaterial({ color: colors[i % colors.length], roughness: 0.6 }),
    )
    m.position.set((Math.random() - 0.5) * 20, 8 + Math.random() * 4, (Math.random() - 0.5) * 16)
    m.userData.vx = (Math.random() - 0.5) * 4
    m.userData.vy = 2 + Math.random() * 3
    m.userData.vz = (Math.random() - 0.5) * 4
    store.root.add(m)
    confetti.push(m)
  }
  animating = true
}

function tickConfetti(dt) {
  if (!confetti.length) return
  confetti.forEach((m) => {
    m.userData.vy -= 9 * dt
    m.position.x += m.userData.vx * dt
    m.position.y += m.userData.vy * dt
    m.position.z += m.userData.vz * dt
    m.rotation.x += dt * 3
    m.rotation.z += dt * 2
  })
  confetti = confetti.filter((m) => {
    if (m.position.y < 0) {
      store.root.remove(m)
      return false
    }
    return true
  })
  if (!confetti.length) animating = false
}

function resize() {
  if (!renderer || !cam) return
  const w = window.innerWidth
  const h = window.innerHeight
  const dprCap = window.matchMedia('(max-width: 700px)').matches ? 1 : 1.5
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap))
  renderer.setSize(w, h, false)
  cam.setAspect(w, h)
  needsFrame = true
}

function loop(now) {
  requestAnimationFrame(loop)
  if (!renderer || !pageVisible) return
  if (state.mode === 'list') return

  const dt = Math.min(0.05, (now - lastT) / 1000)
  lastT = now

  // Orbit damping needs continuous frames while explore mode is visible.
  // Pause fully when the tab/iframe is hidden (visibilitychange / postMessage).
  store?.tick(dt, state.solved.has('delivery'))
  tickConfetti(dt)
  cam?.update()
  renderer.render(store.scene, cam.camera)
  needsFrame = false
}

function setup3D() {
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !window.matchMedia('(max-width: 700px)').matches,
    alpha: false,
    powerPreference: 'high-performance',
  })
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.setClearColor(0xfff7ed, 1)
  renderer.outputColorSpace = THREE.SRGBColorSpace

  store = createStoreScene(renderer)
  cam = createCameraSystem(renderer, canvas)

  createInteraction({
    canvas,
    camera: cam.camera,
    hitList: store.hitList,
    isInteractive: () =>
      state.mode === 'explore' && pageVisible && !cam.tweening && !state.selected,
    onPickZone: (zoneId) => selectZone(zoneId),
  })

  // Allow picking while in overview; when in detail, clicks on canvas don't change zone
  // (mission panel owns apply). When selected, still allow orbit.

  cam.controls.addEventListener('change', () => {
    needsFrame = true
  })

  updateMarkers()
  resize()
  requestAnimationFrame(loop)
}

function onVisibility() {
  pageVisible = document.visibilityState !== 'hidden'
  if (pageVisible) needsFrame = true
}

function onMessage(e) {
  // Portfolio iframe can pause us
  if (!e?.data || typeof e.data !== 'object') return
  if (e.data.type === 'bodega:pause') {
    pageVisible = false
  }
  if (e.data.type === 'bodega:resume') {
    pageVisible = true
    needsFrame = true
  }
}

function boot() {
  ui = createUI({
    onSelectZone: selectZone,
    onApplyFix: applyFix,
    onBackOverview: backOverview,
    onToggleMode: toggleMode,
    getState,
  })

  ui.renderZones()
  ui.updateProgress()

  const webglOk = canUseWebGL()
  if (!webglOk || state.mode === 'list') {
    if (!webglOk) {
      fallback.classList.add('is-on')
      fallback.querySelector('[data-fallback-msg]').textContent =
        'WebGL is unavailable on this device. Use the list walkthrough to complete the mission.'
      state.mode = 'list'
      document.body.dataset.viewMode = 'list'
      ui.announce('3D unavailable. List walkthrough is ready.')
    } else if (reducedMotion || lowCapability) {
      state.mode = 'list'
      document.body.dataset.viewMode = 'list'
      ui.announce('Reduced motion or low-capability device detected. Starting in list walkthrough.')
    }
    ui.renderZones()
  }

  if (webglOk) {
    try {
      setup3D()
      if (state.mode === 'list') {
        // Keep renderer paused via mode gate
      } else {
        hint.hidden = false
        ui.announce(
          'Store overview ready. Use the mission panel or click a colored zone ring to begin.',
        )
      }
    } catch (err) {
      console.error(err)
      fallback.classList.add('is-on')
      state.mode = 'list'
      document.body.dataset.viewMode = 'list'
      ui.renderZones()
      ui.announce('3D failed to start. Continuing in list walkthrough.')
    }
  }

  window.addEventListener('resize', resize)
  document.addEventListener('visibilitychange', onVisibility)
  window.addEventListener('message', onMessage)

  // Keyboard: Enter/Space already activate focused buttons; Escape handled in UI
}

boot()
