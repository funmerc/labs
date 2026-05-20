import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

const LAYER_SIZES = [4, 8, 10, 8, 3]
const LAYER_SPACING = 5.5
const NEURON_RADIUS = 0.36
const LAYER_DISK_SCALE = 0.95
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))

const LAYER_COLORS = [
  0x4f8cff, // input
  0x8a7dff, // hidden
  0x6ad1ff, // hidden
  0x8a7dff, // hidden
  0xff9a55, // output
]

const PULSE_COLOR = 0xfff2a8
const CONN_BASE_OPACITY = 0.12
const CONN_DIM_OPACITY = 0.04
const CONN_HIGHLIGHT_OPACITY = 0.95
const PULSE_DURATION_MS = 650

export type SceneHighlight = 'overview' | 'neuron' | 'layers' | 'training'

export type NetworkScene = {
  setHighlight: (kind: SceneHighlight) => void
  runForwardPass: () => void
  destroy: () => void
}

type Neuron = {
  mesh: THREE.Mesh
  layer: number
  indexInLayer: number
  baseColor: THREE.Color
  flashUntil: number
}

type Connection = {
  line: THREE.Line
  from: Neuron
  to: Neuron
}

export function createNetworkScene(canvas: HTMLCanvasElement): NetworkScene {
  const scene = new THREE.Scene()

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200)
  camera.position.set(0, 3, 18)

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  const ambient = new THREE.AmbientLight(0xffffff, 0.55)
  const keyLight = new THREE.DirectionalLight(0xffffff, 0.8)
  keyLight.position.set(6, 10, 8)
  const fillLight = new THREE.DirectionalLight(0x88aaff, 0.3)
  fillLight.position.set(-8, -4, 4)
  scene.add(ambient, keyLight, fillLight)

  const controls = new OrbitControls(camera, canvas)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.minDistance = 8
  controls.maxDistance = 40
  controls.enablePan = true
  controls.screenSpacePanning = true
  controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.PAN,
  }

  canvas.addEventListener('contextmenu', (event) => event.preventDefault())

  const numLayers = LAYER_SIZES.length
  const neurons: Neuron[][] = []
  const sphereGeo = new THREE.SphereGeometry(NEURON_RADIUS, 24, 24)

  for (let layer = 0; layer < numLayers; layer++) {
    const size = LAYER_SIZES[layer]
    const layerNeurons: Neuron[] = []
    const xPos = (layer - (numLayers - 1) / 2) * LAYER_SPACING
    const angleOffset = layer * 0.42
    for (let i = 0; i < size; i++) {
      let yPos = 0
      let zPos = 0
      if (size > 1) {
        const angle = i * GOLDEN_ANGLE + angleOffset
        const radius = Math.sqrt((i + 0.5) / size) * Math.sqrt(size) * LAYER_DISK_SCALE
        yPos = radius * Math.cos(angle)
        zPos = radius * Math.sin(angle)
      }
      const baseColor = new THREE.Color(LAYER_COLORS[layer])
      const material = new THREE.MeshStandardMaterial({
        color: baseColor,
        emissive: baseColor.clone().multiplyScalar(0.25),
        roughness: 0.45,
        metalness: 0.15,
      })
      const mesh = new THREE.Mesh(sphereGeo, material)
      mesh.position.set(xPos, yPos, zPos)
      scene.add(mesh)
      layerNeurons.push({ mesh, layer, indexInLayer: i, baseColor, flashUntil: 0 })
    }
    neurons.push(layerNeurons)
  }

  const connections: Connection[] = []
  for (let layer = 0; layer < numLayers - 1; layer++) {
    for (const from of neurons[layer]) {
      for (const to of neurons[layer + 1]) {
        const points = [from.mesh.position.clone(), to.mesh.position.clone()]
        const geometry = new THREE.BufferGeometry().setFromPoints(points)
        const material = new THREE.LineBasicMaterial({
          color: 0xa0a0b0,
          transparent: true,
          opacity: CONN_BASE_OPACITY,
        })
        const line = new THREE.Line(geometry, material)
        scene.add(line)
        connections.push({ line, from, to })
      }
    }
  }

  const pulseGeo = new THREE.SphereGeometry(0.13, 12, 12)
  type Pulse = {
    mesh: THREE.Mesh
    from: THREE.Vector3
    to: THREE.Vector3
    target: Neuron
    startTime: number
    duration: number
  }
  const activePulses: Pulse[] = []

  type AnimationMode = 'idle' | 'forward' | 'backward' | 'focused'
  let animationMode: AnimationMode = 'idle'
  let animationStep = 0

  function spawnPulses(fromList: Neuron[], toList: Neuron[], color: number) {
    const now = performance.now()
    for (const from of fromList) {
      for (const to of toList) {
        const material = new THREE.MeshBasicMaterial({ color })
        const mesh = new THREE.Mesh(pulseGeo, material)
        mesh.position.copy(from.mesh.position)
        scene.add(mesh)
        activePulses.push({
          mesh,
          from: from.mesh.position.clone(),
          to: to.mesh.position.clone(),
          target: to,
          startTime: now,
          duration: PULSE_DURATION_MS,
        })
      }
    }
  }

  function getFocusedNeuron(): Neuron {
    const layerIdx = 2
    const layerArr = neurons[layerIdx]
    return layerArr[Math.floor(layerArr.length / 2)]
  }

  function startForwardPass() {
    if (animationMode !== 'idle') {
      return
    }
    animationMode = 'forward'
    animationStep = 0
    spawnPulses(neurons[0], neurons[1], PULSE_COLOR)
  }

  function startBackwardPass() {
    if (animationMode !== 'idle') {
      return
    }
    animationMode = 'backward'
    animationStep = numLayers - 2
    spawnPulses(neurons[animationStep + 1], neurons[animationStep], 0xff7878)
  }

  function startFocusedPass() {
    if (animationMode !== 'idle') {
      return
    }
    animationMode = 'focused'
    animationStep = 0
    const target = getFocusedNeuron()
    spawnPulses(neurons[target.layer - 1], [target], PULSE_COLOR)
  }

  function flashNeuron(neuron: Neuron) {
    neuron.flashUntil = performance.now() + 280
  }

  function resize() {
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    if (width === 0 || height === 0) {
      return
    }
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }
  resize()

  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(canvas)

  let highlightMode: SceneHighlight = 'overview'

  function resetVisuals() {
    for (const layer of neurons) {
      for (const neuron of layer) {
        const material = neuron.mesh.material as THREE.MeshStandardMaterial
        material.color.copy(neuron.baseColor)
        if (neuron.flashUntil < performance.now()) {
          material.emissive.copy(neuron.baseColor).multiplyScalar(0.25)
        }
        neuron.mesh.scale.set(1, 1, 1)
      }
    }
    for (const connection of connections) {
      const material = connection.line.material as THREE.LineBasicMaterial
      material.opacity = CONN_BASE_OPACITY
      material.color.setHex(0xa0a0b0)
    }
  }

  function applyHighlight() {
    resetVisuals()

    if (highlightMode === 'neuron') {
      const layerIdx = 2
      const layerArr = neurons[layerIdx]
      const target = layerArr[Math.floor(layerArr.length / 2)]
      target.mesh.scale.set(1.7, 1.7, 1.7)
      const targetMat = target.mesh.material as THREE.MeshStandardMaterial
      targetMat.emissive.setHex(0xffe6a0)
      for (const connection of connections) {
        const material = connection.line.material as THREE.LineBasicMaterial
        if (connection.to === target) {
          material.opacity = CONN_HIGHLIGHT_OPACITY
          material.color.setHex(0xffd566)
          connection.from.mesh.scale.set(1.25, 1.25, 1.25)
        } else {
          material.opacity = CONN_DIM_OPACITY
        }
      }
    } else if (highlightMode === 'layers') {
      for (const layer of neurons) {
        for (const neuron of layer) {
          const material = neuron.mesh.material as THREE.MeshStandardMaterial
          material.emissive.copy(neuron.baseColor).multiplyScalar(0.55)
          neuron.mesh.scale.set(1.1, 1.1, 1.1)
        }
      }
    } else if (highlightMode === 'training') {
      for (const connection of connections) {
        const material = connection.line.material as THREE.LineBasicMaterial
        const hash = (connection.from.indexInLayer * 7 + connection.to.indexInLayer * 3) % 5
        if (hash === 0) {
          material.opacity = 0.6
          material.color.setHex(0xff8888)
        } else if (hash === 1) {
          material.opacity = 0.45
          material.color.setHex(0x88ddaa)
        }
      }
    }
  }

  function setHighlight(kind: SceneHighlight) {
    highlightMode = kind
    applyHighlight()
  }

  function easeInOutCubic(time: number): number {
    if (time < 0.5) {
      return 4 * time * time * time
    }
    const inv = -2 * time + 2
    return 1 - (inv * inv * inv) / 2
  }

  let rafId = 0
  function animate() {
    const now = performance.now()
    controls.update()

    for (let index = activePulses.length - 1; index >= 0; index--) {
      const pulse = activePulses[index]
      const linear = Math.min(1, (now - pulse.startTime) / pulse.duration)
      const eased = easeInOutCubic(linear)
      pulse.mesh.position.lerpVectors(pulse.from, pulse.to, eased)
      const scale = 1 + Math.sin(linear * Math.PI) * 0.6
      pulse.mesh.scale.set(scale, scale, scale)
      if (linear >= 1) {
        scene.remove(pulse.mesh)
        ;(pulse.mesh.material as THREE.Material).dispose()
        flashNeuron(pulse.target)
        activePulses.splice(index, 1)
      }
    }

    for (const layer of neurons) {
      for (const neuron of layer) {
        if (neuron.flashUntil > now) {
          const remaining = (neuron.flashUntil - now) / 280
          const material = neuron.mesh.material as THREE.MeshStandardMaterial
          material.emissive.setRGB(1, 0.92, 0.55).multiplyScalar(remaining)
        } else if (neuron.flashUntil !== 0) {
          neuron.flashUntil = 0
          const material = neuron.mesh.material as THREE.MeshStandardMaterial
          material.emissive.copy(neuron.baseColor).multiplyScalar(highlightMode === 'layers' ? 0.55 : 0.25)
        }
      }
    }

    if (animationMode !== 'idle' && activePulses.length === 0) {
      if (animationMode === 'forward') {
        animationStep += 1
        if (animationStep >= numLayers - 1) {
          animationMode = 'idle'
        } else {
          spawnPulses(neurons[animationStep], neurons[animationStep + 1], PULSE_COLOR)
        }
      } else if (animationMode === 'backward') {
        animationStep -= 1
        if (animationStep < 0) {
          animationMode = 'idle'
        } else {
          spawnPulses(neurons[animationStep + 1], neurons[animationStep], 0xff7878)
        }
      } else if (animationMode === 'focused') {
        animationStep += 1
        const target = getFocusedNeuron()
        if (animationStep === 1) {
          spawnPulses([target], neurons[target.layer + 1], PULSE_COLOR)
        } else {
          animationMode = 'idle'
        }
      }
    }

    renderer.render(scene, camera)
    rafId = requestAnimationFrame(animate)
  }
  animate()

  function destroy() {
    cancelAnimationFrame(rafId)
    resizeObserver.disconnect()
    controls.dispose()
    for (const pulse of activePulses) {
      scene.remove(pulse.mesh)
      ;(pulse.mesh.material as THREE.Material).dispose()
    }
    activePulses.length = 0
    for (const layer of neurons) {
      for (const neuron of layer) {
        ;(neuron.mesh.material as THREE.Material).dispose()
      }
    }
    for (const connection of connections) {
      connection.line.geometry.dispose()
      ;(connection.line.material as THREE.Material).dispose()
    }
    sphereGeo.dispose()
    pulseGeo.dispose()
    renderer.dispose()
  }

  return {
    setHighlight,
    runForwardPass: () => {
      if (highlightMode === 'training') {
        startBackwardPass()
      } else if (highlightMode === 'neuron') {
        startFocusedPass()
      } else {
        startForwardPass()
      }
    },
    destroy,
  }
}
