/**
 * Minimalist Computational Node Graph Canvas
 * Adapts to Dark (Monochrome Black & White) and Light (Claude Warm White & Orange)
 */

(function () {
  const canvas = document.getElementById("nodeCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let width, height;
  let nodes = [];
  let packets = [];
  let mouse = { x: -1000, y: -1000, radius: 180 };
  let animationFrameId;
  let isVisible = true;

  const NODE_COUNT_FACTOR = 0.000035; // Clean minimalist density
  const MIN_NODES = 20;
  const MAX_NODES = 45;
  const CONNECT_DISTANCE = 140;
  const PACKET_CHANCE = 0.012;

  function getPalette() {
    const isLight = document.documentElement.getAttribute("data-theme") === "light";
    if (isLight) {
      // Claude Theme (Warm Terracotta / Orange / Stone)
      return [
        { r: 217, g: 119, b: 6 },   // Claude warm amber/orange
        { r: 234, g: 88, b: 12 },   // Deep terracotta
        { r: 168, g: 85, b: 247 },  // Subtle violet
        { r: 120, g: 113, b: 108 }  // Stone gray
      ];
    } else {
      // Dark Theme (Minimalist Monochrome Black & White)
      return [
        { r: 255, g: 255, b: 255 }, // Crisp White
        { r: 220, g: 220, b: 225 }, // Silver
        { r: 180, g: 180, b: 185 }, // Light Gray
        { r: 130, g: 130, b: 135 }  // Subtle Gray
      ];
    }
  }

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    initNodes();
  }

  function initNodes() {
    nodes = [];
    packets = [];
    const count = Math.min(MAX_NODES, Math.max(MIN_NODES, Math.floor(width * height * NODE_COUNT_FACTOR)));
    const palette = getPalette();

    for (let i = 0; i < count; i++) {
      const color = palette[Math.floor(Math.random() * palette.length)];
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: Math.random() * 1.8 + 1.2,
        baseRadius: Math.random() * 1.8 + 1.2,
        color: color,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.018 + Math.random() * 0.02,
        name: i % 6 === 0 ? ["/odom", "/tf", "/scan", "/cmd_vel"][i % 4] : null
      });
    }
  }

  function update() {
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      n.x += n.vx;
      n.y += n.vy;
      n.pulse += n.pulseSpeed;

      if (n.x < 0 || n.x > width) n.vx *= -1;
      if (n.y < 0 || n.y > height) n.vy *= -1;

      // Mouse proximity interaction
      const dx = mouse.x - n.x;
      const dy = mouse.y - n.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < mouse.radius && dist > 0) {
        const force = (1 - dist / mouse.radius) * 1.2;
        n.x -= (dx / dist) * force;
        n.y -= (dy / dist) * force;
        n.radius = n.baseRadius + force * 2;
      } else {
        n.radius = n.baseRadius + Math.sin(n.pulse) * 0.4;
      }
    }

    // Spawn packets
    if (packets.length < 10 && Math.random() < PACKET_CHANCE) {
      const idxA = Math.floor(Math.random() * nodes.length);
      for (let j = 0; j < nodes.length; j++) {
        if (idxA === j) continue;
        const dx = nodes[idxA].x - nodes[j].x;
        const dy = nodes[idxA].y - nodes[j].y;
        if (Math.sqrt(dx * dx + dy * dy) < CONNECT_DISTANCE) {
          packets.push({
            from: nodes[idxA],
            to: nodes[j],
            progress: 0,
            speed: 0.012 + Math.random() * 0.012,
            color: nodes[idxA].color
          });
          break;
        }
      }
    }

    // Update packets
    for (let i = packets.length - 1; i >= 0; i--) {
      const p = packets[i];
      p.progress += p.speed;
      if (p.progress >= 1) {
        packets.splice(i, 1);
      }
    }
  }

  function render() {
    ctx.clearRect(0, 0, width, height);
    const isLight = document.documentElement.getAttribute("data-theme") === "light";

    // Draw lines
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const n1 = nodes[i];
        const n2 = nodes[j];
        const dx = n1.x - n2.x;
        const dy = n1.y - n2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < CONNECT_DISTANCE) {
          const alpha = (1 - dist / CONNECT_DISTANCE) * (isLight ? 0.16 : 0.14);
          ctx.beginPath();
          ctx.moveTo(n1.x, n1.y);
          ctx.lineTo(n2.x, n2.y);
          ctx.strokeStyle = `rgba(${n1.color.r}, ${n1.color.g}, ${n1.color.b}, ${alpha})`;
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
      }
    }

    // Draw packets
    for (let i = 0; i < packets.length; i++) {
      const p = packets[i];
      const curX = p.from.x + (p.to.x - p.from.x) * p.progress;
      const curY = p.from.y + (p.to.y - p.from.y) * p.progress;

      ctx.beginPath();
      ctx.arc(curX, curY, 1.8, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, 0.8)`;
      ctx.fill();
    }

    // Draw nodes
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];

      // Subtle core
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${n.color.r}, ${n.color.g}, ${n.color.b}, ${isLight ? 0.5 : 0.65})`;
      ctx.fill();

      // Topic label
      if (n.name) {
        ctx.font = "9px 'JetBrains Mono', monospace";
        ctx.fillStyle = `rgba(${n.color.r}, ${n.color.g}, ${n.color.b}, 0.35)`;
        ctx.fillText(n.name, n.x + 6, n.y + 3);
      }
    }
  }

  function loop() {
    if (isVisible) {
      update();
      render();
    }
    animationFrameId = requestAnimationFrame(loop);
  }

  // Event Listeners
  window.addEventListener("resize", resize);

  window.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  window.addEventListener("mouseleave", () => {
    mouse.x = -1000;
    mouse.y = -1000;
  });

  document.addEventListener("visibilitychange", () => {
    isVisible = !document.hidden;
  });

  // Listen for theme changes to adapt node colors
  window.addEventListener("themechanged", () => {
    initNodes();
  });

  // Init
  resize();
  loop();
})();
