import * as THREE from 'three';

exports.projection = (player, s) => {
  let MAP_SIZE = 100;
  let MAP_HEIGHT = 25;
  let PLAYER_HEIGHT = 5;

  let position = player.mesh.position.clone();
  let direction = player.camera.getWorldDirection().clone();
  let spray = s.clone();
  spray.multiplyScalar(0.02 / (MAP_SIZE / 2));
  direction.add(spray);

  const t1 = (MAP_SIZE / 2 - position.x) / direction.x;
  const t2 = (-MAP_SIZE / 2 - position.x) / direction.x;
  const t3 = (-PLAYER_HEIGHT + MAP_HEIGHT - position.y) / direction.y;
  const t4 = (-PLAYER_HEIGHT - position.y) / direction.y;
  const t5 = (MAP_SIZE / 2 - position.z) / direction.z;
  const t6 = (-MAP_SIZE / 2 - position.z) / direction.z;

  const pos = [t1, t2, t3, t4, t5, t6].filter(t => t >= 0);
  const t = Math.min(...pos);

  return position.add(direction.multiplyScalar(t));
};