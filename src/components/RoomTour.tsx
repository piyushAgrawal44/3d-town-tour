import { Environment, OrbitControls, useProgress } from "@react-three/drei";
import { Canvas, useFrame, type Camera } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { RoomViewer } from "../components/RoomViewer";
import { OrbitControls as ThreeOrbitControls } from "three/examples/jsm/Addons.js";
import { CameraController } from "./CameraController";
import * as THREE from "three";


function PageLoader() {
    const { progress } = useProgress();

    return (
        <div className="fixed w-full h-full inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
            <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
                <p className="text-white text-lg">{Math.floor(progress)}% loading</p>
            </div>
        </div>
    );
}

function AnimatedCircle({
    position,
    onClick,
}: {
    position: [number, number, number];
    onClick: () => void;
}) {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame(({ clock }) => {
        const mesh = meshRef.current;
        if (mesh) {
            const scale = 1 + Math.sin(clock.getElapsedTime() * 2) * 0.1;
            mesh.scale.set(scale, scale, scale);
        }
    });

    return (
        <mesh
            ref={meshRef}
            position={position}
            rotation={[-Math.PI / 2, 0, 0]}
            onDoubleClick={onClick}
        >
            <circleGeometry args={[8.5, 84]} />
            <meshStandardMaterial
                color="white"
                opacity={1}
                transparent
                side={THREE.DoubleSide}
            />
        </mesh>
    );
}

function CameraMover({
    cameraRef,
    targetPosition,
    setTargetPosition,
    controlsRef,
}: {
    cameraRef: React.RefObject<Camera | null>;
    targetPosition: [number, number, number] | null;
    setTargetPosition: React.Dispatch<React.SetStateAction<[number, number, number] | null>>;
    controlsRef: React.RefObject<ThreeOrbitControls | any>;
}) {

    // Room boundaries
    const roomMin = new THREE.Vector3(-159.5063, 5, -92.9707);
    const roomMax = new THREE.Vector3(160.2180, 50, 105.1444);

    function clampVector(vec: THREE.Vector3, min: THREE.Vector3, max: THREE.Vector3) {
        return new THREE.Vector3(
            THREE.MathUtils.clamp(vec.x, min.x, max.x),
            THREE.MathUtils.clamp(vec.y, min.y, max.y),
            THREE.MathUtils.clamp(vec.z, min.z, max.z)
        );
    }

    useFrame((_, delta) => {
        if (!targetPosition || !cameraRef.current) return;

        const cam = cameraRef.current;
        const current = cam.position.clone();
        const target = new THREE.Vector3(targetPosition[0], current.y, targetPosition[2]);

        if (controlsRef.current) controlsRef.current.enabled = false;

        const speed = 50; // 🔁 units per second
        const direction = target.clone().sub(current).normalize();
        const distance = speed * delta;
        const newPosition = current.clone().add(direction.multiplyScalar(distance));

        if (newPosition.distanceTo(target) < distance) {
            cam.position.copy(clampVector(target, roomMin, roomMax));
            setTargetPosition(null);
            if (controlsRef.current) controlsRef.current.enabled = true;
        } else {
            cam.position.copy(clampVector(newPosition, roomMin, roomMax));
            cam.lookAt(target);
        }
    });

    return null;
}



const RoomTour = () => {
    const params = useParams();
    const [modelPath, setModelPath] = useState("");
    // const [moveDirection, setMoveDirection] = useState("");
    const controlsRef = useRef<ThreeOrbitControls | any>(null);
    const cameraRef = useRef<Camera | null>(null);
    const [targetPosition, setTargetPosition] = useState<[number, number, number] | null>(null);
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        setModelPath("/models/jungle_room.glb");
    }, [params]);

    // const stopMoving = () => setMoveDirection("");

    // ✅ Floor circles
    const circlePositions: [number, number, number][] = [
        [-85, 22, -5],
        [-80, 2, -55],
        [105, 2, 5],

    ];



    return (
        <div className="canvas-container" style={{ height: "100vh", position: "relative" }}>
            {isLoading && <PageLoader />}
            {modelPath && (
                <Canvas

                    camera={{ position: [90, 50, 80], fov: 50 }}
                    onCreated={({ camera }) => { cameraRef.current = camera; setIsLoading(false) }}
                >
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[5, 5, 5]} intensity={1} />
                    <Environment preset="city" />
                    <RoomViewer modelPath={modelPath} />

                    <CameraMover
                        cameraRef={cameraRef}
                        targetPosition={targetPosition}
                        setTargetPosition={setTargetPosition}
                        controlsRef={controlsRef}
                    />

                    {circlePositions.map((pos, idx) => (
                        <AnimatedCircle
                            key={idx}
                            position={pos}
                            onClick={() => setTargetPosition([pos[0], pos[1] + 4, pos[2] - 6])}
                        />
                    ))}

                    <OrbitControls
                        ref={controlsRef}
                        minDistance={10}
                        maxDistance={100}
                        minPolarAngle={Math.PI / 2.8}
                        maxPolarAngle={Math.PI / 2.8}
                    />

                    <CameraController direction={""} controlsRef={controlsRef} />
                </Canvas>
            )}

            {/* ✅ Navigation buttons */}
            {/* <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 z-10">
                <button
                    onMouseDown={() => setMoveDirection("forward")}
                    onMouseUp={stopMoving}
                    className="bg-white text-gray-900 px-5 py-3 rounded-lg text-base hover:bg-blue-500 transition"
                >
                    🔼 Forward
                </button>
                <button
                    onMouseDown={() => setMoveDirection("backward")}
                    onMouseUp={stopMoving}
                    className="bg-white text-gray-900 px-5 py-3 rounded-lg text-base hover:bg-blue-500 transition"
                >
                    🔽 Backward
                </button>
            </div> */}
        </div>
    );
};

export default RoomTour;
