import React, { useState, useEffect } from 'react';
import IntroAnimation from './components/IntroAnimation';
import MainMenu from './components/MainMenu';
import GameCanvas3D from './components/GameCanvas3D';
import soundManager from './logic/soundManager';
import storageManager from './logic/storageManager';
import animationManager from './logic/animationManager';

function App() {
  const [appState, setAppState] = useState('intro'); // intro, menu, game
  const [gameState, setGameState] = useState({
    isPlaying: false,
    score: 0,
    startTime: null,
    playTime: 0
  });

  const [highScore, setHighScore] = useState(0);
  const [gameStats, setGameStats] = useState({
    totalGames: 0,
    totalScore: 0,
    bestScore: 0,
    totalPlayTime: 0,
    lastPlayed: null
  });
  const [settings, setSettings] = useState({
    volume: 0.5,
    isMuted: false,
    difficulty: 'normal'
  });

  // Load saved data on component mount
  useEffect(() => {
    const savedHighScore = storageManager.getHighScore();
    const savedStats = storageManager.getGameStats();
    const savedSettings = storageManager.getGameSettings();
    
    setHighScore(savedHighScore);
    setGameStats(savedStats);
    setSettings(savedSettings);
    
    // Apply settings to sound manager
    soundManager.setVolume(savedSettings.volume);
    if (savedSettings.isMuted) {
      soundManager.toggleMute();
    }
    
    // Start animation manager
    animationManager.start();
  }, []);

  // Handle Electron menu commands
  useEffect(() => {
    if (window.electronAPI) {
      // Handle new game command from menu
      window.electronAPI.onNewGame(() => {
        if (appState === 'game' && !gameState.isPlaying) {
          startGame();
        } else if (appState !== 'game') {
          setAppState('game');
          setTimeout(startGame, 500);
        }
      });

      // Handle pause/resume command from menu
      window.electronAPI.onTogglePause(() => {
        if (appState === 'game') {
          if (gameState.isPlaying) {
            pauseGame();
          } else {
            startGame();
          }
        }
      });

      // Cleanup listeners
      return () => {
        window.electronAPI.removeAllListeners('new-game');
        window.electronAPI.removeAllListeners('toggle-pause');
      };
    }
  }, [appState, gameState.isPlaying]);

  const handleIntroComplete = () => {
    setAppState('menu');
  };

  const handleStartGame = () => {
    setAppState('game');
    setTimeout(startGame, 500);
  };

  const handleQuitGame = () => {
    if (window.electronAPI) {
      // If running in Electron, quit the app
      window.electronAPI.quit();
    } else {
      // If running in browser, show confirmation
      if (window.confirm('Are you sure you want to quit?')) {
        window.close();
      }
    }
  };

  const handleBackToMenu = () => {
    setAppState('menu');
  };

  const handleGameOver = (finalScore, playTime) => {
    // Save high score
    const isNewHighScore = storageManager.saveHighScore(finalScore);
    if (isNewHighScore) {
      setHighScore(finalScore);
      soundManager.play('score'); // Play special sound for new high score
    } else {
      soundManager.play('gameOver');
    }

    // Save game stats
    storageManager.saveGameStats({
      score: finalScore,
      playTime: playTime
    });

    // Update local stats
    setGameStats(prev => ({
      ...prev,
      totalGames: prev.totalGames + 1,
      totalScore: prev.totalScore + finalScore,
      bestScore: Math.max(prev.bestScore, finalScore),
      totalPlayTime: prev.totalPlayTime + playTime,
      lastPlayed: new Date().toISOString()
    }));

    // Stop background music
    soundManager.stop('background');
  };

  const startGame = () => {
    const startTime = Date.now();
    setGameState(prev => ({
      ...prev,
      isPlaying: true,
      score: 0,
      startTime: startTime,
      playTime: 0
    }));

    // Play background music
    soundManager.play('background');
  };

  const pauseGame = () => {
    setGameState(prev => ({
      ...prev,
      isPlaying: false
    }));

    // Pause background music
    soundManager.stop('background');
  };

  const toggleMute = () => {
    const isMuted = soundManager.toggleMute();
    setSettings(prev => ({
      ...prev,
      isMuted: isMuted
    }));
    storageManager.saveGameSettings({
      ...settings,
      isMuted: isMuted
    });
  };

  const updateVolume = (volume) => {
    soundManager.setVolume(volume);
    setSettings(prev => ({
      ...prev,
      volume: volume
    }));
    storageManager.saveGameSettings({
      ...settings,
      volume: volume
    });
  };

  // Render different app states
  const renderAppState = () => {
    switch (appState) {
      case 'intro':
        return <IntroAnimation onComplete={handleIntroComplete} />;
      
      case 'menu':
        return (
          <MainMenu
            onStartGame={handleStartGame}
            onQuit={handleQuitGame}
            settings={settings}
            onToggleMute={toggleMute}
            onUpdateVolume={updateVolume}
            gameStats={gameStats}
          />
        );
      
      case 'game':
        return (
          <div className="game-container">
            <GameCanvas3D 
              gameState={gameState}
              setGameState={setGameState}
              onGameOver={handleGameOver}
            />
          </div>
        );
      
      default:
        return <IntroAnimation onComplete={handleIntroComplete} />;
    }
  };

  return (
    <div className="App">
      {renderAppState()}
    </div>
  );
}

export default App; 