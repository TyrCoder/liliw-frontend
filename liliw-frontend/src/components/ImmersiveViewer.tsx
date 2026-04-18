'use client';

import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Headphones, Camera, Download } from 'lucide-react';

interface ImmersiveViewerProps {
  title: string;
  imageUrl: string;
  description?: string;
}

export default function ImmersiveViewer({ title, imageUrl, description }: ImmersiveViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVRSupported, setIsVRSupported] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check WebXR support
    if (navigator.xr) {
      navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
        setIsVRSupported(supported);
      });
    }
  }, []);

  useEffect(() => {
    if (!canvasRef.current || !imageUrl) return;

    setIsLoading(true);

    // Initialize Three.js for panoramic viewer
    const initPanorama = async () => {
      try {
        // Dynamically import Three.js to avoid SSR issues
        const THREE = await import('three');

        const canvas = canvasRef.current!;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
          75,
          canvas.clientWidth / canvas.clientHeight,
          0.1,
          1000
        );
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });

        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        renderer.setClearColor(0x000000);

        // Create sphere for 360 image
        const geometry = new THREE.SphereGeometry(500, 60, 40);
        // Invert the geometry for panoramic effect
        geometry.scale(-1, 1, 1);

        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(imageUrl, (texture) => {
          const material = new THREE.MeshBasicMaterial({ map: texture });
          const mesh = new THREE.Mesh(geometry, material);
          scene.add(mesh);
          setIsLoading(false);
        });

        camera.position.set(0, 0, 0.1);

        let animationId: number;
        let mouseX = 0;
        let mouseY = 0;
        let targetX = 0;
        let targetY = 0;
        let isDragging = false;
        let previousMouseX = 0;
        let previousMouseY = 0;

        const onMouseDown = () => {
          isDragging = true;
        };

        const onMouseUp = () => {
          isDragging = false;
        };

        const onMouseMove = (event: MouseEvent) => {
          if (!isDragging) return;

          const deltaX = event.clientX - previousMouseX;
          const deltaY = event.clientY - previousMouseY;

          targetX += deltaX * 0.005;
          targetY += deltaY * 0.005;

          previousMouseX = event.clientX;
          previousMouseY = event.clientY;
        };

        const onMouseEnter = (event: MouseEvent) => {
          previousMouseX = event.clientX;
          previousMouseY = event.clientY;
        };

        const onTouchStart = (event: TouchEvent) => {
          isDragging = true;
          if (event.touches.length > 0) {
            previousMouseX = event.touches[0].clientX;
            previousMouseY = event.touches[0].clientY;
          }
        };

        const onTouchEnd = () => {
          isDragging = false;
        };

        const onTouchMove = (event: TouchEvent) => {
          if (!isDragging || event.touches.length === 0) return;

          const deltaX = event.touches[0].clientX - previousMouseX;
          const deltaY = event.touches[0].clientY - previousMouseY;

          targetX += deltaX * 0.005;
          targetY += deltaY * 0.005;

          previousMouseX = event.touches[0].clientX;
          previousMouseY = event.touches[0].clientY;
        };

        // Attach canvas-specific listeners
        canvas.addEventListener('mousedown', onMouseDown);
        canvas.addEventListener('mouseup', onMouseUp);
        canvas.addEventListener('mousemove', onMouseMove);
        canvas.addEventListener('mouseenter', onMouseEnter);
        canvas.addEventListener('mouseleave', onMouseUp);
        canvas.addEventListener('touchstart', onTouchStart);
        canvas.addEventListener('touchend', onTouchEnd);
        canvas.addEventListener('touchmove', onTouchMove);

        const handleResize = () => {
          if (!canvas.parentElement) return;
          const width = canvas.parentElement.clientWidth;
          const height = canvas.parentElement.clientHeight;
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height);
        };

        window.addEventListener('resize', handleResize);

        const animate = () => {
          animationId = requestAnimationFrame(animate);

          // Smooth camera movement
          mouseX += (targetX - mouseX) * 0.05;
          mouseY += (targetY - mouseY) * 0.05;

          camera.rotation.order = 'YXZ';
          camera.rotation.y += mouseX * 0.005;
          camera.rotation.x += mouseY * 0.005;

          // Clamp vertical rotation
          if (camera.rotation.x > Math.PI / 2.5) camera.rotation.x = Math.PI / 2.5;
          if (camera.rotation.x < -Math.PI / 2.5) camera.rotation.x = -Math.PI / 2.5;

          renderer.render(scene, camera);
        };

        animate();

        return () => {
          cancelAnimationFrame(animationId);
          canvas.removeEventListener('mousedown', onMouseDown);
          canvas.removeEventListener('mouseup', onMouseUp);
          canvas.removeEventListener('mousemove', onMouseMove);
          canvas.removeEventListener('mouseenter', onMouseEnter);
          canvas.removeEventListener('mouseleave', onMouseUp);
          canvas.removeEventListener('touchstart', onTouchStart);
          canvas.removeEventListener('touchend', onTouchEnd);
          canvas.removeEventListener('touchmove', onTouchMove);
          window.removeEventListener('resize', handleResize);
          geometry.dispose();
          renderer.dispose();
        };
      } catch (error) {
        console.error('Error loading 3D viewer:', error);
        setIsLoading(false);
      }
    };

    const cleanup = initPanorama();
    return () => {
      cleanup.then((fn) => fn && fn());
    };
  }, [imageUrl]);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!isFullscreen) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  const enterVR = async () => {
    if (!navigator.xr || !canvasRef.current) return;

    try {
      const session = await navigator.xr.requestSession('immersive-vr', {
        requiredFeatures: ['local-floor'],
        optionalFeatures: ['dom-overlay', 'dom-overlay-for-handheld-ar'],
      });

      // VR session would continue rendering with WebXR
      console.log('VR session started:', session);
    } catch (error) {
      console.error('VR session error:', error);
    }
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      ref={containerRef}
      className="rounded-xl overflow-hidden bg-black border-2"
      style={{ borderColor: '#00BFB3' }}
    >
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mx-auto mb-4" style={{ borderColor: '#00BFB3' }} />
              <p className="text-white text-sm">Loading 3D immersive view...</p>
            </div>
          </div>
        )}

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
          style={{ touchAction: 'none' }}
        />

        {/* Overlay Controls */}
        <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
          {/* Header */}
          <div className="pointer-events-auto bg-gradient-to-b from-black/60 to-transparent p-4 rounded-lg">
            <h3 className="text-white font-bold text-lg">{title}</h3>
            {description && <p className="text-gray-300 text-sm mt-1">{description}</p>}
          </div>

          {/* Control Buttons */}
          <div className="flex gap-3 justify-center pointer-events-auto">
            {/* Screenshot */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (canvasRef.current) {
                  const link = document.createElement('a');
                  link.href = canvasRef.current.toDataURL('image/png');
                  link.download = `${title}-immersive.png`;
                  link.click();
                }
              }}
              className="p-3 rounded-lg bg-black/70 hover:bg-black/90 text-white transition"
            >
              <Camera className="w-5 h-5" />
            </motion.button>

            {/* Fullscreen */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleFullscreen}
              className="p-3 rounded-lg bg-black/70 hover:bg-black/90 text-white transition"
            >
              <Download className="w-5 h-5" />
            </motion.button>

            {/* VR Mode */}
            {isVRSupported && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={enterVR}
                className="p-3 rounded-lg transition flex items-center gap-2 px-4"
                style={{ backgroundColor: '#00BFB3', color: '#0F1F3C' }}
              >
                <Headphones className="w-5 h-5" />
                <span className="text-sm font-semibold hidden sm:inline">Enter VR</span>
              </motion.button>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="absolute bottom-4 left-4 right-4 pointer-events-auto bg-black/60 text-white text-xs p-3 rounded-lg">
          <p>💡 <strong>Drag</strong> to look around | <strong>Touch & move</strong> on mobile | VR mode for compatible devices</p>
        </div>
      </div>
    </motion.div>
  );
}
