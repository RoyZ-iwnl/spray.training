import * as THREE from 'three';

exports.projection = (player) => {
  let position = player.mesh.position.clone();
  let direction = player.camera.getWorldDirection().clone();
  let MAP_SIZE = 100;

  const t1 = (MAP_SIZE / 2 - position.x) / direction.x;
  const t2 = (-MAP_SIZE / 2 - position.x) / direction.x;
  const t3 = (MAP_SIZE / 2 - position.z) / direction.z;
  const t4 = (-MAP_SIZE / 2 - position.z) / direction.z;

  const pos = [t1, t2, t3, t4].filter(t => t >= 0);
  const t = Math.min(...pos);

  return position.add(direction.multiplyScalar(t));
};