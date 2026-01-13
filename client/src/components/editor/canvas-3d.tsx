import { Suspense, useRef, useMemo, useState, useEffect, Component, ErrorInfo, ReactNode } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { fontOptions } from "@shared/schema";
import { Box, AlertTriangle } from "lucide-react";

function checkWebGLSupport(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    return !!gl;
  } catch (e) {
    return false;
  }
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class CanvasErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn("3D Canvas error caught:", error.message);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function Canvas2DFallback() {
  const { letterSettings, wiringSettings, mountingSettings } = useEditorStore();
  const selectedFont = fontOptions.find((f) => f.id === letterSettings.fontId);

  const width = letterSettings.text.length * 40 * letterSettings.scale;
  const height = 60 * letterSettings.scale;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 rounded-md p-8">
      <div className="flex items-center gap-2 mb-6 text-zinc-400">
        <AlertTriangle className="h-4 w-4" />
        <span className="text-sm">2D Preview Mode</span>
      </div>
      
      <div className="relative mb-8">
        <div
          className="bg-purple-600 rounded-md shadow-2xl flex items-center justify-center border-2 border-purple-500/50"
          style={{
            width: `${Math.min(Math.max(letterSettings.text.length * 60, 80), 400)}px`,
            height: `${Math.min(100 * letterSettings.scale, 150)}px`,
            boxShadow: "0 20px 60px rgba(147, 51, 234, 0.3)",
          }}
        >
          <span
            className="text-purple-950 font-bold tracking-wide"
            style={{
              fontFamily: selectedFont?.family || "Inter",
              fontSize: `${Math.min(48 * letterSettings.scale, 72)}px`,
            }}
          >
            {letterSettings.text || "A"}
          </span>
        </div>

        {wiringSettings.channelType !== "none" && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/4 h-2 bg-yellow-500 rounded-full opacity-80" />
        )}

        {mountingSettings.pattern !== "none" && (
          <>
            <div className="absolute top-2 left-2 w-2 h-2 bg-red-500 rounded-full" />
            <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
            {mountingSettings.pattern !== "2-point" && (
              <>
                <div className="absolute bottom-2 left-2 w-2 h-2 bg-red-500 rounded-full" />
                <div className="absolute bottom-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
              </>
            )}
          </>
        )}
      </div>

      <div className="bg-zinc-900/95 backdrop-blur-sm border border-zinc-700 rounded-md px-4 py-2 text-sm font-mono text-zinc-100">
        <span className="text-zinc-400">W:</span>{" "}
        <span className="text-purple-400">{width.toFixed(0)}mm</span>
        <span className="mx-3 text-zinc-600">|</span>
        <span className="text-zinc-400">H:</span>{" "}
        <span className="text-purple-400">{height.toFixed(0)}mm</span>
        <span className="mx-3 text-zinc-600">|</span>
        <span className="text-zinc-400">D:</span>{" "}
        <span className="text-purple-400">{letterSettings.depth}mm</span>
      </div>

      <div className="mt-6 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full bg-purple-500" />
          <span className="text-zinc-400">Letter body</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full bg-yellow-500" />
          <span className="text-zinc-400">Wire channel</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-zinc-400">Mount holes</span>
        </div>
      </div>

      <p className="mt-6 text-xs text-zinc-500 text-center max-w-xs">
        Full 3D preview requires WebGL support. Export functionality works normally.
      </p>
    </div>
  );
}

