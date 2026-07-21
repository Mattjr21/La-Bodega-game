import * as THREE from 'three'

/**
 * Unified Pointer Events picking for mouse / touch / pen.
 * Avoids hover-dependent fix actions.
 * getHitList() can return zone rings or challenge props depending on mode.
 */
export function createInteraction({ canvas, camera, getHitList, onPick, onMiss, isInteractive }) {
  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()
  let pointerId = null
  let downXY = null
  let dragging = false

  function setPointerFromEvent(e) {
    const rect = canvas.getBoundingClientRect()
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
  }

  function pick() {
    const list = typeof getHitList === 'function' ? getHitList() : getHitList
    if (!list?.length) return null
    raycaster.setFromCamera(pointer, camera)
    const hits = raycaster.intersectObjects(list, false)
    return hits[0]?.object || null
  }

  canvas.addEventListener('pointerdown', (e) => {
    if (!isInteractive()) return
    if (e.button !== undefined && e.button !== 0) return
    pointerId = e.pointerId
    downXY = { x: e.clientX, y: e.clientY }
    dragging = false
    try {
      canvas.setPointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
  })

  canvas.addEventListener('pointermove', (e) => {
    if (pointerId !== e.pointerId || !downXY) return
    const dx = e.clientX - downXY.x
    const dy = e.clientY - downXY.y
    if (dx * dx + dy * dy > 36) dragging = true
  })

  function endPointer(e) {
    if (pointerId !== e.pointerId) return
    const wasDrag = dragging
    const id = pointerId
    pointerId = null
    downXY = null
    dragging = false
    try {
      canvas.releasePointerCapture(id)
    } catch {
      /* ignore */
    }
    if (wasDrag || !isInteractive()) return
    setPointerFromEvent(e)
    const obj = pick()
    if (obj) onPick(obj)
    else if (onMiss) onMiss()
  }

  canvas.addEventListener('pointerup', endPointer)
  canvas.addEventListener('pointercancel', () => {
    pointerId = null
    downXY = null
    dragging = false
  })

  return { pick, setPointerFromEvent }
}
