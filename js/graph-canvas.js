/**
 * graph-canvas.js
 * Interactive, strictly isometric HTML5 Canvas for analytic geometry.
 * - Equal pixels-per-unit on X and Y (1 grid square = true square, so 90° looks 90° on LIM)
 * - Mouse & touch pan, wheel & pinch zoom, snap to integers/half-integers
 * - Draggable points with live Rational coordinate updates
 */
(function (root) {
  'use strict';

  const M = (typeof module !== 'undefined' && module.exports)
    ? require('./math-exact.js')
    : root.GraphCalc;

  const { Rational, formatItalianDecimal } = M;

  class IsometricGraph {
    constructor(canvas, options) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.options = options || {};
      this.onPointDrag = this.options.onPointDrag || null;
      this.onHoverCoord = this.options.onHoverCoord || null;

      // View state: center in math coordinates, scale in CSS pixels per 1 math unit (STRICTLY EQUAL on X and Y)
      this.centerX = 0;
      this.centerY = 0;
      this.scale = 44;
      this.minScale = 12;
      this.maxScale = 160;

      // Snap mode: 'int' (1), 'half' (0.5), 'none'
      this.snapMode = 'half';

      // Scene data
      this.scene = {
        points: [],
        lines: [],
        segments: [],
        polygons: [],
        slopeTriangle: null,
        rightAngles: [],
        parabola: null,
        inequalityIntervals: null,
        functionCurves: [],
        circles: []
      };

      // Interaction state
      this.draggingPointId = null;
      this.panning = false;
      this.panStart = null;
      this.hoverPointId = null;
      this.activePointers = new Map();
      this.pinchStartDist = null;
      this.pinchStartScale = null;

      this._bindEvents();
      this.resize();
    }

    resize() {
      const rect = this.canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(200, Math.floor(rect.width));
      const h = Math.max(200, Math.floor(rect.height));
      if (this.canvas.width !== Math.floor(w * dpr) || this.canvas.height !== Math.floor(h * dpr)) {
        this.canvas.width = Math.floor(w * dpr);
        this.canvas.height = Math.floor(h * dpr);
      }
      this.cssWidth = w;
      this.cssHeight = h;
      this.dpr = dpr;
      this.render();
    }

    mathToScreen(mx, my) {
      return {
        x: this.cssWidth / 2 + (mx - this.centerX) * this.scale,
        y: this.cssHeight / 2 - (my - this.centerY) * this.scale
      };
    }

    screenToMath(sx, sy) {
      return {
        x: this.centerX + (sx - this.cssWidth / 2) / this.scale,
        y: this.centerY - (sy - this.cssHeight / 2) / this.scale
      };
    }

    setSnapMode(mode) {
      this.snapMode = mode;
    }

    setScene(scene) {
      this.scene = Object.assign({
        points: [],
        lines: [],
        segments: [],
        polygons: [],
        slopeTriangle: null,
        rightAngles: [],
        parabola: null,
        inequalityIntervals: null,
        functionCurves: [],
        circles: []
      }, scene || {});
      this.render();
    }

    resetView() {
      this.centerX = 0;
      this.centerY = 0;
      this.scale = Math.max(28, Math.min(52, Math.floor(Math.min(this.cssWidth, this.cssHeight) / 11)));
      this.render();
    }

    fitToPoints(pts) {
      if (!pts || pts.length === 0) {
        this.resetView();
        return;
      }
      let minX = 0, maxX = 0, minY = 0, maxY = 0;
      for (const p of pts) {
        const px = typeof p.x === 'number' ? p.x : p.x.toNumber();
        const py = typeof p.y === 'number' ? p.y : p.y.toNumber();
        if (!Number.isFinite(px) || !Number.isFinite(py)) continue;
        minX = Math.min(minX, px);
        maxX = Math.max(maxX, px);
        minY = Math.min(minY, py);
        maxY = Math.max(maxY, py);
      }
      const pad = 2.2;
      const spanX = Math.max(6, (maxX - minX) + pad * 2);
      const spanY = Math.max(6, (maxY - minY) + pad * 2);
      this.centerX = (minX + maxX) / 2;
      this.centerY = (minY + maxY) / 2;
      const sx = this.cssWidth / spanX;
      const sy = this.cssHeight / spanY;
      // STRICTLY ISOMETRIC: single scale for both axes
      this.scale = Math.max(this.minScale, Math.min(64, Math.min(sx, sy)));
      this.render();
    }

    zoomBy(factor, pivotScreenX, pivotScreenY) {
      const px = pivotScreenX !== undefined ? pivotScreenX : this.cssWidth / 2;
      const py = pivotScreenY !== undefined ? pivotScreenY : this.cssHeight / 2;
      const before = this.screenToMath(px, py);
      this.scale = Math.max(this.minScale, Math.min(this.maxScale, this.scale * factor));
      const after = this.screenToMath(px, py);
      this.centerX += before.x - after.x;
      this.centerY += before.y - after.y;
      this.render();
    }

    _snapValue(val) {
      if (this.snapMode === 'int') {
        const n = Math.round(val);
        return new Rational(BigInt(n), 1n);
      }
      if (this.snapMode === 'half') {
        const half = Math.round(val * 2);
        return new Rational(BigInt(half), 2n);
      }
      const tenth = Math.round(val * 10);
      return new Rational(BigInt(tenth), 10n);
    }

    _hitTestDraggable(sx, sy) {
      const hitRadius = 24;
      let best = null;
      let bestDist = hitRadius;
      for (const pt of this.scene.points) {
        if (!pt.draggable) continue;
        const px = typeof pt.x === 'number' ? pt.x : pt.x.toNumber();
        const py = typeof pt.y === 'number' ? pt.y : pt.y.toNumber();
        const scr = this.mathToScreen(px, py);
        const d = Math.hypot(scr.x - sx, scr.y - sy);
        if (d < bestDist) {
          bestDist = d;
          best = pt;
        }
      }
      return best;
    }

    _getLocalCoords(evt) {
      const rect = this.canvas.getBoundingClientRect();
      return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
    }

    _bindEvents() {
      const c = this.canvas;
      c.style.touchAction = 'none';

      c.addEventListener('pointerdown', (e) => {
        c.setPointerCapture(e.pointerId);
        const pos = this._getLocalCoords(e);
        this.activePointers.set(e.pointerId, pos);

        if (this.activePointers.size === 2) {
          this.panning = false;
          this.draggingPointId = null;
          const pts = Array.from(this.activePointers.values());
          this.pinchStartDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
          this.pinchStartScale = this.scale;
          return;
        }

        const hit = this._hitTestDraggable(pos.x, pos.y);
        if (hit) {
          this.draggingPointId = hit.id;
          c.style.cursor = 'grabbing';
          this.render();
          return;
        }
        this.panning = true;
        this.panStart = { sx: pos.x, sy: pos.y, cx: this.centerX, cy: this.centerY };
        c.style.cursor = 'grabbing';
      });

      c.addEventListener('pointermove', (e) => {
        const pos = this._getLocalCoords(e);
        if (this.activePointers.has(e.pointerId)) {
          this.activePointers.set(e.pointerId, pos);
        }

        if (this.activePointers.size === 2 && this.pinchStartDist) {
          const pts = Array.from(this.activePointers.values());
          const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
          const midX = (pts[0].x + pts[1].x) / 2;
          const midY = (pts[0].y + pts[1].y) / 2;
          const targetScale = Math.max(this.minScale, Math.min(this.maxScale, this.pinchStartScale * (dist / this.pinchStartDist)));
          this.zoomBy(targetScale / this.scale, midX, midY);
          return;
        }

        if (this.draggingPointId !== null) {
          const m = this.screenToMath(pos.x, pos.y);
          const rx = this._snapValue(m.x);
          const ry = this._snapValue(m.y);
          if (this.onPointDrag) {
            this.onPointDrag(this.draggingPointId, rx, ry);
          }
          return;
        }

        if (this.panning && this.panStart) {
          const dx = (pos.x - this.panStart.sx) / this.scale;
          const dy = (pos.y - this.panStart.sy) / this.scale;
          this.centerX = this.panStart.cx - dx;
          this.centerY = this.panStart.cy + dy;
          this.render();
          return;
        }

        const hit = this._hitTestDraggable(pos.x, pos.y);
        const newHover = hit ? hit.id : null;
        if (newHover !== this.hoverPointId) {
          this.hoverPointId = newHover;
          c.style.cursor = hit ? 'grab' : 'default';
          this.render();
        }
        if (this.onHoverCoord) {
          const m = this.screenToMath(pos.x, pos.y);
          this.onHoverCoord(m.x, m.y);
        }
      });

      const endPointer = (e) => {
        this.activePointers.delete(e.pointerId);
        if (this.activePointers.size < 2) {
          this.pinchStartDist = null;
        }
        if (this.draggingPointId !== null) {
          this.draggingPointId = null;
          c.style.cursor = 'default';
          this.render();
        }
        if (this.panning) {
          this.panning = false;
          this.panStart = null;
          c.style.cursor = 'default';
        }
      };

      c.addEventListener('pointerup', endPointer);
      c.addEventListener('pointercancel', endPointer);

      c.addEventListener('wheel', (e) => {
        e.preventDefault();
        const pos = this._getLocalCoords(e);
        const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
        this.zoomBy(factor, pos.x, pos.y);
      }, { passive: false });
    }

    _chooseGridStep() {
      // Choose clean grid step (1, 2, 5, 10...) so gridlines are 34–90 px apart
      const rawStep = 48 / this.scale;
      const candidates = [0.5, 1, 2, 5, 10, 20, 50];
      for (const s of candidates) {
        if (s >= rawStep) return s;
      }
      return 50;
    }

    render() {
      const ctx = this.ctx;
      const w = this.cssWidth;
      const h = this.cssHeight;
      if (!w || !h) return;

      ctx.save();
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

      // Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);

      const minMath = this.screenToMath(0, h);
      const maxMath = this.screenToMath(w, 0);
      const step = this._chooseGridStep();

      // Minor grid (half-step if zoomed in)
      if (step === 1 && this.scale >= 44) {
        this._drawGridLines(ctx, minMath, maxMath, 0.5, '#f1f5f9', 1);
      }
      // Major grid
      this._drawGridLines(ctx, minMath, maxMath, step, '#e2e8f0', 1);

      // Axes & tick labels
      this._drawAxes(ctx, minMath, maxMath, step);

      // Polygons (triangles)
      for (const poly of this.scene.polygons) {
        this._drawPolygon(ctx, poly);
      }

      // Circles
      for (const circ of this.scene.circles) {
        this._drawCircle(ctx, circ);
      }

      // Function curves (exp/log)
      for (const fc of this.scene.functionCurves) {
        this._drawFunctionCurve(ctx, fc, minMath.x, maxMath.x);
      }

      // Parabola
      if (this.scene.parabola) {
        this._drawParabola(ctx, this.scene.parabola, minMath.x, maxMath.x);
      }

      // Inequality intervals on x-axis
      if (this.scene.inequalityIntervals) {
        this._drawInequalityIntervals(ctx, this.scene.inequalityIntervals, minMath.x, maxMath.x);
      }

      // Lines
      for (const item of this.scene.lines) {
        this._drawLine(ctx, item, minMath, maxMath);
      }

      // Segments
      for (const seg of this.scene.segments) {
        this._drawSegment(ctx, seg);
      }

      // Slope triangle (Δx, Δy)
      if (this.scene.slopeTriangle) {
        this._drawSlopeTriangle(ctx, this.scene.slopeTriangle);
      }

      // Right angle markers
      for (const ra of this.scene.rightAngles) {
        this._drawRightAngle(ctx, ra);
      }

      // Points (always on top)
      for (const pt of this.scene.points) {
        this._drawPoint(ctx, pt);
      }

      ctx.restore();
    }

    _drawGridLines(ctx, minM, maxM, step, color, width) {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = width;

      const startX = Math.floor(minM.x / step) * step;
      for (let x = startX; x <= maxM.x + step; x += step) {
        const sx = this.mathToScreen(x, 0).x;
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx, this.cssHeight);
      }
      const startY = Math.floor(minM.y / step) * step;
      for (let y = startY; y <= maxM.y + step; y += step) {
        const sy = this.mathToScreen(0, y).y;
        ctx.moveTo(0, sy);
        ctx.lineTo(this.cssWidth, sy);
      }
      ctx.stroke();
    }

    _drawAxes(ctx, minM, maxM, step) {
      const origin = this.mathToScreen(0, 0);
      ctx.strokeStyle = '#334155';
      ctx.fillStyle = '#334155';
      ctx.lineWidth = 1.8;

      // X axis
      if (origin.y >= -2 && origin.y <= this.cssHeight + 2) {
        ctx.beginPath();
        ctx.moveTo(0, origin.y);
        ctx.lineTo(this.cssWidth - 6, origin.y);
        ctx.stroke();
        // Arrowhead X
        ctx.beginPath();
        ctx.moveTo(this.cssWidth - 2, origin.y);
        ctx.lineTo(this.cssWidth - 11, origin.y - 5);
        ctx.lineTo(this.cssWidth - 11, origin.y + 5);
        ctx.closePath();
        ctx.fill();
        ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
        ctx.fillText('x', this.cssWidth - 16, origin.y - 10);
      }

      // Y axis
      if (origin.x >= -2 && origin.x <= this.cssWidth + 2) {
        ctx.beginPath();
        ctx.moveTo(origin.x, this.cssHeight);
        ctx.lineTo(origin.x, 6);
        ctx.stroke();
        // Arrowhead Y
        ctx.beginPath();
        ctx.moveTo(origin.x, 2);
        ctx.lineTo(origin.x - 5, 11);
        ctx.lineTo(origin.x + 5, 11);
        ctx.closePath();
        ctx.fill();
        ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
        ctx.fillText('y', origin.x + 10, 16);
      }

      // Origin label O
      if (origin.x >= 0 && origin.x <= this.cssWidth && origin.y >= 0 && origin.y <= this.cssHeight) {
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(origin.x, origin.y, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
        ctx.fillText('O', origin.x - 14, origin.y + 15);
      }

      // Axis numbers
      ctx.font = '12px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#475569';
      const clampY = Math.max(16, Math.min(this.cssHeight - 8, origin.y + 15));
      const startX = Math.floor(minM.x / step) * step;
      for (let x = startX; x <= maxM.x; x += step) {
        const rx = Math.round(x * 1000) / 1000;
        if (Math.abs(rx) < 1e-6) continue;
        const sx = this.mathToScreen(rx, 0).x;
        if (sx < 14 || sx > this.cssWidth - 20) continue;
        const txt = formatItalianDecimal(rx, 1);
        ctx.textAlign = 'center';
        ctx.fillText(txt, sx, clampY);
      }

      const clampX = Math.max(18, Math.min(this.cssWidth - 10, origin.x - 8));
      const startY = Math.floor(minM.y / step) * step;
      ctx.textAlign = 'right';
      for (let y = startY; y <= maxM.y; y += step) {
        const ry = Math.round(y * 1000) / 1000;
        if (Math.abs(ry) < 1e-6) continue;
        const sy = this.mathToScreen(0, ry).y;
        if (sy < 18 || sy > this.cssHeight - 10) continue;
        const txt = formatItalianDecimal(ry, 1);
        ctx.fillText(txt, clampX, sy + 4);
      }
      ctx.textAlign = 'left';
    }

    _drawLine(ctx, item, minM, maxM) {
      const line = item.line;
      if (!line) return;
      ctx.save();
      ctx.strokeStyle = item.color || '#2563eb';
      ctx.lineWidth = item.width || 2.6;
      if (item.dashed) ctx.setLineDash([8, 6]);

      let p1, p2;
      if (line.isVertical()) {
        const x = line.xIntercept().toNumber();
        p1 = this.mathToScreen(x, minM.y - 1);
        p2 = this.mathToScreen(x, maxM.y + 1);
      } else {
        const m = line.slope().toNumber();
        const q = line.yIntercept().toNumber();
        const x1 = minM.x - 2;
        const x2 = maxM.x + 2;
        p1 = this.mathToScreen(x1, m * x1 + q);
        p2 = this.mathToScreen(x2, m * x2 + q);
      }

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      if (item.label) {
        // Place label inside viewport near one end of the line
        let lx, ly;
        if (line.isVertical()) {
          const x = line.xIntercept().toNumber();
          const scr = this.mathToScreen(x, maxM.y - (maxM.y - minM.y) * 0.12);
          lx = scr.x + 8;
          ly = Math.max(24, Math.min(this.cssHeight - 14, scr.y));
        } else {
          const m = line.slope().toNumber();
          const q = line.yIntercept().toNumber();
          const sampleX = maxM.x - (maxM.x - minM.x) * 0.18;
          const sampleY = m * sampleX + q;
          let scr = this.mathToScreen(sampleX, sampleY);
          if (scr.y < 24 || scr.y > this.cssHeight - 24) {
            const targetY = scr.y < 24 ? maxM.y - (maxM.y - minM.y) * 0.14 : minM.y + (maxM.y - minM.y) * 0.14;
            const altX = m !== 0 ? (targetY - q) / m : sampleX;
            scr = this.mathToScreen(altX, targetY);
          }
          lx = Math.max(12, Math.min(this.cssWidth - 110, scr.x + 6));
          ly = Math.max(22, Math.min(this.cssHeight - 12, scr.y - 8));
        }
        ctx.setLineDash([]);
        ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
        const tw = ctx.measureText(item.label).width;
        ctx.fillStyle = 'rgba(255,255,255,0.88)';
        ctx.fillRect(lx - 4, ly - 13, tw + 8, 18);
        ctx.fillStyle = item.color || '#2563eb';
        ctx.fillText(item.label, lx, ly);
      }
      ctx.restore();
    }

    _drawSegment(ctx, seg) {
      const ax = typeof seg.A.x === 'number' ? seg.A.x : seg.A.x.toNumber();
      const ay = typeof seg.A.y === 'number' ? seg.A.y : seg.A.y.toNumber();
      const bx = typeof seg.B.x === 'number' ? seg.B.x : seg.B.x.toNumber();
      const by = typeof seg.B.y === 'number' ? seg.B.y : seg.B.y.toNumber();
      const p1 = this.mathToScreen(ax, ay);
      const p2 = this.mathToScreen(bx, by);
      ctx.save();
      ctx.strokeStyle = seg.color || '#0f766e';
      ctx.lineWidth = seg.width || 2.8;
      if (seg.dashed) ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      if (seg.label) {
        const mx = (p1.x + p2.x) / 2;
        const my = (p1.y + p2.y) / 2;
        ctx.setLineDash([]);
        ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
        const tw = ctx.measureText(seg.label).width;
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fillRect(mx - tw / 2 - 4, my - 10, tw + 8, 17);
        ctx.fillStyle = seg.color || '#0f766e';
        ctx.textAlign = 'center';
        ctx.fillText(seg.label, mx, my + 3);
        ctx.textAlign = 'left';
      }
      ctx.restore();
    }

    _drawPolygon(ctx, poly) {
      if (!poly.points || poly.points.length < 3) return;
      ctx.save();
      ctx.beginPath();
      poly.points.forEach((pt, idx) => {
        const px = typeof pt.x === 'number' ? pt.x : pt.x.toNumber();
        const py = typeof pt.y === 'number' ? pt.y : pt.y.toNumber();
        const scr = this.mathToScreen(px, py);
        if (idx === 0) ctx.moveTo(scr.x, scr.y);
        else ctx.lineTo(scr.x, scr.y);
      });
      ctx.closePath();
      ctx.fillStyle = poly.fill || 'rgba(37, 99, 235, 0.08)';
      ctx.fill();
      ctx.strokeStyle = poly.stroke || '#1d4ed8';
      ctx.lineWidth = 2.2;
      ctx.stroke();
      ctx.restore();
    }

    _drawSlopeTriangle(ctx, st) {
      const ax = st.A.x.toNumber(), ay = st.A.y.toNumber();
      const bx = st.B.x.toNumber(), by = st.B.y.toNumber();
      if (Math.abs(ax - bx) < 1e-9 || Math.abs(ay - by) < 1e-9) return;
      const pA = this.mathToScreen(ax, ay);
      const pCorner = this.mathToScreen(bx, ay);
      const pB = this.mathToScreen(bx, by);
      ctx.save();
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(pA.x, pA.y);
      ctx.lineTo(pCorner.x, pCorner.y);
      ctx.lineTo(pB.x, pB.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#b45309';
      ctx.textAlign = 'center';
      ctx.fillText(st.dxLabel || 'Δx', (pA.x + pCorner.x) / 2, pCorner.y + (by >= ay ? 16 : -6));
      ctx.textAlign = 'left';
      ctx.fillText(st.dyLabel || 'Δy', pCorner.x + 6, (pCorner.y + pB.y) / 2 + 4);
      ctx.restore();
    }

    _drawRightAngle(ctx, ra) {
      const vx = typeof ra.vertex.x === 'number' ? ra.vertex.x : ra.vertex.x.toNumber();
      const vy = typeof ra.vertex.y === 'number' ? ra.vertex.y : ra.vertex.y.toNumber();
      const pV = this.mathToScreen(vx, vy);
      const size = 12;
      // Convert math direction vectors to screen unit vectors (y inverted)
      const len1 = Math.hypot(ra.dir1.x, ra.dir1.y);
      const len2 = Math.hypot(ra.dir2.x, ra.dir2.y);
      if (len1 < 1e-9 || len2 < 1e-9) return;
      const u1 = { x: (ra.dir1.x / len1) * size, y: -(ra.dir1.y / len1) * size };
      const u2 = { x: (ra.dir2.x / len2) * size, y: -(ra.dir2.y / len2) * size };
      ctx.save();
      ctx.strokeStyle = ra.color || '#dc2626';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(pV.x + u1.x, pV.y + u1.y);
      ctx.lineTo(pV.x + u1.x + u2.x, pV.y + u1.y + u2.y);
      ctx.lineTo(pV.x + u2.x, pV.y + u2.y);
      ctx.stroke();
      ctx.restore();
    }

    _drawParabola(ctx, par, minX, maxX) {
      const a = par.a.toNumber(), b = par.b.toNumber(), c = par.c.toNumber();
      ctx.save();
      ctx.strokeStyle = par.color || '#7c3aed';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      const samples = 240;
      const step = (maxX - minX) / samples;
      let started = false;
      for (let i = 0; i <= samples; i++) {
        const x = minX + i * step;
        const y = a * x * x + b * x + c;
        const scr = this.mathToScreen(x, y);
        if (scr.y < -1000 || scr.y > this.cssHeight + 1000) {
          started = false;
          continue;
        }
        if (!started) { ctx.moveTo(scr.x, scr.y); started = true; }
        else ctx.lineTo(scr.x, scr.y);
      }
      ctx.stroke();
      ctx.restore();
    }

    _drawInequalityIntervals(ctx, intervals, minX, maxX) {
      const y0 = this.mathToScreen(0, 0).y;
      ctx.save();
      ctx.strokeStyle = '#16a34a';
      ctx.fillStyle = '#16a34a';
      ctx.lineWidth = 6;
      for (const iv of intervals) {
        const fromX = iv.from === -Infinity ? minX - 1 : iv.from;
        const toX = iv.to === Infinity ? maxX + 1 : iv.to;
        const p1 = this.mathToScreen(fromX, 0);
        const p2 = this.mathToScreen(toX, 0);
        ctx.beginPath();
        ctx.moveTo(p1.x, y0);
        ctx.lineTo(p2.x, y0);
        ctx.stroke();

        // Endpoints
        const drawEnd = (val, included) => {
          if (!Number.isFinite(val)) return;
          const p = this.mathToScreen(val, 0);
          ctx.beginPath();
          ctx.arc(p.x, y0, 6.5, 0, Math.PI * 2);
          ctx.fillStyle = included ? '#16a34a' : '#ffffff';
          ctx.fill();
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = '#16a34a';
          ctx.stroke();
          ctx.lineWidth = 6;
        };
        drawEnd(iv.from, iv.incFrom);
        drawEnd(iv.to, iv.incTo);
      }
      ctx.restore();
    }

    _drawFunctionCurve(ctx, fc, minX, maxX) {
      ctx.save();
      ctx.strokeStyle = fc.color || '#0284c7';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      const samples = 260;
      const startX = fc.domainMin !== undefined ? Math.max(minX, fc.domainMin + 1e-4) : minX;
      if (startX >= maxX) { ctx.restore(); return; }
      const step = (maxX - startX) / samples;
      let started = false;
      for (let i = 0; i <= samples; i++) {
        const x = startX + i * step;
        const y = fc.fn(x);
        if (!Number.isFinite(y)) { started = false; continue; }
        const scr = this.mathToScreen(x, y);
        if (scr.y < -1000 || scr.y > this.cssHeight + 1000) { started = false; continue; }
        if (!started) { ctx.moveTo(scr.x, scr.y); started = true; }
        else ctx.lineTo(scr.x, scr.y);
      }
      ctx.stroke();
      ctx.restore();
    }

    _drawCircle(ctx, circ) {
      const cx = circ.center.x.toNumber();
      const cy = circ.center.y.toNumber();
      const rPx = circ.radius.toNumber() * this.scale;
      const p = this.mathToScreen(cx, cy);
      ctx.save();
      ctx.strokeStyle = circ.color || '#64748b';
      ctx.lineWidth = 1.8;
      if (circ.dashed) ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.arc(p.x, p.y, rPx, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    _drawPoint(ctx, pt) {
      const px = typeof pt.x === 'number' ? pt.x : pt.x.toNumber();
      const py = typeof pt.y === 'number' ? pt.y : pt.y.toNumber();
      const scr = this.mathToScreen(px, py);
      const isHovered = this.hoverPointId === pt.id || this.draggingPointId === pt.id;
      const radius = pt.draggable ? (isHovered ? 8.5 : 7) : 5.5;

      ctx.save();
      if (pt.draggable && isHovered) {
        ctx.beginPath();
        ctx.arc(scr.x, scr.y, 15, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(37, 99, 235, 0.18)';
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(scr.x, scr.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = pt.hollow ? '#ffffff' : (pt.color || '#dc2626');
      ctx.fill();
      ctx.lineWidth = 2.4;
      ctx.strokeStyle = pt.hollow ? (pt.color || '#dc2626') : '#ffffff';
      ctx.stroke();

      if (pt.label) {
        ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
        const text = pt.sublabel ? `${pt.label} ${pt.sublabel}` : pt.label;
        const tw = ctx.measureText(text).width;
        const lx = scr.x + 10;
        const ly = scr.y - 10;
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fillRect(lx - 3, ly - 13, tw + 6, 17);
        ctx.fillStyle = '#0f172a';
        ctx.fillText(text, lx, ly);
      }
      ctx.restore();
    }
  }

  const exportsObj = { IsometricGraph };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exportsObj;
  } else {
    root.GraphCalc = root.GraphCalc || {};
    Object.assign(root.GraphCalc, exportsObj);
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
