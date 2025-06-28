import React, { useRef, useEffect } from 'react';
import animationManager from '../logic/animationManager';

const GameCanvas = ({ gameState, setGameState }) => {
  const canvasRef = useRef(null);
  const playerImgRef = useRef(null);
  const obstacleImgRef = useRef(null);
  const particleEffectsRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Load images
    const playerImg = new Image();
    playerImg.src = '/assets/player.svg';
    playerImg.onload = () => {
      playerImgRef.current = playerImg;
    };

    const obstacleImg = new Image();
    obstacleImg.src = '/assets/obstacle.svg';
    obstacleImg.onload = () => {
      obstacleImgRef.current = obstacleImg;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background with parallax effect
    const backgroundGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    backgroundGradient.addColorStop(0, '#87CEEB');
    backgroundGradient.addColorStop(1, '#98D8E8');
    ctx.fillStyle = backgroundGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw clouds (parallax background)
    drawClouds(ctx, gameState.score);
    
    // Draw ground with texture
    const groundGradient = ctx.createLinearGradient(0, 350, 0, 400);
    groundGradient.addColorStop(0, '#8FBC8F');
    groundGradient.addColorStop(1, '#7A9A7A');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, 350, canvas.width, 50);
    
    // Draw ground texture
    ctx.strokeStyle = '#6B8E6B';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 350);
      ctx.lineTo(i, 400);
      ctx.stroke();
    }
    
    // Draw player with shadow
    drawPlayer(ctx);
    
    // Draw obstacles with shadows
    drawObstacles(ctx);
    
    // Draw particle effects
    drawParticleEffects(ctx);
    
    // Draw score with enhanced styling
    drawScore(ctx);
    
    // Draw game speed indicator
    drawSpeedIndicator(ctx);
    
  }, [gameState]);

  const drawClouds = (ctx, score) => {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    const cloudPositions = [
      { x: 50 + (score * 0.1) % 800, y: 50 },
      { x: 200 + (score * 0.05) % 800, y: 80 },
      { x: 400 + (score * 0.08) % 800, y: 60 },
      { x: 600 + (score * 0.12) % 800, y: 90 }
    ];
    
    cloudPositions.forEach(cloud => {
      ctx.beginPath();
      ctx.arc(cloud.x, cloud.y, 20, 0, Math.PI * 2);
      ctx.arc(cloud.x + 15, cloud.y, 15, 0, Math.PI * 2);
      ctx.arc(cloud.x + 30, cloud.y, 20, 0, Math.PI * 2);
      ctx.arc(cloud.x + 15, cloud.y - 10, 15, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const drawPlayer = (ctx) => {
    const player = gameState.player;
    
    // Draw shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(player.x + 5, 340, player.width - 10, 10);
    
    // Draw player
    if (playerImgRef.current) {
      ctx.drawImage(
        playerImgRef.current,
        player.x,
        player.y,
        player.width,
        player.height
      );
    } else {
      // Fallback rectangle with gradient
      const playerGradient = ctx.createLinearGradient(
        player.x, player.y, 
        player.x + player.width, player.y + player.height
      );
      playerGradient.addColorStop(0, '#FF6B6B');
      playerGradient.addColorStop(1, '#FF5252');
      ctx.fillStyle = playerGradient;
      ctx.fillRect(player.x, player.y, player.width, player.height);
      
      // Add some details
      ctx.fillStyle = '#FFD93D';
      ctx.fillRect(player.x + 10, player.y + 10, 30, 10);
    }
  };

  const drawObstacles = (ctx) => {
    gameState.obstacles.forEach(obstacle => {
      // Draw shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(obstacle.x + 2, 340, obstacle.width - 4, 10);
      
      if (obstacleImgRef.current) {
        ctx.drawImage(
          obstacleImgRef.current,
          obstacle.x,
          obstacle.y,
          obstacle.width,
          obstacle.height
        );
      } else {
        // Fallback with gradient
        const obstacleGradient = ctx.createLinearGradient(
          obstacle.x, obstacle.y,
          obstacle.x + obstacle.width, obstacle.y + obstacle.height
        );
        obstacleGradient.addColorStop(0, '#4A4A4A');
        obstacleGradient.addColorStop(1, '#2A2A2A');
        ctx.fillStyle = obstacleGradient;
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        // Add some details
        ctx.fillStyle = '#6A6A6A';
        ctx.fillRect(obstacle.x + 5, obstacle.y + 5, obstacle.width - 10, 10);
      }
    });
  };

  const drawParticleEffects = (ctx) => {
    // Draw any active particle effects
    particleEffectsRef.current.forEach(effect => {
      if (effect && effect.draw) {
        effect.draw(ctx);
      }
    });
  };

  const drawScore = (ctx) => {
    // Score background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(15, 15, 150, 40);
    
    // Score text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px Arial';
    ctx.fillText(`Score: ${gameState.score}`, 25, 40);
    
    // Score glow effect
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 10;
    ctx.fillText(`Score: ${gameState.score}`, 25, 40);
    ctx.shadowBlur = 0;
  };

  const drawSpeedIndicator = (ctx) => {
    const speed = gameState.gameSpeed;
    const maxSpeed = 15;
    const speedPercentage = Math.min(speed / maxSpeed, 1);
    
    // Speed bar background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(700, 20, 80, 15);
    
    // Speed bar fill
    const speedGradient = ctx.createLinearGradient(700, 20, 780, 20);
    speedGradient.addColorStop(0, '#4CAF50');
    speedGradient.addColorStop(0.5, '#FF9800');
    speedGradient.addColorStop(1, '#F44336');
    
    ctx.fillStyle = speedGradient;
    ctx.fillRect(700, 20, 80 * speedPercentage, 15);
    
    // Speed text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px Arial';
    ctx.fillText(`Speed: ${Math.round(speed)}`, 700, 45);
  };

  // Add particle effect when player jumps
  useEffect(() => {
    if (gameState.player.isJumping && gameState.player.velocityY < 0) {
      const particleEffect = animationManager.createParticleEffect(
        gameState.player.x + gameState.player.width / 2,
        gameState.player.y + gameState.player.height,
        '#FFD700',
        5
      );
      particleEffectsRef.current.push(particleEffect);
      
      // Clean up old effects
      setTimeout(() => {
        particleEffectsRef.current = particleEffectsRef.current.filter(
          effect => effect !== particleEffect
        );
      }, 2000);
    }
  }, [gameState.player.isJumping]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={400}
      style={{
        border: '2px solid #333',
        display: 'block',
        margin: '0 auto',
        borderRadius: '10px',
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)'
      }}
    />
  );
};

export default GameCanvas; 