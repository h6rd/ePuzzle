const defaults = {
    spread: 500,
    ticks: 100,
    gravity: 1,
    decay: 0.95,
    startVelocity: 40,
  };
  
  function shootConfetti() {
    console.log('Run Confetti');
    function shoot() {
      confetti({
      ...defaults,
      particleCount: 20,
      scalar: 1,
          shapes: ["circle", "polygon"],
          colors: ["#ff6c96", "#ffc76c", "#6cffe0", "#92ff6c", "#a16cff"],
    });
  
    confetti({
      ...defaults,
      particleCount: 40,
      scalar: 2,
      shapes: ["emoji"],
      shapeOptions: {
        emoji: {
          value: ["🐻", "🐺", "🦁", "🐶"],
        },
      },
    });
  }

  shoot();
    setTimeout(shoot, 0);
    setTimeout(shoot, 100);
    setTimeout(shoot, 200);
}

window.shootConfetti = shootConfetti;
