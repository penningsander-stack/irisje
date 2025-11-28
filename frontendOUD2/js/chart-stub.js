// frontend/js/chart-stub.js
// Lightweight local stub for Chart.js to avoid external CDN dependency.
// Supports the limited 'doughnut' usage in dashboard.js.

(function () {
  if (typeof window === "undefined") return;
  if (window.Chart) return; // respect real Chart if present

  class SimpleChart {
    constructor(ctx, config) {
      this.ctx = ctx && ctx.getContext ? ctx.getContext("2d") : null;
      this.config = config || {};
      this._draw();
    }

    _draw() {
      if (!this.ctx || !this.config || !this.config.data) return;

      const data = (this.config.data.datasets || [])[0] || {};
      const values = Array.isArray(data.data) ? data.data : [];
      const labels = Array.isArray(this.config.data.labels)
        ? this.config.data.labels
        : [];

      const total = values.reduce((sum, v) => sum + (Number(v) || 0), 0);
      if (!total) return;

      const ctx = this.ctx;
      const w = ctx.canvas.width;
      const h = ctx.canvas.height;
      const radius = Math.min(w, h) / 2 - 10;
      const cx = w / 2;
      const cy = h / 2;

      ctx.clearRect(0, 0, w, h);

      const baseColors = [
        "#4F46E5",
        "#22C55E",
        "#F97316",
        "#EF4444",
        "#0EA5E9",
        "#A855F7",
      ];

      let startAngle = -Math.PI / 2;

      values.forEach((value, index) => {
        const numeric = Number(value) || 0;
        if (!numeric) return;

        const sliceAngle = (numeric / total) * Math.PI * 2;
        const endAngle = startAngle + sliceAngle;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = baseColors[index % baseColors.length];
        ctx.fill();

        startAngle = endAngle;
      });

      // inner "hole"
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = "#F9FAFB";
      ctx.fill();

      // simple center label: total
      ctx.fillStyle = "#111827";
      ctx.font = "14px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(total), cx, cy);
    }

    destroy() {
      if (!this.ctx) return;
      const ctx = this.ctx;
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
  }

  window.Chart = SimpleChart;
})();
