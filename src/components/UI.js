import React, { useState } from 'react';

const UI = ({ 
  score, 
  highScore, 
  gameStats, 
  settings, 
  isPlaying, 
  onStart, 
  onPause, 
  onToggleMute, 
  onVolumeChange,
  onBackToMenu 
}) => {
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  return (
    <div className="game-ui">
      <div className="ui-header">
        <h1 className="game-title">3D Runner Game</h1>
        <div className="score-display">
          <div className="score">Score: {score}</div>
          <div className="high-score">High Score: {highScore}</div>
        </div>
      </div>
      
      <div className="controls">
        {!isPlaying ? (
          <button className="start-btn" onClick={onStart}>
            Start Game
          </button>
        ) : (
          <button className="pause-btn" onClick={onPause}>
            Pause Game
          </button>
        )}
        
        <div className="control-buttons">
          <button 
            className={`stats-btn ${showStats ? 'active' : ''}`}
            onClick={() => setShowStats(!showStats)}
          >
            📊 Stats
          </button>
          <button 
            className={`settings-btn ${showSettings ? 'active' : ''}`}
            onClick={() => setShowSettings(!showSettings)}
          >
            ⚙️ Settings
          </button>
          <button 
            className="back-btn"
            onClick={onBackToMenu}
            style={{ background: 'linear-gradient(45deg, #6c757d, #495057)' }}
          >
            ← Back to Menu
          </button>
        </div>
      </div>

      {showStats && (
        <div className="stats-panel">
          <h3>Game Statistics</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Total Games:</span>
              <span className="stat-value">{gameStats.totalGames}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Best Score:</span>
              <span className="stat-value">{gameStats.bestScore}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Score:</span>
              <span className="stat-value">{gameStats.totalScore}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Play Time:</span>
              <span className="stat-value">{formatTime(gameStats.totalPlayTime)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Average Score:</span>
              <span className="stat-value">
                {gameStats.totalGames > 0 
                  ? Math.round(gameStats.totalScore / gameStats.totalGames) 
                  : 0}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Last Played:</span>
              <span className="stat-value">
                {gameStats.lastPlayed 
                  ? new Date(gameStats.lastPlayed).toLocaleDateString() 
                  : 'Never'}
              </span>
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="settings-panel">
          <h3>Game Settings</h3>
          <div className="setting-item">
            <label htmlFor="volume">Volume:</label>
            <input
              id="volume"
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="volume-slider"
            />
            <span className="volume-value">{Math.round(settings.volume * 100)}%</span>
          </div>
          <div className="setting-item">
            <button 
              className={`mute-btn ${settings.isMuted ? 'muted' : ''}`}
              onClick={onToggleMute}
            >
              {settings.isMuted ? '🔇 Unmute' : '🔊 Mute'}
            </button>
          </div>
        </div>
      )}
      
      <div className="instructions">
        <h3>How to Play (3D Runner):</h3>
        <ul>
          <li><strong>← →</strong> or <strong>A/D</strong> - Move left/right between lanes</li>
          <li><strong>↑</strong> or <strong>W</strong> or <strong>SPACEBAR</strong> - Jump over obstacles</li>
          <li><strong>↓</strong> or <strong>S</strong> - Slide under obstacles</li>
          <li>Avoid 3D obstacles in three lanes</li>
          <li>Game speed increases every 500 points</li>
        </ul>
      </div>
      
      <div className="game-status">
        {isPlaying ? (
          <div className="status playing">🎮 3D Game Running</div>
        ) : (
          <div className="status paused">⏸️ Game Paused</div>
        )}
      </div>
    </div>
  );
};

export default UI; 