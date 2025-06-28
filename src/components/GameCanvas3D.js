import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

const GameCanvas3D = ({ gameState, setGameState, onGameOver }) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const playerRef = useRef(null);
  const obstaclesRef = useRef([]);
  const lanesRef = useRef([-2, 0, 2]); // Left, Center, Right lanes
  const currentLaneRef = useRef(1); // Start in center lane
  const gameSpeedRef = useRef(0.2);
  const isJumpingRef = useRef(false);
  const isSlidingRef = useRef(false);
  const animationIdRef = useRef(null);
  const gameStartTimeRef = useRef(null);

  useEffect(() => {
    initScene();
    animate();
    
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []);

  // Reset game when starting
  useEffect(() => {
    if (gameState.isPlaying && !gameStartTimeRef.current) {
      resetGame();
      gameStartTimeRef.current = Date.now();
    }
  }, [gameState.isPlaying]);

  const initScene = () => {
    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue
    scene.fog = new THREE.Fog(0x87CEEB, 10, 100);
    sceneRef.current = scene;

    // Camera (Third-person view)
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(800, 400);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(20, 1000);
    const groundMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x8FBC8F,
      side: THREE.DoubleSide 
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.z = -50;
    ground.receiveShadow = true;
    scene.add(ground);

    // Road markings
    createRoadMarkings(scene);

    // Player (3D character)
    createPlayer(scene);

    // Initial obstacles
    createObstacles(scene);

    // Handle window resize
    window.addEventListener('resize', onWindowResize);
  };

  const createRoadMarkings = (scene) => {
    const lineGeometry = new THREE.BoxGeometry(0.1, 0.1, 2);
    const lineMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
    
    for (let i = 0; i < 50; i++) {
      const line = new THREE.Mesh(lineGeometry, lineMaterial);
      line.position.set(0, 0.01, -i * 4);
      scene.add(line);
    }
  };

  const createPlayer = (scene) => {
    // Player body
    const bodyGeometry = new THREE.BoxGeometry(0.8, 1.5, 0.4);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xFF6B6B });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0, 0.75, 0);
    body.castShadow = true;

    // Player head
    const headGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    const headMaterial = new THREE.MeshLambertMaterial({ color: 0xFFD93D });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, 1.8, 0);
    head.castShadow = true;

    // Player group
    const player = new THREE.Group();
    player.add(body);
    player.add(head);
    player.position.set(0, 0, 0);
    scene.add(player);
    playerRef.current = player;
  };

  const createObstacles = (scene) => {
    const obstacleTypes = [
      { width: 1, height: 1, depth: 1, color: 0x4A4A4A }, // Cube
      { width: 0.5, height: 2, depth: 0.5, color: 0x6A6A6A }, // Tall pillar
      { width: 2, height: 0.5, depth: 1, color: 0x8A8A8A } // Wide block
    ];

    for (let i = 0; i < 20; i++) {
      const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
      const lane = Math.floor(Math.random() * 3);
      
      const geometry = new THREE.BoxGeometry(type.width, type.height, type.depth);
      const material = new THREE.MeshLambertMaterial({ color: type.color });
      const obstacle = new THREE.Mesh(geometry, material);
      
      obstacle.position.set(
        lanesRef.current[lane],
        type.height / 2,
        -20 - i * 8
      );
      obstacle.castShadow = true;
      obstacle.receiveShadow = true;
      
      scene.add(obstacle);
      obstaclesRef.current.push(obstacle);
    }
  };

  const animate = () => {
    animationIdRef.current = requestAnimationFrame(animate);
    
    if (gameState.isPlaying) {
      updateGame();
    }
    
    rendererRef.current.render(sceneRef.current, cameraRef.current);
  };

  const updateGame = () => {
    // Update camera position (follow player)
    const targetZ = playerRef.current.position.z + 8;
    cameraRef.current.position.z = THREE.MathUtils.lerp(
      cameraRef.current.position.z,
      targetZ,
      0.1
    );

    // Move obstacles towards player
    obstaclesRef.current.forEach((obstacle, index) => {
      obstacle.position.z += gameSpeedRef.current;
      
      // Remove obstacles that pass the player
      if (obstacle.position.z > 5) {
        sceneRef.current.remove(obstacle);
        obstaclesRef.current.splice(index, 1);
        
        // Create new obstacle at the end
        createNewObstacle();
      }
    });

    // Check collisions
    checkCollisions();

    // Update score
    setGameState(prev => ({
      ...prev,
      score: prev.score + 1
    }));

    // Increase game speed
    if (gameState.score % 500 === 0) {
      gameSpeedRef.current += 0.01;
    }
  };

  const createNewObstacle = () => {
    const obstacleTypes = [
      { width: 1, height: 1, depth: 1, color: 0x4A4A4A },
      { width: 0.5, height: 2, depth: 0.5, color: 0x6A6A6A },
      { width: 2, height: 0.5, depth: 1, color: 0x8A8A8A }
    ];

    const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
    const lane = Math.floor(Math.random() * 3);
    
    const geometry = new THREE.BoxGeometry(type.width, type.height, type.depth);
    const material = new THREE.MeshLambertMaterial({ color: type.color });
    const obstacle = new THREE.Mesh(geometry, material);
    
    obstacle.position.set(
      lanesRef.current[lane],
      type.height / 2,
      -200
    );
    obstacle.castShadow = true;
    obstacle.receiveShadow = true;
    
    sceneRef.current.add(obstacle);
    obstaclesRef.current.push(obstacle);
  };

  const checkCollisions = () => {
    const playerBox = new THREE.Box3().setFromObject(playerRef.current);
    
    obstaclesRef.current.forEach(obstacle => {
      const obstacleBox = new THREE.Box3().setFromObject(obstacle);
      
      if (playerBox.intersectsBox(obstacleBox)) {
        // Collision detected - game over
        handleGameOver();
      }
    });
  };

  const handleGameOver = () => {
    const playTime = gameStartTimeRef.current ? (Date.now() - gameStartTimeRef.current) / 1000 : 0;
    
    setGameState(prev => ({
      ...prev,
      isPlaying: false
    }));

    // Call parent's game over handler
    if (onGameOver) {
      onGameOver(gameState.score, playTime);
    }

    // Reset game state
    gameStartTimeRef.current = null;
  };

  const resetGame = () => {
    // Reset player position
    if (playerRef.current) {
      playerRef.current.position.set(0, 0, 0);
      playerRef.current.scale.set(1, 1, 1);
    }

    // Clear obstacles
    obstaclesRef.current.forEach(obstacle => {
      sceneRef.current.remove(obstacle);
    });
    obstaclesRef.current = [];

    // Reset game speed
    gameSpeedRef.current = 0.2;

    // Reset player state
    isJumpingRef.current = false;
    isSlidingRef.current = false;
    currentLaneRef.current = 1;

    // Create new obstacles
    createObstacles(sceneRef.current);
  };

  const movePlayer = (direction) => {
    if (!gameState.isPlaying) return;

    const targetLane = currentLaneRef.current + direction;
    if (targetLane >= 0 && targetLane < 3) {
      currentLaneRef.current = targetLane;
      const targetX = lanesRef.current[targetLane];
      
      // Smooth lane transition
      playerRef.current.position.x = THREE.MathUtils.lerp(
        playerRef.current.position.x,
        targetX,
        0.2
      );
    }
  };

  const jump = () => {
    if (!gameState.isPlaying || isJumpingRef.current) return;
    
    isJumpingRef.current = true;
    const jumpHeight = 3;
    const jumpDuration = 1000; // 1 second
    
    const startY = playerRef.current.position.y;
    const startTime = Date.now();
    
    const jumpAnimation = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / jumpDuration;
      
      if (progress < 1) {
        // Parabolic jump
        const height = jumpHeight * Math.sin(progress * Math.PI);
        playerRef.current.position.y = startY + height;
        requestAnimationFrame(jumpAnimation);
      } else {
        playerRef.current.position.y = startY;
        isJumpingRef.current = false;
      }
    };
    
    jumpAnimation();
  };

  const slide = () => {
    if (!gameState.isPlaying || isSlidingRef.current) return;
    
    isSlidingRef.current = true;
    const originalScale = playerRef.current.scale.y;
    
    // Scale down to simulate sliding
    playerRef.current.scale.y = 0.5;
    
    setTimeout(() => {
      playerRef.current.scale.y = originalScale;
      isSlidingRef.current = false;
    }, 500);
  };

  const onWindowResize = () => {
    if (cameraRef.current && rendererRef.current) {
      cameraRef.current.aspect = 800 / 400;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(800, 400);
    }
  };

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e) => {
      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          movePlayer(-1);
          break;
        case 'ArrowRight':
        case 'KeyD':
          movePlayer(1);
          break;
        case 'Space':
        case 'ArrowUp':
        case 'KeyW':
          jump();
          break;
        case 'ArrowDown':
        case 'KeyS':
          slide();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [gameState.isPlaying]);

  return (
    <div 
      ref={mountRef} 
      style={{
        width: '800px',
        height: '400px',
        margin: '0 auto',
        border: '2px solid #333',
        borderRadius: '10px',
        overflow: 'hidden'
      }}
    />
  );
};

export default GameCanvas3D; 