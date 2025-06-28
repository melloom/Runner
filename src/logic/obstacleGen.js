export const generateObstacle = () => {
  const obstacleTypes = [
    {
      width: 30,
      height: 50,
      y: 300, // Ground level
      type: 'small'
    },
    {
      width: 40,
      height: 80,
      y: 270, // Slightly above ground
      type: 'medium'
    },
    {
      width: 50,
      height: 100,
      y: 250, // Higher obstacle
      type: 'large'
    }
  ];
  
  const randomType = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
  
  return {
    x: 800, // Start at right edge of canvas
    y: randomType.y,
    width: randomType.width,
    height: randomType.height,
    type: randomType.type
  };
}; 