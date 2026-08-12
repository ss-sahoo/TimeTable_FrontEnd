import { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Neural Network Node - LARGER
function NeuralNode({ 
  position, 
  color, 
  size = 0.2,
  pulseSpeed = 1,
  isHovered 
}: { 
  position: [number, number, number]; 
  color: string; 
  size?: number;
  pulseSpeed?: number;
  isHovered: boolean;
}) {
  const nodeRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (nodeRef.current) {
      const speed = isHovered ? pulseSpeed * 0.3 : pulseSpeed;
      const scale = 1 + Math.sin(state.clock.elapsedTime * speed) * 0.2;
      nodeRef.current.scale.setScalar(scale);
    }
    if (glowRef.current) {
      const opacity = 0.25 + Math.sin(state.clock.elapsedTime * pulseSpeed * 0.5) * 0.15;
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = opacity;
    }
  });

  return (
    <group position={position}>
      {/* Glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[size * 2.5, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.25} />
      </mesh>
      {/* Core Node */}
      <mesh ref={nodeRef}>
        <sphereGeometry args={[size, 24, 24]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color}
          emissiveIntensity={0.5}
          metalness={0.7}
          roughness={0.2}
        />
      </mesh>
    </group>
  );
}

// Connection Line with pulse - THICKER
function ConnectionLine({ 
  start, 
  end, 
  color,
  isHovered 
}: { 
  start: [number, number, number]; 
  end: [number, number, number]; 
  color: string;
  isHovered: boolean;
}) {
  const pulseRef = useRef<THREE.Mesh>(null);
  const progress = useRef(Math.random());

  const points = useMemo(() => {
    return [new THREE.Vector3(...start), new THREE.Vector3(...end)];
  }, [start, end]);

  const geometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [points]);

  useFrame(() => {
    const speed = isHovered ? 0.008 : 0.02;
    progress.current = (progress.current + speed) % 1;
    
    if (pulseRef.current) {
      const t = progress.current;
      pulseRef.current.position.set(
        start[0] + (end[0] - start[0]) * t,
        start[1] + (end[1] - start[1]) * t,
        start[2] + (end[2] - start[2]) * t
      );
    }
  });

  return (
    <group>
      <line geometry={geometry}>
        <lineBasicMaterial color={color} transparent opacity={0.35} linewidth={2} />
      </line>
      {/* Pulse traveling along line - LARGER */}
      <mesh ref={pulseRef}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.95} />
      </mesh>
    </group>
  );
}

// 3D Brain - Made with actual 3D geometry
function Brain3D({ isHovered }: { isHovered: boolean }) {
  const brainRef = useRef<THREE.Group>(null);
  const leftHemisphereRef = useRef<THREE.Mesh>(null);
  const rightHemisphereRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (brainRef.current) {
      const speed = isHovered ? 0.0005 : 0.002;
      brainRef.current.rotation.y += speed;
      // Breathing effect
      const scale = 1 + Math.sin(state.clock.elapsedTime * 0.8) * 0.05;
      brainRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group ref={brainRef}>
      {/* Left Hemisphere */}
      <mesh ref={leftHemisphereRef} position={[-0.35, 0, 0]}>
        <sphereGeometry args={[0.9, 32, 32, 0, Math.PI]} />
        <meshStandardMaterial
          color="#ec4899"
          emissive="#ec4899"
          emissiveIntensity={0.3}
          metalness={0.6}
          roughness={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Right Hemisphere */}
      <mesh ref={rightHemisphereRef} position={[0.35, 0, 0]}>
        <sphereGeometry args={[0.9, 32, 32, Math.PI, Math.PI]} />
        <meshStandardMaterial
          color="#8b5cf6"
          emissive="#8b5cf6"
          emissiveIntensity={0.3}
          metalness={0.6}
          roughness={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Brain stem */}
      <mesh position={[0, -0.7, 0]}>
        <cylinderGeometry args={[0.25, 0.15, 0.5, 16]} />
        <meshStandardMaterial
          color="#6366f1"
          emissive="#6366f1"
          emissiveIntensity={0.2}
          metalness={0.5}
          roughness={0.5}
        />
      </mesh>

      {/* Brain folds - decorative lines */}
      {[0, 1, 2].map((i) => (
        <mesh key={`fold-left-${i}`} position={[-0.5, 0.3 - i * 0.3, 0.6]} rotation={[0, 0, Math.PI / 6]}>
          <torusGeometry args={[0.25, 0.03, 8, 16, Math.PI]} />
          <meshBasicMaterial color="#f472b6" transparent opacity={0.7} />
        </mesh>
      ))}
      
      {[0, 1, 2].map((i) => (
        <mesh key={`fold-right-${i}`} position={[0.5, 0.3 - i * 0.3, 0.6]} rotation={[0, 0, -Math.PI / 6]}>
          <torusGeometry args={[0.25, 0.03, 8, 16, Math.PI]} />
          <meshBasicMaterial color="#a78bfa" transparent opacity={0.7} />
        </mesh>
      ))}

      {/* Outer glow */}
      <mesh>
        <sphereGeometry args={[1.3, 32, 32]} />
        <meshBasicMaterial 
          color="#0ea5e9" 
          transparent 
          opacity={0.15}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Rotating ring 1 */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.5, 0.025, 16, 64]} />
        <meshBasicMaterial color="#0ea5e9" transparent opacity={0.6} />
      </mesh>

      {/* Rotating ring 2 */}
      <mesh rotation={[Math.PI / 3, Math.PI / 4, 0]}>
        <torusGeometry args={[1.7, 0.02, 16, 64]} />
        <meshBasicMaterial color="#8b5cf6" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

