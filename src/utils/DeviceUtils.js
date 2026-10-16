/**
 * src/utils/DeviceUtils.js
 * Device detection and responsive utility — singleton.
 */

import { EventBus } from '../core/EventBus.js';
import { DEBUG }    from './Constants.js';

const BREAKPOINTS    = Object.freeze({ MOBILE_MAX: 767, TABLET_MAX: 1024 });
const LOW_END_THRESH = 1_200_000;
const RESIZE_DELAY   = 150;

const DU_EVENTS = Object.freeze({
  RESIZE:      'device:resize',
  ORIENTATION: 'device:orientation',
});

class DeviceUtilsClass {
  constructor() {
    this._initialized = false;
    this._resizeTimer = null;
    this._cache = {
      isMobile: false, isTablet: false, isDesktop: false,
      hasTouch: false, hasMouse: false, hasKeyboard: false,
      screenWidth: 0, screenHeight: 0, windowWidth: 0, windowHeight: 0,
      pixelRatio: 1, isPortrait: true, isLandscape: false,
      isLowEnd: false, isHighEnd: false, refreshRate: 60,
      safeArea: { top: 0, bottom: 0, left: 0, right: 0 },
      isAndroid: false, isIOS: false, isWindows: false, isMac: false,
    };
  }

  init() {
    if (this._initialized) return;
    this._detectOS();
    this._detectDeviceType();
    this._detectInput();
    this._detectScreen();
    this._detectPerformance();
    this._detectSafeArea();
    this._detectRefreshRate();
    this._attachListeners();
    this._initialized = true;
    this._log('Initialized', this._cache);
  }

  get isMobile()       { return this._cache.isMobile; }
  get isTablet()       { return this._cache.isTablet; }
  get isDesktop()      { return this._cache.isDesktop; }
  get hasTouch()       { return this._cache.hasTouch; }
  get hasMouse()       { return this._cache.hasMouse; }
  get hasKeyboard()    { return this._cache.hasKeyboard; }
  get windowWidth()    { return this._cache.windowWidth; }
  get windowHeight()   { return this._cache.windowHeight; }
  get screenWidth()    { return this._cache.screenWidth; }
  get screenHeight()   { return this._cache.screenHeight; }
  get pixelRatio()     { return Math.min(this._cache.pixelRatio, 3); }
  get isPortrait()     { return this._cache.isPortrait; }
  get isLandscape()    { return this._cache.isLandscape; }
  get safeArea()       { return { ...this._cache.safeArea }; }
  get isLowEnd()       { return this._cache.isLowEnd; }
  get isHighEnd()      { return this._cache.isHighEnd; }
  get refreshRate()    { return this._cache.refreshRate; }
  get isAndroid()      { return this._cache.isAndroid; }
  get isIOS()          { return this._cache.isIOS; }
  get aspectRatio()    { return this._cache.windowWidth / this._cache.windowHeight; }
  get isLowEndDevice() { return this._cache.isLowEnd; }

  _detectOS() {
    const ua = navigator.userAgent.toLowerCase();
    this._cache.isAndroid = /android/.test(ua);
    this._cache.isIOS     = /iphone|ipad|ipod/.test(ua);
    this._cache.isWindows = /windows/.test(ua);
    this._cache.isMac     = /macintosh|mac os x/.test(ua);
  }

  _detectDeviceType() {
    const ua      = navigator.userAgent;
    const w       = window.innerWidth;
    const uaMob   = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    this._cache.isMobile  = uaMob && w <= BREAKPOINTS.MOBILE_MAX;
    this._cache.isTablet  = uaMob && w > BREAKPOINTS.MOBILE_MAX && w <= BREAKPOINTS.TABLET_MAX;
    this._cache.isDesktop = !uaMob || w > BREAKPOINTS.TABLET_MAX;
  }

  _detectInput() {
    this._cache.hasTouch    = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    this._cache.hasMouse    = window.matchMedia('(pointer: fine)').matches;
    this._cache.hasKeyboard = !this._cache.hasTouch || this._cache.isDesktop;
  }

  _detectScreen() {
    this._cache.screenWidth  = window.screen.width;
    this._cache.screenHeight = window.screen.height;
    this._cache.windowWidth  = window.innerWidth;
    this._cache.windowHeight = window.innerHeight;
    this._cache.pixelRatio   = window.devicePixelRatio || 1;
    const portrait           = window.innerHeight > window.innerWidth;
    this._cache.isPortrait   = portrait;
    this._cache.isLandscape  = !portrait;
  }

  _detectPerformance() {
    const w      = this._cache.windowWidth;
    const h      = this._cache.windowHeight;
    const dpr    = this._cache.pixelRatio;
    const pixels = w * h * dpr;
    const cores  = navigator.hardwareConcurrency ?? 4;
    const memory = navigator.deviceMemory ?? 4;
    this._cache.isLowEnd  = pixels < LOW_END_THRESH || cores <= 2 || memory <= 2;
    this._cache.isHighEnd = pixels > 2_000_000 && cores >= 6 && memory >= 6;
  }

  _detectSafeArea() {
    const el = document.createElement('div');
    el.style.cssText = `position:fixed;top:env(safe-area-inset-top,0px);bottom:env(safe-area-inset-bottom,0px);left:env(safe-area-inset-left,0px);right:env(safe-area-inset-right,0px);visibility:hidden;pointer-events:none;`;
    document.body.appendChild(el);
    const c = window.getComputedStyle(el);
    this._cache.safeArea = {
      top:    parseInt(c.top,    10) || 0,
      bottom: parseInt(c.bottom, 10) || 0,
      left:   parseInt(c.left,   10) || 0,
      right:  parseInt(c.right,  10) || 0,
    };
    document.body.removeChild(el);
  }

  _detectRefreshRate() {
    let frames = 0, start = null;
    const sample = (ts) => {
      if (!start) start = ts;
      if (++frames < 30) { requestAnimationFrame(sample); return; }
      const rate = Math.round(30 / ((ts - start) / 1000));
      this._cache.refreshRate = rate >= 115 ? 120 : rate >= 85 ? 90 : rate >= 55 ? 60 : 30;
    };
    requestAnimationFrame(sample);
  }

  _attachListeners() {
    window.addEventListener('resize', () => {
      if (this._resizeTimer) clearTimeout(this._resizeTimer);
      this._resizeTimer = setTimeout(() => this._onResize(), RESIZE_DELAY);
    });
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this._onResize(), 200);
    });
  }

  _onResize() {
    const prevPortrait = this._cache.isPortrait;
    this._detectScreen();
    this._detectDeviceType();
    this._detectSafeArea();
    const orientationChanged = this._cache.isPortrait !== prevPortrait;
    EventBus.emit(DU_EVENTS.RESIZE, {
      width: this._cache.windowWidth, height: this._cache.windowHeight,
      portrait: this._cache.isPortrait, pixelRatio: this._cache.pixelRatio,
    });
    if (orientationChanged) {
      EventBus.emit(DU_EVENTS.ORIENTATION, {
        isPortrait: this._cache.isPortrait, isLandscape: this._cache.isLandscape,
      });
    }
  }

  _log(msg, data) {
    if (DEBUG.ENABLED) console.log(`[DeviceUtils] ${msg}`, data ?? '');
  }
}

const DeviceUtils = new DeviceUtilsClass();
export { DeviceUtils, DU_EVENTS };
