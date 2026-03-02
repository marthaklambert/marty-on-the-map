"use client";

import { useRef } from 'react';
import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { latLonToVector3 } from '@/lib/utils';
import type { TravelRoute } from '@/types/blog';

interface TravelRouteProps {
  route: TravelRoute;
  index: number; // For staggered animation
}

function createCurvedPath(
  from: [number, number, number],
  to: [number, number, number]
): [number, number, number][] {
  const points: [number, number, number][] = [];
  const segments = 60;

  const fromVec = new THREE.Vector3(...from);
  const toVec = new THREE.Vector3(...to);

  // Calculate distance between points to determine arc height
  const distance = fromVec.distanceTo(toVec);

  // Scale arc height based on distance
  // Short distances (like Taiwan cities): low arc
  // Long distances (like London → Taipei): high arc
  const arcHeight = Math.min(distance * 0.25, 1.2); // Max arc height of 1.2

  // Calculate midpoint and lift it above the sphere
  const midpoint = new THREE.Vector3()
    .addVectors(fromVec, toVec)
    .multiplyScalar(0.5);

  // Normalize and scale to create arc above sphere surface
  midpoint.normalize().multiplyScalar(2 + arcHeight);

  // Create quadratic bezier curve
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const t2 = t * t;
    const mt = 1 - t;
    const mt2 = mt * mt;

    // Quadratic bezier formula
    const point = new THREE.Vector3();
    point.x = mt2 * fromVec.x + 2 * mt * t * midpoint.x + t2 * toVec.x;
    point.y = mt2 * fromVec.y + 2 * mt * t * midpoint.y + t2 * toVec.y;
    point.z = mt2 * fromVec.z + 2 * mt * t * midpoint.z + t2 * toVec.z;

    points.push([point.x, point.y, point.z]);
  }

  return points;
}

export default function TravelRoute({ route, index }: TravelRouteProps) {
  const lineRef = useRef<any>(null);
  const fromPos = latLonToVector3(route.from.lat, route.from.lon, 2.01);
  const toPos = latLonToVector3(route.to.lat, route.to.lon, 2.01);

  const curvePoints = createCurvedPath(fromPos, toPos);

  // Animate the color with a ripple effect
  useFrame((state) => {
    if (lineRef.current) {
      const time = state.clock.elapsedTime;
      // Stagger animation for each route
      const offset = index * 0.5;
      const wave = Math.sin(time * 3 + offset) * 0.5 + 0.5; // 0 to 1, faster speed

      // Interpolate between base pink and bright white for dramatic shimmer
      const baseColor = new THREE.Color('#FCC0DB');
      const shineColor = new THREE.Color('#FFFFFF'); // Bright white for dramatic shimmer

      const currentColor = baseColor.clone().lerp(shineColor, wave * 0.6); // Shimmer effect
      lineRef.current.material.color = currentColor;
    }
  });

  return (
    <Line
      ref={lineRef}
      points={curvePoints}
      color="#FCC0DB"
      lineWidth={6}
      transparent={false}
      toneMapped={false}
    />
  );
}
