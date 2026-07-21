import gsap from 'gsap'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { ZONES, OVERVIEW } from './content.js'

export function createCameraSystem(renderer, canvas) {
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 300)
  camera.position.set(...OVERVIEW.pos)
  camera.lookAt(...OVERVIEW.target)

  const controls = new OrbitControls(camera, canvas)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.enablePan = false
  controls.minDistance = 18
  controls.maxDistance = 95
  controls.minPolarAngle = 0.35
  controls.maxPolarAngle = Math.PI / 2.15
  controls.target.set(...OVERVIEW.target)
  controls.update()

  let mode = 'overview' // overview | detail
  let tweening = false
  let activeZone = null

  function setAspect(w, h) {
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }

  function flyTo(zoneId, { reducedMotion = false, onComplete } = {}) {
    const zone = ZONES.find((z) => z.id === zoneId)
    if (!zone) return
    activeZone = zoneId
    mode = 'detail'
    controls.enabled = false
    tweening = true

    const look = new THREE.Vector3(...zone.look)
    const pos = new THREE.Vector3(...zone.cam)

    if (reducedMotion) {
      camera.position.copy(pos)
      controls.target.copy(look)
      camera.lookAt(look)
      controls.update()
      tweening = false
      controls.enabled = true
      controls.minDistance = 8
      controls.maxDistance = 28
      onComplete?.()
      return
    }

    const state = {
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z,
      tx: controls.target.x,
      ty: controls.target.y,
      tz: controls.target.z,
    }

    gsap.to(state, {
      duration: 1.15,
      ease: 'power2.inOut',
      x: pos.x,
      y: pos.y,
      z: pos.z,
      tx: look.x,
      ty: look.y,
      tz: look.z,
      onUpdate() {
        camera.position.set(state.x, state.y, state.z)
        controls.target.set(state.tx, state.ty, state.tz)
        camera.lookAt(controls.target)
      },
      onComplete() {
        tweening = false
        controls.enabled = true
        controls.minDistance = 8
        controls.maxDistance = 28
        controls.update()
        onComplete?.()
      },
    })
  }

  function returnOverview({ reducedMotion = false, onComplete } = {}) {
    activeZone = null
    mode = 'overview'
    controls.enabled = false
    tweening = true
    controls.minDistance = 18
    controls.maxDistance = 95

    const look = new THREE.Vector3(...OVERVIEW.target)
    const pos = new THREE.Vector3(...OVERVIEW.pos)

    if (reducedMotion) {
      camera.position.copy(pos)
      controls.target.copy(look)
      camera.lookAt(look)
      controls.update()
      tweening = false
      controls.enabled = true
      onComplete?.()
      return
    }

    const state = {
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z,
      tx: controls.target.x,
      ty: controls.target.y,
      tz: controls.target.z,
    }

    gsap.to(state, {
      duration: 1.05,
      ease: 'power2.inOut',
      x: pos.x,
      y: pos.y,
      z: pos.z,
      tx: look.x,
      ty: look.y,
      tz: look.z,
      onUpdate() {
        camera.position.set(state.x, state.y, state.z)
        controls.target.set(state.tx, state.ty, state.tz)
        camera.lookAt(controls.target)
      },
      onComplete() {
        tweening = false
        controls.enabled = true
        controls.update()
        onComplete?.()
      },
    })
  }

  function update() {
    if (!tweening && controls.enabled) controls.update()
  }

  return {
    camera,
    controls,
    setAspect,
    flyTo,
    returnOverview,
    update,
    get mode() {
      return mode
    },
    get tweening() {
      return tweening
    },
    get activeZone() {
      return activeZone
    },
  }
}
