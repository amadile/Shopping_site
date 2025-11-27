// Auto-animate elements on scroll and page load
export function initAutoAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const animateElements = document.querySelectorAll('[data-animate]');
    animateElements.forEach(el => observer.observe(el));

    const autoElements = document.querySelectorAll(`
    .product-card, .category-card, .feature-card,
    .testimonial, .stat-card, h1, h2, h3,
    .hero-section, .cta-button
  `);

    autoElements.forEach(el => {
        if (!el.hasAttribute('data-no-animate')) {
            observer.observe(el);
        }
    });

    setTimeout(() => {
        const products = document.querySelectorAll('.product-card');
        products.forEach((product, index) => {
            if (index < 3) {
                setTimeout(() => product.classList.add('thunder-strike'), index * 300);
            }
        });

        document.querySelectorAll('.hero-section, .banner, .featured-section').forEach(hero => {
            hero.classList.add('dramatic-entrance');
        });

        document.querySelectorAll('.badge, .discount-badge, .sale-tag').forEach((badge, index) => {
            setTimeout(() => badge.classList.add('explode'), 500 + (index * 200));
        });

        document.querySelectorAll('.cta-button, .primary-button, .buy-now').forEach(cta => {
            cta.classList.add('neon-pulse');
        });

        document.querySelectorAll('h1').forEach(title => {
            title.classList.add('mega-zoom');
        });
    }, 200);
}

// ULTRA DRAMATIC FULL PAGE THUNDER EFFECT
function triggerThunderEffect() {
    // Create BRIGHT overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 99999;
    background: white;
    opacity: 0;
    transition: opacity 0.03s;
  `;
    document.body.appendChild(overlay);

    // EXTREME flash sequence - MUCH brighter and longer
    const flashes = [
        { d: 0, o: 1, bg: 'white' },           // INSTANT FULL WHITE
        { d: 80, o: 0, bg: 'white' },          // Quick dark
        { d: 150, o: 1, bg: '#FFD700' },       // GOLD FLASH
        { d: 250, o: 0.3, bg: 'white' },       // Dim
        { d: 320, o: 1, bg: '#87CEEB' },       // BLUE FLASH
        { d: 420, o: 0, bg: 'white' },         // Dark
        { d: 500, o: 1, bg: '#FF6B00' },       // ORANGE FLASH
        { d: 600, o: 0.5, bg: 'white' },       // Half
        { d: 680, o: 1, bg: 'white' },         // FINAL FULL FLASH
        { d: 800, o: 0, bg: 'white' },         // Fade out
    ];

    flashes.forEach(f => {
        setTimeout(() => {
            overlay.style.opacity = f.o;
            overlay.style.background = f.bg;

            // STRONGER screen shake on bright flashes
            if (f.o >= 0.8) {
                const shakeX = (Math.random() - 0.5) * 20; // Increased from 4 to 20
                const shakeY = (Math.random() - 0.5) * 20;
                const rotate = (Math.random() - 0.5) * 2;  // Add rotation
                document.body.style.transform = `translate(${shakeX}px, ${shakeY}px) rotate(${rotate}deg)`;
                document.body.style.transition = 'transform 0.05s';

                setTimeout(() => {
                    document.body.style.transform = 'translate(0, 0) rotate(0deg)';
                }, 60);
            }
        }, f.d);
    });

    setTimeout(() => overlay.remove(), 1200);

    // Create MULTIPLE lightning bolts
    createMultipleLightningBolts();

    // Add thunder sound visualization
    createThunderRumble();
}

// Create MULTIPLE dramatic lightning bolts
function createMultipleLightningBolts() {
    const boltCount = 3; // 3 lightning bolts

    for (let b = 0; b < boltCount; b++) {
        setTimeout(() => {
            const bolt = document.createElement('div');
            const startX = (window.innerWidth / (boltCount + 1)) * (b + 1);
            const segments = 12; // More segments for jagged effect
            let path = `M${startX} 0`;

            let currentX = startX;
            let currentY = 0;

            for (let i = 0; i < segments; i++) {
                currentX += (Math.random() - 0.5) * 150; // More jagged
                currentY += window.innerHeight / segments;
                path += ` L${currentX} ${currentY}`;

                // Add branches
                if (i % 3 === 0 && Math.random() > 0.5) {
                    const branchX = currentX + (Math.random() - 0.5) * 100;
                    const branchY = currentY + 50;
                    path += ` M${currentX} ${currentY} L${branchX} ${branchY} M${currentX} ${currentY}`;
                }
            }

            bolt.innerHTML = `
        <svg style="position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:100000">
          <path d="${path}" 
                stroke="rgba(255, 255, 255, 1)" 
                stroke-width="6" 
                fill="none" 
                filter="drop-shadow(0 0 20px #fff) drop-shadow(0 0 40px #87CEEB) drop-shadow(0 0 60px #FFD700)"
                stroke-linecap="round"/>
          <path d="${path}" 
                stroke="rgba(135, 206, 250, 0.8)" 
                stroke-width="12" 
                fill="none" 
                filter="blur(8px)"
                stroke-linecap="round"/>
        </svg>
      `;

            document.body.appendChild(bolt);

            // Flash the bolt multiple times
            let boltOpacity = 1;
            const boltFlashes = [0, 80, 100, 180, 200, 280];
            boltFlashes.forEach((delay, index) => {
                setTimeout(() => {
                    bolt.style.opacity = index % 2 === 0 ? '1' : '0.3';
                }, delay);
            });

            setTimeout(() => {
                bolt.style.opacity = '0';
                bolt.style.transition = 'opacity 0.2s';
            }, 350);

            setTimeout(() => bolt.remove(), 600);
        }, b * 100); // Stagger bolts
    }
}

// Create thunder rumble effect (visual)
function createThunderRumble() {
    const rumble = document.createElement('div');
    rumble.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 99998;
    box-shadow: inset 0 0 200px 100px rgba(255, 255, 255, 0.5);
    opacity: 0;
  `;
    document.body.appendChild(rumble);

    // Pulse the rumble
    const rumblePulses = [
        { d: 0, o: 0.8 }, { d: 100, o: 0.3 }, { d: 200, o: 0.9 },
        { d: 300, o: 0.2 }, { d: 400, o: 0.7 }, { d: 500, o: 0 }
    ];

    rumblePulses.forEach(p => {
        setTimeout(() => {
            rumble.style.opacity = p.o;
            rumble.style.transition = 'opacity 0.05s';
        }, p.d);
    });

    setTimeout(() => rumble.remove(), 700);
}

