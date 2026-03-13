"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Line, OrbitControls } from "@react-three/drei";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import * as THREE from "three";
import Link from "next/link";
import Image from "next/image";
import CityMarker from "./CityMarker";
import TravelRoute from "./TravelRoute";
import MarkerPopup from "./MarkerPopup";
import { formatDate } from "@/lib/utils";
import type { PostLocation, TravelRoute as TravelRouteType } from "@/types/blog";

const GEOJSON_URL = "/countries.geojson";

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

function CountryBorders({
  geoJSON,
  locations,
  routes,
  onMarkerClick,
  onGlobeClick
}: {
  geoJSON: GeoJSON;
  locations: PostLocation[];
  routes: TravelRouteType[];
  onMarkerClick: (location: PostLocation, screenX: number, screenY: number) => void;
  onGlobeClick: (point: THREE.Vector3) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [hasReachedTarget, setHasReachedTarget] = useState(false);
  const radius = 2;
  const graticuleLines = generateGraticuleLines(radius, 30, 30);

  // Calculate target rotation based on most recent post
  const targetRotation = useMemo(() => {
    if (locations.length === 0) return { y: 0, x: 0 };

    // Find the most recent post (newest date)
    const mostRecent = locations.reduce((latest, current) => {
      return new Date(current.date) > new Date(latest.date) ? current : latest;
    }, locations[0]);

    // Horizontal rotation (longitude)
    const yRotation = -(mostRecent.lon + 90) * Math.PI / 180;

    // Vertical tilt (latitude)
    const xRotation = (mostRecent.lat) * Math.PI / 180;

    return { y: yRotation, x: xRotation };
  }, [locations]);

  useFrame((state, delta) => {
    if (!groupRef.current || hasReachedTarget) return;

    const currentY = groupRef.current.rotation.y;
    const currentX = groupRef.current.rotation.x;

    const diffY = targetRotation.y - currentY;
    const diffX = targetRotation.x - currentX;

    // Normalize Y difference to shortest path
    let normalizedDiffY = ((diffY + Math.PI) % (2 * Math.PI)) - Math.PI;
    if (normalizedDiffY < -Math.PI) normalizedDiffY += 2 * Math.PI;

    // Check if we've reached the target
    if (Math.abs(normalizedDiffY) < 0.01 && Math.abs(diffX) < 0.01) {
      groupRef.current.rotation.y = targetRotation.y;
      groupRef.current.rotation.x = targetRotation.x;
      setHasReachedTarget(true);
    } else {
      // Smooth animation towards target
      const smoothness = 3.0;
      const lerpFactor = 1 - Math.exp(-smoothness * delta);

      groupRef.current.rotation.y += normalizedDiffY * lerpFactor;
      groupRef.current.rotation.x += diffX * lerpFactor;
      state.invalidate();
    }
  });

  const lines: [number, number, number][][] = [];

  geoJSON.features.forEach((feature) => {
    const { geometry } = feature;
    if (!geometry) return;

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
    <>
      {/* Clickable sphere behind everything */}
      <mesh
        onClick={(e) => {
          onGlobeClick(e.point);
        }}
      >
        <sphereGeometry args={[radius, 64, 64]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      <group ref={groupRef}>
        {/* Graticule lines (atlas grid) */}
        {graticuleLines.map((linePoints, index) => (
          <Line
            key={`graticule-${index}`}
            points={linePoints}
            color="#cccccc"
            lineWidth={0.5}
          />
        ))}
        {/* Country borders */}
        {lines.map((linePoints, index) => (
          <Line
            key={`country-${index}`}
            points={linePoints}
            color="#000000"
            lineWidth={1}
          />
        ))}
        {/* Travel routes */}
        {routes.map((route, index) => (
          <TravelRoute key={`route-${index}`} route={route} index={index} />
        ))}
        {/* City markers */}
        {locations.map((location, index) => {
          // Find the most recent location by date, but only the first occurrence of each slug
          const uniqueLocations = locations.reduce((acc: PostLocation[], loc) => {
            if (!acc.find(l => l.slug === loc.slug)) {
              acc.push(loc);
            }
            return acc;
          }, []);

          const newestLocation = uniqueLocations.reduce((latest, current) => {
            return new Date(current.date) > new Date(latest.date) ? current : latest;
          }, uniqueLocations[0]);

          // Only mark the first occurrence of the newest post as newest
          const isNewest = location.slug === newestLocation.slug && 
            locations.findIndex(l => l.slug === newestLocation.slug) === index;

          return (
            <CityMarker
              key={`${location.slug}-${location.lat}-${location.lon}-${index}`}
              location={location}
              onMarkerClick={onMarkerClick}
              isNewest={isNewest}
            />
          );
        })}
      </group>
    </>
  );
}

function Globe({
  geoJSON,
  locations,
  routes,
  onMarkerClick,
  onGlobeClick,
}: {
  geoJSON: GeoJSON;
  locations: PostLocation[];
  routes: TravelRouteType[];
  onMarkerClick: (location: PostLocation, screenX: number, screenY: number) => void;
  onGlobeClick: (point: THREE.Vector3) => void;
}) {
  return (
    <CountryBorders
      geoJSON={geoJSON}
      locations={locations}
      routes={routes}
      onMarkerClick={onMarkerClick}
      onGlobeClick={onGlobeClick}
    />
  );
}

function CameraController({
  targetPositionRef,
  targetLookAtRef,
  invalidateRef,
}: {
  targetPositionRef: React.MutableRefObject<THREE.Vector3 | null>;
  targetLookAtRef: React.MutableRefObject<THREE.Vector3 | null>;
  invalidateRef: React.MutableRefObject<(() => void) | null>;
}) {
  const { camera, invalidate } = useThree();
  const hasInitialized = useRef(false);

  // Expose invalidate to parent
  useEffect(() => {
    invalidateRef.current = invalidate;
  }, [invalidate, invalidateRef]);

  // Zoom out on mobile on initial mount
  useEffect(() => {
    if (!hasInitialized.current && typeof window !== 'undefined' && window.innerWidth < 640) {
      camera.position.set(0, 0, 8);
      hasInitialized.current = true;
    }
  }, [camera]);

  useFrame((state, delta) => {
    const targetPosition = targetPositionRef.current;
    const targetLookAt = targetLookAtRef.current;

    if (targetPosition && targetLookAt) {
      const distance = camera.position.distanceTo(targetPosition);

      // Stop if close enough
      if (distance < 0.01) {
        camera.position.copy(targetPosition);
        targetPositionRef.current = null;
        targetLookAtRef.current = null;

        // Reset controls target without animation
        const controls = state.controls as any;
        if (controls && controls.target) {
          controls.target.copy(targetLookAt);
          controls.update();
        }
        return;
      }

      // Delta-time independent exponential smoothing
      const smoothness = 3.0;
      const lerpFactor = 1 - Math.exp(-smoothness * delta);

      // Animate camera position
      camera.position.lerp(targetPosition, lerpFactor);

      // Animate controls target in sync
      const controls = state.controls as any;
      if (controls && controls.target) {
        controls.target.lerp(targetLookAt, lerpFactor);
        controls.update();
      }
      state.invalidate();
    }
  });

  return null;
}


export default function WorldMap({
  locations = [],
  routes = [],
  onResetView
}: {
  locations?: PostLocation[];
  routes?: TravelRouteType[];
  onResetView?: (resetFn: () => void) => void;
}) {
  const [geoJSON, setGeoJSON] = useState<GeoJSON | null>(null);
  const [selectedLocationCoord, setSelectedLocationCoord] = useState<{ lat: number; lon: number } | null>(null);
  const [selectedPostIndex, setSelectedPostIndex] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const [isTooltipClosing, setIsTooltipClosing] = useState(false);
  const targetCameraPositionRef = useRef<THREE.Vector3 | null>(null);
  const targetCameraLookAtRef = useRef<THREE.Vector3 | null>(null);
  const invalidateRef = useRef<(() => void) | null>(null);
  const controlsRef = useRef<any>(null);
  const isDraggingRef = useRef(false);
  const dragCountRef = useRef(0);

  // Fetch GeoJSON early so it loads in parallel with Canvas/WebGL init
  useEffect(() => {
    fetch(GEOJSON_URL)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch GeoJSON");
        return res.json();
      })
      .then((data) => setGeoJSON(data))
      .catch(() => {});
  }, []);

  const getDefaultZoom = useCallback(() => {
    return typeof window !== 'undefined' && window.innerWidth < 640 ? 8 : 6;
  }, []);

  // Get all locations at the currently selected coordinate
  const selectedLocations = selectedLocationCoord
    ? locations.filter(
        (loc) =>
          Math.abs(loc.lat - selectedLocationCoord.lat) < 0.001 &&
          Math.abs(loc.lon - selectedLocationCoord.lon) < 0.001
      )
    : [];

  const selectedLocation = selectedLocations[selectedPostIndex] || null;

  const handleResetView = useCallback(() => {
    // Reset camera to initial position (no state changes, just refs)
    targetCameraPositionRef.current = new THREE.Vector3(0, 0, getDefaultZoom());
    targetCameraLookAtRef.current = new THREE.Vector3(0, 0, 0);

    // Close tooltip only if it's open
    if (selectedLocationCoord) {
      setSelectedLocationCoord(null);
      setSelectedPostIndex(0);
      setTooltipPosition(null);
      setIsTooltipClosing(false);
    }
  }, [selectedLocationCoord]);

  // Expose reset function to parent
  useEffect(() => {
    if (onResetView) {
      onResetView(handleResetView);
    }
  }, [onResetView, handleResetView]);

  const closeTooltip = () => {
    setIsTooltipClosing(true);
    setTimeout(() => {
      setSelectedLocationCoord(null);
      setSelectedPostIndex(0);
      setTooltipPosition(null);
      setIsTooltipClosing(false);
    }, 200); // Match the CSS transition duration
  };

  const handleMarkerClick = (location: PostLocation, screenX: number, screenY: number) => {
    const newCoord = { lat: location.lat, lon: location.lon };
    
    // If tooltip is already open, close it first
    if (selectedLocationCoord) {
      closeTooltip();
      setTimeout(() => {
        setSelectedLocationCoord(newCoord);
        setSelectedPostIndex(0);
        setTooltipPosition({ x: screenX, y: screenY });
      }, 200);
    } else {
      setSelectedLocationCoord(newCoord);
      setSelectedPostIndex(0);
      setTooltipPosition({ x: screenX, y: screenY });
    }
  };

  const handleGlobeClick = (point: THREE.Vector3) => {
    // Only zoom if user clicked without dragging
    if (isDraggingRef.current) {
      return;
    }

    // Close tooltip if open
    if (selectedLocationCoord) {
      closeTooltip();
    }

    // Calculate the direction from center to clicked point
    const direction = point.clone().normalize();

    // Position camera closer to the globe, looking at the clicked point
    const zoomDistance = 2.7; // Zoom in very close to surface
    const newCameraPosition = direction.multiplyScalar(zoomDistance);

    // Use refs for immediate update without waiting for React render
    targetCameraPositionRef.current = newCameraPosition;
    targetCameraLookAtRef.current = point;
    invalidateRef.current?.();
  };

  const handleControlsStart = () => {
    // Reset drag tracking when interaction starts
    isDraggingRef.current = false;
    dragCountRef.current = 0;

    // Clear animation targets when user starts manually controlling the camera
    targetCameraPositionRef.current = null;
    targetCameraLookAtRef.current = null;

    // Close tooltip when user starts interacting (dragging or zooming)
    if (selectedLocationCoord) {
      closeTooltip();
    }
  };

  const handleControlsChange = () => {
    // Increment drag counter
    dragCountRef.current += 1;

    // Only mark as dragging after several onChange events (threshold to avoid false positives on clicks)
    if (dragCountRef.current > 5) {
      isDraggingRef.current = true;
    }
  };

  return (
    <div className={`w-full h-dvh bg-[#FAF8F3] overflow-hidden transition-opacity duration-500 ${geoJSON ? 'opacity-100' : 'opacity-0'}`}>
      {/* Preload all cover images — visually hidden but still loaded */}
      <div className="absolute w-0 h-0 overflow-hidden" aria-hidden="true">
        {locations.map((location) => (
          <Image
            key={location.slug}
            src={location.coverImage}
            alt=""
            width={384}
            height={144}
            priority
          />
        ))}
      </div>

      <Canvas camera={{ position: [0, 0, 6], fov: 45 }} frameloop="demand">
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        {geoJSON && (
          <Globe
            geoJSON={geoJSON}
            locations={locations}
            routes={routes}
            onMarkerClick={handleMarkerClick}
            onGlobeClick={handleGlobeClick}
          />
        )}
        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          onStart={handleControlsStart}
          onChange={handleControlsChange}
          minDistance={2.5}
          maxDistance={15}
        />
        <CameraController
          targetPositionRef={targetCameraPositionRef}
          targetLookAtRef={targetCameraLookAtRef}
          invalidateRef={invalidateRef}
        />
      </Canvas>
      {selectedLocation && tooltipPosition && (() => {
        // Smart positioning: close to marker, constrained to viewport
        const tooltipHeight = selectedLocations.length > 1 ? 520 : 450; // Extra height for multi-post nav
        const tooltipWidth = 384; // max-w-xs = 384px
        const margin = 10; // Minimum margin from edges
        const offset = 5; // Small offset from click point
        const headerHeight = 80; // Approximate height of header nav

        // Start with ideal position (close to marker)
        let left = tooltipPosition.x + offset;
        let top = tooltipPosition.y + offset;

        // Check if marker is near top (would be hidden by header)
        if (tooltipPosition.y < headerHeight + 20) {
          // Position below marker with extra offset to clear header
          top = Math.max(headerHeight + margin, tooltipPosition.y + 20);
        }

        // Check right edge overflow
        if (left + tooltipWidth > window.innerWidth - margin) {
          // Flip to left side of marker
          left = tooltipPosition.x - tooltipWidth - offset;
        }

        // Check bottom edge overflow
        if (top + tooltipHeight > window.innerHeight - margin) {
          // Check if there's more space above
          const spaceAbove = tooltipPosition.y - headerHeight;
          const spaceBelow = window.innerHeight - tooltipPosition.y;

          if (spaceAbove > spaceBelow && spaceAbove > tooltipHeight) {
            // Flip above marker (but below header)
            top = Math.max(headerHeight + margin, tooltipPosition.y - tooltipHeight - offset);
          } else {
            // Constrain to bottom
            top = window.innerHeight - tooltipHeight - margin;
          }
        }

        // Ensure minimum margins on all sides (and below header)
        left = Math.max(margin, Math.min(left, window.innerWidth - tooltipWidth - margin));
        top = Math.max(headerHeight + margin, Math.min(top, window.innerHeight - tooltipHeight - margin));

        return (
          <div
            className="absolute max-w-xs w-full transition-opacity duration-200"
            style={{
              left: `${left}px`,
              top: `${top}px`,
              opacity: isTooltipClosing ? 0 : 1,
            }}
          >
            <div className="bg-[#ECECEC] border-t-[3px] border-l-[3px] border-white border-r-[3px] border-b-[3px] border-r-[#808080] border-b-[#808080] p-2">
              {/* Image in recessed frame */}
              <div className="relative border-t-[3px] border-l-[3px] border-[#808080] border-r-[3px] border-b-[3px] border-r-white border-b-white">
                <div className="relative h-64 bg-gray-200 overflow-hidden">
                  <Image
                    src={selectedLocation.coverImage}
                    alt={selectedLocation.city}
                    width={384}
                    height={256}
                    className="object-cover w-full h-full"
                  />
                </div>
                {/* Close button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTooltip();
                  }}
                  className="absolute top-2 right-2 z-10 w-7 h-7 bg-[#E0E0E0] border-t-2 border-l-2 border-white border-r-2 border-b-2 border-r-[#808080] border-b-[#808080] flex items-center justify-center text-sm font-bold active:border-t-[#808080] active:border-l-[#808080] active:border-r-white active:border-b-white"
                >
                  ×
                </button>
              </div>

              {/* Details */}
              <div className="px-4 pt-2 pb-3">
                <div className="text-[9px] text-black/50 font-mono font-bold uppercase tracking-[0.2em] mb-1">
                  {selectedLocation.city}, {selectedLocation.country}
                </div>
                <h3 className="text-lg font-display font-bold text-black leading-tight mb-1">
                  {selectedLocation.title}
                </h3>
                <div className="text-[9px] text-gray-500 font-mono font-bold uppercase tracking-[0.15em] mb-2">
                  {formatDate(selectedLocation.date)}
                </div>
                <p className="text-xs text-gray-700 leading-relaxed mb-3" style={{ fontFamily: 'Tahoma, Verdana, -apple-system, sans-serif' }}>
                  {selectedLocation.excerpt}
                </p>

                {/* Multi-post navigation */}
                {selectedLocations.length > 1 && (
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => setSelectedPostIndex(Math.max(0, selectedPostIndex - 1))}
                      disabled={selectedPostIndex === 0}
                      className="flex-1 bg-[#E0E0E0] border-t-2 border-l-2 border-white border-r-2 border-b-2 border-r-[#808080] border-b-[#808080] px-3 py-2 text-xs font-mono font-bold uppercase tracking-wide disabled:opacity-50 active:border-t-[#808080] active:border-l-[#808080] active:border-r-white active:border-b-white"
                    >
                      ← Prev
                    </button>
                    <div className="flex-1 flex items-center justify-center bg-[#F5F5F5] px-3 py-2 text-xs font-mono font-bold text-black/70">
                      {selectedPostIndex + 1} / {selectedLocations.length}
                    </div>
                    <button
                      onClick={() => setSelectedPostIndex(Math.min(selectedLocations.length - 1, selectedPostIndex + 1))}
                      disabled={selectedPostIndex === selectedLocations.length - 1}
                      className="flex-1 bg-[#E0E0E0] border-t-2 border-l-2 border-white border-r-2 border-b-2 border-r-[#808080] border-b-[#808080] px-3 py-2 text-xs font-mono font-bold uppercase tracking-wide disabled:opacity-50 active:border-t-[#808080] active:border-l-[#808080] active:border-r-white active:border-b-white"
                    >
                      Next →
                    </button>
                  </div>
                )}

                <Link
                  href={`/blog/${selectedLocation.slug}`}
                  className="block w-full text-center bg-[#E0E0E0] border-t-2 border-l-2 border-white border-r-2 border-b-2 border-r-[#808080] border-b-[#808080] px-6 py-2.5 text-xs font-mono font-bold uppercase tracking-wide active:border-t-[#808080] active:border-l-[#808080] active:border-r-white active:border-b-white"
                >
                  ENTER &gt;&gt;
                </Link>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
