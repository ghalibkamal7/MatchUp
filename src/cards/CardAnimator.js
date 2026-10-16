/**
 * src/cards/CardAnimator.js
 * All card movement — lift, flip, arc fly, bounce, fan, collect.
 */

import gsap              from 'gsap';
import * as THREE        from 'three';
import { cubicBezier3D } from '../utils/MathUtils.js';
import { ANIM, CARD }    from '../utils/Constants.js';
import { EventBus }      from '../core/EventBus.js';
import { EVENTS }        from '../utils/Constants.js';

export class CardAnimator {
  constructor() {
    this._timelines = new Map();
  }

  playCard(card, fromPos, toPos, faceUp = true) {
    return new Promise(resolve => {
      this._kill(card.id);
      const mesh = card.mesh;
      mesh.position.copy(fromPos);

      const cp1 = { x: fromPos.x + (toPos.x - fromPos.x)*0.25, y: fromPos.y + CARD.CARD_LIFT_HEIGHT*3.5, z: fromPos.z + (toPos.z - fromPos.z)*0.25 };
      const cp2 = { x: fromPos.x + (toPos.x - fromPos.x)*0.75, y: toPos.y   + CARD.CARD_LIFT_HEIGHT*2.0, z: fromPos.z + (toPos.z - fromPos.z)*0.75 };

      const progress = { t:0 };
      const startRot = { y: mesh.rotation.y };
      const tl = gsap.timeline({ onComplete: resolve });
      this._timelines.set(card.id, tl);

      tl.to(mesh.position, { y: fromPos.y + ANIM.CARD_LIFT_HEIGHT, duration: ANIM.CARD_LIFT_DURATION, ease:'power2.out' });
      tl.to({}, { duration: ANIM.CARD_PAUSE });
      tl.to(progress, {
        t:1, duration: ANIM.CARD_FLY_DURATION, ease: ANIM.EASE_CARD_FLY,
        onUpdate: () => {
          const pos = cubicBezier3D(progress.t, fromPos, cp1, cp2, toPos);
          mesh.position.set(pos.x, pos.y, pos.z);
        },
      }, '-=0.05');
      tl.to(startRot, {
        y: faceUp ? 0 : Math.PI, duration: ANIM.CARD_FLIP_DURATION, ease:'power2.inOut',
        onUpdate: () => { mesh.rotation.y = startRot.y; },
      }, `-=${ANIM.CARD_FLY_DURATION * 0.8}`);
      tl.to(mesh.position, { y: toPos.y + ANIM.CARD_BOUNCE_HEIGHT, duration: ANIM.CARD_BOUNCE_DURATION*0.4, ease:'power2.out' })
        .to(mesh.position, { y: toPos.y, duration: ANIM.CARD_BOUNCE_DURATION*0.6, ease: ANIM.EASE_CARD_BOUNCE,
          onComplete: () => { card.isFaceUp = faceUp; EventBus.emit(EVENTS.CARD_PLACED, { card }); },
        });
    });
  }

  dealCard(card, from, to, delay = 0) {
    return new Promise(resolve => {
      const mesh = card.mesh;
      mesh.position.copy(from); mesh.rotation.y = Math.PI;
      const mid = { x:(from.x+to.x)/2, y:Math.max(from.y,to.y)+1.2, z:(from.z+to.z)/2 };
      const progress = { t:0 };
      gsap.to(progress, {
        t:1, duration: ANIM.DEAL_CARD_DURATION, delay, ease:'power2.out',
        onUpdate: () => {
          const t=progress.t, mt=1-t;
          mesh.position.x = mt*mt*from.x + 2*mt*t*mid.x + t*t*to.x;
          mesh.position.y = mt*mt*from.y + 2*mt*t*mid.y + t*t*to.y;
          mesh.position.z = mt*mt*from.z + 2*mt*t*mid.z + t*t*to.z;
        },
        onComplete: resolve,
      });
    });
  }

  collectPile(cards, targetPos) {
    return new Promise(resolve => {
      let done = 0;
      if (!cards.length) { resolve(); return; }
      cards.forEach((card, i) => {
        const mesh = card.mesh, from = mesh.position.clone(), delay = i * ANIM.MATCH_PILE_STAGGER;
        const cp1  = { x:mesh.position.x, y:mesh.position.y+2.5+i*0.1, z:mesh.position.z };
        const cp2  = { x:(mesh.position.x+targetPos.x)/2, y:targetPos.y+1.8, z:(mesh.position.z+targetPos.z)/2 };
        const prog = { t:0 };
        gsap.to(prog, {
          t:1, duration: ANIM.MATCH_PILE_FLY, delay, ease: ANIM.EASE_PILE_FLY,
          onUpdate: () => {
            const pos = cubicBezier3D(prog.t, from, cp1, cp2, targetPos);
            mesh.position.set(pos.x, pos.y, pos.z);
          },
          onComplete: () => { if (++done === cards.length) resolve(); },
        });
      });
    });
  }

  arrangeFan(cards, pivot, facing = 1, animate = true) {
    const count  = cards.length;
    const spread = Math.min(CARD.FAN_SPREAD, (count-1)*0.06);
    cards.forEach((card, i) => {
      const t      = count > 1 ? i/(count-1) : 0.5;
      const angle  = -spread/2 + t*spread;
      const tx     = pivot.x + Math.sin(angle)*CARD.FAN_RADIUS;
      const ty     = pivot.y + CARD.FAN_Y_OFFSET;
      const tz     = pivot.z + Math.cos(angle)*CARD.FAN_RADIUS*0.1*facing;
      if (animate) {
        gsap.to(card.mesh.position, { x:tx, y:ty, z:tz, duration:ANIM.FAN_FORM_DURATION, ease:'power2.out', delay:i*0.02 });
        gsap.to(card.mesh.rotation, { y:Math.PI+angle*0.5, duration:ANIM.FAN_FORM_DURATION, ease:'power2.out', delay:i*0.02 });
      } else {
        card.mesh.position.set(tx,ty,tz); card.mesh.rotation.y = Math.PI+angle*0.5;
      }
    });
  }

  shuffleAnimation(cards, deckPos) {
    return new Promise(resolve => {
      const tl = gsap.timeline({ onComplete: resolve });
      cards.forEach((card, i) => {
        const a=Math.random()*Math.PI*2, b=0.3+Math.random()*0.2;
        tl.to(card.mesh.position, { x:deckPos.x+Math.cos(a)*b, y:deckPos.y+0.1+i*CARD.DECK_LAYER_OFFSET, z:deckPos.z+Math.sin(a)*b, duration:0.2, ease:'power2.out' }, i*0.005);
      });
      cards.forEach(card => {
        tl.to(card.mesh.position, { x:deckPos.x, y:card.mesh.position.y, z:deckPos.z, duration:0.25, ease:'power2.inOut' }, '>-0.18');
      });
    });
  }

  _kill(id) { const t = this._timelines.get(id); if (t) { t.kill(); this._timelines.delete(id); } }
  killAll()  { for (const t of this._timelines.values()) t.kill(); this._timelines.clear(); }
}