if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAutoAnimations);
    } else {
        initAutoAnimations();
    }

    let lastPath = window.location.pathname;
    setInterval(() => {
        if (window.location.pathname !== lastPath) {
            lastPath = window.location.pathname;
            setTimeout(initAutoAnimations, 100);
            triggerThunderEffect(); // Thunder on route change
        }
    }, 500);

    // Thunder on page load
    window.addEventListener('load', () => setTimeout(triggerThunderEffect, 200));

    // BONUS: Thunder every 30 seconds for continuous effect
    setInterval(() => {
        if (Math.random() > 0.7) { // 30% chance every 30 seconds
            triggerThunderEffect();
        }
    }, 30000);
}
// Ambient Particle Storm Effect
function triggerParticleStorm() {
    // Create container
    const container = document.createElement('div');
    container.className = 'particle-storm';
    container.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    overflow: hidden;
    z-index: 99997;
  `;
    document.body.appendChild(container);

    // Generate particles
    const particleCount = 30;
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        const size = Math.random() * 4 + 2; // 2-6px
        const startX = Math.random() * window.innerWidth;
        const startY = Math.random() * window.innerHeight;
        const duration = Math.random() * 3 + 2; // 2-5s
        particle.style.cssText = `
      position: absolute;
      left: ${startX}px;
      top: ${startY}px;
      width: ${size}px;
      height: ${size}px;
      background: rgba(255,255,255,0.8);
      border-radius: 50%;
      opacity: 0;
      animation: particleFloat ${duration}s ease-in-out forwards;
    `;
        container.appendChild(particle);
    }

    // Define keyframes (once)
    const styleTag = document.createElement('style');
    styleTag.textContent = `
    @keyframes particleFloat {
      0% { transform: translateY(0) scale(0.5); opacity: 0; }
      30% { opacity: 1; }
      100% { transform: translateY(-200px) scale(1); opacity: 0; }
    }
  `;
    document.head.appendChild(styleTag);

    // Cleanup after max duration
    setTimeout(() => {
        container.remove();
        styleTag.remove();
    }, 6000);
}

// Schedule particle storm after page load and on route changes
if (typeof window !== 'undefined') {
    // After initial load (5 seconds)
    window.addEventListener('load', () => setTimeout(triggerParticleStorm, 5000));

    // On route change (same logic as thunder)
    let lastPathStorm = window.location.pathname;
    setInterval(() => {
        if (window.location.pathname !== lastPathStorm) {
            lastPathStorm = window.location.pathname;
            setTimeout(triggerParticleStorm, 5000);
        }
    }, 500);

    // Random occasional storm (every 45 seconds, 30% chance)
    setInterval(() => {
        if (Math.random() > 0.7) {
            triggerParticleStorm();
        }
    }, 45000);
}
// Supernova Explosion Effect – even stronger than thunder
function triggerSupernovaEffect() {
    // Full-screen overlay with expanding radial gradient
    const overlay = document.createElement('div');
    overlay.className = 'supernova-overlay';
    overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 99998;
    background: radial-gradient(circle at center, rgba(255,255,255,0.9) 0%, rgba(255,165,0,0.7) 30%, rgba(0,0,0,0) 70%);
    opacity: 0;
    transform: scale(0.5);
    transition: opacity 0.2s ease-out, transform 0.8s ease-out;
  `;
    document.body.appendChild(overlay);

    // Trigger the explosion
    requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        overlay.style.transform = 'scale(1.5)';
    });

    // Strong screen shake during peak
    const shake = () => {
        const shakeX = (Math.random() - 0.5) * 30;
        const shakeY = (Math.random() - 0.5) * 30;
        const rotate = (Math.random() - 0.5) * 5;
        document.body.style.transform = `translate(${shakeX}px, ${shakeY}px) rotate(${rotate}deg)`;
        document.body.style.transition = 'transform 0.05s';
        setTimeout(() => {
            document.body.style.transform = 'translate(0,0) rotate(0deg)';
        }, 70);
    };
    shake();

    // Fade out and cleanup
    setTimeout(() => {
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.5s ease-out';
        setTimeout(() => overlay.remove(), 600);
    }, 1200);
}

// Schedule Supernova effect – automatic, no click needed
if (typeof window !== 'undefined') {
    // Initial load after 10 seconds
    window.addEventListener('load', () => setTimeout(triggerSupernovaEffect, 10000));

    // On route change (same as thunder)
    let lastPathSuper = window.location.pathname;
    setInterval(() => {
        if (window.location.pathname !== lastPathSuper) {
            lastPathSuper = window.location.pathname;
            setTimeout(triggerSupernovaEffect, 10000);
        }
    }, 500);

    // Random occasional supernova (every 60 seconds, 20% chance)
    setInterval(() => {
        if (Math.random() > 0.8) {
            triggerSupernovaEffect();
        }
    }, 60000);
}