function WebGL3DCanvas() {
  const { letterSettings, wiringSettings, mountingSettings, showGrid, showWireframe, showMeasurements } = useEditorStore();
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const selectedFont = fontOptions.find((f) => f.id === letterSettings.fontId);
  const depth = (letterSettings.depth / 20) * letterSettings.scale;
  const fontSize = 2 * letterSettings.scale;
  const channelRadius = (wiringSettings.channelDiameter / 40) * letterSettings.scale;
  const channelLength = 4 * letterSettings.scale;
  const textWidth = Math.max(letterSettings.text.length * 1.6, 1.6) * letterSettings.scale;
  const textHeight = 2.6 * letterSettings.scale;
  const width = letterSettings.text.length * 40 * letterSettings.scale;
  const height = 60 * letterSettings.scale;

  const mountingHoles = useMemo(() => {
    if (mountingSettings.pattern === "none") return [];
    const holes: { position: [number, number, number] }[] = [];
    const offset = (mountingSettings.insetFromEdge / 20) * letterSettings.scale;
    const baseX = textWidth / 2 - offset;
    const baseY = textHeight / 2 - offset;

    switch (mountingSettings.pattern) {
      case "2-point":
        holes.push({ position: [-baseX, 0, depth / 2 + 0.01] }, { position: [baseX, 0, depth / 2 + 0.01] });
        break;
      case "4-corner":
        holes.push(
          { position: [-baseX, baseY, depth / 2 + 0.01] },
          { position: [baseX, baseY, depth / 2 + 0.01] },
          { position: [-baseX, -baseY, depth / 2 + 0.01] },
          { position: [baseX, -baseY, depth / 2 + 0.01] }
        );
        break;
      case "6-point":
        holes.push(
          { position: [-baseX, baseY, depth / 2 + 0.01] },
          { position: [0, baseY, depth / 2 + 0.01] },
          { position: [baseX, baseY, depth / 2 + 0.01] },
          { position: [-baseX, -baseY, depth / 2 + 0.01] },
          { position: [0, -baseY, depth / 2 + 0.01] },
          { position: [baseX, -baseY, depth / 2 + 0.01] }
        );
        break;
    }
    return holes;
  }, [mountingSettings, letterSettings.scale, textWidth, textHeight, depth]);

  const [ThreeModules, setThreeModules] = useState<{
    Canvas: any;
    OrbitControls: any;
    Environment: any;
    Center: any;
    Text: any;
    Grid: any;
    Html: any;
    RoundedBox: any;
    THREE: any;
  } | null>(null);

  useEffect(() => {
    let mounted = true;
    
    async function loadModules() {
      try {
        const [fiberModule, dreiModule, threeModule] = await Promise.all([
          import("@react-three/fiber"),
          import("@react-three/drei"),
          import("three"),
        ]);
        
        if (mounted) {
          setThreeModules({
            Canvas: fiberModule.Canvas,
            OrbitControls: dreiModule.OrbitControls,
            Environment: dreiModule.Environment,
            Center: dreiModule.Center,
            Text: dreiModule.Text,
            Grid: dreiModule.Grid,
            Html: dreiModule.Html,
            RoundedBox: dreiModule.RoundedBox,
            THREE: threeModule,
          });
          setIsLoaded(true);
        }
      } catch (err) {
        console.error("Failed to load 3D modules:", err);
        if (mounted) {
          setLoadError(true);
        }
      }
    }
    
    loadModules();
    return () => { mounted = false; };
  }, []);

  if (loadError) {
    return <Canvas2DFallback />;
  }

  if (!isLoaded || !ThreeModules) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 rounded-md">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-zinc-400">Loading 3D preview...</span>
        </div>
      </div>
    );
  }

  const { Canvas, OrbitControls, Environment, Center, Text, Grid, Html, RoundedBox, THREE } = ThreeModules;

  return (
    <div ref={canvasContainerRef} className="w-full h-full rounded-md overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950" />
      <CanvasErrorBoundary fallback={<Canvas2DFallback />}>
        <Canvas
          camera={{ position: [0, 0, 8], fov: 50 }}
          gl={{ 
            antialias: true, 
            alpha: false,
            failIfMajorPerformanceCaveat: false,
          }}
          dpr={[1, 2]}
          onCreated={({ gl }) => {
            gl.setClearColor("#18181b");
          }}
        >
          <color attach="background" args={["#18181b"]} />
          <fog attach="fog" args={["#18181b", 15, 30]} />
          
          <ambientLight intensity={0.45} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <directionalLight position={[-5, 5, -5]} intensity={0.35} />
          <pointLight position={[0, 0, 6]} intensity={0.25} color="#a855f7" />

          <Center>
            <group>
              <RoundedBox
                args={[textWidth + 0.4, textHeight + 0.3, depth]}
                radius={letterSettings.bevelEnabled ? 0.15 * letterSettings.scale : 0.03}
                smoothness={4}
              >
                {showWireframe ? (
                  <meshBasicMaterial color="#a855f7" wireframe />
                ) : (
                  <meshStandardMaterial color="#a855f7" metalness={0.25} roughness={0.4} />
                )}
              </RoundedBox>

              <Text
                position={[0, 0, depth / 2 + 0.02]}
                fontSize={fontSize}
                color={showWireframe ? "#d946ef" : "#1e1b4b"}
                anchorX="center"
                anchorY="middle"
              >
                {letterSettings.text || "A"}
              </Text>

              <Text
                position={[0, 0, -depth / 2 - 0.02]}
                fontSize={fontSize}
                rotation={[0, Math.PI, 0]}
                color={showWireframe ? "#d946ef" : "#1e1b4b"}
                anchorX="center"
                anchorY="middle"
              >
                {letterSettings.text || "A"}
              </Text>

              {wiringSettings.channelType !== "none" && (
                <mesh
                  position={[
                    0,
                    wiringSettings.channelType === "back" ? -textHeight / 3 : 0,
                    wiringSettings.channelType === "back" ? -depth / 2 + channelRadius : 0,
                  ]}
                  rotation={[0, 0, Math.PI / 2]}
                >
                  <cylinderGeometry args={[channelRadius, channelRadius, channelLength, 16]} />
                  <meshStandardMaterial color="#fbbf24" transparent opacity={0.85} emissive="#fbbf24" emissiveIntensity={0.15} />
                </mesh>
              )}

              {mountingHoles.map((hole, index) => (
                <group key={index} position={hole.position}>
                  <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry
                      args={[
                        (mountingSettings.holeDiameter / 40) * letterSettings.scale,
                        (mountingSettings.holeDiameter / 40) * letterSettings.scale,
                        (mountingSettings.holeDepth / 25) * letterSettings.scale,
                        16,
                      ]}
                    />
                    <meshStandardMaterial color="#ef4444" transparent opacity={0.75} />
                  </mesh>
                  <mesh position={[0, 0, 0.03]}>
                    <ringGeometry
                      args={[
                        (mountingSettings.holeDiameter / 55) * letterSettings.scale,
                        (mountingSettings.holeDiameter / 35) * letterSettings.scale,
                        16,
                      ]}
                    />
                    <meshBasicMaterial color="#dc2626" side={THREE.DoubleSide} />
                  </mesh>
                </group>
              ))}
            </group>
          </Center>

          {showGrid && (
            <Grid
              args={[20, 20]}
              cellSize={0.5}
              cellThickness={0.5}
              cellColor="#3f3f46"
              sectionSize={2}
              sectionThickness={1}
              sectionColor="#52525b"
              fadeDistance={25}
              fadeStrength={1}
              position={[0, -2.5, 0]}
            />
          )}

          {showMeasurements && (
            <Html position={[0, 3.5, 0]} center>
              <div className="bg-zinc-900/95 backdrop-blur-sm border border-zinc-700 rounded-md px-3 py-1.5 text-xs font-mono whitespace-nowrap text-zinc-100 shadow-lg">
                <span className="text-zinc-400">W:</span> <span className="text-purple-400">{width.toFixed(0)}mm</span>
                <span className="mx-2 text-zinc-600">|</span>
                <span className="text-zinc-400">H:</span> <span className="text-purple-400">{height.toFixed(0)}mm</span>
                <span className="mx-2 text-zinc-600">|</span>
                <span className="text-zinc-400">D:</span> <span className="text-purple-400">{letterSettings.depth}mm</span>
              </div>
            </Html>
          )}

          <Environment preset="studio" />
          <OrbitControls
            makeDefault
            enableDamping
            dampingFactor={0.05}
            minDistance={3}
            maxDistance={25}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI - Math.PI / 6}
          />
        </Canvas>
      </CanvasErrorBoundary>

      <div className="absolute bottom-4 left-4 flex gap-2">
        <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-700 rounded-md px-2 py-1 text-[10px] text-zinc-400">
          Drag to rotate
        </div>
        <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-700 rounded-md px-2 py-1 text-[10px] text-zinc-400">
          Scroll to zoom
        </div>
      </div>

      <div className="absolute top-4 right-4 flex flex-col gap-1.5 bg-zinc-900/60 backdrop-blur-sm border border-zinc-800 rounded-md p-2">
        <div className="flex items-center gap-2 text-[10px]">
          <div className="w-2 h-2 rounded-full bg-purple-500" />
          <span className="text-zinc-400">Letter body</span>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <div className="w-2 h-2 rounded-full bg-yellow-500" />
          <span className="text-zinc-400">Wire channel</span>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-zinc-400">Mount holes</span>
        </div>
      </div>
    </div>
  );
}

export function Canvas3D() {
  const [hasWebGL, setHasWebGL] = useState<boolean | null>(null);

  useEffect(() => {
    const supported = checkWebGLSupport();
    setHasWebGL(supported);
  }, []);

  if (hasWebGL === null) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 rounded-md">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-zinc-400">Checking WebGL support...</span>
        </div>
      </div>
    );
  }

  if (!hasWebGL) {
    return <Canvas2DFallback />;
  }

  return (
    <CanvasErrorBoundary fallback={<Canvas2DFallback />}>
      <WebGL3DCanvas />
    </CanvasErrorBoundary>
  );
}
