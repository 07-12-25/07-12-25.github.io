// ======================
// CANVAS BACKGROUND & CONFETTI
// ======================
export class CanvasEffects {
  constructor(canvasId, gameState) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext("2d");
    this.gameState = gameState;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.particles = [];
    this.spotlights = [];
    this.confetti = [];

    this.init();
  }

  resize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
  }

  init() {
    this.resize();
    window.addEventListener("resize", () => this.resize());

    // Background Particles
    for (let i = 0; i < 60; i++)
      this.particles.push(new Particle(this.width, this.height));
    for (let i = 0; i < 4; i++)
      this.spotlights.push(new Spotlight(this.width, this.height));

    this.animate();
  }

  triggerConfetti() {
    for (let i = 0; i < 150; i++) {
      this.confetti.push(new ConfettiParticle(this.width, this.height));
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Draw Spotlights
    this.spotlights.forEach((s) => {
      s.update(this.gameState.excitementLevel);
      s.draw(this.ctx, this.height);
    });

    // Draw Background Particles
    this.particles.forEach((p) => {
      p.update(this.gameState.excitementLevel, this.width, this.height);
      p.draw(this.ctx);
    });

    // Draw Confetti (if any)
    for (let i = this.confetti.length - 1; i >= 0; i--) {
      const p = this.confetti[i];
      p.update();
      p.draw(this.ctx);
      if (p.y > this.height) this.confetti.splice(i, 1);
    }

    requestAnimationFrame(() => this.animate());
  }
}

class Particle {
  constructor(w, h) {
    this.reset(w, h);
  }
  reset(w, h) {
    this.x = Math.random() * w;
    this.y = Math.random() * h;
    this.vx = (Math.random() - 0.5) * 0.2;
    this.vy = (Math.random() - 0.5) * 0.2;
    this.size = Math.random() * 2;
    this.alpha = Math.random() * 0.5;
  }
  update(excitement, w, h) {
    this.x += this.vx * excitement;
    this.y += this.vy * excitement;
    if (this.x < 0) this.x = w;
    if (this.x > w) this.x = 0;
    if (this.y < 0) this.y = h;
    if (this.y > h) this.y = 0;
  }
  draw(ctx) {
    ctx.fillStyle = `rgba(136, 170, 255, ${this.alpha})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

class Spotlight {
  constructor(w, h) {
    this.angle = Math.random() * Math.PI;
    this.speed = Math.random() * 0.002 + 0.001;
    this.x = Math.random() * w;
    this.width = Math.random() * 300 + 200;
  }
  update(excitement) {
    this.angle += this.speed * excitement;
  }
  draw(ctx, h) {
    ctx.save();
    ctx.translate(this.x, h + 100);
    ctx.rotate(Math.sin(this.angle) * 0.5);
    const grad = ctx.createLinearGradient(0, 0, 0, -h);
    grad.addColorStop(0, "rgba(0,100,255,0.25)");
    grad.addColorStop(1, "rgba(0,0,50,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(-this.width / 2, 0);
    ctx.lineTo(this.width / 2, 0);
    ctx.lineTo(this.width, -h * 1.5);
    ctx.lineTo(-this.width, -h * 1.5);
    ctx.fill();
    ctx.restore();
  }
}

class ConfettiParticle {
  constructor(w, h) {
    this.x = w / 2;
    this.y = h / 2;
    this.vx = (Math.random() - 0.5) * 20;
    this.vy = (Math.random() - 0.5) * 20 - 10;
    this.gravity = 0.5;
    this.color = `hsl(${Math.random() * 360}, 100%, 50%)`;
    this.size = Math.random() * 10 + 5;
    this.rotation = Math.random() * 360;
    this.rotationSpeed = (Math.random() - 0.5) * 10;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.rotation += this.rotationSpeed;
  }
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate((this.rotation * Math.PI) / 180);
    ctx.fillStyle = this.color;
    ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
    ctx.restore();
  }
}
