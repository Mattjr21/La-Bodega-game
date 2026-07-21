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
      const gx = -17 + col * 3.4
      const gz = -6.5 + row * 4.5
      // Keep a clear sightline into the receiving bay.
      if (!(gx < -10 && gz < -4)) shelfPositions.push([gx, gz])
    }
  }
  for (let col = 0; col < 3; col++) {
    for (let row = 0; row < 4; row++) {
      const gx = 1.2 + col * 4.0
      const gz = -7.5 + row * 4.8
      // Leave the center walkway open for the aisle-audit bay.
      if (Math.abs(gx - 3.2) < 2.2 && Math.abs(gz + 0.3) < 2.6) continue
      shelfPositions.push([gx, gz])
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
  // Short belts stay on the cashier side so they never invade the queue lane.
  const registerScreens = []
  const screenError = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.2,
    metalness: 0.25,
    emissive: new THREE.Color(0xef4444),
    emissiveIntensity: 1.15,
  })
  const screenOk = mats.screen
  const registerHousings = []
  ;[11.2, 13.8, 16.4, 19.0].forEach((cx, i) => {
    box(2.0, 1.05, 0.85, mats.woodLt, cx, 0.52, 10.6)
    box(2.0, 0.1, 0.85, mats.yellow, cx, 1.05, 10.6)
    box(0.08, 0.55, 0.08, mats.chrome, cx + 0.35, 1.35, 10.35)
    // Error terminal housing glows red so it reads as broken from any angle.
    const housing = box(0.55, 0.42, 0.06, i === 1 ? screenError : mats.dark, cx + 0.35, 1.72, 10.28)
    registerHousings.push(housing)
    const screen = box(
      0.48,
      0.34,
      0.04,
      i === 1 ? screenError : screenOk,
      cx + 0.35,
      1.72,
      10.25,
    )
    registerScreens.push(screen)
    box(1.2, 0.08, 0.95, mats.dark, cx, 1.06, 11.35)
    box(0.55, 0.28, 0.06, i % 2 ? mats.blue : mats.coral, cx - 0.55, 0.85, 10.15)
  })

  // Checkout floor — thin floor tape, not board-like pads.
  ;[12.2, 14.8, 17.4].forEach((qx) => {
    for (let step = 0; step < 4; step++) {
      box(0.55, 0.03, 0.35, mats.turquoise, qx, 0.06, 14.5 + step * 0.7)
    }
  })
  // Queue rails and stanchions — south of the belts, clear of hardware.
  ;[11.1, 13.5, 15.9, 18.3].forEach((qx) => {
    cyl(0.12, 0.16, 1.0, 10, mats.chrome, qx, 0.5, 16.6)
    sph(0.16, mats.coral, qx, 1.05, 16.6)
  })
  ;[
    [12.3, 16.6],
    [14.7, 16.6],
    [17.1, 16.6],
  ].forEach(([x, z]) => box(2.0, 0.08, 0.08, mats.turquoiseDk, x, 0.78, z))
  // Basket return + lane beacon (decoration).
  box(1.5, 0.8, 1.1, mats.coral, 19.8, 0.4, 16.0)
  box(0.12, 2.0, 0.12, mats.dark, 10.5, 1.0, 14.4)
  box(1.2, 0.55, 0.1, mats.turquoise, 10.5, 2.1, 14.4)
  // Misc-charge sign in the queue lane — the queue challenge target, in view.
  box(0.12, 1.7, 0.12, mats.dark, 16.6, 0.85, 17.9)
  const miscSign = box(1.35, 0.72, 0.12, mats.coral, 16.6, 1.75, 17.9)
  box(0.9, 0.16, 0.1, mats.yellow, 16.6, 1.75, 17.97)

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

  // Receiving bay — visually distinct from retail aisles.
  const dockFloor = std(0xfed7aa, 0.92)
  box(9.0, 0.14, 7.0, dockFloor, -15.2, 0.07, -10.8)
  // Roll-up loading door and safety frame.
  box(7.4, 4.5, 0.18, mats.chrome, -15.2, 2.25, -14.82)
  for (let slat = 0; slat < 8; slat++) {
    box(7.0, 0.08, 0.08, mats.dark, -15.2, 0.35 + slat * 0.52, -14.68)
  }
  box(0.22, 4.8, 0.3, mats.yellow, -19.0, 2.4, -14.65)
  box(0.22, 4.8, 0.3, mats.yellow, -11.4, 2.4, -14.65)
  // Pallets — wood deck + runners so they read as pallets, not flat boards.
  ;[
    [-17.3, -11.5, 0],
    [-14.8, -11.6, 1],
    [-12.5, -11.2, 2],
  ].forEach(([px, pz, stack]) => {
    // Runners
    box(1.9, 0.12, 0.18, mats.woodDk, px, 0.08, pz - 0.45)
    box(1.9, 0.12, 0.18, mats.woodDk, px, 0.08, pz)
    box(1.9, 0.12, 0.18, mats.woodDk, px, 0.08, pz + 0.45)
    // Deck boards
    for (let plank = 0; plank < 5; plank++) {
      box(0.28, 0.08, 1.35, mats.woodLt, px - 0.72 + plank * 0.36, 0.2, pz)
    }
    const levels = 2 + stack
    for (let level = 0; level < levels; level++) {
      for (let item = 0; item < 2; item++) {
        box(
          0.82,
          0.68,
          0.72,
          mats.cardboard,
          px - 0.46 + item * 0.92,
          0.62 + level * 0.7,
          pz,
        )
      }
    }
  })
  // Sample-scan gate: untagged carton (challenge) → cleared shelf after fix.
  box(2.8, 1.0, 1.1, mats.turquoiseDk, -12.5, 0.5, -8.3)
  const scanScreen = box(0.7, 0.55, 0.08, mats.screen, -12.5, 1.45, -8.85)
  scanScreen.material = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.2,
    metalness: 0.25,
    emissive: new THREE.Color(0xf97316),
    emissiveIntensity: 0.85,
  })
  const untaggedCarton = box(0.8, 0.55, 0.65, mats.cardboard, -13.25, 1.3, -8.25)
  const clearedShelf = box(0.8, 0.08, 0.45, mats.chrome, -11.7, 1.15, -8.25)
  // Static pallet jack — purposeful equipment, no unexplained ambient motion.
  const trolley = box(0.55, 0.55, 1.7, mats.coral, -18.5, 0.28, -8.6)
  const trolleyBox = box(1.0, 0.68, 0.8, mats.cardboard, -18.5, 0.9, -9.1)
  box(0.12, 1.5, 0.12, mats.dark, -18.5, 0.9, -7.75, -0.18)

  // Pricing control station — product, unit cost and market price in one place.
  box(6.2, 0.16, 5.2, std(0xdcfce7, 0.92), 17.4, 0.08, -2.4)
  box(4.8, 1.0, 1.2, mats.wood, 17.0, 0.5, -3.8)
  box(4.8, 0.1, 1.2, mats.green, 17.0, 1.05, -3.8)
  box(0.85, 0.7, 0.7, mats.cardboard, 15.7, 1.45, -3.8)
  box(1.1, 0.12, 0.8, mats.chrome, 17.1, 1.18, -3.8)
  box(0.65, 0.48, 0.08, mats.screen, 17.1, 1.62, -4.25)
  box(3.8, 2.2, 0.2, mats.dark, 18.0, 1.85, -5.0)
  const priceBars = [
    [-1.0, 1.6, mats.coral],
    [0, 1.2, mats.yellow],
    [1.0, 0.6, mats.green],
  ].map(([dx, h, material]) =>
    box(0.62, h, 0.16, material, 18.0 + dx, 1.0 + h / 2, -4.86),
  )
  // Price-tag cards on grounded stands: case → unit → market.
  const priceCards = [-1.8, 0, 1.8].map((dx, index) => {
    box(0.08, 1.0, 0.08, mats.dark, 17.0 + dx, 0.5, -1.0)
    return box(1.05, 0.62, 0.12, index === 0 ? mats.coral : mats.wallTop, 17.0 + dx, 1.15, -1.0)
  })

  // Stock & Aisles audit bay — loaded pallets + three-team workflow.
  const aisleCartons = []
  function makePallet(px, pz, cartonCount = 4) {
    box(1.8, 0.18, 0.22, mats.woodDk, px, 0.12, pz - 0.5)
    box(1.8, 0.18, 0.22, mats.woodDk, px, 0.12, pz)
    box(1.8, 0.18, 0.22, mats.woodDk, px, 0.12, pz + 0.5)
    for (let plank = 0; plank < 6; plank++) {
      box(0.24, 0.14, 1.45, mats.wood, px - 0.7 + plank * 0.28, 0.3, pz)
    }
    const layout = [
      [-0.4, -0.32],
      [0.4, -0.32],
      [-0.4, 0.32],
      [0.4, 0.32],
      [0, 0],
      [-0.4, 0],
    ]
    for (let i = 0; i < cartonCount; i++) {
      const [dx, dz] = layout[i]
      const layer = i < 4 ? 0 : 1
      const carton = box(
        0.62,
        0.5,
        0.52,
        i % 2 === 0 ? mats.cardboard : mats.yellow,
        px + dx,
        0.62 + layer * 0.52,
        pz + dz,
      )
      aisleCartons.push(carton)
      box(0.62, 0.05, 0.08, mats.dark, px + dx, 0.72 + layer * 0.52, pz + dz)
    }
  }

  box(5.4, 0.04, 4.4, std(0xffedd5, 0.95), 3.2, 0.025, -0.3)
  makePallet(1.9, -1.15, 4)
  makePallet(4.4, -1.05, 4)
  makePallet(3.15, 0.95, 5)
  box(1.4, 0.85, 0.7, mats.turquoiseDk, 5.55, 0.42, 0.55)
  box(0.08, 0.45, 0.08, mats.chrome, 5.55, 1.1, 0.35)
  box(0.55, 0.4, 0.06, mats.screen, 5.55, 1.4, 0.28)
  const unmarkedCarton = box(0.5, 0.4, 0.4, mats.yellow, 5.1, 1.25, 0.55)
  box(0.9, 0.75, 0.55, mats.woodLt, 0.95, 0.38, 0.75)
  box(0.45, 0.32, 0.05, mats.screen, 0.95, 1.05, 0.55)

  // Overhead aisle markers — tiny hanging chips above open walkways only.
  ;[
    [-8.5, -2.0, mats.coral],
    [6.8, 2.8, mats.purple],
    [9.5, -6.0, mats.turquoise],
  ].forEach(([x, z, m]) => {
    box(0.06, 0.7, 0.06, mats.dark, x, 5.0, z)
    box(0.9, 0.45, 0.08, m, x, 4.55, z)
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
    return g
  }
  ;[
    [12, 9.7, 0x22c55e, 0.1],
    [14.8, 9.7, 0x3b82f6, 0.05],
    [17.6, 9.7, 0xf97316, 0.08],
    [19.0, 9.7, 0xa855f7, 0.05],
    [-12.8, -9.4, 0xf59e0b, Math.PI],
    [17.5, -2.7, 0x22c55e, Math.PI],
    [1.5, 0.2, 0xf59e0b, 0.4],
    [5.2, 0.05, 0x3b82f6, -0.5],
    [3.8, 1.45, 0x22c55e, Math.PI],
  ].forEach(([x, z, c, ry]) => person(x, z, c, ry))
  const queuePeople = [
    [12.2, 15.4, 0xef4444, Math.PI],
    [14.5, 15.6, 0x14b8a6, Math.PI],
    [16.8, 15.8, 0xf59e0b, Math.PI],
    [18.6, 15.3, 0x3b82f6, Math.PI],
  ].map(([x, z, c, ry]) => person(x, z, c, ry))

  // Plants
  ;[
    [21.5, 14],
    [21.5, -12],
    [-21.5, 12],
  ].forEach(([x, z]) => {
    cyl(0.45, 0.5, 0.8, 10, mats.coral, x, 0.4, z)
    sph(0.6, mats.green, x, 1.2, z)
  })

  // Challenge props — larger invisible hit volumes for reliable picking.
  function makeChallengeHit(zoneId, mesh, scale = 1.8) {
    const hit = new THREE.Mesh(
      new THREE.BoxGeometry(1.2 * scale, 1.2 * scale, 1.2 * scale),
      new THREE.MeshBasicMaterial({ visible: false }),
    )
    hit.position.copy(mesh.position)
    hit.userData.zoneId = zoneId
    hit.userData.kind = 'challenge'
    root.add(hit)
    return hit
  }
  const challengeProps = {
    delivery: untaggedCarton,
    register: registerScreens[1],
    queue: miscSign,
    aisles: unmarkedCarton,
    revenue: priceCards[0],
  }
  const challengeHits = Object.entries(challengeProps).map(([id, mesh]) =>
    makeChallengeHit(id, mesh),
  )

  // Zone hit targets — spaced so rings never collide across zones.
  const hitGeo = new THREE.CylinderGeometry(1.5, 1.5, 4, 16)
  const hitMat = new THREE.MeshBasicMaterial({ visible: false })
  // Ring / click positions sit in OPEN floor in front of each zone so the
  // full ring is visible and never clips through counters or pallets.
  const zPos = {
    delivery: new THREE.Vector3(-15.2, 0, -6.4),
    register: new THREE.Vector3(15.1, 0, 12.7),
    queue: new THREE.Vector3(15.1, 0, 18.4),
    aisles: new THREE.Vector3(3.2, 0, 3.6),
    revenue: new THREE.Vector3(17.4, 0, 1.6),
  }
  const hitMeshes = {}
  Object.entries(zPos).forEach(([id, pos]) => {
    const m = new THREE.Mesh(hitGeo, hitMat)
    m.position.copy(pos)
    m.position.y += 2
    m.userData.zoneId = id
    m.userData.kind = 'zone'
    root.add(m)
    hitMeshes[id] = m
  })

  // Floor markers — compact rings that stay in open floor, not through fixtures.
  const markers = {}
  Object.entries(zPos).forEach(([id, pos]) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.05, 0.07, 8, 28),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: new THREE.Color(0xffffff),
        emissiveIntensity: 0.35,
        roughness: 0.4,
        depthWrite: true,
      }),
    )
    ring.rotation.x = Math.PI / 2
    ring.position.set(pos.x, 0.08, pos.z)
    ring.renderOrder = 2
    root.add(ring)
    const pad = new THREE.Mesh(
      new THREE.CircleGeometry(0.85, 24),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.18,
        roughness: 1,
        metalness: 0,
      }),
    )
    pad.rotation.x = -Math.PI / 2
    pad.position.set(pos.x, 0.05, pos.z)
    root.add(pad)
    markers[id] = { ring, pad }
  })

  function makeTextSprite(text, { w = 512, h = 128, font = '700 44px Arial, sans-serif' } = {}) {
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = 'rgba(28, 25, 23, 0.92)'
    ctx.beginPath()
    ctx.roundRect(4, 4, w - 8, h - 8, 28)
    ctx.fill()
    ctx.strokeStyle = '#fff7ed'
    ctx.lineWidth = 5
    ctx.stroke()
    ctx.fillStyle = '#fff7ed'
    ctx.font = font
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, w / 2, h / 2)
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }),
    )
    sprite.renderOrder = 22
    root.add(sprite)
    return sprite
  }

  const tapHint = makeTextSprite('Tap to inspect', { w: 480, h: 112, font: '700 42px Arial, sans-serif' })
  tapHint.scale.set(3.6, 0.85, 1)
  tapHint.visible = false

  // Challenge beacon — a bright bobbing pointer over the active broken object.
  // depthTest:false keeps it visible even when the prop faces away from camera.
  const beacon = new THREE.Group()
  const beaconCone = new THREE.Mesh(
    new THREE.ConeGeometry(0.34, 0.72, 4),
    new THREE.MeshStandardMaterial({
      color: 0xff3b30,
      emissive: new THREE.Color(0xff3b30),
      emissiveIntensity: 0.95,
      roughness: 0.4,
      depthTest: false,
    }),
  )
  beaconCone.rotation.x = Math.PI
  beaconCone.renderOrder = 30
  beacon.add(beaconCone)
  const beaconRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.42, 0.06, 8, 24),
    new THREE.MeshStandardMaterial({
      color: 0xff3b30,
      emissive: new THREE.Color(0xff3b30),
      emissiveIntensity: 0.85,
      depthTest: false,
    }),
  )
  beaconRing.rotation.x = Math.PI / 2
  beaconRing.position.y = -0.5
  beaconRing.renderOrder = 30
  beacon.add(beaconRing)
  beacon.visible = false
  root.add(beacon)
  const beaconLabel = makeTextSprite('Tap to fix', { w: 360, h: 104 })
  beaconLabel.scale.set(2.6, 0.75, 1)
  beaconLabel.material.depthTest = false
  beaconLabel.visible = false
  let beaconBaseY = 0

  // Active labels turn abstract geometry into recognizable operational zones.
  const labelText = {
    delivery: 'RECEIVING BAY',
    register: 'POS TERMINALS',
    queue: 'CHECKOUT QUEUE',
    aisles: 'AISLE AUDIT',
    revenue: 'PRICING CONTROL',
  }
  const zoneLabels = {}
  Object.entries(zPos).forEach(([id, pos]) => {
    const sprite = makeTextSprite(labelText[id], {
      w: 560,
      h: 120,
      font: '700 46px Arial, sans-serif',
    })
    sprite.position.set(pos.x, 6.4, pos.z)
    sprite.scale.set(3.0, 0.64, 1)
    sprite.visible = false
    zoneLabels[id] = sprite
  })

  const fixedZones = new Set()
  let pulseOpenId = null
  let challengePulseId = null

  // Snapshot every prop the fixes mutate so the mission can be replayed.
  const resettableMeshes = [
    untaggedCarton,
    trolleyBox,
    clearedShelf,
    scanScreen,
    ...registerScreens,
    ...registerHousings,
    miscSign,
    ...aisleCartons,
    unmarkedCarton,
    ...priceBars,
    ...priceCards,
    ...queuePeople,
  ]
  const snapshots = resettableMeshes.map((m) => ({
    mesh: m,
    material: m.material,
    emissiveHex: m.material?.emissive ? m.material.emissive.getHex() : null,
    emissiveIntensity: m.material?.emissiveIntensity ?? null,
    position: m.position.clone(),
    scale: m.scale.clone(),
    visible: m.visible,
  }))

  function applyZoneFix(zoneId) {
    if (fixedZones.has(zoneId)) return
    fixedZones.add(zoneId)
    if (zoneId === 'delivery') {
      untaggedCarton.material = mats.cardboardOk
      trolleyBox.material = mats.cardboardOk
      clearedShelf.material = mats.cardboardOk
      scanScreen.material.emissive.setHex(0x22c55e)
      scanScreen.material.emissiveIntensity = 1.1
    }
    if (zoneId === 'register') {
      registerScreens.forEach((screen) => {
        screen.material = screenOk
      })
      registerHousings.forEach((housing) => {
        housing.material = mats.dark
      })
    }
    if (zoneId === 'queue') {
      miscSign.material = mats.turquoise
      queuePeople.forEach((p, i) => {
        p.position.z = 14.2 + (i % 2) * 0.25
        p.position.x = 12.8 + i * 1.35
        p.visible = i < 2
      })
    }
    if (zoneId === 'aisles') {
      aisleCartons.forEach((c) => {
        c.material = mats.cardboardOk
      })
      unmarkedCarton.material = mats.cardboardOk
    }
    if (zoneId === 'revenue') {
      const targets = [
        { h: 0.8, oldH: 1.6, mat: mats.yellow },
        { h: 1.3, oldH: 1.2, mat: mats.green },
        { h: 1.8, oldH: 0.6, mat: mats.green },
      ]
      priceBars.forEach((bar, i) => {
        const t = targets[i]
        bar.scale.y = t.h / t.oldH
        bar.position.y = 1.0 + t.h / 2
        bar.material = t.mat
      })
      priceCards.forEach((card) => {
        card.material = mats.green
      })
    }
  }

  function markChallengeFound(zoneId) {
    challengePulseId = null
    beacon.visible = false
    beaconLabel.visible = false
    const prop = challengeProps[zoneId]
    if (!prop) return
    prop.scale.setScalar(1.12)
    if (prop.material?.emissive) {
      prop.material.emissiveIntensity = Math.max(prop.material.emissiveIntensity || 0, 0.6)
    }
  }

  return {
    scene,
    root,
    zPos,
    hitMeshes,
    hitList: Object.values(hitMeshes),
    challengeHits,
    markers,
    mats,
    trolley,
    trolleyBox,
    applyZoneFix,
    markChallengeFound,
    resetZones() {
      fixedZones.clear()
      challengePulseId = null
      beacon.visible = false
      beaconLabel.visible = false
      snapshots.forEach((s) => {
        s.mesh.material = s.material
        if (s.emissiveHex != null && s.mesh.material?.emissive) {
          s.mesh.material.emissive.setHex(s.emissiveHex)
          s.mesh.material.emissiveIntensity = s.emissiveIntensity
        }
        s.mesh.position.copy(s.position)
        s.mesh.scale.copy(s.scale)
        s.mesh.visible = s.visible
      })
    },
    nudgeBeacon() {
      // A quick pop to draw the eye back to the correct target on a miss.
      beaconCone.scale.setScalar(1.6)
      beaconRing.scale.setScalar(1.5)
    },
    tick(dt) {
      if (beaconCone.scale.x > 1) {
        const s = Math.max(1, beaconCone.scale.x - dt * 2.2)
        beaconCone.scale.setScalar(s)
        beaconRing.scale.setScalar(Math.max(1, beaconRing.scale.x - dt * 2.2))
      }
      Object.entries(markers).forEach(([id, { ring }]) => {
        if (!ring.visible) return
        if (id === pulseOpenId) {
          const pulse = 1 + Math.sin(performance.now() * 0.005) * 0.12
          ring.scale.setScalar(pulse)
          ring.material.emissiveIntensity = 0.45 + Math.sin(performance.now() * 0.005) * 0.25
          ring.rotation.z += dt * 1.1
        } else {
          ring.rotation.z += dt * 0.35
        }
      })
      if (challengePulseId) {
        const prop = challengeProps[challengePulseId]
        if (prop) {
          const s = 1 + Math.sin(performance.now() * 0.008) * 0.08
          prop.scale.setScalar(s)
        }
      }
      if (beacon.visible) {
        const t = performance.now() * 0.004
        beacon.position.y = beaconBaseY + Math.sin(t) * 0.18
        beaconRing.rotation.z += dt * 2.2
        beaconLabel.position.y = beacon.position.y + 0.78
      }
      if (tapHint.visible) {
        tapHint.position.y = 2.35 + Math.sin(performance.now() * 0.003) * 0.12
      }
    },
    setMarkerColor(id, hex) {
      const marker = markers[id]
      if (!marker) return
      marker.ring.material.color.setHex(hex)
      marker.ring.material.emissive.setHex(hex)
      marker.pad.material.color.setHex(hex)
    },
    syncMarkers({ solved, selected, nextOpenId }) {
      pulseOpenId = selected ? null : nextOpenId
      const showSceneLabel = !window.matchMedia('(max-width: 720px)').matches
      Object.entries(markers).forEach(([id, marker]) => {
        const done = solved.has(id)
        const isNext = id === nextOpenId
        const locked = !done && !isNext
        const show = done || isNext
        marker.ring.visible = show
        marker.pad.visible = show
        if (done) {
          marker.ring.scale.setScalar(0.72)
          marker.pad.material.opacity = 0.22
          marker.ring.material.emissiveIntensity = 0.35
        } else if (isNext && !selected) {
          marker.pad.material.opacity = 0.3
        } else if (selected === id) {
          marker.ring.scale.setScalar(1.08)
          marker.pad.material.opacity = 0.28
          marker.ring.material.emissiveIntensity = 0.55
        } else {
          marker.ring.scale.setScalar(1)
          marker.pad.material.opacity = 0.12
          marker.ring.material.emissiveIntensity = 0.2
        }
        if (locked) {
          marker.ring.visible = false
          marker.pad.visible = false
        }
      })
      Object.entries(zoneLabels).forEach(([zoneId, label]) => {
        label.visible = showSceneLabel && zoneId === selected
      })
      if (!selected && nextOpenId && zPos[nextOpenId]) {
        const p = zPos[nextOpenId]
        tapHint.position.set(p.x, 2.35, p.z)
        tapHint.visible = true
      } else {
        tapHint.visible = false
      }
    },
    setChallengePulse(zoneId) {
      challengePulseId = zoneId
      const prop = zoneId ? challengeProps[zoneId] : null
      if (prop) {
        const p = prop.position
        beaconBaseY = p.y + 1.25
        beacon.position.set(p.x, beaconBaseY, p.z)
        beaconLabel.position.set(p.x, beaconBaseY + 0.78, p.z)
        beacon.visible = true
        beaconLabel.visible = true
      } else {
        beacon.visible = false
        beaconLabel.visible = false
      }
    },
    setActiveZone(id) {
      // Kept for main.js compatibility; syncMarkers owns visibility.
      Object.entries(zoneLabels).forEach(([zoneId, label]) => {
        const showSceneLabel = !window.matchMedia('(max-width: 720px)').matches
        label.visible = showSceneLabel && zoneId === id
      })
    },
  }
}
