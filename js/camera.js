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
  let activeTween = null

  function killActiveTween() {
    if (activeTween) {
      activeTween.kill()
      activeTween = null
    }
  }

  function setAspect(w, h) {
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }

  function flyTo(zoneId, { reducedMotion = false, onComplete } = {}) {
    const zone = ZONES.find((z) => z.id === zoneId)
    if (!zone) return
    // Cinematic when moving from one zoomed-in zone to another: pull back to an
    // establishing view over the destination, then descend in.
    const wasDetail = mode === 'detail'
    killActiveTween()
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

    function onUpdate() {
      camera.position.set(state.x, state.y, state.z)
      controls.target.set(state.tx, state.ty, state.tz)
      camera.lookAt(controls.target)
    }

    const tl = gsap.timeline({
      onComplete() {
        tweening = false
        activeTween = null
        controls.enabled = true
        controls.minDistance = 8
        controls.maxDistance = 28
        controls.update()
        onComplete?.()
      },
    })
    activeTween = tl

    if (wasDetail) {
      // Establishing vantage: pulled back and lifted above the destination so
      // the player sees the next location in the context of the whole store.
      const dir = pos.clone().sub(look)
      const transit = look.clone().add(dir.multiplyScalar(2.5))
      transit.y = Math.max(pos.y * 1.9, 24)

      tl.to(state, {
        duration: 1.05,
        ease: 'power2.inOut',
        x: transit.x,
        y: transit.y,
        z: transit.z,
        tx: look.x,
        ty: look.y,
        tz: look.z,
        onUpdate,
      }).to(state, {
        duration: 1.45,
        ease: 'power2.inOut',
        x: pos.x,
        y: pos.y,
        z: pos.z,
        tx: look.x,
        ty: look.y,
        tz: look.z,
        onUpdate,
      })
    } else {
      tl.to(state, {
        duration: 1.65,
        ease: 'power2.inOut',
        x: pos.x,
        y: pos.y,
        z: pos.z,
        tx: look.x,
        ty: look.y,
        tz: look.z,
        onUpdate,
      })
    }
  }

  function returnOverview({ reducedMotion = false, onComplete } = {}) {
    killActiveTween()
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

    activeTween = gsap.to(state, {
      duration: 1.5,
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
        activeTween = null
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
