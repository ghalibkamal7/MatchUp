/**
 * src/cards/CardTextureGenerator.js
 * Procedural vintage matchbox card textures via Canvas API.
 * All 20 pictures drawn in code — swap with PNG later without changing game logic.
 */

import * as THREE        from 'three';
import { CARD, COLORS,
         CARD_PICTURES } from '../utils/Constants.js';

const W = CARD.TEXTURE_WIDTH;
const H = CARD.TEXTURE_HEIGHT;

const PALETTES = Object.freeze({
  SHIP:     { border:'#c8960c', bg:'#ddeeff', accent:'#003366' },
  LION:     { border:'#8b1a1a', bg:'#fff8e8', accent:'#8b1a1a' },
  CAMEL:    { border:'#c8960c', bg:'#fff4d0', accent:'#8b5a00' },
  PARROT:   { border:'#1a6b1a', bg:'#e8ffe8', accent:'#1a6b1a' },
  PISTOL:   { border:'#2a2a2a', bg:'#f0f0f0', accent:'#2a2a2a' },
  ROCKET:   { border:'#8b1a1a', bg:'#fff0e8', accent:'#cc4400' },
  FLOWER:   { border:'#8b1a6b', bg:'#ffe8f8', accent:'#cc0066' },
  TIGER:    { border:'#c86400', bg:'#fff4e0', accent:'#c86400' },
  GLOBE:    { border:'#1a4a8b', bg:'#e8f4ff', accent:'#1a4a8b' },
  CROWN:    { border:'#c8960c', bg:'#fffce0', accent:'#c8960c' },
  DIYA:     { border:'#c86400', bg:'#fff8e0', accent:'#c86400' },
  PEACOCK:  { border:'#1a6b5a', bg:'#e8fff8', accent:'#1a6b5a' },
  ELEPHANT: { border:'#5a5a8b', bg:'#f0f0ff', accent:'#5a5a8b' },
  MANGO:    { border:'#c8960c', bg:'#fff8e0', accent:'#e07000' },
  BICYCLE:  { border:'#1a4a8b', bg:'#e8f0ff', accent:'#1a4a8b' },
  KITE:     { border:'#8b1a1a', bg:'#fff0e8', accent:'#cc4400' },
  UMBRELLA: { border:'#1a1a8b', bg:'#e8e8ff', accent:'#1a1a8b' },
  BELL:     { border:'#c8960c', bg:'#fffce0', accent:'#c8960c' },
  SUN:      { border:'#c86400', bg:'#fffce0', accent:'#ff8c00' },
  KANGAROO: { border:'#8b5a00', bg:'#fff4e0', accent:'#8b5a00' },
});

const _canvas = document.createElement('canvas');
_canvas.width = W; _canvas.height = H;
const _ctx = _canvas.getContext('2d');

class CardTextureGeneratorClass {
  constructor() {
    this._frontCache = new Map();
    this._backTexture = null;
  }

  generateFront(pictureID, label) {
    if (this._frontCache.has(pictureID)) return this._frontCache.get(pictureID);
    const tex = this._renderFront(pictureID, label);
    this._frontCache.set(pictureID, tex);
    return tex;
  }

  generateBack() {
    if (this._backTexture) return this._backTexture;
    this._backTexture = this._renderBack();
    return this._backTexture;
  }

  preloadAll() {
    for (const { id, label } of CARD_PICTURES) this.generateFront(id, label);
  }

  dispose() {
    for (const tex of this._frontCache.values()) tex.dispose();
    this._frontCache.clear();
    this._backTexture?.dispose();
    this._backTexture = null;
  }

