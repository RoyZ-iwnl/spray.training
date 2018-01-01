import * as THREE from 'three';
import { global } from './global.js';

export default class Button {
  constructor(position, rotation, name, color, action, mesh = new THREE.Mesh(new THREE.CircleGeometry(1, 32), new THREE.MeshBasicMaterial({color: color, side: THREE.DoubleSide}))) {
    this.position = position;
    this.action = action;
    this.name = name;
    mesh.position.copy(position);
    mesh.rotation.copy(rotation);
    this.mesh = mesh;
  }
}
