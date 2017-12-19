import * as THREE from 'three';

export default class Player {
  constructor(camera) {
    this.camera = camera;
    this.mesh = (new THREE.Mesh(new THREE.SphereGeometry(2, 32, 32), new THREE.MeshBasicMaterial({color: 0x00aaff, visible: true}))).add(camera);
    this.position = this.mesh.position;
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.rotation = this.mesh.rotation;
    this.cRotation = this.camera.rotation;
    this.direction = this.camera.getWorldDirection();
  }  
}