// Neural Network Structure - SCALED UP
function NeuralNetwork({ isHovered }: { isHovered: boolean }) {
  // Define network nodes - LARGER positions
  const nodes = useMemo(() => {
    const nodeList: { position: [number, number, number]; color: string; layer: number }[] = [];
    
    // Layer 1 - Input nodes (left) - SPREAD OUT MORE
    const layer1: [number, number, number][] = [
      [-5, 2.5, 0],
      [-5, 0, 1],
      [-5, -2.5, 0],
    ];
    layer1.forEach(pos => nodeList.push({ position: pos, color: '#0ea5e9', layer: 1 }));

    // Layer 2 - Hidden (left-center)
    const layer2: [number, number, number][] = [
      [-2.5, 1.5, 0.5],
      [-2.5, -1.5, 0.5],
    ];
    layer2.forEach(pos => nodeList.push({ position: pos, color: '#8b5cf6', layer: 2 }));

    // Layer 3 - Hidden (right-center)
    const layer3: [number, number, number][] = [
      [2.5, 1.5, -0.5],
      [2.5, -1.5, -0.5],
    ];
    layer3.forEach(pos => nodeList.push({ position: pos, color: '#8b5cf6', layer: 3 }));

    // Layer 4 - Output nodes (right)
    const layer4: [number, number, number][] = [
      [5, 2.5, 0],
      [5, 0, 1],
      [5, -2.5, 0],
    ];
    layer4.forEach(pos => nodeList.push({ position: pos, color: '#ec4899', layer: 4 }));

    return nodeList;
  }, []);

  // Define connections
  const connections = useMemo(() => {
    const conns: { start: [number, number, number]; end: [number, number, number]; color: string }[] = [];
    
    // Layer 1 to Layer 2
    nodes.filter(n => n.layer === 1).forEach(n1 => {
      nodes.filter(n => n.layer === 2).forEach(n2 => {
        conns.push({ start: n1.position, end: n2.position, color: '#0ea5e9' });
      });
    });

    // Layer 2 to center (brain)
    nodes.filter(n => n.layer === 2).forEach(n => {
      conns.push({ start: n.position, end: [0, 0, 0], color: '#8b5cf6' });
    });

    // Center to Layer 3
    nodes.filter(n => n.layer === 3).forEach(n => {
      conns.push({ start: [0, 0, 0], end: n.position, color: '#8b5cf6' });
    });

    // Layer 3 to Layer 4
    nodes.filter(n => n.layer === 3).forEach(n3 => {
      nodes.filter(n => n.layer === 4).forEach(n4 => {
        conns.push({ start: n3.position, end: n4.position, color: '#ec4899' });
      });
    });

    return conns;
  }, [nodes]);

  return (
    <group>
      {/* Connection Lines */}
      {connections.map((conn, i) => (
        <ConnectionLine 
          key={`conn-${i}`}
          start={conn.start}
          end={conn.end}
          color={conn.color}
          isHovered={isHovered}
        />
      ))}

      {/* Neural Nodes - LARGER */}
      {nodes.map((node, i) => (
        <NeuralNode
          key={`node-${i}`}
          position={node.position}
          color={node.color}
          size={0.18}
          pulseSpeed={1 + i * 0.1}
          isHovered={isHovered}
        />
      ))}

      {/* Central 3D Brain */}
      <Brain3D isHovered={isHovered} />
    </group>
  );
}

// Background Particles - MORE VISIBLE
function BackgroundParticles({ isHovered }: { isHovered: boolean }) {
  const particlesRef = useRef<THREE.Points>(null);
  const particleCount = 150;

  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 18;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    return pos;
  }, []);

  const colors = useMemo(() => {
    const cols = new Float32Array(particleCount * 3);
    const palette = [
      new THREE.Color('#0ea5e9'),
      new THREE.Color('#8b5cf6'),
      new THREE.Color('#ec4899'),
    ];
    
    for (let i = 0; i < particleCount; i++) {
      const color = palette[Math.floor(Math.random() * palette.length)];
      cols[i * 3] = color.r;
      cols[i * 3 + 1] = color.g;
      cols[i * 3 + 2] = color.b;
    }
    return cols;
  }, []);

  useFrame(() => {
    if (particlesRef.current) {
      const speed = isHovered ? 0.0002 : 0.0008;
      particlesRef.current.rotation.y += speed;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// Main Component
export default function ParticleAnimation() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="w-full h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Canvas
        camera={{ position: [0, 0, 12], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        {/* Lighting - BRIGHTER */}
        <ambientLight intensity={1} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <pointLight position={[5, 3, 5]} intensity={1.2} color="#0ea5e9" />
        <pointLight position={[-5, -3, 5]} intensity={1} color="#8b5cf6" />
        <pointLight position={[0, 0, 8]} intensity={0.8} color="#ec4899" />
        
        {/* Neural Network */}
        <NeuralNetwork isHovered={isHovered} />
        
        {/* Background Particles */}
        <BackgroundParticles isHovered={isHovered} />
      </Canvas>
    </div>
  );
}
