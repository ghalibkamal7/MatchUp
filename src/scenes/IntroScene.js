/**
 * src/scenes/IntroScene.js
 * Phase 1 — Black screen → matchstick → flame → logo → fade out.
 * Pure DOM + Canvas, no Three.js. Runs while 3D scene loads in background.
 */

import gsap             from 'gsap';
import { EventBus }     from '../core/EventBus.js';
import { AudioManager } from '../audio/AudioManager.js';
import { EVENTS, COLORS, DEBUG } from '../utils/Constants.js';

const T = Object.freeze({
  MATCHSTICK_SLIDE: 0.5,
  FLAME_IGNITE:     1.2,
  LOGO_RISE:        2.5,
  LOGO_FULL:        3.8,
  HOLD_END:         5.0,
  COMPLETE:         5.8,
});

const FLAME = Object.freeze({
  PARTICLE_COUNT: 60,
  CANVAS_W: 120, CANVAS_H: 180,
  BASE_COLOR_1: '#ff6a00',
  BASE_COLOR_2: '#ffcc00',
  TIP_COLOR:    '#ffffff',
  FLICKER_SPEED: 0.08,
});

export class IntroScene {
  constructor() {
    this._container   = null;
    this._flameCanvas = null;
    this._flameCtx    = null;
    this._particles   = [];
    this._flameRAF    = null;
    this._timeline    = null;
    this._destroyed   = false;
  }

  async play() {
    this._buildDOM();
    this._initFlameParticles();
    this._startFlameLoop();
    this._buildTimeline();
    if (DEBUG.ENABLED) console.log('[IntroScene] started');
  }

  skip() {
    if (this._destroyed) return;
    this._timeline?.kill();
    this._complete();
  }

  destroy() {
    if (this._destroyed) return;
    this._destroyed = true;
    this._timeline?.kill();
    if (this._flameRAF) { cancelAnimationFrame(this._flameRAF); this._flameRAF = null; }
    this._container?.remove();
    this._container = null; this._flameCanvas = null; this._flameCtx = null; this._particles = [];
  }

  _buildDOM() {
    this._container = document.createElement('div');
    Object.assign(this._container.style, {
      position:'fixed', inset:'0', zIndex:'200', background:'#000',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      overflow:'hidden', cursor:'pointer',
    });
    this._container.addEventListener('click', () => this.skip(), { once:true });

    this._sceneWrapper = document.createElement('div');
    Object.assign(this._sceneWrapper.style, {
      position:'relative', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'flex-end', width:'280px', height:'380px',
    });

    // Matchstick SVG
    this._matchstick = this._buildMatchstickSVG();
    Object.assign(this._matchstick.style, {
      position:'absolute', bottom:'0', left:'50%',
      transform:'translateX(-50%) translateY(100%)', opacity:'0',
      width:'12px', height:'220px', zIndex:'1',
    });

    // Flame canvas
    this._flameCanvas = document.createElement('canvas');
    this._flameCanvas.width  = FLAME.CANVAS_W;
    this._flameCanvas.height = FLAME.CANVAS_H;
    this._flameCtx = this._flameCanvas.getContext('2d');
    Object.assign(this._flameCanvas.style, {
      position:'absolute', bottom:'180px', left:'50%',
      transform:'translateX(-50%)', opacity:'0', zIndex:'2', pointerEvents:'none',
    });

    // Logo
    this._logo = this._buildLogo();
    Object.assign(this._logo.style, {
      position:'absolute', top:'20px', left:'50%',
      transform:'translateX(-50%) translateY(30px)', opacity:'0',
      zIndex:'3', textAlign:'center', pointerEvents:'none', width:'260px',
    });

    this._sceneWrapper.appendChild(this._matchstick);
    this._sceneWrapper.appendChild(this._flameCanvas);
    this._sceneWrapper.appendChild(this._logo);
    this._container.appendChild(this._sceneWrapper);

    // Flash overlay
    this._flash = document.createElement('div');
    Object.assign(this._flash.style, { position:'fixed', inset:'0', background:'#ff8c00', opacity:'0', pointerEvents:'none', zIndex:'5' });
    this._container.appendChild(this._flash);

    // Fade overlay
    this._fadeOverlay = document.createElement('div');
    Object.assign(this._fadeOverlay.style, { position:'fixed', inset:'0', background:'#000', opacity:'0', pointerEvents:'none', zIndex:'6' });
    this._container.appendChild(this._fadeOverlay);

    // Skip hint
    this._skipHint = document.createElement('p');
    this._skipHint.textContent = 'Tap to skip';
    Object.assign(this._skipHint.style, {
      position:'fixed', bottom:'32px', left:'50%', transform:'translateX(-50%)',
      color:'rgba(255,255,255,0.3)', fontSize:'13px', fontFamily:'"Baloo 2",cursive',
      letterSpacing:'0.05em', zIndex:'7', pointerEvents:'none',
    });
    this._container.appendChild(this._skipHint);
    document.body.appendChild(this._container);
  }

