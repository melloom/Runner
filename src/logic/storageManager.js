class StorageManager {
  constructor() {
    this.storageKey = 'desktopRunnerGame';
  }

  saveHighScore(score) {
    try {
      const currentHigh = this.getHighScore();
      if (score > currentHigh) {
        localStorage.setItem(`${this.storageKey}_highScore`, score.toString());
        return true; // New high score
      }
      return false; // Not a new high score
    } catch (error) {
      console.error('Error saving high score:', error);
      return false;
    }
  }

  getHighScore() {
    try {
      const highScore = localStorage.getItem(`${this.storageKey}_highScore`);
      return highScore ? parseInt(highScore, 10) : 0;
    } catch (error) {
      console.error('Error loading high score:', error);
      return 0;
    }
  }

  saveGameSettings(settings) {
    try {
      localStorage.setItem(`${this.storageKey}_settings`, JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('Error saving game settings:', error);
      return false;
    }
  }

  getGameSettings() {
    try {
      const settings = localStorage.getItem(`${this.storageKey}_settings`);
      return settings ? JSON.parse(settings) : {
        volume: 0.5,
        isMuted: false,
        difficulty: 'normal'
      };
    } catch (error) {
      console.error('Error loading game settings:', error);
      return {
        volume: 0.5,
        isMuted: false,
        difficulty: 'normal'
      };
    }
  }

  saveGameStats(stats) {
    try {
      const currentStats = this.getGameStats();
      const updatedStats = {
        totalGames: currentStats.totalGames + 1,
        totalScore: currentStats.totalScore + stats.score,
        bestScore: Math.max(currentStats.bestScore, stats.score),
        totalPlayTime: currentStats.totalPlayTime + (stats.playTime || 0),
        lastPlayed: new Date().toISOString()
      };
      localStorage.setItem(`${this.storageKey}_stats`, JSON.stringify(updatedStats));
      return true;
    } catch (error) {
      console.error('Error saving game stats:', error);
      return false;
    }
  }

  getGameStats() {
    try {
      const stats = localStorage.getItem(`${this.storageKey}_stats`);
      return stats ? JSON.parse(stats) : {
        totalGames: 0,
        totalScore: 0,
        bestScore: 0,
        totalPlayTime: 0,
        lastPlayed: null
      };
    } catch (error) {
      console.error('Error loading game stats:', error);
      return {
        totalGames: 0,
        totalScore: 0,
        bestScore: 0,
        totalPlayTime: 0,
        lastPlayed: null
      };
    }
  }

  clearAllData() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.storageKey)) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      return false;
    }
  }
}

export default new StorageManager(); 