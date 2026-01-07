'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float } from '@react-three/drei';
import * as THREE from 'three';
import { useRouter } from 'next/navigation';

/**
 * 粒子系統核心組件
 */
function ParticleSystem({ clickCount }) {
  const count = 4000; // 粒子數量：4000顆，GPU 輕鬆處理
  const meshRef = useRef();

  // 產生初始隨機位置
  const [positions, colors] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();

    for (let i = 0; i < count; i++) {
      // 初始：大範圍散佈
      positions[i * 3] = (Math.random() - 0.5) * 50;     // x
      positions[i * 3 + 1] = (Math.random() - 0.5) * 50; // y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 50; // z

      // 初始顏色：銀白/深藍
      color.setHSL(Math.random() * 0.1 + 0.5, 0.5, Math.random() * 0.5 + 0.5);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    return [positions, colors];
  }, []);

  // 每個粒子的額外數據 (速度、偏移量)
  const particlesData = useMemo(() => {
    return new Array(count).fill(0).map(() => ({
      velocity: [0, 0, 0],
      target: [0, 0, 0],
      angle: Math.random() * Math.PI * 2,
      radius: Math.random() * 5 + 2,
      speed: Math.random() * 0.02 + 0.01
    }));
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;

    const time = state.clock.getElapsedTime();
    const positions = meshRef.current.geometry.attributes.position.array;
    const colors = meshRef.current.geometry.attributes.color.array;
    const colorHelper = new THREE.Color();

    // 根據階段 (clickCount) 計算每個粒子的運動
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const data = particlesData[i];

      let tx = positions[i3];
      let ty = positions[i3 + 1];
      let tz = positions[i3 + 2];

      // --- Stage 0: 渾沌 (Chaos / Nebula) ---
      if (clickCount === 0) {
        // 緩慢漂浮 + 噪聲
        tx += Math.sin(time * 0.5 + data.angle) * 0.01;
        ty += Math.cos(time * 0.3 + data.angle) * 0.01;

        // 顏色：冷色調
        colorHelper.setHSL(0.6 + Math.sin(time + i) * 0.1, 0.8, 0.6);
      }

      // --- Stage 1: 雙螺旋 (Double Helix / DNA) ---
      else if (clickCount === 1) {
        // 形成兩股交纏的螺旋，像 DNA 或雙星系統
        const angle = time * (0.3 + data.speed) + data.angle;
        const height = (data.angle - Math.PI) * 4; // 垂直分佈

        // 分成兩組：根據 id 的奇偶性
        const isArmA = i % 2 === 0;
        const phaseOffset = isArmA ? 0 : Math.PI; // 相差 180 度

        const radius = 6 + Math.sin(angle * 2 + data.angle) * 2; // 讓半徑也呼吸

        // 螺旋公式
        const targetX = Math.cos(angle + phaseOffset) * radius;
        const targetY = Math.sin(time * 0.5 + data.angle) * 3; // 稍微上下浮動
        const targetZ = Math.sin(angle + phaseOffset) * radius;

        // Lerp 移動 (稍微慢一點，展現流動感)
        tx += (targetX - tx) * 0.04;
        ty += (targetY - ty) * 0.04;
        tz += (targetZ - tz) * 0.04;

        // 顏色：雙色調 (冰火交織)
        if (isArmA) {
          colorHelper.setHSL(0.6, 0.8, 0.6); // 藍
        } else {
          colorHelper.setHSL(0.05, 0.9, 0.6); // 橘
        }
      }

      // --- Stage 2: 蟲洞 (Wormhole Tunnel) ---
      else if (clickCount === 2) {
        // 形成一個深邃的蟲洞隧道，準備穿越
        const angle = data.angle + time * 0.5; // 快速旋轉
        const radius = 5 + Math.sin(time * 2 + i * 0.01) * 0.5; // 隧道壁會呼吸蠕動
        const length = 40; // 隧道長度

        // 讓粒子分佈在長長的圓柱體上
        const zPos = ((i / count) * length) - (length / 2); // -20 到 20

        const targetX = Math.cos(angle) * radius;
        const targetY = Math.sin(angle) * radius;
        const targetZ = zPos + Math.sin(time + zPos) * 2; // 增加一點波浪扭曲

        // Lerp 移動
        tx += (targetX - tx) * 0.08;
        ty += (targetY - ty) * 0.08;
        tz += (targetZ - tz) * 0.08;

        // 顏色：科技青，越深處越暗
        const depth = (zPos + length / 2) / length; // 0 to 1
        colorHelper.setHSL(0.5, 0.8, 0.3 + depth * 0.5);
      }

      // --- Stage 3: 關機前 (Overload) ---
      else if (clickCount >= 3) {
        // 保持行星狀態，但加速旋轉並變亮
        const theta = data.angle + time * 2.0; // 高速旋轉
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 4;

        const targetX = r * Math.sin(phi) * Math.cos(theta);
        const targetY = r * Math.sin(phi) * Math.sin(theta);
        const targetZ = r * Math.cos(phi);

        tx += (targetX - tx) * 0.2;
        ty += (targetY - ty) * 0.2;
        tz += (targetZ - tz) * 0.2;

        // 顏色：極亮白，模擬CRT過載
        colorHelper.setHSL(0.6, 0.2, 1.0);
      }

      // 更新位置
      positions[i3] = tx;
      positions[i3 + 1] = ty;
      positions[i3 + 2] = tz;

      // 更新顏色 (使用 lerp 讓顏色漸變更平滑)
      colors[i3] = colorHelper.r;
      colors[i3 + 1] = colorHelper.g;
      colors[i3 + 2] = colorHelper.b;
    }

    meshRef.current.geometry.attributes.position.needsUpdate = true;
    meshRef.current.geometry.attributes.color.needsUpdate = true;

    // 讓整體慢慢旋轉
    meshRef.current.rotation.y += 0.001;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      {/* 粒子材質設定 */}
      <pointsMaterial
        size={0.15}            // 粒子大小
        vertexColors      // 啟用頂點顏色
        transparent
        opacity={0.8}
        sizeAttenuation   // 遠小近大
        depthWrite={false}
        blending={THREE.AdditiveBlending} // 發光疊加效果
      />
    </points>
  );
}

export default function HomePage() {
  const [clickCount, setClickCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (clickCount >= 3) {
      // 0.3秒後跳轉 (配合 CRT 動畫時間)
      const timer = setTimeout(() => {
        router.push('/map');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [clickCount, router]);

  const handleClick = () => {
    if (clickCount < 3) {
      setClickCount(prev => prev + 1);
    }
  };

  return (
    <div
      className={`w-full h-screen bg-black cursor-pointer relative overflow-hidden ${clickCount >= 3 ? 'animate-crt-off' : ''}`}
      onClick={handleClick}
    >
      {/* Three.js Canvas */}
      <Canvas camera={{ position: [0, 0, 20], fov: 45 }}>
        {/* 背景星空 */}
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

        {/* 粒子系統 */}
        <Float speed={1} rotationIntensity={0.5} floatIntensity={0.2}>
          <ParticleSystem clickCount={clickCount} />
        </Float>
      </Canvas>

    </div>
  );
}
