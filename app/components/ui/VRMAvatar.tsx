"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VRMLoaderPlugin, VRM, VRMExpressionPresetName } from "@pixiv/three-vrm";

interface VRMAvatarProps {
  isTalking: boolean;
  vrmUrl?: string; // e.g. "/sara.vrm"
}

export default function VRMAvatar({
  isTalking,
  vrmUrl = "/sara.vrm", // Default path inside public folder
}: VRMAvatarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const vrmRef = useRef<VRM | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Setup Three.js Scene
    const scene = new THREE.Scene();
    
    // Setup Camera
    const camera = new THREE.PerspectiveCamera(
      35,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      20.0
    );
    // Position camera for a portrait shot (head & shoulders)
    camera.position.set(0.0, 1.4, 1.5);

    // Setup Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    // Background color is handled by the parent container, so use alpha: true
    containerRef.current.appendChild(renderer.domElement);

    // Setup Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(1.0, 1.0, 1.0).normalize();
    scene.add(directionalLight);

    // 2. Load VRM Model
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));

    loader.load(
      vrmUrl,
      (gltf) => {
        const vrm = gltf.userData.vrm as VRM;
        if (!vrm) {
          setError("Failed to load VRM data from model.");
          return;
        }

        vrmRef.current = vrm;
        scene.add(vrm.scene);
        
        // Rotate the model slightly so she faces the camera perfectly
        vrm.scene.rotation.y = Math.PI;

        // Fix rendering order for materials (alpha issues in some VRMs)
        vrm.scene.traverse((obj) => {
          obj.frustumCulled = false;
        });

      },
      (progress) => {
        // console.log("Loading model...", 100.0 * (progress.loaded / progress.total), "%");
      },
      (err) => {
        console.error(err);
        setError("Missing 3D Model: Place 'sara.vrm' in your public folder.");
      }
    );

    // 3. Animation Loop Variables
    const clock = new THREE.Clock();
    let frameId: number;
    let blinkTimer = 0;
    let isBlinking = false;
    let blinkDuration = 0.15;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const deltaTime = clock.getDelta();
      const currentVrm = vrmRef.current;

      if (currentVrm) {
        const time = clock.elapsedTime;

        // A. Breathing & Organic Posture
        const spine = currentVrm.humanoid?.getNormalizedBoneNode("spine");
        if (spine) {
          // Complex sine waves for organic breathing
          spine.rotation.x = Math.sin(time * 1.2) * 0.015 + Math.sin(time * 0.4) * 0.01;
          spine.rotation.y = Math.sin(time * 0.8) * 0.005;
        }
        
        // Organic head tracking & swaying
        const neck = currentVrm.humanoid?.getNormalizedBoneNode("neck");
        const head = currentVrm.humanoid?.getNormalizedBoneNode("head");
        if (neck && head) {
          const yaw = Math.sin(time * 0.5) * 0.02 + Math.sin(time * 1.1) * 0.01;
          const pitch = Math.sin(time * 0.7) * 0.01 + (isTalking ? Math.abs(Math.sin(time * 3)) * 0.02 : 0);
          const roll = Math.cos(time * 0.4) * 0.015;
          
          neck.rotation.y = yaw * 0.5;
          neck.rotation.x = pitch * 0.5;
          neck.rotation.z = roll * 0.5;

          head.rotation.y = yaw;
          head.rotation.x = pitch;
          head.rotation.z = roll;
        }

        // B. Blinking Animation (Double Blinks)
        blinkTimer += deltaTime;
        if (!isBlinking && blinkTimer > 2 + Math.random() * 5) {
          isBlinking = true;
          blinkTimer = 0;
          // 25% chance of a double blink
          blinkDuration = Math.random() < 0.25 ? 0.35 : 0.15; 
        }

        if (isBlinking) {
          let blinkPhase = 0;
          if (blinkDuration > 0.2) {
             // Double blink pattern
             const t = blinkTimer / blinkDuration;
             blinkPhase = Math.max(0, Math.sin(t * Math.PI * 2.5)); // Two peaks
          } else {
             // Single blink
             blinkPhase = Math.max(0, Math.sin((blinkTimer / blinkDuration) * Math.PI));
          }
          
          if (blinkTimer > blinkDuration) {
            isBlinking = false;
            blinkTimer = 0;
            currentVrm.expressionManager?.setValue(VRMExpressionPresetName.Blink, 0);
          } else {
            currentVrm.expressionManager?.setValue(VRMExpressionPresetName.Blink, blinkPhase);
          }
        }

        // C. Advanced Lip-Sync / Talking Animation
        if (isTalking) {
          // Mix shapes to simulate natural phonetic speech
          const aaPhase = Math.max(0, Math.sin(time * 18) * 0.8);
          const eePhase = Math.max(0, Math.cos(time * 22) * 0.5);
          const ihPhase = Math.max(0, Math.sin(time * 14 + 1) * 0.4);
          
          currentVrm.expressionManager?.setValue(VRMExpressionPresetName.Aa, aaPhase);
          currentVrm.expressionManager?.setValue(VRMExpressionPresetName.Ee, eePhase);
          currentVrm.expressionManager?.setValue(VRMExpressionPresetName.Ih, ihPhase);
          currentVrm.expressionManager?.setValue(VRMExpressionPresetName.Happy, 0.2);
        } else {
          // Reset mouth
          currentVrm.expressionManager?.setValue(VRMExpressionPresetName.Aa, 0);
          currentVrm.expressionManager?.setValue(VRMExpressionPresetName.Ee, 0);
          currentVrm.expressionManager?.setValue(VRMExpressionPresetName.Ih, 0);
          // Friendly idle smile
          currentVrm.expressionManager?.setValue(VRMExpressionPresetName.Happy, 0.1);
        }

        // Update VRM Engine
        currentVrm.update(deltaTime);
      }

      renderer.render(scene, camera);
    };

    animate();

    // Handle Resize
    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(frameId);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [vrmUrl, isTalking]);

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-slate-800 to-black overflow-hidden flex items-center justify-center rounded-3xl">
      {error && (
        <div className="absolute inset-0 z-20 bg-black/80 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm border border-red-500/30 rounded-3xl">
          <div className="text-4xl mb-4">🤖</div>
          <h3 className="text-red-400 font-bold mb-2 uppercase tracking-widest text-sm">3D Avatar Missing</h3>
          <p className="text-white/60 text-xs leading-relaxed max-w-xs">
            {error}
          </p>
          <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10 text-left w-full max-w-sm">
            <div className="text-[10px] text-cyan-400 uppercase tracking-widest font-bold mb-2">How to add character:</div>
            <ol className="text-[10px] text-white/50 space-y-1 list-decimal list-inside">
              <li>Download <b>VRoid Studio</b> (free).</li>
              <li>Create a female character with a black coat and white band.</li>
              <li>Export as VRM (v0.0 is best for compatibility).</li>
              <li>Rename the file to <b>sara.vrm</b>.</li>
              <li>Place it inside the <b>public/</b> folder of this project.</li>
            </ol>
          </div>
        </div>
      )}
      
      {/* Three.js Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 z-10 w-full h-full" />
      
      {/* Subtle UI Overlay to show it's "AI Sara" */}
      <div className="absolute bottom-4 right-4 z-20">
        <div className="flex items-center gap-2 bg-black/50 px-2 py-1 rounded border border-cyan-500/30 backdrop-blur-sm">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <div className="text-[9px] text-cyan-400 font-bold uppercase tracking-widest">3D Neural Engine Active</div>
        </div>
      </div>
    </div>
  );
}
