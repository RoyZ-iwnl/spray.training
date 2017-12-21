import * as THREE from 'three';

export default class Player {
  constructor(camera) {
    this.camera = camera;
    this.mesh = (new THREE.Mesh(new THREE.SphereGeometry(5, 32, 32), new THREE.MeshBasicMaterial({color: 0x00aaff, visible: false}))).add(camera);
    this.mesh.position.y = 5;
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.shoot = false;
  }  
}