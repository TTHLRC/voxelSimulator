import * as THREE from 'three'
import { sceneConfig } from '../config/sceneConfig'
import { lightConfig } from '../config/lightConfig'
import { groundConfig } from '../config/groundConfig'
import { helperConfig } from '../config/helperConfig'
import { cameraConfig } from '../config/cameraConfig'
import { CameraControls } from './cameraControls'
import { SceneMode } from '../config/modeConfig'

export class SceneUtils {
  constructor(container) {
    this.container = container
    this.scene = null
    this.camera = null
    this.renderer = null
    this.cameraControls = null
    this.gridHelper = null
    this.ground = null
    this.currentMode = SceneMode.CREATE  // 默认模式
    this.annotationLines = []  // 存储标注线
  }

  // 创建标注线
  createAnnotationLine(startPoint, endPoint) {
    const material = new THREE.LineBasicMaterial({
      color: annotationConfig.line.color,
      linewidth: annotationConfig.line.linewidth,
      transparent: true,
      opacity: annotationConfig.line.opacity
    })

    const geometry = new THREE.BufferGeometry().setFromPoints([startPoint, endPoint])
    const line = new THREE.Line(geometry, material)
    
    this.scene.add(line)
    this.annotationLines.push(line)
    
    return line
  }

  // 清除所有标注线
  clearAnnotationLines() {
    this.annotationLines.forEach(line => {
      this.scene.remove(line)
      line.geometry.dispose()
      line.material.dispose()
    })
    this.annotationLines = []
  }

  // 为两个立方体之间创建标注线
  createCubeConnectionLines(cube1, cube2) {
    // 获取两个立方体的位置
    const pos1 = cube1.position
    const pos2 = cube2.position

    // 确定是X轴还是Z轴方向的连接
    const dx = Math.abs(pos2.x - pos1.x)
    const dz = Math.abs(pos2.z - pos1.z)

    const cubeSize = 4  // 立方体大小
    const offset = cubeSize / 2  // 偏移量

    if (dx > dz) {
      // X轴方向的连接
      const x = (pos1.x + pos2.x) / 2
      const y = pos1.y
      const z = pos1.z

      // 创建四条连接线
      this.createAnnotationLine(
        new THREE.Vector3(x, y + offset, z + offset),
        new THREE.Vector3(x, y + offset, z - offset)
      )
      this.createAnnotationLine(
        new THREE.Vector3(x, y - offset, z + offset),
        new THREE.Vector3(x, y - offset, z - offset)
      )
      this.createAnnotationLine(
        new THREE.Vector3(x, y + offset, z + offset),
        new THREE.Vector3(x, y - offset, z + offset)
      )
      this.createAnnotationLine(
        new THREE.Vector3(x, y + offset, z - offset),
        new THREE.Vector3(x, y - offset, z - offset)
      )
    } else {
      // Z轴方向的连接
      const x = pos1.x
      const y = pos1.y
      const z = (pos1.z + pos2.z) / 2

      // 创建四条连接线
      this.createAnnotationLine(
        new THREE.Vector3(x + offset, y + offset, z),
        new THREE.Vector3(x - offset, y + offset, z)
      )
      this.createAnnotationLine(
        new THREE.Vector3(x + offset, y - offset, z),
        new THREE.Vector3(x - offset, y - offset, z)
      )
      this.createAnnotationLine(
        new THREE.Vector3(x + offset, y + offset, z),
        new THREE.Vector3(x + offset, y - offset, z)
      )
      this.createAnnotationLine(
        new THREE.Vector3(x - offset, y + offset, z),
        new THREE.Vector3(x - offset, y - offset, z)
      )
    }
  }

  // 更新标注线
  updateAnnotationLines() {
    // 清除现有的标注线
    this.clearAnnotationLines()

    // 获取当前选中的立方体
    const selectedCubes = this.cameraControls.selectedCubes
    if (selectedCubes.length === 2) {
      this.createCubeConnectionLines(selectedCubes[0], selectedCubes[1])
    }
  }

  // 获取cubeManager实例
  getCubeManager() {
    return this.cameraControls ? this.cameraControls.cubeManager : null
  }

  // 控制网格显示
  setGridVisible(visible) {
    if (this.gridHelper) {
      this.gridHelper.visible = visible
    }
  }

  // 控制地板显示
  setGroundVisible(visible) {
    if (this.ground) {
      this.ground.visible = visible
    }
  }

