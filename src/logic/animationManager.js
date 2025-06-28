class AnimationManager {
  constructor() {
    this.animations = new Map();
    this.isRunning = false;
    this.lastTime = 0;
  }

  start() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.animate();
    }
  }

  stop() {
    this.isRunning = false;
  }

  animate(currentTime = 0) {
    if (!this.isRunning) return;

    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Update all animations
    this.animations.forEach((animation, id) => {
      if (animation.isActive) {
        animation.update(deltaTime);
        
        // Remove completed animations
        if (animation.isComplete) {
          this.animations.delete(id);
        }
      }
    });

    requestAnimationFrame((time) => this.animate(time));
  }

  addAnimation(id, animation) {
    this.animations.set(id, {
      ...animation,
      isActive: true,
      isComplete: false,
      startTime: performance.now()
    });
  }

  removeAnimation(id) {
    this.animations.delete(id);
  }

  // Predefined animation types
  createFadeIn(duration = 1000) {
    return {
      update: function(deltaTime) {
        this.elapsed += deltaTime;
        const progress = Math.min(this.elapsed / duration, 1);
        this.element.style.opacity = progress;
        
        if (progress >= 1) {
          this.isComplete = true;
        }
      },
      elapsed: 0,
      element: null
    };
  }

  createFadeOut(duration = 1000) {
    return {
      update: function(deltaTime) {
        this.elapsed += deltaTime;
        const progress = Math.min(this.elapsed / duration, 1);
        this.element.style.opacity = 1 - progress;
        
        if (progress >= 1) {
          this.isComplete = true;
        }
      },
      elapsed: 0,
      element: null
    };
  }

  createBounce(duration = 500, height = 20) {
    return {
      update: function(deltaTime) {
        this.elapsed += deltaTime;
        const progress = Math.min(this.elapsed / duration, 1);
        
        // Bounce effect using sine wave
        const bounce = Math.sin(progress * Math.PI * 4) * height * (1 - progress);
        this.element.style.transform = `translateY(${-bounce}px)`;
        
        if (progress >= 1) {
          this.element.style.transform = 'translateY(0px)';
          this.isComplete = true;
        }
      },
      elapsed: 0,
      element: null
    };
  }

  createShake(duration = 300, intensity = 5) {
    return {
      update: function(deltaTime) {
        this.elapsed += deltaTime;
        const progress = Math.min(this.elapsed / duration, 1);
        
        // Shake effect
        const shake = Math.sin(progress * Math.PI * 20) * intensity * (1 - progress);
        this.element.style.transform = `translateX(${shake}px)`;
        
        if (progress >= 1) {
          this.element.style.transform = 'translateX(0px)';
          this.isComplete = true;
        }
      },
      elapsed: 0,
      element: null
    };
  }

  createPulse(duration = 1000, scale = 1.2) {
    return {
      update: function(deltaTime) {
        this.elapsed += deltaTime;
        const progress = Math.min(this.elapsed / duration, 1);
        
        // Pulse effect
        const pulse = 1 + Math.sin(progress * Math.PI * 2) * (scale - 1) * 0.5;
        this.element.style.transform = `scale(${pulse})`;
        
        if (progress >= 1) {
          this.element.style.transform = 'scale(1)';
          this.isComplete = true;
        }
      },
      elapsed: 0,
      element: null
    };
  }

  // Particle system for effects
  createParticleEffect(x, y, color = '#FFD700', count = 10) {
    const particles = [];
    
    for (let i = 0; i < count; i++) {
      const particle = {
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 200,
        vy: (Math.random() - 0.5) * 200 - 100,
        life: 1.0,
        decay: 0.02 + Math.random() * 0.03,
        color: color,
        size: 3 + Math.random() * 5
      };
      particles.push(particle);
    }

    return {
      particles,
      update: function(deltaTime) {
        this.particles.forEach(particle => {
          particle.x += particle.vx * deltaTime / 1000;
          particle.y += particle.vy * deltaTime / 1000;
          particle.vy += 500 * deltaTime / 1000; // Gravity
          particle.life -= particle.decay;
        });

        this.particles = this.particles.filter(particle => particle.life > 0);
        
        if (this.particles.length === 0) {
          this.isComplete = true;
        }
      },
      draw: function(ctx) {
        this.particles.forEach(particle => {
          ctx.save();
          ctx.globalAlpha = particle.life;
          ctx.fillStyle = particle.color;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      },
      isActive: true,
      isComplete: false
    };
  }
}

export default new AnimationManager(); 