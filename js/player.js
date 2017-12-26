import * as THREE from 'three';
import { global } from './global.js';

export default class Player {
  constructor(camera) {
    this.camera = camera;
    this.mesh = (new THREE.Mesh(new THREE.SphereGeometry(5, 32, 32), new THREE.MeshBasicMaterial({color: 0x00aaff, visible: false}))).add(camera);
    this.mesh.position.x = -global.MAP_SIZE / 2 + global.INITIAL_DISTANCE;
    this.mesh.position.y = global.PLAYER_HEIGHT;
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.shoot = false;
  }  
}