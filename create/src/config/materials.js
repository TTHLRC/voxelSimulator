import * as THREE from 'three'

//hinge预览时的材质
export const preMaterial_Hinge = new THREE.MeshStandardMaterial({
  color: 0xff0000, // 改为红色
  transparent: true,
  opacity: 0.2, // 设置透明度为0.4
})

//hinge选中后的材质
export const selectedMaterial_Hinge = new THREE.MeshStandardMaterial({
  color: 0xff0000, // 红色
  transparent: true,
  opacity: 0.9, // 设置透明度为0.9
})

export const normalMaterial_Cone = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.5
})

// 其他材质配置... 