  // 设置场景模式
  setSceneMode(mode) {
    this.currentMode = mode
    if (this.cameraControls) {
      this.cameraControls.setMode(mode)

      // 在演示模式下隐藏网格和地板
      if (mode === SceneMode.DEMO) {
        this.setGridVisible(false)
        this.setGroundVisible(false)
      } else {
        // 在其他模式下显示网格和地板
        this.setGridVisible(true)
        this.setGroundVisible(true)
      }
    }
  }

  initScene() {
    // 创建场景
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color('#000000')

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(
      cameraConfig.perspective.fov,
      window.innerWidth / window.innerHeight,
      cameraConfig.perspective.near,
      cameraConfig.perspective.far
    )
    this.camera.position.set(
      cameraConfig.perspective.position.x,
      cameraConfig.perspective.position.y,
      cameraConfig.perspective.position.z
    )
    this.camera.lookAt(0, 0, 0)

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({ antialias: sceneConfig.renderer.antialias })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.shadowMap.enabled = sceneConfig.renderer.shadowMap.enabled
    this.renderer.shadowMap.type = THREE[sceneConfig.renderer.shadowMap.type]
    this.container.appendChild(this.renderer.domElement)

    // 初始化相机控制
    this.cameraControls = new CameraControls(this.camera, this.renderer.domElement, this.scene)
    
    // 设置初始模式
    this.cameraControls.setMode(this.currentMode)

    // 添加光照
    this.addLights()

    // 在非演示模式下添加地板和辅助线
    if (this.currentMode !== SceneMode.DEMO) {
      // 添加地板
      this.addGround()

      // 添加辅助线
      this.addHelpers()
    }

    // 开始动画循环
    this.animate()

    // 添加窗口大小调整监听
    window.addEventListener('resize', () => this.onWindowResize())
  }

  addLights() {
    // 环境光
    const ambientLight = new THREE.AmbientLight(
      lightConfig.ambient.color,
      lightConfig.ambient.intensity
    )
    this.scene.add(ambientLight)

    // 平行光
    const directionalLight = new THREE.DirectionalLight(
      lightConfig.directional.color,
      lightConfig.directional.intensity
    )
    directionalLight.position.set(
      lightConfig.directional.position.x,
      lightConfig.directional.position.y,
      lightConfig.directional.position.z
    )
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = lightConfig.directional.shadow.mapSize.width
    directionalLight.shadow.mapSize.height = lightConfig.directional.shadow.mapSize.height
    directionalLight.shadow.camera.near = lightConfig.directional.shadow.camera.near
    directionalLight.shadow.camera.far = lightConfig.directional.shadow.camera.far
    directionalLight.shadow.camera.left = lightConfig.directional.shadow.camera.left
    directionalLight.shadow.camera.right = lightConfig.directional.shadow.camera.right
    directionalLight.shadow.camera.top = lightConfig.directional.shadow.camera.top
    directionalLight.shadow.camera.bottom = lightConfig.directional.shadow.camera.bottom
    this.scene.add(directionalLight)
  }

  addGround() {
    const groundGeometry = new THREE.PlaneGeometry(
      groundConfig.size.width,
      groundConfig.size.height
    )
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: groundConfig.material.color,
      roughness: groundConfig.material.roughness,
      metalness: groundConfig.material.metalness
    })
    this.ground = new THREE.Mesh(groundGeometry, groundMaterial)
    this.ground.receiveShadow = true
    this.ground.rotation.x = groundConfig.rotation.x
    this.ground.position.set(
      groundConfig.position.x,
      groundConfig.position.y,
      groundConfig.position.z
    )
    this.scene.add(this.ground)
  }

  addHelpers() {
    // 网格辅助线
    this.gridHelper = new THREE.GridHelper(
      helperConfig.grid.size,
      helperConfig.grid.divisions,
      helperConfig.grid.colorCenterLine,
      helperConfig.grid.colorGrid
    )
    this.gridHelper.position.set(
      helperConfig.grid.position.x,
      helperConfig.grid.position.y,
      helperConfig.grid.position.z
    )
    this.scene.add(this.gridHelper)

    // 坐标轴辅助线
    const axesHelper = new THREE.AxesHelper(helperConfig.axes.size)
    axesHelper.position.set(
      helperConfig.axes.position.x,
      helperConfig.axes.position.y,
      helperConfig.axes.position.z
    )
    this.scene.add(axesHelper)
  }

  animate() {
    requestAnimationFrame(() => this.animate())
    this.cameraControls.update()
    this.renderer.render(this.scene, this.camera)
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  dispose() {
    window.removeEventListener('resize', this.onWindowResize)
    this.clearAnnotationLines()
    if (this.cameraControls) {
      this.cameraControls.dispose()
    }
    if (this.renderer) {
      this.renderer.dispose()
    }
  }
} 