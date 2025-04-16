import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { cameraConfig } from '../config/cameraConfig'
import { CubeManager } from './cubeManager'
import { cubeConfig } from '../config/cubeConfig'
import { SceneStateManager } from './SceneStateManager'
import { SceneMode } from '../config/modeConfig'
import { selectedMaterial_Hinge, preMaterial_Hinge } from '../config/materials'

export class CameraControls extends OrbitControls {
  constructor(camera, domElement, scene) {
    super(camera, domElement)
    this.scene = scene
    this.camera = camera
    this.cubeManager = new CubeManager(scene)
    this.sceneStateManager = new SceneStateManager(this.cubeManager)
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()
    this.currentMode = SceneMode.CREATE
    this.keys = {}
    this.moveSpeed = cameraConfig.controls.moveSpeed
    this.rotateSpeed = cameraConfig.controls.rotateSpeed
    this.currentLayer = 0  // 当前层级
    this.layerHeight = 4   // 每层高度

    // 预览立方体相关
    this.previewCube = null
    this.initPreviewCube()

    // 选中的立方体
    this.selectedCubes = []
    this.selectedMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.5,
    })
    this.originalMaterials = new Map()

    // 铰接点相关
    this.hingePoints = []  // 存储所有铰接点
    this.hingeGeometry = new THREE.SphereGeometry(0.5, 32, 32)
    this.hingeMaterial = preMaterial_Hinge
    this.selectedHingePoints = []  // 存储选中的铰接点

    this.initEventListeners()
    this.loadSavedScene()
  }

  loadSavedScene() {
    if (this.sceneStateManager.hasSavedState()) {
      this.sceneStateManager.loadSceneState()
    }
  }

  initPreviewCube() {
    const geometry = new THREE.BoxGeometry(cubeConfig.size, cubeConfig.size, cubeConfig.size)
    const material = new THREE.MeshStandardMaterial({
      color: 0x20B2AA, // 浅海绿色，更接近图片中的颜色
      transparent: true,
      opacity: 0.5
    })
    this.previewCube = new THREE.Mesh(geometry, material)
    this.previewCube.visible = false
    this.scene.add(this.previewCube)
  }

  initEventListeners() {
    // 鼠标事件
    this.domElement.addEventListener('mousedown', (event) => {
      const isCtrlPressed = event.ctrlKey || event.metaKey
      
      // 如果不是Ctrl/Command键按下，不处理
      if (!isCtrlPressed) return

      // 计算鼠标在归一化设备坐标中的位置
      const rect = this.domElement.getBoundingClientRect()
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      // 更新射线
      this.raycaster.setFromCamera(this.mouse, this.camera)

      // 根据按钮类型处理点击事件
      if (event.button === 0) { // 左键
        this.handleLeftClick(event)
      } else if (event.button === 2) { // 右键
        this.handleRightClick(event)
      }
    })

    // 键盘事件
    this.keys = {
      w: false,
      a: false,
      s: false,
      d: false,
      space: false,
      shift: false,
      up: false,
      down: false
    }

    window.addEventListener('keydown', (event) => {
      switch(event.key.toLowerCase()) {
        case 'w': this.keys.w = true; break
        case 'a': this.keys.a = true; break
        case 's': this.keys.s = true; break
        case 'd': this.keys.d = true; break
        case ' ': this.keys.space = true; break
        case 'shift': this.keys.shift = true; break
        case 'arrowup': 
          this.keys.up = true
          if (this.currentMode === SceneMode.CREATE) {
            this.currentLayer++
            console.log('Current layer:', this.currentLayer)
          }
          break
        case 'arrowdown': 
          this.keys.down = true
          if (this.currentMode === SceneMode.CREATE) {
            this.currentLayer = Math.max(0, this.currentLayer - 1)
            console.log('Current layer:', this.currentLayer)
          }
          break
      }
    })

    window.addEventListener('keyup', (event) => {
      switch(event.key.toLowerCase()) {
        case 'w': this.keys.w = false; break
        case 'a': this.keys.a = false; break
        case 's': this.keys.s = false; break
        case 'd': this.keys.d = false; break
        case ' ': this.keys.space = false; break
        case 'shift': this.keys.shift = false; break
        case 'arrowup': this.keys.up = false; break
        case 'arrowdown': this.keys.down = false; break
      }
    })

    // 鼠标移动事件
    this.domElement.addEventListener('mousemove', (event) => {
      // 计算鼠标在归一化设备坐标中的位置
      const rect = this.domElement.getBoundingClientRect()
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      // 更新射线
      this.raycaster.setFromCamera(this.mouse, this.camera)

      // 处理铰接点的悬停效果
      this.handleHingePointHover()
    })

    // 鼠标离开画布时隐藏预览立方体
    this.domElement.addEventListener('mouseleave', () => {
      if (this.previewCube) {
        this.previewCube.visible = false
      }
    })

    // 鼠标抬起事件
    this.domElement.addEventListener('mouseup', () => {
      this.enabled = true
    })

    // 添加动画循环
    this.animate()
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this))
    
    // 处理键盘控制
    const moveSpeed = 0.1
    if (this.keys.w) this.camera.position.z -= moveSpeed
    if (this.keys.s) this.camera.position.z += moveSpeed
    if (this.keys.a) this.camera.position.x -= moveSpeed
    if (this.keys.d) this.camera.position.x += moveSpeed
    if (this.keys.space) this.camera.position.y += moveSpeed
    if (this.keys.shift) this.camera.position.y -= moveSpeed

    // 更新控制器
    this.update()
  }

  // 检查两个立方体是否相邻
  areCubesAdjacent(cube1, cube2) {
    const gridSize = 4  // 网格大小
    const pos1 = cube1.position
    const pos2 = cube2.position
    
    // 计算两个立方体中心点之间的距离
    const dx = Math.abs(pos1.x - pos2.x)
    const dy = Math.abs(pos1.y - pos2.y)
    const dz = Math.abs(pos1.z - pos2.z)
    
    // 如果两个立方体在同一水平面上（y坐标相同）
    // 且它们在x或z方向上相邻（相差一个网格大小）
    // 另一个方向上重合（相差为0）
    return dy === 0 && (
      (dx === gridSize && dz === 0) ||
      (dx === 0 && dz === gridSize)
    )
  }

  // 创建铰接点
  createHingePoints() {
    if (this.selectedCubes.length !== 2) return

    const cube1 = this.selectedCubes[0]
    const cube2 = this.selectedCubes[1]
    
    // 检查是否已经存在这些立方体之间的铰接点
    const existingHinges = this.hingePoints.filter(point => 
      point.userData.connectedCubes.includes(cube1) && 
      point.userData.connectedCubes.includes(cube2)
    )

    if (existingHinges.length > 0) {
      // 如果已存在铰接点，只更新它们的可见性
      existingHinges.forEach(hinge => {
        hinge.visible = this.currentMode === SceneMode.HINGE
      })
      return
    }
    
    // 确定两个立方体的相对位置
    const dx = cube2.position.x - cube1.position.x
    const dz = cube2.position.z - cube1.position.z
    
    const hingePositions = []
    const gridSize = 4 // 网格大小
    const cubeSize = 4 // 立方体大小

    if (dx !== 0) {
      // 立方体在X轴方向相邻
      const x = cube1.position.x + dx / 2  // 交接面的x坐标
      const z = cube1.position.z          // 中心z坐标
      const y = cube1.position.y          // 中心y坐标
      
      // 创建四条边的铰接点
      hingePositions.push(new THREE.Vector3(x, y, z + cubeSize/2))
      hingePositions.push(new THREE.Vector3(x, y, z - cubeSize/2))
      hingePositions.push(new THREE.Vector3(x, y + cubeSize/2, z))
      hingePositions.push(new THREE.Vector3(x, y - cubeSize/2, z))
    } else if (dz !== 0) {
      // 立方体在Z轴方向相邻
      const x = cube1.position.x          // 中心x坐标
      const z = cube1.position.z + dz / 2  // 交接面的z坐标
      const y = cube1.position.y          // 中心y坐标
      
      // 创建四条边的铰接点
      hingePositions.push(new THREE.Vector3(x - cubeSize/2, y, z))
      hingePositions.push(new THREE.Vector3(x + cubeSize/2, y, z))
      hingePositions.push(new THREE.Vector3(x, y + cubeSize/2, z))
      hingePositions.push(new THREE.Vector3(x, y - cubeSize/2, z))
    }

    // 创建新的铰接点
    hingePositions.forEach(position => {
      const hingePoint = new THREE.Mesh(this.hingeGeometry, this.hingeMaterial)
      hingePoint.position.copy(position)
      hingePoint.userData = {
        isHingePoint: true,
        status: false,
        connectedCubes: [cube1, cube2]
      }
      hingePoint.visible = this.currentMode === SceneMode.HINGE
      this.scene.add(hingePoint)
      this.hingePoints.push(hingePoint)
    })
  }

  // 清除所有选中状态
  clearSelection() {
    // 清除立方体选中状态
    this.selectedCubes.forEach(cube => {
      if (this.originalMaterials.has(cube.uuid)) {
        cube.material = this.originalMaterials.get(cube.uuid)
        this.originalMaterials.delete(cube.uuid)
      }
    })
    this.selectedCubes = []
    
    // 清除铰接点选中状态
    this.selectedHingePoints.forEach(point => {
      point.material = preMaterial_Hinge
      point.userData.status = false
    })
    this.selectedHingePoints = []
  }

  handleLeftClick(event) {
    const isCtrlPressed = event.ctrlKey || event.metaKey
    if (!isCtrlPressed) return

    // 检查是否点击到铰接点
    const intersectedPoint = this.checkHingePointIntersection()
    if (intersectedPoint) {
      // 如果点击已选中的铰接点，取消选中
      const index = this.selectedHingePoints.indexOf(intersectedPoint)
      if (index !== -1) {
        intersectedPoint.material = preMaterial_Hinge
        intersectedPoint.userData.status = false
        this.selectedHingePoints.splice(index, 1)
        this.saveHingeState()  // 保存状态
      } else {
        // 如果未达到最大选中数量，添加新的选中点
        if (this.selectedHingePoints.length < 4) {
          this.selectedHingePoints.push(intersectedPoint)
          intersectedPoint.material = selectedMaterial_Hinge
          intersectedPoint.userData.status = true
          this.saveHingeState()  // 保存状态
        } else {
          console.log('最多只能选择4个铰接点')
        }
      }
      event.stopPropagation()
      return
    }

    // 检查是否点击到控制圆锥体
    const cones = this.cubeManager.coneControlArray
    const coneIntersects = this.raycaster.intersectObjects(cones)
    if (coneIntersects.length > 0) {
      const clickedCone = coneIntersects[0].object
      clickedCone.material = selectedMaterial_Hinge
      // TODO: 处理控制圆锥体的点击事件
      event.stopPropagation()
      return
    }

    // 获取所有立方体，用于检查交点
    const cubes = this.cubeManager.getAllCubes()
    const intersects = this.raycaster.intersectObjects(cubes)
    
    if (this.currentMode === SceneMode.CREATE) {
      // 创建模式下的逻辑
      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 0.5, 0), 0)
      const intersection = new THREE.Vector3()
      
      if (this.raycaster.ray.intersectPlane(groundPlane, intersection)) {
        const gridSize = 4
        intersection.x = Math.floor(intersection.x / gridSize) * gridSize + gridSize / 2
        intersection.y = -3 + (this.currentLayer * this.layerHeight)  // 根据当前层级计算Y轴位置
        intersection.z = Math.floor(intersection.z / gridSize) * gridSize + gridSize / 2

        // 检查该位置是否已有立方体
        const existingCube = this.cubeManager.getCubeAtPosition(intersection)
        if (!existingCube) {
          const newCube = this.cubeManager.createCube(intersection)
          this.saveHingeState()
        }
      }
    } else if (this.currentMode === SceneMode.HINGE) {
      // 铰接模式下的选择逻辑
      if (intersects.length > 0) {
        const clickedCube = intersects[0].object

        // 如果点击已选中的立方体，取消选中
        if (this.selectedCubes.includes(clickedCube)) {
          // 恢复原始材质
          clickedCube.material = this.originalMaterials.get(clickedCube.uuid)
          this.originalMaterials.delete(clickedCube.uuid)
          // 从选中列表中移除
          this.selectedCubes = this.selectedCubes.filter(cube => cube !== clickedCube)
          // 清除控制圆锥体
          this.cubeManager.clearControlCones()
          // 保存状态
          this.saveHingeState()
          return
        }

        // 如果已经选中了两个立方体，清除所有选中
        if (this.selectedCubes.length >= 2) {
          this.clearSelection()
          return
        }

        // 如果是第二个选中的立方体，检查是否与第一个相邻
        if (this.selectedCubes.length === 1) {
          if (!this.areCubesAdjacent(this.selectedCubes[0], clickedCube)) {
            console.log('只能选择相邻的立方体')
            return
          }
        }

        // 保存原始材质并应用选中材质
        this.originalMaterials.set(clickedCube.uuid, clickedCube.material)
        clickedCube.material = this.selectedMaterial
        this.selectedCubes.push(clickedCube)

        // 如果选中了两个立方体，创建铰接点
        if (this.selectedCubes.length === 2) {
          this.createHingePoints()
          // 恢复之前选中的铰接点状态
          this.hingePoints.forEach(point => {
            if (point.userData.status) {
              point.material = selectedMaterial_Hinge
              this.selectedHingePoints.push(point)
            }
          })
        } else {
          // 如果只选中一个立方体，显示控制圆锥体
          this.cubeManager.createControlCones(clickedCube.position)
        }
        // 保存状态
        this.saveHingeState()
      }
    } else if (this.currentMode === SceneMode.DEMO) {
      // 演示模式下的选择逻辑
      if (intersects.length > 0) {
        const clickedCube = intersects[0].object

        // 如果点击已选中的立方体，取消选中
        if (this.selectedCubes.includes(clickedCube)) {
          // 恢复原始材质
          clickedCube.material = this.originalMaterials.get(clickedCube.uuid)
          this.originalMaterials.delete(clickedCube.uuid)
          // 从选中列表中移除
          this.selectedCubes = this.selectedCubes.filter(cube => cube !== clickedCube)
          // 清除控制圆锥体
          this.cubeManager.clearControlCones()
          // 保存状态
          this.saveHingeState()
          return
        }

        // 如果已经选中了两个立方体，清除所有选中
        if (this.selectedCubes.length >= 2) {
          this.clearSelection()
          return
        }

        // 保存原始材质并应用选中材质
        this.originalMaterials.set(clickedCube.uuid, clickedCube.material)
        clickedCube.material = this.selectedMaterial
        this.selectedCubes.push(clickedCube)

        // 显示控制圆锥体
        this.cubeManager.createControlCones(clickedCube.position)
        // 保存状态
        this.saveHingeState()
      }
    }
  }

  handleRightClick(event) {
    const isCtrlPressed = event.ctrlKey || event.metaKey
    if (!isCtrlPressed) return

    if (this.currentMode === SceneMode.CREATE) {
      // 创建模式下的删除逻辑
      const cubes = this.cubeManager.getAllCubes()
      const intersects = this.raycaster.intersectObjects(cubes)

      if (intersects.length > 0) {
        this.cubeManager.removeCube(intersects[0].object)
        this.sceneStateManager.autoSave()
      }
    }
  }

  update() {
    // 更新控制器
    super.update()

    // 处理键盘移动
    const direction = new THREE.Vector3()

    // 前后移动 (Z轴)
    if (this.keys.w) {
      direction.z -= this.moveSpeed
    }
    if (this.keys.s) {
      direction.z += this.moveSpeed
    }

    // 左右移动 (X轴)
    if (this.keys.a) {
      direction.x -= this.moveSpeed
    }
    if (this.keys.d) {
      direction.x += this.moveSpeed
    }

    // 上下移动 (Y轴)
    if (this.keys.space) {
      direction.y += this.moveSpeed
    }
    if (this.keys.shift) {
      direction.y -= this.moveSpeed
    }

    // 根据相机旋转角度调整移动方向
    const cameraRotation = new THREE.Euler(0, this.object.rotation.y, 0)
    direction.applyEuler(cameraRotation)

    // 应用移动
    this.object.position.add(direction)
  }

  dispose() {
    window.removeEventListener('keydown', this.handleKeyDown)
    window.removeEventListener('keyup', this.handleKeyUp)
    if (this.previewCube) {
      this.scene.remove(this.previewCube)
      this.previewCube.geometry.dispose()
      this.previewCube.material.dispose()
    }
    if (this.selectedMaterial) {
      this.selectedMaterial.dispose()
    }
    if (this.hingeMaterial) {
      this.hingeMaterial.dispose()
    }
    this.clearSelection()
    super.dispose()
    this.cubeManager.clearAllCubes()
  }

  setMode(mode) {
    this.currentMode = mode
    
    // 在非创建模式下隐藏预览立方体
    if (mode !== SceneMode.CREATE && this.previewCube) {
      this.previewCube.visible = false
    }

    // 设置铰接点的可见性
    this.hingePoints.forEach(point => {
      point.visible = mode === SceneMode.HINGE
    })
  }

  getMode() {
    return this.currentMode
  }

  checkHingePointIntersection() {
    const intersects = this.raycaster.intersectObjects(this.hingePoints)
    return intersects.length > 0 ? intersects[0].object : null
  }

  // 保存铰接状态
  saveHingeState() {
    const state = {
      selectedCubes: this.selectedCubes,
      selectedHinges: this.selectedHingePoints
    }
    this.sceneStateManager.saveSceneState(state)
  }

  // 处理铰接点的鼠标移入事件
  handleHingePointHover() {
    if (this.currentMode !== SceneMode.HINGE) return

    const intersectedPoint = this.checkHingePointIntersection()
    
    // 重置所有未选中铰接点为预览材质
    this.hingePoints.forEach(point => {
      if (!this.selectedHingePoints.includes(point)) {
        point.material = preMaterial_Hinge
      }
    })

    // 如果鼠标悬停在铰接点上，且该点未被选中，显示预览效果
    if (intersectedPoint && !this.selectedHingePoints.includes(intersectedPoint)) {
      intersectedPoint.material = preMaterial_Hinge
    }
  }
} 