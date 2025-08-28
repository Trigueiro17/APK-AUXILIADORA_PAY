'use client';

import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Sphere, Cylinder } from '@react-three/drei';
import * as THREE from 'three';

interface RevenueData {
  period: string;
  revenue: number;
  growth: number;
}

interface RevenueChart3DProps {
  data: RevenueData[];
  width?: number;
  height?: number;
}

// Componente para uma esfera 3D animada representando receita
function AnimatedRevenueSphere({ position, size, color, label, value, growth }: {
  position: [number, number, number];
  size: number;
  color: string;
  label: string;
  value: number;
  growth: number;
}) {
  const sphereRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = React.useState(false);

  useFrame((state) => {
    if (sphereRef.current) {
      // Animação de flutuação
      sphereRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.2;
      
      // Rotação suave
      sphereRef.current.rotation.y += 0.01;
      
      // Efeito de hover
      if (hovered) {
        sphereRef.current.scale.setScalar(1.2);
      } else {
        sphereRef.current.scale.setScalar(1);
      }
    }
  });

  const growthColor = growth >= 0 ? '#10b981' : '#ef4444';

  return (
    <group position={position}>
      {/* Esfera principal */}
      <Sphere
        ref={sphereRef}
        args={[size, 32, 32]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial 
          color={hovered ? '#fbbf24' : color}
          metalness={0.4}
          roughness={0.2}
          emissive={hovered ? '#fbbf24' : '#000000'}
          emissiveIntensity={hovered ? 0.1 : 0}
        />
      </Sphere>
      
      {/* Cilindro de base */}
      <Cylinder args={[size * 0.8, size * 0.8, 0.1]} position={[0, -size - 0.5, 0]}>
        <meshStandardMaterial color="#374151" />
      </Cylinder>
      
      {/* Label do período */}
      <Text
        position={[0, -size - 1, 0]}
        fontSize={0.4}
        color="#1f2937"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
      
      {/* Valor da receita */}
      <Text
        position={[0, size + 1, 0]}
        fontSize={0.3}
        color="#059669"
        anchorX="center"
        anchorY="middle"
      >
        R$ {value.toLocaleString()}
      </Text>
      
      {/* Indicador de crescimento */}
      <Text
        position={[0, size + 1.5, 0]}
        fontSize={0.25}
        color={growthColor}
        anchorX="center"
        anchorY="middle"
      >
        {growth >= 0 ? '↗' : '↘'} {Math.abs(growth).toFixed(1)}%
      </Text>
      
      {/* Partículas de efeito */}
      {hovered && (
        <group>
          {Array.from({ length: 8 }, (_, i) => {
            const angle = (i / 8) * Math.PI * 2;
            const radius = size * 1.5;
            return (
              <Sphere
                key={i}
                args={[0.05, 8, 8]}
                position={[
                  Math.cos(angle) * radius,
                  Math.sin(angle * 2) * 0.5,
                  Math.sin(angle) * radius
                ]}
              >
                <meshBasicMaterial color="#fbbf24" />
              </Sphere>
            );
          })}
        </group>
      )}
    </group>
  );
}

// Componente para conexões entre esferas
function ConnectionLines({ data }: { data: RevenueData[] }) {
  const points = useMemo(() => {
    const pts = [];
    for (let i = 0; i < data.length; i++) {
      const x = (i - data.length / 2) * 4;
      const y = 2;
      const z = 0;
      pts.push(new THREE.Vector3(x, y, z));
    }
    return pts;
  }, [data]);

  const curve = useMemo(() => {
    return new THREE.CatmullRomCurve3(points);
  }, [points]);

  return (
    <mesh>
      <tubeGeometry args={[curve, 100, 0.05, 8, false]} />
      <meshBasicMaterial color="#6366f1" transparent opacity={0.6} />
    </mesh>
  );
}

// Componente principal da cena 3D
function RevenueChart3DScene({ data }: { data: RevenueData[] }) {
  const maxRevenue = useMemo(() => {
    return Math.max(...data.map(d => d.revenue), 1);
  }, [data]);

  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
    '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
  ];

  return (
    <>
      {/* Iluminação avançada */}
      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-10, 10, -10]} intensity={0.5} color="#3b82f6" />
      <pointLight position={[10, -10, 10]} intensity={0.5} color="#10b981" />
      
      {/* Plano de fundo com gradiente */}
      <mesh position={[0, -3, -10]}>
        <planeGeometry args={[30, 20]} />
        <meshBasicMaterial 
          color="#1e293b" 
          transparent 
          opacity={0.3}
        />
      </mesh>
      
      {/* Conexões entre pontos */}
      <ConnectionLines data={data} />
      
      {/* Esferas de receita */}
      {data.map((item, index) => {
        const size = (item.revenue / maxRevenue) * 1.5 + 0.5; // Tamanho entre 0.5 e 2
        const xPosition = (index - data.length / 2) * 4;
        
        return (
          <AnimatedRevenueSphere
            key={item.period}
            position={[xPosition, 2, 0]}
            size={size}
            color={colors[index % colors.length]}
            label={item.period}
            value={item.revenue}
            growth={item.growth}
          />
        );
      })}
      
      {/* Título do gráfico */}
      <Text
        position={[0, 6, -3]}
        fontSize={1}
        color="#f8fafc"
        anchorX="center"
        anchorY="middle"
      >
        Receita por Período
      </Text>
      
      {/* Subtítulo */}
      <Text
        position={[0, 5.2, -3]}
        fontSize={0.4}
        color="#cbd5e1"
        anchorX="center"
        anchorY="middle"
      >
        Evolução da receita com indicadores de crescimento
      </Text>
      
      {/* Controles de órbita */}
      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        maxPolarAngle={Math.PI / 1.5}
        minDistance={8}
        maxDistance={25}
        autoRotate={true}
        autoRotateSpeed={0.5}
      />
    </>
  );
}

export default function RevenueChart3D({ data, width = 800, height = 600 }: RevenueChart3DProps) {
  // Dados de exemplo se não fornecidos
  const defaultData: RevenueData[] = [
    { period: 'Jan', revenue: 15000, growth: 12.5 },
    { period: 'Fev', revenue: 18000, growth: 20.0 },
    { period: 'Mar', revenue: 16500, growth: -8.3 },
    { period: 'Abr', revenue: 22000, growth: 33.3 },
    { period: 'Mai', revenue: 25000, growth: 13.6 },
    { period: 'Jun', revenue: 28000, growth: 12.0 },
  ];

  const chartData = data && data.length > 0 ? data : defaultData;

  return (
    <div 
      style={{ width, height }}
      className="border rounded-lg overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900"
    >
      <Canvas
        camera={{ 
          position: [12, 8, 12], 
          fov: 50 
        }}
        shadows
        style={{ 
          background: 'radial-gradient(ellipse at center, #1e1b4b 0%, #0f0f23 70%, #000000 100%)' 
        }}
        gl={{ antialias: true, alpha: false }}
      >
        <Suspense fallback={null}>
          <RevenueChart3DScene data={chartData} />
        </Suspense>
      </Canvas>
    </div>
  );
}