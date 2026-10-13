export class InputHandler {
  constructor(canvas) {
    this.canvas = canvas;
    this.clickX = null;
    this.clickY = null;
    this.mouseX = 0;
    this.mouseY = 0;
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseDown = this._onMouseDown.bind(this);
    canvas.addEventListener('mousemove', this._onMouseMove);
    canvas.addEventListener('mousedown', this._onMouseDown);
  }

  _getCanvasPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  _onMouseMove(e) {
    const pos = this._getCanvasPos(e);
    this.mouseX = pos.x;
    this.mouseY = pos.y;
  }

  _onMouseDown(e) {
    const pos = this._getCanvasPos(e);
    this.clickX = pos.x;
    this.clickY = pos.y;
  }

  consumeClick() {
    if (this.clickX === null) return null;
    const click = { x: this.clickX, y: this.clickY };
    this.clickX = null;
    this.clickY = null;
    return click;
  }
}

export function drawCrosshair(ctx, x, y) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 2;
  const s = 14;
  ctx.beginPath();
  ctx.moveTo(x - s, y); ctx.lineTo(x + s, y);
  ctx.moveTo(x, y - s); ctx.lineTo(x, y + s);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, 8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}
