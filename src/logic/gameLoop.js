import { generateObstacle } from './obstacleGen';

export const gameLoop = (gameState, setGameState, handleGameOver) => {
  setGameState(prevState => {
    const newState = { ...prevState };
    
    // Calculate play time
    if (newState.startTime) {
      newState.playTime = Date.now() - newState.startTime;
    }
    
    // Update player physics
    newState.player.velocityY += newState.gravity;
    newState.player.y += newState.player.velocityY;
    
    // Ground collision
    const groundY = 300;
    if (newState.player.y >= groundY) {
      newState.player.y = groundY;
      newState.player.velocityY = 0;
      newState.player.isJumping = false;
    }
    
    // Update obstacles
    newState.obstacles = newState.obstacles.map(obstacle => ({
      ...obstacle,
      x: obstacle.x - newState.gameSpeed
    })).filter(obstacle => obstacle.x > -obstacle.width);
    
    // Generate new obstacles
    if (Math.random() < 0.02) { // 2% chance per frame
      const newObstacle = generateObstacle();
      newState.obstacles.push(newObstacle);
    }
    
    // Collision detection
    const playerHitbox = {
      x: newState.player.x,
      y: newState.player.y,
      width: newState.player.width,
      height: newState.player.height
    };
    
    const collision = newState.obstacles.some(obstacle => {
      return (
        playerHitbox.x < obstacle.x + obstacle.width &&
        playerHitbox.x + playerHitbox.width > obstacle.x &&
        playerHitbox.y < obstacle.y + obstacle.height &&
        playerHitbox.y + playerHitbox.height > obstacle.y
      );
    });
    
    if (collision) {
      // Game over - call the handler with final score and play time
      handleGameOver(newState.score, newState.playTime);
      newState.isPlaying = false;
      return newState;
    }
    
    // Update score
    newState.score += 1;
    
    // Increase game speed over time
    if (newState.score % 500 === 0) {
      newState.gameSpeed += 0.5;
    }
    
    return newState;
  });
}; 