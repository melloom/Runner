import { Howl } from 'howler';

class SoundManager {
  constructor() {
    this.sounds = {};
    this.isMuted = false;
    this.volume = 0.5;
    this.backgroundMusic = null;
    this.initSounds();
  }

  initSounds() {
    // Initialize the YOASOBI background music
    this.backgroundMusic = new Howl({
      src: ['assets/YOASOBI夜に駆ける Official Music Video.mp3'],
      volume: this.volume,
      loop: true,
      preload: true,
      onload: () => {
        console.log('Background music loaded successfully');
      },
      onloaderror: (id, error) => {
        console.warn('Failed to load background music:', error);
        // Fallback to beep sounds
        this.createBeepSound('background', 440, 0.05, true);
      }
    });

    // Create simple beep sounds using Web Audio API as fallback
    this.createBeepSound('jump', 800, 0.1);
    this.createBeepSound('gameOver', 200, 0.3);
    this.createBeepSound('score', 1200, 0.1);
    this.createBeepSound('menuSelect', 600, 0.1);
    this.createBeepSound('menuConfirm', 1000, 0.1);
  }

  createBeepSound(name, frequency, duration, loop = false) {
    try {
      // Create a simple beep using Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(this.volume, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
      
      this.sounds[name] = {
        play: () => {
          if (!this.isMuted) {
            const newOscillator = audioContext.createOscillator();
            const newGainNode = audioContext.createGain();
            
            newOscillator.connect(newGainNode);
            newGainNode.connect(audioContext.destination);
            
            newOscillator.frequency.value = frequency;
            newOscillator.type = 'sine';
            
            newGainNode.gain.setValueAtTime(this.volume, audioContext.currentTime);
            newGainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
            
            newOscillator.start();
            newOscillator.stop(audioContext.currentTime + duration);
          }
        },
        stop: () => {
          // Stop any playing sounds
        },
        volume: (vol) => {
          this.volume = vol;
        }
      };
    } catch (error) {
      console.warn(`Could not create sound for ${name}:`, error);
      // Fallback: create a dummy sound object
      this.sounds[name] = {
        play: () => console.log(`Playing ${name} sound`),
        stop: () => console.log(`Stopping ${name} sound`),
        volume: () => {}
      };
    }
  }

  play(soundName) {
    if (soundName === 'background') {
      if (this.backgroundMusic && !this.isMuted) {
        this.backgroundMusic.play();
      }
    } else if (this.sounds[soundName]) {
      this.sounds[soundName].play();
    }
  }

  stop(soundName) {
    if (soundName === 'background') {
      if (this.backgroundMusic) {
        this.backgroundMusic.stop();
      }
    } else if (this.sounds[soundName]) {
      this.sounds[soundName].stop();
    }
  }

  stopAll() {
    if (this.backgroundMusic) {
      this.backgroundMusic.stop();
    }
    Object.values(this.sounds).forEach(sound => {
      if (sound.stop) sound.stop();
    });
  }

  setVolume(volume) {
    this.volume = volume;
    if (this.backgroundMusic) {
      this.backgroundMusic.volume(volume);
    }
    Object.values(this.sounds).forEach(sound => {
      if (sound.volume) sound.volume(volume);
    });
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopAll();
    } else if (this.backgroundMusic) {
      this.backgroundMusic.volume(this.volume);
    }
    return this.isMuted;
  }

  getMuteStatus() {
    return this.isMuted;
  }

  // New method to play background music for intro/menu
  playBackgroundMusic() {
    if (this.backgroundMusic && !this.isMuted) {
      this.backgroundMusic.play();
    }
  }

  // New method to stop background music
  stopBackgroundMusic() {
    if (this.backgroundMusic) {
      this.backgroundMusic.stop();
    }
  }

  // Method to check if background music is currently playing
  isBackgroundMusicPlaying() {
    if (this.backgroundMusic) {
      return this.backgroundMusic.playing();
    }
    return false;
  }
}

export default new SoundManager(); 