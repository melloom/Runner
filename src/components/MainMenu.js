import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import soundManager from '../logic/soundManager';

const MainMenu = ({ onStartGame, onQuit, settings, onToggleMute, onUpdateVolume, gameStats }) => {
  const [selectedOption, setSelectedOption] = useState(0);
  const [hoveredOption, setHoveredOption] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const animationIdRef = useRef(null);

  const isFullscreen = () => {
    return !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
  };

  const menuOptions = [
    { label: '🎮 START GAME', action: onStartGame, icon: '▶️' },
    { label: '⚙️ SETTINGS', action: () => setShowSettings(true), icon: '🔧' },
    { label: '📊 STATISTICS', action: () => setShowStats(true), icon: '📈' },
    { label: '❓ HOW TO PLAY', action: () => console.log('How to Play'), icon: '❔' },
    { label: '🚪 QUIT GAME', action: onQuit, icon: '🚪' }
  ];

  useEffect(() => {
    initScene();
    animate();
    
    // Start background music if not already playing
    if (!soundManager.isBackgroundMusicPlaying()) {
      soundManager.playBackgroundMusic();
    }
    
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

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
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
  }, []);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (showSettings || showStats) {
        if (e.code === 'Escape') {
          setShowSettings(false);
          setShowStats(false);
        }
        return;
      }

      switch (e.code) {
        case 'ArrowUp':
          setSelectedOption(prev => {
            const newIndex = prev > 0 ? prev - 1 : menuOptions.length - 1;
            soundManager.play('menuSelect');
            return newIndex;
          });
          break;
        case 'ArrowDown':
          setSelectedOption(prev => {
            const newIndex = prev < menuOptions.length - 1 ? prev + 1 : 0;
            soundManager.play('menuSelect');
            return newIndex;
          });
          break;
        case 'Enter':
        case 'Space':
          soundManager.play('menuConfirm');
          menuOptions[selectedOption].action();
          break;
        case 'Escape':
          setShowSettings(false);
          setShowStats(false);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [selectedOption, menuOptions, showSettings, showStats]);

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
    // Create particle system with music-reactive colors
    const particleCount = 400;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 25;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 15 - 5;

      // Create vibrant color palette
      const hue = Math.random() * 0.4 + 0.5; // 0.5 to 0.9 (green to pink)
      const color = new THREE.Color().setHSL(hue, 0.9, 0.7);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = Math.random() * 0.08 + 0.02;
    }

    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.06,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });

    const particleSystem = new THREE.Points(particles, particleMaterial);
    scene.add(particleSystem);
    sceneRef.current.particleSystem = particleSystem;

    // Create floating geometric shapes with better materials
    const shapes = [];
    const geometries = [
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.SphereGeometry(0.5, 20, 20),
      new THREE.OctahedronGeometry(0.6),
      new THREE.TetrahedronGeometry(0.7),
      new THREE.TorusGeometry(0.4, 0.2, 16, 32)
    ];

    for (let i = 0; i < 20; i++) {
      const geometry = geometries[Math.floor(Math.random() * geometries.length)];
      const material = new THREE.MeshPhongMaterial({ 
        color: new THREE.Color().setHSL(Math.random() * 0.4 + 0.5, 0.8, 0.6),
        transparent: true,
        opacity: 0.5,
        shininess: 120,
        emissive: new THREE.Color().setHSL(Math.random() * 0.4 + 0.5, 0.6, 0.3)
      });
      const shape = new THREE.Mesh(geometry, material);
      
      shape.position.set(
        (Math.random() - 0.5) * 18,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 12 - 3
      );
      
      shape.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      
      shape.userData = {
        rotationSpeed: {
          x: (Math.random() - 0.5) * 0.04,
          y: (Math.random() - 0.5) * 0.04,
          z: (Math.random() - 0.5) * 0.04
        },
        floatSpeed: Math.random() * 0.006 + 0.002,
        originalY: shape.position.y,
        pulseSpeed: Math.random() * 0.01 + 0.005
      };
      
      shapes.push(shape);
      scene.add(shape);
    }

    sceneRef.current.shapes = shapes;

    // Add enhanced lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const pointLight1 = new THREE.PointLight(0x4a90e2, 1.2, 40);
    pointLight1.position.set(-5, 0, 10);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xff6b6b, 1.2, 40);
    pointLight2.position.set(5, 0, 10);
    scene.add(pointLight2);
  };

  const animate = () => {
    animationIdRef.current = requestAnimationFrame(animate);

    if (sceneRef.current.particleSystem) {
      // Animate particles with music-reactive movement
      const positions = sceneRef.current.particleSystem.geometry.attributes.position.array;
      const time = Date.now() * 0.001;
      
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += 0.003; // Move particles up
        positions[i] += Math.sin(time + i * 0.05) * 0.003; // Wave effect
        positions[i + 2] += Math.cos(time + i * 0.03) * 0.002; // Depth movement
        if (positions[i + 1] > 6) {
          positions[i + 1] = -6;
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
        shape.position.y = shape.userData.originalY + Math.sin(Date.now() * shape.userData.floatSpeed) * 1.5;
        
        // Pulse effect
        const scale = 1 + Math.sin(Date.now() * shape.userData.pulseSpeed) * 0.1;
        shape.scale.set(scale, scale, scale);
      });
    }

    // Camera movement
    if (cameraRef.current) {
      const time = Date.now() * 0.0003;
      cameraRef.current.position.x = Math.sin(time) * 1.5;
      cameraRef.current.position.y = Math.cos(time * 0.8) * 0.8;
      cameraRef.current.lookAt(0, 0, 0);
    }

    rendererRef.current.render(sceneRef.current, cameraRef.current);
  };

  const handleOptionClick = (index) => {
    setSelectedOption(index);
    soundManager.play('menuConfirm');
    menuOptions[index].action();
  };

  const handleOptionHover = (index) => {
    if (index !== selectedOption) {
      setHoveredOption(index);
      soundManager.play('menuSelect');
      setSelectedOption(index);
    }
  };

  const handleOptionMouseLeave = () => {
    setHoveredOption(null);
  };

  const handleBackFromPanel = () => {
    setShowSettings(false);
    setShowStats(false);
  };

  return (
    <div className="main-menu-container">
      <div ref={mountRef} className="menu-canvas" />
      {showSettings && (
        <div className="settings-panel">
          <div className="panel-header">
            <h2>⚙️ Settings</h2>
            <button onClick={handleBackFromPanel} className="close-btn">✕</button>
          </div>
          <div className="panel-content">
            <div className="setting-item">
              <label>🎵 Volume:</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.volume}
                onChange={(e) => onUpdateVolume(parseFloat(e.target.value))}
              />
              <span>{Math.round(settings.volume * 100)}%</span>
            </div>
            <div className="setting-item">
              <button onClick={onToggleMute} className="mute-btn">
                {settings.isMuted ? '🔇 Unmute' : '🔊 Mute'}
              </button>
            </div>
          </div>
        </div>
      )}
      {showStats && (
        <div className="stats-panel">
          <div className="panel-header">
            <h2>📊 Statistics</h2>
            <button onClick={handleBackFromPanel} className="close-btn">✕</button>
          </div>
          <div className="panel-content">
            <div className="stat-item">
              <span>🎮 Total Games:</span>
              <span>{gameStats.totalGames}</span>
            </div>
            <div className="stat-item">
              <span>🏆 Best Score:</span>
              <span>{gameStats.bestScore}</span>
            </div>
            <div className="stat-item">
              <span>⭐ Total Score:</span>
              <span>{gameStats.totalScore}</span>
            </div>
            <div className="stat-item">
              <span>📈 Average Score:</span>
              <span>
                {gameStats.totalGames > 0 
                  ? Math.round(gameStats.totalScore / gameStats.totalGames) 
                  : 0}
              </span>
            </div>
          </div>
        </div>
      )}
      {/* Menu content wrapper */}
      <div className="menu-content">
        {/* Always visible menu */}
        <div className="menu-title visible">
          <h1 className="game-title-menu">RUNNER GAME</h1>
          <div className="game-subtitle">ADVENTURE AWAITS</div>
          <div className="game-version">v2.0 Enhanced Edition</div>
        </div>
        <div className="menu-options visible">
          {menuOptions.map((option, index) => (
            <div
              key={index}
              className={`menu-option ${selectedOption === index ? 'selected' : ''} ${hoveredOption === index ? 'hovered' : ''}`}
              style={{ 
                animationDelay: `${index * 0.08}s`,
                cursor: 'pointer'
              }}
              onClick={() => handleOptionClick(index)}
              onMouseEnter={() => handleOptionHover(index)}
              onMouseLeave={handleOptionMouseLeave}
            >
              <span className="option-icon">{option.icon}</span>
              <span className="option-label">{option.label}</span>
              {selectedOption === index && <span className="selection-indicator">▶</span>}
            </div>
          ))}
        </div>
        <div className="menu-controls visible">
          <div className="control-hint">
            Use ↑↓ arrows to navigate, ENTER to select
          </div>
          <div className="music-info">
            🎵 Now Playing: YOASOBI - 夜に駆ける
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainMenu; 