  _renderFront(pictureID, label) {
    const p   = PALETTES[pictureID] ?? PALETTES.SHIP;
    const ctx = _ctx;
    ctx.clearRect(0,0,W,H);
    this._drawBg(ctx, p.bg);
    this._drawBorder(ctx, p.border, 8, 6);
    this._drawBorder(ctx, p.border, 17, 2);
    const ix=17, iy=17+6+8;
    const iw=W-ix*2, ih=H*0.62;
    this._drawIllBg(ctx, ix, iy, iw, ih, p);
    this._drawIll(ctx, pictureID, ix, iy, iw, ih, p);
    const divY = iy+ih+6;
    ctx.strokeStyle=p.border; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(ix+4,divY); ctx.lineTo(W-ix-4,divY); ctx.stroke();
    this._drawLabel(ctx, label, divY+8, p);
    this._drawCorners(ctx, p.border);
    this._drawAge(ctx);
    ctx.fillStyle=p.border; ctx.font=`11px serif`; ctx.textAlign='center';
    ctx.fillText('SAFETY MATCHES', W/2, H-14);
    return this._toTexture();
  }

  _drawBg(ctx, bg) {
    const g = ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.max(W,H)/1.4);
    g.addColorStop(0, bg); g.addColorStop(1, this._dark(bg,0.12));
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  }

  _drawBorder(ctx, color, inset, width) {
    ctx.strokeStyle=color; ctx.lineWidth=width; ctx.lineJoin='round';
    ctx.beginPath(); ctx.roundRect(inset,inset,W-inset*2,H-inset*2,10); ctx.stroke();
  }

  _drawIllBg(ctx, x, y, w, h, p) {
    const g=ctx.createLinearGradient(x,y,x,y+h);
    g.addColorStop(0,this._light(p.bg,0.15)); g.addColorStop(1,p.bg);
    ctx.fillStyle=g; ctx.beginPath(); ctx.roundRect(x,y,w,h,6); ctx.fill();
    ctx.strokeStyle=this._dark(p.bg,0.2); ctx.lineWidth=1; ctx.stroke();
  }

  _drawIll(ctx, id, x, y, w, h, p) {
    const cx=x+w/2, cy=y+h/2, r=Math.min(w,h)*0.32;
    ctx.save(); ctx.beginPath(); ctx.roundRect(x,y,w,h,6); ctx.clip();
    switch(id) {
      case 'SHIP':     this._ship(ctx,cx,cy,r,p);     break;
      case 'LION':     this._lion(ctx,cx,cy,r,p);     break;
      case 'ROCKET':   this._rocket(ctx,cx,cy,r,p);   break;
      case 'FLOWER':   this._flower(ctx,cx,cy,r,p);   break;
      case 'GLOBE':    this._globe(ctx,cx,cy,r,p);    break;
      case 'SUN':      this._sun(ctx,cx,cy,r,p);      break;
      case 'CROWN':    this._crown(ctx,cx,cy,r,p);    break;
      case 'DIYA':     this._diya(ctx,cx,cy,r,p);     break;
      case 'PEACOCK':  this._peacock(ctx,cx,cy,r,p);  break;
      case 'ELEPHANT': this._elephant(ctx,cx,cy,r,p); break;
      case 'KITE':     this._kite(ctx,cx,cy,r,p);     break;
      case 'BELL':     this._bell(ctx,cx,cy,r,p);     break;
      case 'TIGER':    this._tiger(ctx,cx,cy,r,p);    break;
      case 'CAMEL':    this._camel(ctx,cx,cy,r,p);    break;
      case 'PARROT':   this._parrot(ctx,cx,cy,r,p);   break;
      default:         this._generic(ctx,cx,cy,r,p,id); break;
    }
    ctx.restore();
  }

  _ship(ctx,cx,cy,r,p) {
    ctx.fillStyle=p.accent;
    ctx.beginPath(); ctx.ellipse(cx,cy+r*0.3,r*1.1,r*0.45,0,0,Math.PI); ctx.fill();
    ctx.fillRect(cx-r*0.9,cy-r*0.2,r*1.8,r*0.5);
    ctx.fillStyle='#cc2200';
    for(const fx of[-0.25,0.2]){ctx.fillRect(cx+fx*r*2-8,cy-r*0.8,16,r*0.65);}
    ctx.fillStyle='rgba(200,200,200,0.7)';
    for(const[fx,fy,fr]of[[-0.25,-0.9,0.18],[0.2,-0.85,0.15],[-0.1,-1.05,0.12]]){ctx.beginPath();ctx.arc(cx+fx*r*2,cy+fy*r,fr*r*2,0,Math.PI*2);ctx.fill();}
    ctx.strokeStyle='#4499cc'; ctx.lineWidth=3;
    for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(cx-r*1.2,cy+r*0.45+i*7);ctx.quadraticCurveTo(cx,cy+r*0.35+i*7,cx+r*1.2,cy+r*0.45+i*7);ctx.stroke();}
  }

  _lion(ctx,cx,cy,r,p) {
    ctx.fillStyle='#c86400'; ctx.beginPath(); ctx.arc(cx,cy,r*1.05,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#8b4500';
    for(let i=0;i<12;i++){const a=(i/12)*Math.PI*2;ctx.beginPath();ctx.ellipse(cx+Math.cos(a)*r,cy+Math.sin(a)*r,6,14,a,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle='#e8a050'; ctx.beginPath(); ctx.arc(cx,cy,r*0.72,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#1a1a00';
    for(const ex of[-0.28,0.28]){ctx.beginPath();ctx.arc(cx+ex*r,cy-0.15*r,r*0.10,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle='#c86400'; ctx.beginPath(); ctx.arc(cx,cy+0.12*r,r*0.09,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#8b4500'; ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(cx,cy+0.2*r);ctx.quadraticCurveTo(cx-r*0.2,cy+0.38*r,cx-r*0.35,cy+0.28*r);ctx.stroke();
    ctx.beginPath();ctx.moveTo(cx,cy+0.2*r);ctx.quadraticCurveTo(cx+r*0.2,cy+0.38*r,cx+r*0.35,cy+0.28*r);ctx.stroke();
  }

  _rocket(ctx,cx,cy,r,p) {
    ctx.fillStyle=p.accent; ctx.beginPath(); ctx.roundRect(cx-r*0.28,cy-r*0.9,r*0.56,r*1.4,8); ctx.fill();
    ctx.beginPath();ctx.moveTo(cx,cy-r*1.25);ctx.lineTo(cx-r*0.28,cy-r*0.9);ctx.lineTo(cx+r*0.28,cy-r*0.9);ctx.closePath();ctx.fillStyle='#cc2200';ctx.fill();
    ctx.fillStyle='#cc4400';
    for(const s of[-1,1]){ctx.beginPath();ctx.moveTo(cx+s*r*0.28,cy+r*0.4);ctx.lineTo(cx+s*r*0.72,cy+r*0.9);ctx.lineTo(cx+s*r*0.28,cy+r*0.5);ctx.closePath();ctx.fill();}
    ctx.fillStyle='#aaddff'; ctx.strokeStyle='#336699'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(cx,cy-r*0.22,r*0.18,0,Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#ff8c00'; ctx.beginPath(); ctx.ellipse(cx,cy+r*0.82,r*0.18,r*0.38,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#ffee00'; ctx.beginPath(); ctx.ellipse(cx,cy+r*0.78,r*0.09,r*0.22,0,0,Math.PI*2); ctx.fill();
  }

  _flower(ctx,cx,cy,r,p) {
    for(let i=0;i<8;i++){const a=(i/8)*Math.PI*2;ctx.fillStyle=i%2===0?'#ff6699':'#ff99bb';ctx.beginPath();ctx.ellipse(cx+Math.cos(a)*r*0.58,cy+Math.sin(a)*r*0.58,r*0.32,r*0.52,a,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle='#ffdd00'; ctx.beginPath(); ctx.arc(cx,cy,r*0.30,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#cc8800'; ctx.beginPath(); ctx.arc(cx,cy,r*0.18,0,Math.PI*2); ctx.fill();
  }

  _globe(ctx,cx,cy,r,p) {
    ctx.fillStyle='#4488cc'; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.lineWidth=1;
    for(let i=-2;i<=2;i++){const y=cy+i*r*0.38,hw=Math.sqrt(Math.max(0,r*r-(y-cy)*(y-cy)));ctx.beginPath();ctx.moveTo(cx-hw,y);ctx.lineTo(cx+hw,y);ctx.stroke();}
    ctx.fillStyle='#4a9a4a';
    for(const[lx,ly,lw,lh]of[[0,-0.2,0.32,0.28],[-0.3,0.15,0.22,0.30],[0.25,0.25,0.28,0.22]]){ctx.beginPath();ctx.ellipse(cx+lx*r,cy+ly*r,lw*r,lh*r,lx,0,Math.PI*2);ctx.fill();}
    ctx.strokeStyle=p.accent; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.stroke();
  }

  _sun(ctx,cx,cy,r,p) {
    for(let i=0;i<16;i++){const a=(i/16)*Math.PI*2,r1=r*(i%2===0?1.05:0.9),r2=r*1.4;ctx.strokeStyle='#ff8c00';ctx.lineWidth=i%2===0?4:2;ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*r1,cy+Math.sin(a)*r1);ctx.lineTo(cx+Math.cos(a)*r2,cy+Math.sin(a)*r2);ctx.stroke();}
    const g=ctx.createRadialGradient(cx-r*0.2,cy-r*0.2,0,cx,cy,r);g.addColorStop(0,'#ffee44');g.addColorStop(1,'#ff8c00');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#cc6600';
    for(const[ex,ey]of[[-0.25,-0.15],[0.25,-0.15]]){ctx.beginPath();ctx.arc(cx+ex*r,cy+ey*r,r*0.10,0,Math.PI*2);ctx.fill();}
    ctx.strokeStyle='#cc6600'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(cx,cy+r*0.1,r*0.35,0.1,Math.PI-0.1); ctx.stroke();
  }

  _crown(ctx,cx,cy,r,p) {
    ctx.fillStyle='#c8960c'; ctx.fillRect(cx-r,cy+r*0.15,r*2,r*0.6);
    ctx.beginPath();ctx.moveTo(cx-r,cy+r*0.15);ctx.lineTo(cx-r,cy-r*0.6);ctx.lineTo(cx-r*0.5,cy+r*0.0);ctx.lineTo(cx,cy-r*0.9);ctx.lineTo(cx+r*0.5,cy+r*0.0);ctx.lineTo(cx+r,cy-r*0.6);ctx.lineTo(cx+r,cy+r*0.15);ctx.closePath();
    ctx.fillStyle='#f0c030'; ctx.fill(); ctx.strokeStyle='#c8960c'; ctx.lineWidth=3; ctx.stroke();
    for(const[jx,jy,jc]of[[-0.65,-0.15,'#ff3366'],[0,0,'#3366ff'],[0.65,-0.15,'#33cc33']]){ctx.fillStyle=jc;ctx.beginPath();ctx.arc(cx+jx*r,cy+jy*r+r*0.1,r*0.12,0,Math.PI*2);ctx.fill();}
  }

  _diya(ctx,cx,cy,r,p) {
    ctx.fillStyle='#c46020';
    ctx.beginPath();ctx.ellipse(cx,cy+r*0.55,r*0.75,r*0.22,0,0,Math.PI);ctx.fill();
    ctx.beginPath();ctx.ellipse(cx,cy+r*0.3,r*0.65,r*0.30,0,Math.PI,Math.PI*2);ctx.fill();
    ctx.fillStyle='#f0d090';ctx.beginPath();ctx.ellipse(cx,cy+r*0.3,r*0.50,r*0.15,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#888';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cx+r*0.3,cy+r*0.25);ctx.lineTo(cx+r*0.3,cy-r*0.1);ctx.stroke();
    const fg=ctx.createRadialGradient(cx+r*0.3,cy-r*0.3,1,cx+r*0.3,cy-r*0.1,r*0.35);
    fg.addColorStop(0,'#ffee88');fg.addColorStop(0.5,'#ff8800');fg.addColorStop(1,'transparent');
    ctx.fillStyle=fg;ctx.beginPath();ctx.ellipse(cx+r*0.3,cy-r*0.3,r*0.1,r*0.28,0,0,Math.PI*2);ctx.fill();
  }

  _peacock(ctx,cx,cy,r,p) {
    for(let i=0;i<9;i++){const a=-Math.PI*0.6+(i/8)*Math.PI*1.2;ctx.strokeStyle='#1a8b4a';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(cx,cy+r*0.2);ctx.quadraticCurveTo(cx+Math.cos(a)*r*0.6,cy+Math.sin(a)*r*0.5-r*0.1,cx+Math.cos(a)*r*1.1,cy+Math.sin(a)*r-r*0.3);ctx.stroke();ctx.fillStyle='#1a4a8b';ctx.beginPath();ctx.arc(cx+Math.cos(a)*r*1.0,cy+Math.sin(a)*r*0.95-r*0.3,r*0.09,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle='#1a6b5a';ctx.beginPath();ctx.ellipse(cx,cy+r*0.18,r*0.22,r*0.42,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#1a8b6a';ctx.beginPath();ctx.arc(cx,cy-r*0.28,r*0.15,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#c8960c';ctx.lineWidth=2;
    for(const ca of[-0.3,0,0.3]){ctx.beginPath();ctx.moveTo(cx+Math.sin(ca)*5,cy-r*0.38);ctx.lineTo(cx+Math.sin(ca)*8,cy-r*0.55);ctx.stroke();}
  }

  _elephant(ctx,cx,cy,r,p) {
    ctx.fillStyle='#8080a0';
    ctx.beginPath();ctx.ellipse(cx,cy+r*0.1,r*0.82,r*0.65,0,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(cx-r*0.35,cy-r*0.42,r*0.45,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#a090b8';ctx.beginPath();ctx.ellipse(cx-r*0.72,cy-r*0.38,r*0.28,r*0.38,-0.4,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#8080a0';ctx.lineWidth=r*0.18;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(cx-r*0.62,cy-r*0.15);ctx.quadraticCurveTo(cx-r*1.0,cy+r*0.2,cx-r*0.7,cy+r*0.55);ctx.stroke();
    ctx.lineCap='butt';ctx.fillStyle='#1a1a1a';ctx.beginPath();ctx.arc(cx-r*0.48,cy-r*0.52,r*0.07,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#f0e8c0';ctx.lineWidth=r*0.06;ctx.beginPath();ctx.moveTo(cx-r*0.7,cy-r*0.18);ctx.quadraticCurveTo(cx-r*1.1,cy-r*0.1,cx-r*0.98,cy+r*0.1);ctx.stroke();
  }

  _kite(ctx,cx,cy,r,p) {
    ctx.fillStyle='#cc2200';ctx.beginPath();ctx.moveTo(cx,cy-r*0.95);ctx.lineTo(cx+r*0.65,cy);ctx.lineTo(cx,cy+r*0.85);ctx.lineTo(cx-r*0.65,cy);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#ffcc00';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cx,cy-r*0.95);ctx.lineTo(cx,cy+r*0.85);ctx.moveTo(cx-r*0.65,cy);ctx.lineTo(cx+r*0.65,cy);ctx.stroke();
    ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(cx,cy+r*0.85);ctx.quadraticCurveTo(cx+r*0.4,cy+r*1.1,cx+r*0.2,cy+r*1.35);ctx.stroke();ctx.setLineDash([]);
  }

  _bell(ctx,cx,cy,r,p) {
    const g=ctx.createLinearGradient(cx-r,cy,cx+r,cy);g.addColorStop(0,'#c8960c');g.addColorStop(0.4,'#f0c830');g.addColorStop(1,'#c8960c');
    ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(cx-r*0.15,cy-r*0.75);ctx.quadraticCurveTo(cx-r*0.85,cy-r*0.3,cx-r*0.92,cy+r*0.45);ctx.lineTo(cx+r*0.92,cy+r*0.45);ctx.quadraticCurveTo(cx+r*0.85,cy-r*0.3,cx+r*0.15,cy-r*0.75);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#a07008';ctx.lineWidth=2;ctx.stroke();
    ctx.fillStyle='#a07008';ctx.beginPath();ctx.ellipse(cx,cy+r*0.55,r*0.12,r*0.18,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#c8960c';ctx.lineWidth=4;ctx.beginPath();ctx.arc(cx,cy-r*0.78,r*0.1,Math.PI,Math.PI*2);ctx.stroke();
  }

  _tiger(ctx,cx,cy,r,p) {
    ctx.fillStyle='#e07800';ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#1a1a00';ctx.lineWidth=r*0.08;ctx.lineCap='round';
    for(const[x1,y1,x2,y2]of[[-0.5,-0.6,-0.2,-0.1],[0.5,-0.6,0.2,-0.1],[-0.35,-0.2,-0.7,0.3],[0.35,-0.2,0.7,0.3]]){ctx.beginPath();ctx.moveTo(cx+x1*r,cy+y1*r);ctx.lineTo(cx+x2*r,cy+y2*r);ctx.stroke();}
    ctx.lineCap='butt';ctx.fillStyle='#ffee00';
    for(const ex of[-0.28,0.28]){ctx.beginPath();ctx.arc(cx+ex*r,cy-0.15*r,r*0.14,0,Math.PI*2);ctx.fill();ctx.fillStyle='#1a1a00';ctx.beginPath();ctx.arc(cx+ex*r,cy-0.15*r,r*0.07,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffee00';}
    ctx.fillStyle='#cc5500';ctx.beginPath();ctx.arc(cx,cy+0.1*r,r*0.10,0,Math.PI*2);ctx.fill();
  }

  _camel(ctx,cx,cy,r,p) {
    ctx.fillStyle='#c8960c';
    ctx.beginPath();ctx.ellipse(cx+r*0.1,cy+r*0.2,r*0.7,r*0.45,0.1,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(cx-r*0.05,cy-r*0.28,r*0.3,r*0.38,0,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(cx-r*0.52,cy-r*0.1,r*0.18,r*0.45,-0.5,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(cx-r*0.72,cy-r*0.52,r*0.22,r*0.18,0.3,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#1a1a00';ctx.beginPath();ctx.arc(cx-r*0.82,cy-r*0.57,r*0.05,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#c8960c';ctx.lineWidth=r*0.13;ctx.lineCap='round';
    for(const lx of[-0.2,0.1,0.35,0.6]){ctx.beginPath();ctx.moveTo(cx+lx*r,cy+r*0.6);ctx.lineTo(cx+lx*r,cy+r);ctx.stroke();}
    ctx.lineCap='butt';
  }

  _parrot(ctx,cx,cy,r,p) {
    ctx.fillStyle='#22aa22';ctx.beginPath();ctx.ellipse(cx,cy+r*0.1,r*0.42,r*0.72,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#118811';ctx.beginPath();ctx.ellipse(cx+r*0.28,cy+r*0.08,r*0.22,r*0.55,0.4,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#22aa22';ctx.beginPath();ctx.arc(cx-r*0.05,cy-r*0.62,r*0.28,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#cc2200';ctx.beginPath();ctx.arc(cx-r*0.05,cy-r*0.72,r*0.14,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#ffaa00';ctx.beginPath();ctx.moveTo(cx-r*0.22,cy-r*0.62);ctx.quadraticCurveTo(cx-r*0.5,cy-r*0.5,cx-r*0.28,cy-r*0.48);ctx.closePath();ctx.fill();
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(cx+r*0.06,cy-r*0.65,r*0.09,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#1a1a00';ctx.beginPath();ctx.arc(cx+r*0.08,cy-r*0.65,r*0.05,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#cc4400';ctx.beginPath();ctx.moveTo(cx-r*0.15,cy+r*0.78);ctx.lineTo(cx+r*0.05,cy+r*0.78);ctx.lineTo(cx,cy+r*1.1);ctx.closePath();ctx.fill();
  }

  _generic(ctx,cx,cy,r,p,id) {
    const g=ctx.createRadialGradient(cx,cy,0,cx,cy,r);g.addColorStop(0,this._light(p.bg,0.3));g.addColorStop(1,p.bg);
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=p.border;ctx.lineWidth=3;ctx.stroke();
    ctx.fillStyle=p.accent;ctx.font=`bold ${r*1.1}px serif`;ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(id.charAt(0),cx,cy+r*0.06);ctx.textBaseline='alphabetic';
  }

  _drawLabel(ctx, label, labelY, p) {
    const lh=H*0.16, lcy=labelY+lh/2;
    ctx.fillStyle=p.bg;ctx.fillRect(20,labelY,W-40,lh);
    ctx.fillStyle=COLORS.CARD_LABEL_TEXT;
    let fs=22;ctx.font=`bold ${fs}px serif`;ctx.textAlign='center';ctx.textBaseline='middle';
    while(ctx.measureText(label.toUpperCase()).width>W-40&&fs>12){fs--;ctx.font=`bold ${fs}px serif`;}
    ctx.fillText(label.toUpperCase(),W/2,lcy);ctx.textBaseline='alphabetic';
  }

  _drawCorners(ctx,color){
    ctx.fillStyle=color;ctx.font='10px serif';ctx.textAlign='center';
    for(const[x,y]of[[18,22],[W-18,22],[18,H-10],[W-18,H-10]])ctx.fillText('✦',x,y);
  }

  _drawAge(ctx){
    ctx.fillStyle='rgba(139,100,20,0.04)';
    for(let i=0;i<40;i++){ctx.beginPath();ctx.arc(Math.random()*W,Math.random()*H,Math.random()*30+5,0,Math.PI*2);ctx.fill();}
  }

  _renderBack() {
    const ctx=_ctx;ctx.clearRect(0,0,W,H);
    const bg=ctx.createLinearGradient(0,0,W,H);bg.addColorStop(0,'#0a1a3a');bg.addColorStop(1,'#1a2a5a');
    ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
    this._drawBorder(ctx,'#c8960c',6,5);this._drawBorder(ctx,'#c8960c',13,1);
    ctx.strokeStyle='rgba(200,150,12,0.12)';ctx.lineWidth=1;
    for(let i=-H;i<W+H;i+=18){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i+H,H);ctx.stroke();ctx.beginPath();ctx.moveTo(i,H);ctx.lineTo(i+H,0);ctx.stroke();}
    this._star(ctx,W/2,H/2,8,44,22,'#fbbf24');
    ctx.fillStyle='#fbbf24';ctx.font='bold 28px serif';ctx.textAlign='center';
    ctx.fillText('MATCH',W/2,H/2+56);ctx.fillStyle='#f59e0b';ctx.fillText('UP',W/2,H/2+84);
    for(const[cx,cy]of[[24,28],[W-24,28],[24,H-20],[W-24,H-20]])this._star(ctx,cx,cy,5,10,5,'#c8960c');
    return this._toTexture();
  }

  _star(ctx,cx,cy,pts,or,ir,color){
    ctx.fillStyle=color;ctx.beginPath();
    for(let i=0;i<pts*2;i++){const a=(i*Math.PI)/pts-Math.PI/2,r=i%2===0?or:ir;if(i===0)ctx.moveTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);else ctx.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);}
    ctx.closePath();ctx.fill();
  }

  _toTexture(){
    const copy=document.createElement('canvas');copy.width=W;copy.height=H;
    copy.getContext('2d').drawImage(_canvas,0,0);
    const tex=new THREE.CanvasTexture(copy);
    tex.colorSpace=THREE.SRGBColorSpace;tex.generateMipmaps=true;
    tex.minFilter=THREE.LinearMipmapLinearFilter;tex.magFilter=THREE.LinearFilter;tex.needsUpdate=true;
    return tex;
  }

  _light(hex,amt){return this._shift(hex,amt);}
  _dark(hex,amt) {return this._shift(hex,-amt);}
  _shift(hex,amt){
    try{const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16),c=v=>Math.max(0,Math.min(255,Math.round(v+amt*255)));return `rgb(${c(r)},${c(g)},${c(b)})`;}
    catch{return hex;}
  }
}

const CardTextureGenerator = new CardTextureGeneratorClass();
export { CardTextureGenerator };
