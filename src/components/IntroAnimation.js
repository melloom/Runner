import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import soundManager from '../logic/soundManager';

const IntroAnimation = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('loading'); // loading, logo, complete
  const [fadeOut, setFadeOut] = useState(false);
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const animationIdRef = useRef(null);
  const initializedRef = useRef(false);

  const isFullscreen = () => {
    return !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
  };

  useEffect(() => {
    // Only initialize once
    if (initializedRef.current) return;
    initializedRef.current = true;
    
    initScene();
    animate();
    
    // Start background music
    soundManager.playBackgroundMusic();
    
    // Handle window resize
    const handleResize = () => {
      if (cameraRef.current && rendererRef.current && mountRef.current) {
        const container = mountRef.current;
        let width = container.clientWidth || window.innerWidth;
        let height = container.clientHeight || window.innerHeight;
        
        // Use viewport units for fullscreen
        if (isFullscreen()) {
          width = window.innerWidth;
          height = window.innerHeight;
        } else {
          // Ensure minimum dimensions
          width = Math.max(width, 800);
          height = Math.max(height, 600);
        }
        
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(width, height, false);
        
        // Update canvas style
        const canvas = rendererRef.current.domElement;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        
        // Force a render update
        if (sceneRef.current) {
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    
    // Handle fullscreen changes
    const handleFullscreenChange = () => {
      // Longer delay to ensure the window has finished transitioning
      setTimeout(() => {
        handleResize();
        // Force another resize after a bit more time
        setTimeout(handleResize, 200);
      }, 300);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    
    // Add ResizeObserver for more reliable container size detection
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    
    if (mountRef.current) {
      resizeObserver.observe(mountRef.current);
    }
    
    // Simulate loading progress with longer duration - only run once
    let loadingInterval;
    if (stage === 'loading') {
      loadingInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(loadingInterval);
            setStage('logo');
            setTimeout(() => {
              setStage('complete');
              // Don't auto-advance, wait for user input
            }, 3000);
            return 100;
          }
          return prev + Math.random() * 8 + 2; // Slower, more realistic loading
        });
      }, 150);
    }

    // Handle key press to advance from complete stage - only add once
    const handleKeyPress = (e) => {
      if (stage === 'complete' && !fadeOut) {
        setFadeOut(true);
        setTimeout(() => {
          soundManager.stopBackgroundMusic();
          onComplete();
        }, 1000);
      }
    };

    // Only add event listeners if we're in the complete stage
    if (stage === 'complete') {
      document.addEventListener('keydown', handleKeyPress);
      document.addEventListener('click', handleKeyPress);
    }

    return () => {
      if (loadingInterval) {
        clearInterval(loadingInterval);
      }
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      document.removeEventListener('keydown', handleKeyPress);
      document.removeEventListener('click', handleKeyPress);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []); // Empty dependency array to run only once

  // Separate useEffect for stage transitions and key handling
  useEffect(() => {
    // Handle key press to advance from complete stage
    const handleKeyPress = (e) => {
      if (stage === 'complete' && !fadeOut) {
        setFadeOut(true);
        setTimeout(() => {
          soundManager.stopBackgroundMusic();
          onComplete();
        }, 1000);
      }
    };

    // Only add event listeners if we're in the complete stage
    if (stage === 'complete') {
      document.addEventListener('keydown', handleKeyPress);
      document.addEventListener('click', handleKeyPress);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      document.removeEventListener('click', handleKeyPress);
    };
  }, [stage, fadeOut, onComplete]);

  // Separate useEffect for loading progress
  useEffect(() => {
    if (stage === 'loading') {
      const loadingInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(loadingInterval);
            setStage('logo');
            setTimeout(() => {
              setStage('complete');
            }, 3000);
            return 100;
          }
          return prev + Math.random() * 8 + 2;
        });
      }, 150);

      return () => clearInterval(loadingInterval);
    }
  }, [stage]);

  const initScene = () => {
    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    scene.fog = new THREE.Fog(0x0a0a0a, 1, 50);
    sceneRef.current = scene;

    // Get container dimensions with fallbacks
    const container = mountRef.current;
    let width = container?.clientWidth || window.innerWidth;
    let height = container?.clientHeight || window.innerHeight;
    
    // Ensure minimum dimensions and use viewport units for fullscreen
    if (isFullscreen()) {
      width = window.innerWidth;
      height = window.innerHeight;
    } else {
      width = Math.max(width, 800);
      height = Math.max(height, 600);
    }

    // Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 0, 8);
    cameraRef.current = camera;

    // Renderer with better settings for fullscreen
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: false,
      preserveDrawingBuffer: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(width, height, false); // false = don't update canvas style
    renderer.setClearColor(0x0a0a0a, 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Ensure canvas is properly styled
    const canvas = renderer.domElement;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.zIndex = '1';

    mountRef.current.appendChild(renderer.domElement);

    // Create enhanced animated background
    createEnhancedBackground(scene);
    
    // Force initial render
    renderer.render(scene, camera);
  };

  const createEnhancedBackground = (scene) => {
    // Create multiple particle systems for different effects
    const particleCount = 300;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 15;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20 - 10;

      // Create color gradient from blue to purple to pink
      const hue = Math.random() * 0.3 + 0.6; // 0.6 to 0.9 (blue to pink)
      const color = new THREE.Color().setHSL(hue, 0.8, 0.6);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = Math.random() * 0.1 + 0.02;
    }

    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    const particleSystem = new THREE.Points(particles, particleMaterial);
    scene.add(particleSystem);
    sceneRef.current.particleSystem = particleSystem;

    // Create floating geometric shapes with better materials
    const shapes = [];
    const geometries = [
      new THREE.BoxGeometry(0.8, 0.8, 0.8),
      new THREE.SphereGeometry(0.4, 16, 16),
      new THREE.OctahedronGeometry(0.5),
      new THREE.TetrahedronGeometry(0.6)
    ];

    for (let i = 0; i < 15; i++) {
      const geometry = geometries[Math.floor(Math.random() * geometries.length)];
      const material = new THREE.MeshPhongMaterial({ 
        color: new THREE.Color().setHSL(Math.random() * 0.3 + 0.6, 0.7, 0.5),
        transparent: true,
        opacity: 0.4,
        shininess: 100,
        emissive: new THREE.Color().setHSL(Math.random() * 0.3 + 0.6, 0.5, 0.2)
      });
      const shape = new THREE.Mesh(geometry, material);
      
      shape.position.set(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 15 - 5
      );
      
      shape.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      
      shape.userData = {
        rotationSpeed: {
          x: (Math.random() - 0.5) * 0.03,
          y: (Math.random() - 0.5) * 0.03,
          z: (Math.random() - 0.5) * 0.03
        },
        floatSpeed: Math.random() * 0.008 + 0.003,
        originalY: shape.position.y
      };
      
      shapes.push(shape);
      scene.add(shape);
    }

    sceneRef.current.shapes = shapes;

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0x4a90e2, 1, 50);
    pointLight.position.set(0, 0, 10);
    scene.add(pointLight);
  };

  const animate = () => {
    animationIdRef.current = requestAnimationFrame(animate);

    if (sceneRef.current.particleSystem) {
      // Animate particles with wave effect
      const positions = sceneRef.current.particleSystem.geometry.attributes.position.array;
      const time = Date.now() * 0.001;
      
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += 0.005; // Move particles up
        positions[i] += Math.sin(time + i * 0.1) * 0.002; // Wave effect
        if (positions[i + 1] > 7.5) {
          positions[i + 1] = -7.5;
        }
      }
      sceneRef.current.particleSystem.geometry.attributes.position.needsUpdate = true;
    }

    if (sceneRef.current.shapes) {
      sceneRef.current.shapes.forEach(shape => {
        // Rotate shapes
        shape.rotation.x += shape.userData.rotationSpeed.x;
        shape.rotation.y += shape.userData.rotationSpeed.y;
        shape.rotation.z += shape.userData.rotationSpeed.z;
        
        // Float up and down with sine wave
        shape.position.y = shape.userData.originalY + Math.sin(Date.now() * shape.userData.floatSpeed) * 2;
      });
    }

    // Camera movement
    if (cameraRef.current) {
      const time = Date.now() * 0.0005;
      cameraRef.current.position.x = Math.sin(time) * 2;
      cameraRef.current.position.y = Math.cos(time * 0.7) * 1;
      cameraRef.current.lookAt(0, 0, 0);
    }

    rendererRef.current.render(sceneRef.current, cameraRef.current);
  };

  return (
    <div className={`intro-container ${fadeOut ? 'fade-out' : ''}`}>
      <div ref={mountRef} className="intro-canvas" />

      {/* Loading and logo stages use intro-content */}
      {(stage === 'loading' || stage === 'logo') && (
        <div className="intro-content">
          {stage === 'loading' && (
            <div className="loading-screen">
              <div className="game-logo">
                <h1 className="logo-text">RUNNER GAME</h1>
                <div className="logo-subtitle">ADVENTURE AWAITS</div>
              </div>
              <div className="loading-bar-container">
                <div className="loading-bar">
                  <div 
                    className="loading-progress" 
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="loading-text">
                  Loading... {Math.round(progress)}%
                </div>
              </div>
              <div className="loading-tips">
                <div className="tip">🎮 Use arrow keys or WASD to control your character</div>
                <div className="tip">🏃‍♂️ Jump over obstacles and slide under barriers</div>
                <div className="tip">⭐ Try to achieve the highest score possible!</div>
                <div className="tip">🎵 Enjoy the immersive soundtrack</div>
              </div>
            </div>
          )}
          {stage === 'logo' && (
            <div className="logo-animation">
              <div className="logo-final">
                <h1 className="logo-text-final">RUNNER GAME</h1>
                <div className="logo-subtitle-final">READY TO PLAY</div>
                <div className="logo-description">Experience the ultimate running adventure</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Robust, non-glitchy overlay for press any key */}
      {stage === 'complete' && !fadeOut && (
        <div className="intro-overlay">
          <div className="intro-complete">
            <div className="complete-text">PRESS ANY KEY TO CONTINUE</div>
            <div className="complete-subtitle">Your journey begins now...</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntroAnimation; 