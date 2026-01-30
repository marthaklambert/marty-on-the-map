"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Line, OrbitControls } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const GEOJSON_URL =
  "https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson";

interface GeoJSONFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: number[][][] | number[][][][];
  };
  properties: {
    ADMIN: string;
  };
}

interface GeoJSON {
  type: string;
  features: GeoJSONFeature[];
}

function latLonToVector3(
  lat: number,
  lon: number,
  radius: number
): [number, number, number] {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;

  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  return [x, y, z];
}

function createLineFromCoordinates(
  coordinates: number[][],
  radius: number
): [number, number, number][] {
  return coordinates.map(([lon, lat]) => latLonToVector3(lat, lon, radius));
}

function generateGraticuleLines(
  radius: number,
  latStep: number = 30,
  lonStep: number = 30
): [number, number, number][][] {
  const lines: [number, number, number][][] = [];

  // Latitude lines (parallels)
  for (let lat = -90 + latStep; lat < 90; lat += latStep) {
    const points: [number, number, number][] = [];
    for (let lon = -180; lon <= 180; lon += 5) {
      points.push(latLonToVector3(lat, lon, radius));
    }
    lines.push(points);
  }

  // Longitude lines (meridians)
  for (let lon = -180; lon < 180; lon += lonStep) {
    const points: [number, number, number][] = [];
    for (let lat = -90; lat <= 90; lat += 5) {
      points.push(latLonToVector3(lat, lon, radius));
    }
    lines.push(points);
  }

  return lines;
}

function CountryBorders({ geoJSON }: { geoJSON: GeoJSON }) {
  const groupRef = useRef<THREE.Group>(null);
  const radius = 2;
  const graticuleLines = generateGraticuleLines(radius, 30, 30);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.1;
    }
  });

  const lines: [number, number, number][][] = [];

  geoJSON.features.forEach((feature) => {
    const { geometry } = feature;

    if (geometry.type === "Polygon") {
      const coords = geometry.coordinates as number[][][];
      coords.forEach((ring) => {
        lines.push(createLineFromCoordinates(ring, radius));
      });
    } else if (geometry.type === "MultiPolygon") {
      const multiCoords = geometry.coordinates as number[][][][];
      multiCoords.forEach((polygon) => {
        polygon.forEach((ring) => {
          lines.push(createLineFromCoordinates(ring, radius));
        });
      });
    }
  });

  return (
    <group ref={groupRef}>
      {/* Graticule lines (atlas grid) */}
      {graticuleLines.map((linePoints, index) => (
        <Line
          key={`graticule-${index}`}
          points={linePoints}
          color="#cccccc"
          lineWidth={1}
        />
      ))}
      {/* Country borders */}
      {lines.map((linePoints, index) => (
        <Line
          key={`country-${index}`}
          points={linePoints}
          color="black"
          lineWidth={2}
        />
      ))}
    </group>
  );
}

function Globe() {
  const [geoJSON, setGeoJSON] = useState<GeoJSON | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(GEOJSON_URL)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch GeoJSON");
        return res.json();
      })
      .then((data) => {
        setGeoJSON(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <mesh>
        <sphereGeometry args={[2, 32, 32]} />
        <meshBasicMaterial color="#f0f0f0" wireframe />
      </mesh>
    );
  }

  if (error || !geoJSON) {
    return (
      <mesh>
        <sphereGeometry args={[2, 32, 32]} />
        <meshBasicMaterial color="#ff0000" wireframe />
      </mesh>
    );
  }

  return <CountryBorders geoJSON={geoJSON} />;
}

export default function WorldMap() {
  return (
    <div className="w-full h-screen bg-white">
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        <Globe />
        <OrbitControls enablePan={false} />
      </Canvas>
    </div>
  );
}
