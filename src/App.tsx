import { useState, useEffect, useRef } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { useGLTF, Environment, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
const Building = (props) => {
  const { scene } = useGLTF("/AC.glb");
  return <primitive object={scene} {...props} />;
};
const Marker = ({ position }) => {
  return (
    <mesh position={position}>
      <coneGeometry args={[0.5, 2, 32]} />
      <meshStandardMaterial color="red" />
    </mesh>
  );
};

// CameraPositionTracker: Update camera and track position, rotation, zoom
const CameraPositionTracker = ({ setCameraPosition, markerPosition }) => {
  const { camera } = useThree();

  // Update camera position and rotation
  useFrame(() => {
    setCameraPosition({
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z,
      zoom: camera.zoom,
      rotation: {
        x: camera.rotation.x,
        y: camera.rotation.y,
        z: camera.rotation.z,
      },
    });

    // Camera always looks at the marker
    camera.lookAt(new THREE.Vector3(...markerPosition));
  });

  return null;
};
const convertGeoTo3D = (lat, lon) => {
  const baseLat = 9.306776;
  const baseLon = 123.302039; 

  const buildingWidth = 61;
  const basePosition = [-3.5, 0, -6];
  const latScale = 0.5; 
  const lonScale = 0.5;
  const latDiff = lat - baseLat;
  const lonDiff = lon - baseLon;

  // Not too sure on this, I am trying to fix the realworld dimensions on this
  //TODO: Fix dimensions so users can be tracked accurately on 3d space
  const latDistance = latDiff * 111320;
  const lonDistance = lonDiff * 111320 * Math.cos((baseLat * Math.PI) / 180); 
  const scale = buildingWidth / 111320;
  const x = basePosition[0] + lonDistance * lonScale * scale;
  const z = basePosition[2] + latDistance * latScale * scale;

  // Return the new 3D position
  return [x, basePosition[1], z]; // Keep Y fixed at 0 (ground level)
};

// Use geolocation hook to get the user's position and update the marker
const useGeoLocation = (setMarkerPosition) => {
  useEffect(() => {
    if (navigator.geolocation) {
      const geoSuccess = (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const [x, y, z] = convertGeoTo3D(lat, lon);
        setMarkerPosition([x, y, z]); // Update user's 3D position
      };

      const geoError = (error) => {
        console.error("Error getting geolocation", error);
      };

      // Watch the position to update in real-time
      navigator.geolocation.watchPosition(geoSuccess, geoError, {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 5000,
      });
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  }, [setMarkerPosition]);
};
const App: React.FC = () => {
  const [cameraPosition, setCameraPosition] = useState({
    x: -3.66,
    y: 25.43,
    z: -55.24,
    zoom: 1, 
    rotation: { x: 0, y: 0, z: 0 },
  });
  const [markerPosition, setMarkerPosition] = useState([-3.5, 0, -6]); // Default marker position (base) 
  const containerRef = useRef<HTMLDivElement>(null);
  // Track user's geolocation in real-time
  useGeoLocation(setMarkerPosition);

  return (
    <>
      <div
        ref={containerRef}
        style={{ height: "100vh", width: "100%", margin: 0 }}
      >
        <Canvas
          camera={{
            position: [-3.66, 25.43, -55.24],
            fov: 25,
            zoom: cameraPosition.zoom,
          }}
          style={{ width: "100%", height: "100%" }}
        >
          <ambientLight intensity={0.5} />
          <directionalLight
            position={[10, 10, 10]}
            intensity={1}
            color={0xffffff}
          />
          <Building
            position={[0, -0.2, 0]}
            rotation={[0, Math.PI / 2, 0]}
            scale={0.2}
          />
          <Marker position={markerPosition} />
          <Environment preset="city" />
          <OrbitControls
            enableDamping
            dampingFactor={0.25}
            maxPolarAngle={Math.PI / 2}
            screenSpacePanning={false}
            zoomSpeed={0.5}
          />
          <CameraPositionTracker
            setCameraPosition={setCameraPosition}
            markerPosition={markerPosition}
          />
        </Canvas>
      </div>

      <div style={styles.overlay}>
        Camera Position:
        <br />
        X: {cameraPosition.x.toFixed(2)} (Left-Right)
        <br />
        Y: {cameraPosition.y.toFixed(2)} (Up-Down)
        <br />
        Z: {cameraPosition.z.toFixed(2)} (Front-Back)
        <br />
        Zoom: {cameraPosition.zoom.toFixed(2)} (Zoom Level)
        <br />
        Rotation:
        <br />
        X: {cameraPosition.rotation.x.toFixed(2)} (Pitch)
        <br />
        Y: {cameraPosition.rotation.y.toFixed(2)} (Yaw)
        <br />
        Z: {cameraPosition.rotation.z.toFixed(2)} (Roll)
        <br />
        Marker Position:
        <br />
        X: {markerPosition[0].toFixed(2)}
        <br />
        Y: {markerPosition[1].toFixed(2)}
        <br />
        Z: {markerPosition[2].toFixed(2)}
      </div>
    </>
  );
};
const styles = {
  overlay: {
    position: "absolute" as "absolute",
    top: "10px",
    right: "10px",
    color: "#fff",
    fontSize: "16px",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: "5px 10px",
    borderRadius: "5px",
    pointerEvents: "none",
  },
};

export default App;
