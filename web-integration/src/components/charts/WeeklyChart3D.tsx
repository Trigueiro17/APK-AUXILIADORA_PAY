'use client';

import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Box, Cylinder, Cone } from '@react-three/drei';
import * as THREE from 'three';

interface WeeklyData {
  day: string;
  sales: number;
  revenue: number;
  products: number;
}

interface WeeklyChart3DProps {
  data: WeeklyData[];
  width?: number;
  height?: number;
}

// Componente para uma barra 3D com múltiplas métricas
function MultiMetricBar({ position, salesHeight, revenueHeight, productsHeight, label, data }: {
  position: [number, number, number];
  salesHeight: number;
  revenueHeight: number;
  productsHeight: number;
  label: string;
  data: WeeklyData;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const [hovered, setHovered] = React.useState(false);
  const [selectedMetric, setSelectedMetric] = React.useState<'sales' | 'revenue' | 'products' | null>(null);

  useFrame((state) => {
    if (groupRef.current) {
      // Animação de rotação suave
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3 + position[0]) * 0.05;
      
      // Efeito de hover
      if (hovered) {
        groupRef.current.scale.y = 1.1;
      } else {
        groupRef.current.scale.y = 1;
      }
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Barra de Vendas (Azul) */}
      <Box
        args={[0.6, salesHeight, 0.6]}
        position={[-0.8, salesHeight / 2, 0]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={() => setSelectedMetric(selectedMetric === 'sales' ? null : 'sales')}
      >
        <meshStandardMaterial 
          color={selectedMetric === 'sales' ? '#1d4ed8' : '#3b82f6'}
          metalness={0.3}
          roughness={0.4}
          emissive={selectedMetric === 'sales' ? '#1d4ed8' : '#000000'}
          emissiveIntensity={selectedMetric === 'sales' ? 0.2 : 0}
        />
      </Box>
      
      {/* Barra de Receita (Verde) */}
      <Box
        args={[0.6, revenueHeight, 0.6]}
        position={[0, revenueHeight / 2, 0]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={() => setSelectedMetric(selectedMetric === 'revenue' ? null : 'revenue')}
      >
        <meshStandardMaterial 
          color={selectedMetric === 'revenue' ? '#047857' : '#10b981'}
          metalness={0.3}
          roughness={0.4}
          emissive={selectedMetric === 'revenue' ? '#047857' : '#000000'}
          emissiveIntensity={selectedMetric === 'revenue' ? 0.2 : 0}
        />
      </Box>
      
      {/* Barra de Produtos (Laranja) */}
      <Box
        args={[0.6, productsHeight, 0.6]}
        position={[0.8, productsHeight / 2, 0]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={() => setSelectedMetric(selectedMetric === 'products' ? null : 'products')}
      >
        <meshStandardMaterial 
          color={selectedMetric === 'products' ? '#c2410c' : '#f97316'}
          metalness={0.3}
          roughness={0.4}
          emissive={selectedMetric === 'products' ? '#c2410c' : '#000000'}
          emissiveIntensity={selectedMetric === 'products' ? 0.2 : 0}
        />
      </Box>
      
      {/* Base comum */}
      <Cylinder args={[1.5, 1.5, 0.1]} position={[0, 0.05, 0]}>
        <meshStandardMaterial color="#374151" />
      </Cylinder>
      
      {/* Label do dia */}
      <Text
        position={[0, -0.8, 0]}
        fontSize={0.4}
        color="#1f2937"
        anchorX="center"
        anchorY="middle"
        rotation={[-Math.PI / 6, 0, 0]}
      >
        {label}
      </Text>
      
      {/* Valores das métricas */}
      {selectedMetric === 'sales' && (
        <Text
          position={[-0.8, salesHeight + 0.5, 0]}
          fontSize={0.3}
          color="#3b82f6"
          anchorX="center"
          anchorY="middle"
        >
          {data.sales} vendas
        </Text>
      )}
      
      {selectedMetric === 'revenue' && (
        <Text
          position={[0, revenueHeight + 0.5, 0]}
          fontSize={0.3}
          color="#10b981"
          anchorX="center"
          anchorY="middle"
        >
          R$ {data.revenue.toLocaleString()}
        </Text>
      )}
      
      {selectedMetric === 'products' && (
        <Text
          position={[0.8, productsHeight + 0.5, 0]}
          fontSize={0.3}
          color="#f97316"
          anchorX="center"
          anchorY="middle"
        >
          {data.products} produtos
        </Text>
      )}
      
      {/* Indicadores de seta para métricas ativas */}
      {selectedMetric && (
        <Cone
          args={[0.2, 0.5]}
          position={[
            selectedMetric === 'sales' ? -0.8 : selectedMetric === 'revenue' ? 0 : 0.8,
            (selectedMetric === 'sales' ? salesHeight : selectedMetric === 'revenue' ? revenueHeight : productsHeight) + 1,
            0
          ]}
          rotation={[0, 0, Math.PI]}
        >
          <meshBasicMaterial color="#fbbf24" />
        </Cone>
      )}
    </group>
  );
}

// Componente para a legenda 3D
function Legend3D() {
  return (
    <group position={[-8, 4, 0]}>
      {/* Título da legenda */}
      <Text
        position={[0, 2, 0]}
        fontSize={0.5}
        color="#1f2937"
        anchorX="center"
        anchorY="middle"
      >
        Métricas
      </Text>
      
      {/* Item Vendas */}
      <group position={[0, 1, 0]}>
        <Box args={[0.3, 0.3, 0.3]} position={[-1, 0, 0]}>
          <meshStandardMaterial color="#3b82f6" />
        </Box>
        <Text
          position={[0, 0, 0]}
          fontSize={0.3}
          color="#1f2937"
          anchorX="left"
          anchorY="middle"
        >
          Vendas
        </Text>
      </group>
      
      {/* Item Receita */}
      <group position={[0, 0.3, 0]}>
        <Box args={[0.3, 0.3, 0.3]} position={[-1, 0, 0]}>
          <meshStandardMaterial color="#10b981" />
        </Box>
        <Text
          position={[0, 0, 0]}
          fontSize={0.3}
          color="#1f2937"
          anchorX="left"
          anchorY="middle"
        >
          Receita
        </Text>
      </group>
      
      {/* Item Produtos */}
      <group position={[0, -0.4, 0]}>
        <Box args={[0.3, 0.3, 0.3]} position={[-1, 0, 0]}>
          <meshStandardMaterial color="#f97316" />
        </Box>
        <Text
          position={[0, 0, 0]}
          fontSize={0.3}
          color="#1f2937"
          anchorX="left"
          anchorY="middle"
        >
          Produtos
        </Text>
      </group>
    </group>
  );
}

// Componente para o grid 3D
function Grid3D() {
  return (
    <group>
      {/* Plano base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <planeGeometry args={[25, 15]} />
        <meshStandardMaterial 
          color="#f8fafc" 
          transparent 
          opacity={0.8}
        />
      </mesh>
      
      {/* Linhas do grid */}
      {Array.from({ length: 26 }, (_, i) => (
        <mesh key={`x-${i}`} position={[i - 12.5, 0, 0]}>
          <boxGeometry args={[0.02, 0.02, 15]} />
          <meshBasicMaterial color="#e2e8f0" />
        </mesh>
      ))}
      
      {Array.from({ length: 16 }, (_, i) => (
        <mesh key={`z-${i}`} position={[0, 0, i - 7.5]}>
          <boxGeometry args={[25, 0.02, 0.02]} />
          <meshBasicMaterial color="#e2e8f0" />
        </mesh>
      ))}
    </group>
  );
}

// Componente principal da cena 3D
function WeeklyChart3DScene({ data }: { data: WeeklyData[] }) {
  const { maxSales, maxRevenue, maxProducts } = useMemo(() => {
    return {
      maxSales: Math.max(...data.map(d => d.sales), 1),
      maxRevenue: Math.max(...data.map(d => d.revenue), 1),
      maxProducts: Math.max(...data.map(d => d.products), 1)
    };
  }, [data]);

  return (
    <>
      {/* Iluminação */}
      <ambientLight intensity={0.6} />
      <directionalLight 
        position={[15, 15, 10]} 
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-10, 10, -10]} intensity={0.4} color="#3b82f6" />
      <pointLight position={[10, 10, 10]} intensity={0.4} color="#10b981" />
      <spotLight position={[0, 20, 0]} intensity={0.5} angle={Math.PI / 4} />
      
      {/* Grid 3D */}
      <Grid3D />
      
      {/* Legenda */}
      <Legend3D />
      
      {/* Barras de dados */}
      {data.map((item, index) => {
        const salesHeight = (item.sales / maxSales) * 4;
        const revenueHeight = (item.revenue / maxRevenue) * 4;
        const productsHeight = (item.products / maxProducts) * 4;
        const xPosition = (index - data.length / 2) * 3;
        
        return (
          <MultiMetricBar
            key={item.day}
            position={[xPosition, 0, 0]}
            salesHeight={salesHeight}
            revenueHeight={revenueHeight}
            productsHeight={productsHeight}
            label={item.day}
            data={item}
          />
        );
      })}
      
      {/* Título principal */}
      <Text
        position={[0, 7, -5]}
        fontSize={1.2}
        color="#1f2937"
        anchorX="center"
        anchorY="middle"

      >
        Dashboard Semanal
      </Text>
      
      {/* Subtítulo */}
      <Text
        position={[0, 6, -5]}
        fontSize={0.5}
        color="#6b7280"
        anchorX="center"
        anchorY="middle"
      >
        Vendas, Receita e Produtos por Dia da Semana
      </Text>
      
      {/* Instruções de interação */}
      <Text
        position={[8, -2, 0]}
        fontSize={0.3}
        color="#9ca3af"
        anchorX="center"
        anchorY="middle"
      >
        Clique nas barras para ver detalhes
      </Text>
      
      {/* Controles de órbita */}
      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        maxPolarAngle={Math.PI / 1.8}
        minDistance={10}
        maxDistance={30}
        autoRotate={false}
      />
    </>
  );
}

export default function WeeklyChart3D({ data, width = 900, height = 700 }: WeeklyChart3DProps) {
  // Dados de exemplo se não fornecidos
  const defaultData: WeeklyData[] = [
    { day: 'Segunda', sales: 25, revenue: 2500, products: 15 },
    { day: 'Terça', sales: 32, revenue: 3200, products: 20 },
    { day: 'Quarta', sales: 28, revenue: 2800, products: 18 },
    { day: 'Quinta', sales: 35, revenue: 3500, products: 22 },
    { day: 'Sexta', sales: 42, revenue: 4200, products: 28 },
    { day: 'Sábado', sales: 38, revenue: 3800, products: 25 },
    { day: 'Domingo', sales: 30, revenue: 3000, products: 19 },
  ];

  const chartData = data && data.length > 0 ? data : defaultData;

  return (
    <div 
      style={{ width, height }}
      className="border rounded-lg overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50"
    >
      <Canvas
        camera={{ 
          position: [15, 10, 15], 
          fov: 60 
        }}
        shadows
        style={{ 
          background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 50%, #cbd5e1 100%)' 
        }}
        gl={{ antialias: true, alpha: false }}
      >
        <Suspense fallback={null}>
          <WeeklyChart3DScene data={chartData} />
        </Suspense>
      </Canvas>
    </div>
  );
}