  _buildMatchstickSVG() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 12 220');
    const stick = document.createElementNS('http://www.w3.org/2000/svg','rect');
    stick.setAttribute('x','4'); stick.setAttribute('y','20');
    stick.setAttribute('width','4'); stick.setAttribute('height','200');
    stick.setAttribute('fill','#c8a96e'); stick.setAttribute('rx','2');
    const head = document.createElementNS('http://www.w3.org/2000/svg','ellipse');
    head.setAttribute('cx','6'); head.setAttribute('cy','16');
    head.setAttribute('rx','5'); head.setAttribute('ry','8'); head.setAttribute('fill','#8b1a1a');
    const shine = document.createElementNS('http://www.w3.org/2000/svg','ellipse');
    shine.setAttribute('cx','4'); shine.setAttribute('cy','13');
    shine.setAttribute('rx','2'); shine.setAttribute('ry','3'); shine.setAttribute('fill','rgba(255,255,255,0.2)');
    svg.appendChild(stick); svg.appendChild(head); svg.appendChild(shine);
    return svg;
  }

  _buildLogo() {
    const wrapper = document.createElement('div');
    const title   = document.createElement('h1');
    title.innerHTML = `<span style="font-family:'Baloo 2',cursive;font-weight:800;font-size:clamp(48px,14vw,72px);letter-spacing:0.04em;line-height:1;color:#fff;text-shadow:0 0 40px #ff9a3c,0 0 80px #ff6a00;margin:0;display:block;">MATCH<span style="color:${COLORS.PRIMARY}">UP</span></span>`;
    const tagline = document.createElement('p');
    tagline.style.cssText = `font-family:'Baloo 2',cursive;font-weight:600;font-size:clamp(11px,3vw,14px);letter-spacing:0.25em;color:rgba(255,220,150,0.75);margin:6px 0 0;text-shadow:0 0 12px rgba(255,160,60,0.5);`;
    tagline.textContent = 'MATCH. PLAY. WIN.';
    wrapper.appendChild(title); wrapper.appendChild(tagline);
    return wrapper;
  }

  _initFlameParticles() {
    this._particles = [];
    for (let i = 0; i < FLAME.PARTICLE_COUNT; i++) this._particles.push(this._newParticle());
  }

  _newParticle() {
    return {
      x: FLAME.CANVAS_W/2 + (Math.random()-0.5)*18,
      y: FLAME.CANVAS_H - 10,
      vx: (Math.random()-0.5)*1.2,
      vy: -(Math.random()*3+1.5),
      life: Math.random(), maxLife: Math.random()*0.6+0.4,
      size: Math.random()*8+4, flicker: Math.random()*Math.PI*2,
    };
  }

  _startFlameLoop() {
    const draw = () => {
      if (this._destroyed) return;
      this._flameRAF = requestAnimationFrame(draw);
      const ctx=this._flameCtx, w=FLAME.CANVAS_W, h=FLAME.CANVAS_H;
      ctx.clearRect(0,0,w,h);
      for (const p of this._particles) {
        p.life += FLAME.FLICKER_SPEED; p.flicker += 0.15;
        if (p.life >= p.maxLife) { Object.assign(p, this._newParticle()); continue; }
        const progress = p.life/p.maxLife;
        p.x += p.vx + Math.sin(p.flicker)*0.4; p.y += p.vy; p.vy -= 0.04;
        const size  = p.size*(1-progress*0.7);
        const alpha = (1-progress)*0.9;
        const color = progress<0.3 ? FLAME.BASE_COLOR_1 : progress<0.7 ? FLAME.BASE_COLOR_2 : FLAME.TIP_COLOR;
        const grad  = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,size);
        grad.addColorStop(0, color); grad.addColorStop(0.5, color+'88'); grad.addColorStop(1,'transparent');
        ctx.globalAlpha = alpha;
        ctx.beginPath(); ctx.arc(p.x,p.y,size,0,Math.PI*2);
        ctx.fillStyle = grad; ctx.fill();
      }
      ctx.globalAlpha = 1;
    };
    draw();
  }

  _buildTimeline() {
    this._timeline = gsap.timeline({ onComplete: () => this._complete() });
    const tl = this._timeline;

    tl.to(this._matchstick.style, { opacity:1, duration:0.01 }, T.MATCHSTICK_SLIDE)
      .to(this._matchstick.style, { transform:'translateX(-50%) translateY(0%)', duration:0.5, ease:'power2.out' }, T.MATCHSTICK_SLIDE);

    tl.to(this._flash.style, { opacity:0.6, duration:0.08, ease:'power4.in', onStart:()=>AudioManager.playSFX('sfx_matchstick') }, T.FLAME_IGNITE)
      .to(this._flash.style, { opacity:0, duration:0.35, ease:'power2.out' }, T.FLAME_IGNITE+0.08);

    tl.to(this._flameCanvas.style, { opacity:1, duration:0.4, ease:'power2.out' }, T.FLAME_IGNITE+0.1);

    tl.to(this._logo.style, { opacity:1, transform:'translateX(-50%) translateY(0px)', duration:0.9, ease:'power2.out' }, T.LOGO_RISE);

    tl.to(this._skipHint.style, { opacity:1, duration:0.4 }, T.LOGO_FULL)
      .to(this._skipHint.style, { opacity:0, duration:0.4 }, T.HOLD_END-0.4);

    tl.to(this._fadeOverlay.style, { opacity:1, duration:0.7, ease:'power1.inOut' }, T.HOLD_END);
  }

  _complete() {
    if (this._destroyed) return;
    if (DEBUG.ENABLED) console.log('[IntroScene] complete');
    EventBus.emit(EVENTS.INTRO_COMPLETE);
    setTimeout(() => this.destroy(), 100);
  }
}
