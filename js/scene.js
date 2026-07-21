import * as THREE from 'three'

const COLORS = {
  ground: 0xfff7ed,
  floorA: 0xfde68a,
  floorB: 0xfef3c7,
  wall: 0xffedd5,
  wallAccent: 0xfb923c,
  wallTop: 0xfffbeb,
  wood: 0xc2410c,
  woodLt: 0xea580c,
  woodDk: 0x9a3412,
  turquoise: 0x2dd4bf,
  turquoiseDk: 0x0f766e,
  coral: 0xfb7185,
  purple: 0xa855f7,
  green: 0x22c55e,
  blue: 0x3b82f6,
  yellow: 0xfacc15,
  chrome: 0xe2e8f0,
  glass: 0x7dd3fc,
  dark: 0x1e293b,
  produce: [0xef4444, 0xf59e0b, 0x22c55e, 0xa3e635, 0xf97316, 0xeab308],
  packs: [0xef4444, 0xf59e0b, 0x22c55e, 0x3b82f6, 0xa855f7, 0x14b8a6, 0xf97316, 0xeab308],
}

function std(hex, roughness = 0.78, metalness = 0) {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(hex),
    roughness,
    metalness,
  })
}

export function createStoreScene(renderer) {
  const scene = new THREE.Scene()
  scene.fog = new THREE.Fog(0xfff7ed, 70, 160)

  // Lighting — colorful but controlled
  scene.add(new THREE.AmbientLight(0xfff7ed, 0.55))
  const sun = new THREE.DirectionalLight(0xfff1c9, 1.55)
  sun.position.set(30, 48, 24)
  sun.castShadow = true
  const mapSize = window.matchMedia('(max-width: 700px)').matches ? 1024 : 2048
  sun.shadow.mapSize.set(mapSize, mapSize)
  Object.assign(sun.shadow.camera, {
    left: -55,
    right: 55,
    top: 55,
    bottom: -55,
    near: 1,
    far: 160,
  })
  sun.shadow.bias = -0.0004
  sun.shadow.radius = 4
  scene.add(sun)
  const fill = new THREE.DirectionalLight(0xa5f3fc, 0.45)
  fill.position.set(-20, 14, -18)
  scene.add(fill)
  scene.add(new THREE.HemisphereLight(0xfef3c7, 0xfdba74, 0.55))

  // Soft accent lights (limited count)
  ;[
    [0xff6b2c, 0.7, 12, -16, 5, -8],
    [0x3b82f6, 0.55, 10, 14, 4.5, 11],
    [0x22c55e, 0.45, 10, -4, 5, 0],
    [0xf59e0b, 0.4, 9, 18, 4, -2],
  ].forEach(([c, i, d, x, y, z]) => {
    const l = new THREE.PointLight(c, i, d)
    l.position.set(x, y, z)
    scene.add(l)
  })

  const mats = {
    ground: std(COLORS.ground, 0.98),
    wall: std(COLORS.wall, 0.82),
    wallAccent: std(COLORS.wallAccent, 0.7),
    wallTop: std(COLORS.wallTop, 0.65),
    wood: std(COLORS.wood, 0.76),
    woodLt: std(COLORS.woodLt, 0.72),
    woodDk: std(COLORS.woodDk, 0.84),
    turquoise: std(COLORS.turquoise, 0.55, 0.15),
    turquoiseDk: std(COLORS.turquoiseDk, 0.6, 0.2),
    coral: std(COLORS.coral, 0.7),
    purple: std(COLORS.purple, 0.65),
    green: std(COLORS.green, 0.7),
    blue: std(COLORS.blue, 0.65),
    yellow: std(COLORS.yellow, 0.7),
    chrome: std(COLORS.chrome, 0.18, 0.85),
    glass: new THREE.MeshStandardMaterial({
      color: COLORS.glass,
      roughness: 0.08,
      metalness: 0.05,
      transparent: true,
      opacity: 0.32,
    }),
    screen: new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.2,
      metalness: 0.25,
      emissive: new THREE.Color(0x2563eb),
      emissiveIntensity: 0.9,
    }),
    dark: std(COLORS.dark, 0.9),
    cardboard: std(0xfbbf24, 0.88),
    cardboardOk: std(0x16a34a, 0.8),
  }

  const root = new THREE.Group()
  scene.add(root)

  function box(w, h, d, m, x = 0, y = 0, z = 0, ry = 0) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m)
    mesh.position.set(x, y, z)
    if (ry) mesh.rotation.y = ry
    mesh.castShadow = true
    mesh.receiveShadow = true
    root.add(mesh)
    return mesh
  }

  function cyl(rt, rb, h, seg, m, x = 0, y = 0, z = 0) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m)
    mesh.position.set(x, y, z)
    mesh.castShadow = true
    mesh.receiveShadow = true
    root.add(mesh)
    return mesh
  }

  function sph(r, m, x = 0, y = 0, z = 0) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 10), m)
    mesh.position.set(x, y, z)
    mesh.castShadow = true
    root.add(mesh)
    return mesh
  }

  // Ground + colorful checker floor (fewer tiles via larger cells)
  const gnd = new THREE.Mesh(new THREE.PlaneGeometry(180, 180), mats.ground)
  gnd.rotation.x = -Math.PI / 2
  gnd.position.y = -0.02
  gnd.receiveShadow = true
  root.add(gnd)

  const floorA = std(COLORS.floorA, 0.92)
  const floorB = std(COLORS.floorB, 0.9)
  for (let fi = -20; fi <= 21; fi += 2) {
    for (let fj = -13; fj <= 14; fj += 2) {
      const tm = (fi + fj) % 4 === 0 ? floorA : floorB
      const tile = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.04, 1.9), tm)
      tile.position.set(fi, 0.02, fj)
      tile.receiveShadow = true
      root.add(tile)
    }
  }

  // Architecture
  const WH = 6.5
  box(44, WH, 0.55, mats.wall, 1, WH / 2, -15.27)
  box(44.8, 0.48, 0.8, mats.wallTop, 1, WH + 0.24, -15.27)
  box(0.55, WH, 32, mats.wall, -20.27, WH / 2, 0.5)
  box(0.8, 0.48, 32.8, mats.wallTop, -20.27, WH + 0.24, 0.5)
  // Accent stripe
  box(44, 0.35, 0.2, mats.coral, 1, 4.2, -15.0)
  box(0.2, 0.35, 32, mats.turquoise, -20.0, 4.2, 0.5)
  // Store sign
  box(16, 1.4, 0.35, mats.purple, 1, 5.9, -15.0)
  box(14.5, 1.0, 0.2, mats.yellow, 1, 5.9, -14.85)

  // Awning bands
  for (let i = 0; i < 12; i++) {
    const m = i % 2 === 0 ? mats.coral : mats.turquoise
    box(3.4, 0.18, 1.6, m, -18 + i * 3.5, 5.2, -14.2)
  }

  // Instanced shelf products
  const shelfPositions = []
  for (let col = 0; col < 5; col++) {
    for (let row = 0; row < 4; row++) {
      shelfPositions.push([-17 + col * 3.4, -6.5 + row * 4.5])
    }
  }
  for (let col = 0; col < 3; col++) {
    for (let row = 0; row < 5; row++) {
      shelfPositions.push([0.8 + col * 3.4, -8.5 + row * 4])
    }
  }

  const packGeo = new THREE.BoxGeometry(0.22, 0.32, 0.18)
  const packMats = COLORS.packs.map((c) => std(c, 0.72))
  const packMeshes = packMats.map((m) => {
    const im = new THREE.InstancedMesh(packGeo, m, shelfPositions.length * 20)
    im.castShadow = true
    im.receiveShadow = true
    im.count = 0
    root.add(im)
    return im
  })
  const dummy = new THREE.Object3D()

  shelfPositions.forEach(([gx, gz]) => {
    const len = 2.2
    box(len, 4.0, 0.14, mats.woodDk, gx, 2.0, gz)
    for (let s = 0; s < 5; s++) box(len, 0.09, 0.9, mats.wood, gx, 0.35 + s * 0.78, gz + 0.38)
    box(0.12, 4.0, 0.9, mats.woodDk, gx - len / 2, 2.0, gz + 0.38)
    box(0.12, 4.0, 0.9, mats.woodDk, gx + len / 2, 2.0, gz + 0.38)
    // colorful shelf edge strip
    box(len, 0.06, 0.06, mats.turquoise, gx, 0.9, gz + 0.82)

    for (let s2 = 0; s2 < 5; s2++) {
      const y2 = 0.45 + s2 * 0.78
      for (let p = 0; p < 4; p++) {
        const mi = (s2 * 4 + p + Math.abs(gx | 0)) % packMeshes.length
        const mesh = packMeshes[mi]
        dummy.position.set(gx - len / 2 + 0.28 + p * 0.5, y2 + 0.2, gz + 0.36)
        dummy.rotation.set(0, (p % 2) * 0.05, 0)
        dummy.scale.set(1, 0.85 + (p % 3) * 0.12, 1)
        dummy.updateMatrix()
        mesh.setMatrixAt(mesh.count++, dummy.matrix)
      }
    }
  })
  packMeshes.forEach((m) => {
    m.instanceMatrix.needsUpdate = true
  })

  // Coolers — turquoise
  for (let ri = 0; ri < 7; ri++) {
    const rx = -17 + ri * 3.4
    box(3.0, 4.0, 0.7, mats.turquoiseDk, rx, 2.0, -14.65)
    box(2.8, 3.8, 0.09, mats.glass, rx, 2.0, -14.38)
    box(3.0, 0.2, 0.75, mats.coral, rx, 4.1, -14.65)
  }

  // Registers — four terminals (case study)
  ;[11.2, 13.8, 16.4, 19.0].forEach((cx, i) => {
    box(2.0, 1.05, 0.85, mats.woodLt, cx, 0.52, 11.0)
    box(2.0, 0.1, 0.85, mats.yellow, cx, 1.05, 11.0)
    box(0.55, 0.6, 0.08, mats.dark, cx + 0.35, 1.65, 10.6)
    box(0.48, 0.52, 0.05, mats.screen, cx + 0.35, 1.65, 10.57)
    box(1.8, 0.08, 2.4, mats.dark, cx, 1.06, 12.9)
    box(0.9, 0.4, 0.1, i % 2 ? mats.blue : mats.coral, cx, 2.4, 10.5)
  })

  // Produce table
  box(6.5, 0.9, 3.2, mats.woodLt, -1.5, 0.45, -11.5)
  box(6.5, 0.12, 3.2, mats.green, -1.5, 0.92, -11.5)
  COLORS.produce.forEach((hex, i) => {
    const m = std(hex, 0.78)
    for (let n = 0; n < 5; n++) {
      sph(
        0.18,
        m,
        -3.2 + i * 1.05 + (n % 3) * 0.12,
        1.12 + (n % 2) * 0.08,
        -11.5 + (n - 2) * 0.35,
      )
    }
  })

  // Dock / cardboard
  box(7.0, 0.14, 6.0, std(0xfed7aa, 0.92), -17.5, 0.07, -11.5)
  ;[
    [-17.0, 0.3, -11.0],
    [-18.0, 0.3, -11.8],
    [-18.8, 0.3, -10.5],
    [-17.2, 0.85, -11.0],
    [-18.2, 0.85, -11.6],
  ].forEach(([x, y, z]) => box(0.85, 0.55, 0.68, mats.cardboard, x, y, z))

  const trolley = box(0.8, 0.9, 1.2, mats.chrome, -17.0, 0.45, -9.0)
  const trolleyBox = box(0.75, 0.55, 0.55, mats.cardboard, -17.0, 1.05, -9.0)

  // Buffet / revenue board area
  ;[-11.5, -8, -4.5].forEach((bz) => {
    box(4.0, 1.2, 1.0, mats.wood, 18.0, 0.6, bz)
    box(4.0, 0.1, 1.0, mats.chrome, 18.0, 1.2, bz)
    box(3.6, 0.08, 0.8, mats.coral, 18.0, 1.28, bz)
  })
  box(2.4, 1.8, 0.2, mats.green, 19.6, 2.2, -1.2)
  box(2.1, 1.4, 0.12, mats.screen, 19.6, 2.2, -1.1)

  // Endcap signs
  ;[
    [-10, 0, mats.coral],
    [2, 4, mats.purple],
    [8, -4, mats.turquoise],
  ].forEach(([x, z, m]) => {
    box(0.15, 2.2, 1.4, m, x, 1.2, z)
    box(0.08, 0.9, 1.1, mats.yellow, x + 0.12, 1.5, z)
  })

  // People (simple colorful staff)
  function person(px, pz, shirtHex, ry = 0) {
    const g = new THREE.Group()
    g.rotation.y = ry
    const shirt = std(shirtHex, 0.8)
    const skin = std(0xf0b880, 0.86)
    const pants = std(0x1e3a5f, 0.82)
    ;[
      [0.4, 0.6, 0.24, shirt, 0, 1.0, 0],
      [0.16, 0.48, 0.18, pants, -0.1, 0.5, 0],
      [0.16, 0.48, 0.18, pants, 0.1, 0.5, 0],
      [0.28, 0.3, 0.26, skin, 0, 1.48, 0],
    ].forEach(([w, h, d, m, x, y, z]) => {
      const me = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m)
      me.position.set(x, y, z)
      me.castShadow = true
      g.add(me)
    })
    g.position.set(px, 0, pz)
    root.add(g)
  }
  ;[
    [12, 10.1, 0x22c55e, 0.1],
    [14.8, 10.1, 0x3b82f6, 0.05],
    [17.6, 10.1, 0xf97316, 0.08],
    [19.0, 10.1, 0xa855f7, 0.05],
    [12, 13.4, 0xef4444, Math.PI],
    [14.8, 13.4, 0x14b8a6, Math.PI],
    [-15, -3.5, 0xf59e0b, Math.PI * 1.5],
    [-8, 2, 0x3b82f6, 0.4],
    [2, -2, 0x22c55e, 1.0],
    [-19, -7, 0xfb7185, Math.PI * 0.5],
  ].forEach(([x, z, c, ry]) => person(x, z, c, ry))

  // Plants
  ;[
    [21.5, 14],
    [21.5, -12],
    [-21.5, 12],
  ].forEach(([x, z]) => {
    cyl(0.45, 0.5, 0.8, 10, mats.coral, x, 0.4, z)
    sph(0.6, mats.green, x, 1.2, z)
  })

  // Zone hit targets
  const hitGeo = new THREE.CylinderGeometry(2.4, 2.4, 5, 16)
  const hitMat = new THREE.MeshBasicMaterial({ visible: false })
  const zPos = {
    delivery: new THREE.Vector3(-16.5, 0, -8.5),
    register: new THREE.Vector3(14.8, 0, 11.0),
    queue: new THREE.Vector3(15.5, 0, 14.0),
    aisles: new THREE.Vector3(-5.0, 0, 0),
    revenue: new THREE.Vector3(18.5, 0, -2.0),
  }
  const hitMeshes = {}
  Object.entries(zPos).forEach(([id, pos]) => {
    const m = new THREE.Mesh(hitGeo, hitMat)
    m.position.copy(pos)
    m.position.y += 2
    m.userData.zoneId = id
    root.add(m)
    hitMeshes[id] = m
  })

  // Floating zone marker rings (colorful)
  const markers = {}
  Object.entries(zPos).forEach(([id, pos]) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.6, 0.08, 8, 32),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: new THREE.Color(0xffffff),
        emissiveIntensity: 0.35,
        roughness: 0.4,
      }),
    )
    ring.rotation.x = Math.PI / 2
    ring.position.set(pos.x, 0.12, pos.z)
    root.add(ring)
    markers[id] = ring
  })

  let trolleyX = -17
  let trolleyDir = 1

  return {
    scene,
    root,
    zPos,
    hitMeshes,
    hitList: Object.values(hitMeshes),
    markers,
    mats,
    trolley,
    trolleyBox,
    tick(dt, solvedDelivery) {
      if (!solvedDelivery) {
        trolleyX += trolleyDir * dt * 1.1
        if (trolleyX > -13.5 || trolleyX < -20.5) trolleyDir *= -1
        trolley.position.x = trolleyX
        trolleyBox.position.x = trolleyX
      } else {
        trolleyBox.material = mats.cardboardOk
      }
      Object.values(markers).forEach((ring) => {
        ring.rotation.z += dt * 0.6
      })
    },
    setMarkerColor(id, hex) {
      const ring = markers[id]
      if (!ring) return
      ring.material.color.setHex(hex)
      ring.material.emissive.setHex(hex)
    },
  }
}
