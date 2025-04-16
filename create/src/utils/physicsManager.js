import * as CANNON from 'cannon-es'
import { physicsConfig } from '../config/physicsConfig'

export class PhysicsManager {
  constructor() {
    this.world = new CANNON.World()
    this.world.gravity.set(
      physicsConfig.gravity.x,
      -physicsConfig.gravity.y,  // 取反使重力向下
      physicsConfig.gravity.z
    )
    this.world.solver.iterations = physicsConfig.world.iterations
    this.world.solver.tolerance = physicsConfig.world.tolerance

    // 创建默认材质
    this.defaultMaterial = new CANNON.Material('default')
    this.defaultMaterial.friction = physicsConfig.materials.default.friction
    this.defaultMaterial.restitution = physicsConfig.materials.default.restitution

    // 创建立方体材质
    this.cubeMaterial = new CANNON.Material('cube')
    this.cubeMaterial.friction = physicsConfig.materials.cube.friction
    this.cubeMaterial.restitution = physicsConfig.materials.cube.restitution

    // 创建地面接触材质
    this.groundContactMaterial = new CANNON.ContactMaterial(
      this.defaultMaterial,
      this.cubeMaterial,
      {
        friction: 0.5,
        restitution: 0.3
      }
    )
    this.world.addContactMaterial(this.groundContactMaterial)

    // 创建地面
    this.createGround()

    console.log('Physics world initialized with gravity:', this.world.gravity)
  }

  createGround() {
    const groundShape = new CANNON.Plane()
    const groundBody = new CANNON.Body({
      mass: 0,
      material: this.defaultMaterial
    })
    groundBody.addShape(groundShape)
    // 旋转地面180度
    groundBody.quaternion.setFromAxisAngle(
      new CANNON.Vec3(1, 0, 0),
      Math.PI/2  // 旋转180度
    )
    groundBody.position.y = -2 // 设置地面位置
    this.world.addBody(groundBody)
  }

  createCubeBody(cube) {
    try {
      const size = cube.geometry.parameters.width
      const shape = new CANNON.Box(new CANNON.Vec3(size/2, size/2, size/2))
      
      const body = new CANNON.Body({
        mass: 1,
        material: this.cubeMaterial,
        position: new CANNON.Vec3(
          cube.position.x,
          cube.position.y,
          cube.position.z
        ),
        linearDamping: 0.1,
        angularDamping: 0.1,
        fixedRotation: true,
        collisionResponse: true,
        type: CANNON.Body.DYNAMIC
      })
      
      body.addShape(shape)
      
      // 重置所有物理状态
      body.velocity.set(0, 0, 0)
      body.angularVelocity.set(0, 0, 0)
      body.force.set(0, 0, 0)
      body.torque.set(0, 0, 0)
      
      this.world.addBody(body)
      return body
    } catch (error) {
      throw error
    }
  }

  update(deltaTime) {
    // 在更新前确保所有物体都是动态的
    this.world.bodies.forEach(body => {
      if (body.mass > 0) {
        body.type = CANNON.Body.DYNAMIC
      }
    })
    
    this.world.step(deltaTime)
    // 打印所有物体的位置和速度
    this.world.bodies.forEach(body => {
      if (body.mass > 0) {  // 只打印动态物体
        console.log('Body position:', body.position, 'velocity:', body.velocity)
      }
    })
  }

  syncPhysicsToGraphics(cube, body) {
    cube.position.copy(body.position)
    cube.quaternion.copy(body.quaternion)
  }

  removeBody(body) {
    this.world.removeBody(body)
  }
} 