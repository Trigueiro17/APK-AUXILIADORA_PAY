'use client';

import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Box } from '@react-three/drei';
import * as THREE from 'three';

interface SalesData {
  day: string;
  sales: number;
  revenue: number;
}

interface SalesChart3DProps {
  data: SalesData[];
  width?: number;
  height?: number;
}

// Componente para uma barra 3D animada
function AnimatedBar({ position, height, color, label, value }: {
  position: [number, number, number];
  height: number;
  color: string;
  label: string;
  value: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = React.useState(false);
  const [clicked, setClicked] = React.useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      // Animação suave de rotação
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      
      // Efeito de hover
      if (hovered) {
        meshRef.current.scale.setScalar(1.1);
      } else {
        meshRef.current.scale.setScalar(1);
      }
    }
  });

  return (
    <group position={position}>
      {/* Barra principal */}
      <Box
        ref={meshRef}
        args={[0.8, height, 0.8]}
        position={[0, height / 2, 0]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={() => setClicked(!clicked)}
      >
        <meshStandardMaterial 
          color={hovered ? '#60a5fa' : color}
          metalness={0.3}
          roughness={0.4}
        />
      </Box>
      
      {/* Base da barra */}
      <Box args={[1, 0.1, 1]} position={[0, 0.05, 0]}>
        <meshStandardMaterial color="#374151" />
      </Box>
      
      {/* Label do dia */}
      <Text
        position={[0, -0.5, 0]}
        fontSize={0.3}
        color="#1f2937"
        anchorX="center"
        anchorY="middle"
        rotation={[-Math.PI / 2, 0, 0]}
      >
        {label}
      </Text>
      
      {/* Valor das vendas */}
      <Text
        position={[0, height + 0.5, 0]}
        fontSize={0.25}
        color="#059669"
        anchorX="center"
        anchorY="middle"
      >
        {value}
      </Text>
    </group>
  );
}

// Componente para o grid do chão
function GridFloor() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial 
          color="#f3f4f6" 
          transparent 
          opacity={0.8}
        />
      </mesh>
      
      {/* Linhas do grid */}
      {Array.from({ length: 21 }, (_, i) => (
        <group key={i}>
          <mesh position={[i - 10, 0, 0]}>
            <boxGeometry args={[0.02, 0.02, 20]} />
            <meshBasicMaterial color="#d1d5db" />
          </mesh>
          <mesh position={[0, 0, i - 10]}>
            <boxGeometry args={[20, 0.02, 0.02]} />
            <meshBasicMaterial color="#d1d5db" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// Componente principal do gráfico 3D
function Chart3DScene({ data }: { data: SalesData[] }) {
  const maxSales = useMemo(() => {
    return Math.max(...data.map(d => d.sales), 1);
  }, [data]);

  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
    '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
  ];

  return (
    <>
      {/* Iluminação */}
      <ambientLight intensity={0.6} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-10, -10, -10]} intensity={0.3} />
      
      {/* Grid do chão */}
      <GridFloor />
      
      {/* Barras de dados */}
      {data.map((item, index) => {
        const height = (item.sales / maxSales) * 5; // Escala máxima de 5 unidades
        const xPosition = (index - data.length / 2) * 2;
        
        return (
          <AnimatedBar
            key={item.day}
            position={[xPosition, 0, 0]}
            height={height}
            color={colors[index % colors.length]}
            label={item.day}
            value={item.sales}
          />
        );
      })}
      
      {/* Título do gráfico */}
      <Text
        position={[0, 6, -5]}
        fontSize={0.8}
        color="#1f2937"
        anchorX="center"
        anchorY="middle"
      >
        Vendas por Dia
      </Text>
      
      {/* Controles de órbita */}
      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        maxPolarAngle={Math.PI / 2}
        minDistance={5}
        maxDistance={20}
      />
    </>
  );
}

export default function SalesChart3D({ data, width = 800, height = 400 }: SalesChart3DProps) {
  // Dados de exemplo se não houver dados
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return [
        { day: 'Seg', sales: 45, revenue: 2250 },
        { day: 'Ter', sales: 52, revenue: 2600 },
        { day: 'Qua', sales: 38, revenue: 1900 },
        { day: 'Qui', sales: 61, revenue: 3050 },
        { day: 'Sex', sales: 73, revenue: 3650 },
        { day: 'Sáb', sales: 89, revenue: 4450 },
        { day: 'Dom', sales: 67, revenue: 3350 },
      ];
    }
    return data;
  }, [data]);

  const maxSales = Math.max(...chartData.map(d => d.sales));

  return (
    <div style={{ width, height }}>
      <Canvas
        camera={{ position: [10, 10, 10], fov: 50 }}
        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
        gl={{ antialias: true, alpha: false }}
      >
        <Suspense fallback={null}>
          <Chart3DScene data={chartData} />
        </Suspense>
      </Canvas>
    </div>
  );
}