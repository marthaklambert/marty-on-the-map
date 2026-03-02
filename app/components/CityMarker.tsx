"use client";

import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { latLonToVector3 } from '@/lib/utils';
import type { PostLocation } from '@/types/blog';

interface CityMarkerProps {
  location: PostLocation;
  onMarkerClick: (location: PostLocation, screenX: number, screenY: number) => void;
  isNewest: boolean;
}

export default function CityMarker({ location, onMarkerClick, isNewest }: CityMarkerProps) {
  const pinRef = useRef<THREE.Group>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  const pulseMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const { camera } = useThree();

  const surfacePos = latLonToVector3(location.lat, location.lon, 2.0);
  const normal = new THREE.Vector3(...surfacePos).normalize();
  const pinHeight = 0.12;

  // Deterministic random tilt per pin based on slug
  const { tiltedNormal, stickQuaternion } = useMemo(() => {
    // Simple hash from slug for consistent randomness
    let hash = 0;
    for (let i = 0; i < location.slug.length; i++) {
      hash = ((hash << 5) - hash) + location.slug.charCodeAt(i);
      hash |= 0;
    }
    const tiltAngle = (15 + (Math.abs(hash % 15))) * Math.PI / 180; // 15-30 degrees
    const tiltDirection = ((hash >>> 8) % 360) * Math.PI / 180; // random direction around normal

    // Find a tangent vector perpendicular to the normal
    const up = new THREE.Vector3(0, 1, 0);
    let tangent = new THREE.Vector3().crossVectors(normal, up).normalize();
    if (tangent.length() < 0.01) {
      tangent = new THREE.Vector3().crossVectors(normal, new THREE.Vector3(1, 0, 0)).normalize();
    }

    // Rotate tangent around normal by tiltDirection
    tangent.applyAxisAngle(normal, tiltDirection);

    // Tilt the normal by tiltAngle around the tangent
    const tilted = normal.clone().applyAxisAngle(tangent, tiltAngle);

    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), tilted);

    return { tiltedNormal: tilted, stickQuaternion: q };
  }, [location.slug, normal.x, normal.y, normal.z]);

  // Quaternion to orient flat circle on globe surface
  const surfaceQuaternion = useMemo(
    () => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal),
    [normal.x, normal.y, normal.z]
  );

  useFrame((state) => {
    const cameraDistance = camera.position.length();
    const baseScale = cameraDistance / 6;

    if (pinRef.current) {
      pinRef.current.scale.set(baseScale, baseScale, baseScale);
    }

    // Radar pulse animation for newest pin
    if (pulseRef.current && pulseMaterialRef.current && isNewest) {
      const t = (state.clock.elapsedTime * 0.5) % 1; // 0-1 cycle, 2 seconds per pulse
      const pulseScale = baseScale * (0.02 + t * 0.12); // expand from small to large
      pulseRef.current.scale.set(pulseScale, pulseScale, 1);
      pulseMaterialRef.current.opacity = 0.4 * (1 - t); // fade out as it expands
    }
  });

  return (
    <group position={surfacePos}>
      <group
        ref={pinRef}
        onClick={(e) => {
          e.stopPropagation();
          const screenX = (e.nativeEvent as MouseEvent).clientX;
          const screenY = (e.nativeEvent as MouseEvent).clientY;
          onMarkerClick(location, screenX, screenY);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          const canvas = (e.nativeEvent.target as HTMLElement);
          if (canvas) canvas.classList.add('cursor-pointer-custom');
        }}
        onPointerOut={(e) => {
          const canvas = (e.nativeEvent.target as HTMLElement);
          if (canvas) canvas.classList.remove('cursor-pointer-custom');
        }}
      >
        {/* Pin stick — thin cylinder tilted at a random angle */}
        <mesh
          position={[tiltedNormal.x * pinHeight / 2, tiltedNormal.y * pinHeight / 2, tiltedNormal.z * pinHeight / 2]}
          quaternion={stickQuaternion}
          renderOrder={10}
        >
          <cylinderGeometry args={[0.0015, 0.0015, pinHeight, 8]} />
          <meshBasicMaterial color="#666666" transparent opacity={0.99} toneMapped={false} depthTest={false} />
        </mesh>

        {/* Pin head — sphere at the top of the tilted stick */}
        <mesh
          position={[tiltedNormal.x * pinHeight, tiltedNormal.y * pinHeight, tiltedNormal.z * pinHeight]}
          renderOrder={11}
        >
          <sphereGeometry args={[0.015, 32, 32]} />
          <meshStandardMaterial
            color="#E03030"
            emissive="#E03030"
            emissiveIntensity={0.5}
            roughness={0.25}
            metalness={0.05}
            transparent
            opacity={0.99}
            toneMapped={false}
            depthTest={false}
          />
        </mesh>
      </group>

      {/* Radar pulse on globe surface for newest */}
      {isNewest && (
        <mesh
          ref={pulseRef}
          position={[normal.x * 0.005, normal.y * 0.005, normal.z * 0.005]}
          quaternion={surfaceQuaternion}
          renderOrder={5}
        >
          <ringGeometry args={[0.8, 1, 64]} />
          <meshBasicMaterial
            ref={pulseMaterialRef}
            color="#FCC0DB"
            transparent
            opacity={0.4}
            toneMapped={false}
            side={THREE.DoubleSide}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}
