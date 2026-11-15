function getThemeColors() {
  const styles = getComputedStyle(document.documentElement);
  return {
    textPrimary: styles.getPropertyValue('--text-primary').trim() || '#0f172a',
    textMuted: styles.getPropertyValue('--text-muted').trim() || '#64748b',
    grid: styles.getPropertyValue('--chart-grid').trim() || '#e2e8f0',
    primary: styles.getPropertyValue('--chart-line-primary').trim() || '#2563eb',
    secondary: styles.getPropertyValue('--chart-line-secondary').trim() || '#94a3b8',
    barDefault: styles.getPropertyValue('--chart-bar-default').trim() || '#2563eb',
    barMuted: styles.getPropertyValue('--chart-bar-muted').trim() || '#cbd5e1',
    nominal: styles.getPropertyValue('--status-nominal').trim() || '#15803d',
    warning: styles.getPropertyValue('--status-warning').trim() || '#b45309',
    alert: styles.getPropertyValue('--status-alert').trim() || '#b91c1c',
    surface: styles.getPropertyValue('--bg-surface').trim() || '#ffffff',
  };
}

function createSvgElement(tag, attrs = {}) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, String(v));
  }
  return el;
}

export function renderTrendChart(svgEl, tooltipEl, trendData, mode = 'score') {
  const colors = getThemeColors();
  const rect = svgEl.getBoundingClientRect();
  const width = Math.max(rect.width || 520, 320);
  const height = Math.max(rect.height || 240, 200);

  svgEl.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svgEl.innerHTML = '';

  const pad = { top: 20, right: 24, bottom: 34, left: 46 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const isCgpa = mode === 'cgpa';
  const yMin = isCgpa ? 0 : 30;
  const yMax = isCgpa ? 10.0 : 100;
  const ticks = isCgpa ? [0, 2.5, 5.0, 7.5, 10.0] : [30, 50, 70, 85, 100];

  const xFor = (i) =>
    trendData.length > 1 ? pad.left + (i / (trendData.length - 1)) * plotW : pad.left + plotW / 2;
  const yFor = (val) => {
    const clamped = Math.max(yMin, Math.min(yMax, val));
    return pad.top + plotH - ((clamped - yMin) / (yMax - yMin)) * plotH;
  };

  for (const tick of ticks) {
    const y = yFor(tick);
    svgEl.appendChild(
      createSvgElement('line', {
        x1: pad.left,
        y1: y,
        x2: width - pad.right,
        y2: y,
        stroke: colors.grid,
        'stroke-width': 1,
      })
    );
    const label = createSvgElement('text', {
      x: pad.left - 8,
      y: y + 4,
      'text-anchor': 'end',
      fill: colors.textMuted,
      'font-size': 11,
      'font-family': 'JetBrains Mono, monospace',
    });
    label.textContent = isCgpa ? tick.toFixed(1) : `${tick}%`;
    svgEl.appendChild(label);
  }

  if (trendData.length) {
    const benchY = yFor(trendData[0].benchmark);
    svgEl.appendChild(
      createSvgElement('line', {
        x1: pad.left,
        y1: benchY,
        x2: width - pad.right,
        y2: benchY,
        stroke: colors.secondary,
        'stroke-width': 1.5,
        'stroke-dasharray': '5 4',
      })
    );
  }

  if (trendData.length) {
    const pts = trendData.map((d, i) => ({ x: xFor(i), y: yFor(d.value), d }));
    const lineD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const areaD = `${lineD} L ${pts[pts.length - 1].x.toFixed(1)} ${(pad.top + plotH).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(pad.top + plotH).toFixed(1)} Z`;

    svgEl.appendChild(
      createSvgElement('path', {
        d: areaD,
        fill: colors.primary,
        'fill-opacity': 0.08,
      })
    );
    svgEl.appendChild(
      createSvgElement('path', {
        d: lineD,
        fill: 'none',
        stroke: colors.primary,
        'stroke-width': 2.25,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
      })
    );

    pts.forEach((p) => {
      const xLabel = createSvgElement('text', {
        x: p.x,
        y: height - 10,
        'text-anchor': 'middle',
        fill: colors.textMuted,
        'font-size': 11.5,
      });
      xLabel.textContent = p.d.label;
      svgEl.appendChild(xLabel);

      const dot = createSvgElement('circle', {
        cx: p.x,
        cy: p.y,
        r: 4.5,
        fill: colors.surface,
        stroke: colors.primary,
        'stroke-width': 2.25,
        style: 'cursor: pointer;',
      });

      const hit = createSvgElement('circle', {
        cx: p.x,
        cy: p.y,
        r: 16,
        fill: 'transparent',
        style: 'cursor: pointer;',
      });

      hit.addEventListener('mouseenter', () => {
        dot.setAttribute('r', '6');
        const valText = isCgpa ? p.d.value.toFixed(2) : `${p.d.value.toFixed(1)}%`;
        const benchText = isCgpa ? p.d.benchmark.toFixed(1) : `${p.d.benchmark}%`;
        tooltipEl.innerHTML = `<strong>${p.d.label}</strong><br>Mean: ${valText} · Target: ${benchText}`;
        tooltipEl.style.left = `${(p.x / width) * 100}%`;
        tooltipEl.style.top = `${p.y}px`;
        tooltipEl.classList.remove('hidden');
      });

      hit.addEventListener('mouseleave', () => {
        dot.setAttribute('r', '4.5');
        tooltipEl.classList.add('hidden');
      });

      svgEl.appendChild(dot);
      svgEl.appendChild(hit);
    });
  }
}

export function renderGradeChart(svgEl, tooltipEl, distData, activeTier, onSelectTier) {
  const colors = getThemeColors();
  const rect = svgEl.getBoundingClientRect();
  const width = Math.max(rect.width || 520, 320);
  const height = Math.max(rect.height || 240, 200);

  svgEl.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svgEl.innerHTML = '';

  const pad = { top: 20, right: 16, bottom: 32, left: 36 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const maxCount = Math.max(4, ...distData.map((d) => d.count));
  const slotW = plotW / distData.length;
  const barW = Math.min(34, slotW * 0.62);

  const step = Math.max(1, Math.ceil(maxCount / 4));
  for (let v = 0; v <= maxCount; v += step) {
    const y = pad.top + plotH - (v / maxCount) * plotH;
    svgEl.appendChild(
      createSvgElement('line', {
        x1: pad.left,
        y1: y,
        x2: width - pad.right,
        y2: y,
        stroke: colors.grid,
        'stroke-width': 1,
      })
    );
    const label = createSvgElement('text', {
      x: pad.left - 8,
      y: y + 4,
      'text-anchor': 'end',
      fill: colors.textMuted,
      'font-size': 11,
      'font-family': 'JetBrains Mono, monospace',
    });
    label.textContent = v;
    svgEl.appendChild(label);
  }

  distData.forEach((d, i) => {
    const cx = pad.left + i * slotW + slotW / 2;
    const barH = (d.count / maxCount) * plotH;
    const x = cx - barW / 2;
    const y = pad.top + plotH - barH;

    let fillColor = colors.barDefault;
    if (d.tier === 'F') {
      fillColor = colors.alert;
    } else if (d.tier === 'P' || d.tier === 'C') {
      fillColor = colors.warning;
    }

    const isDimmed = activeTier && activeTier !== d.tier;

    const bar = createSvgElement('rect', {
      x,
      y: Math.min(y, pad.top + plotH - 2),
      width: barW,
      height: Math.max(barH, d.count > 0 ? 3 : 1),
      rx: 3,
      fill: fillColor,
      opacity: isDimmed ? 0.3 : 0.92,
      style: 'cursor: pointer; transition: opacity 150ms ease;',
    });

    const hit = createSvgElement('rect', {
      x: pad.left + i * slotW,
      y: pad.top,
      width: slotW,
      height: plotH + 24,
      fill: 'transparent',
      style: 'cursor: pointer;',
    });

    hit.addEventListener('mouseenter', () => {
      bar.setAttribute('opacity', '1');
      tooltipEl.innerHTML = `<strong>Grade ${d.tier}</strong><br>${d.count} student${d.count === 1 ? '' : 's'} (${d.pct.toFixed(1)}%)`;
      tooltipEl.style.left = `${(cx / width) * 100}%`;
      tooltipEl.style.top = `${Math.max(y, pad.top + 10)}px`;
      tooltipEl.classList.remove('hidden');
    });

    hit.addEventListener('mouseleave', () => {
      bar.setAttribute('opacity', isDimmed ? '0.3' : '0.92');
      tooltipEl.classList.add('hidden');
    });

    hit.addEventListener('click', () => {
      onSelectTier(activeTier === d.tier ? null : d.tier);
    });

    svgEl.appendChild(bar);

    if (d.count > 0) {
      const countLabel = createSvgElement('text', {
        x: cx,
        y: Math.max(y - 5, pad.top + 10),
        'text-anchor': 'middle',
        fill: colors.textPrimary,
        'font-size': 11,
        'font-family': 'JetBrains Mono, monospace',
        opacity: isDimmed ? 0.45 : 1,
      });
      countLabel.textContent = d.count;
      svgEl.appendChild(countLabel);
    }

    const xLabel = createSvgElement('text', {
      x: cx,
      y: height - 10,
      'text-anchor': 'middle',
      fill: activeTier === d.tier ? colors.textPrimary : colors.textMuted,
      'font-weight': activeTier === d.tier ? '700' : '500',
      'font-size': 11.5,
      'font-family': 'JetBrains Mono, monospace',
    });
    xLabel.textContent = d.tier;
    svgEl.appendChild(xLabel);

    svgEl.appendChild(hit);
  });
}

let scatterPointsCache = [];
let scatterListenersAttached = false;

export function renderScatterChart(canvasEl, tooltipEl, students, regression, onSelectStudent) {
  const colors = getThemeColors();
  const rect = canvasEl.getBoundingClientRect();
  const width = Math.max(rect.width || 560, 300);
  const height = Math.max(rect.height || 300, 240);
  const dpr = window.devicePixelRatio || 1;

  canvasEl.width = Math.floor(width * dpr);
  canvasEl.height = Math.floor(height * dpr);

  const ctx = canvasEl.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const pad = { top: 20, right: 24, bottom: 38, left: 48 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const xMin = 50;
  const xMax = 100;
  const yMin = 30;
  const yMax = 100;

  const xToPx = (x) => pad.left + ((Math.max(xMin, Math.min(xMax, x)) - xMin) / (xMax - xMin)) * plotW;
  const yToPx = (y) => pad.top + plotH - ((Math.max(yMin, Math.min(yMax, y)) - yMin) / (yMax - yMin)) * plotH;

  ctx.strokeStyle = colors.grid;
  ctx.lineWidth = 1;
  ctx.font = '11px "JetBrains Mono", monospace';
  ctx.fillStyle = colors.textMuted;

  for (const yTick of [30, 50, 70, 85, 100]) {
    const py = yToPx(yTick);
    ctx.beginPath();
    ctx.moveTo(pad.left, py);
    ctx.lineTo(width - pad.right, py);
    ctx.stroke();
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${yTick}%`, pad.left - 8, py);
  }

  for (const xTick of [50, 60, 70, 80, 90, 100]) {
    const px = xToPx(xTick);
    ctx.beginPath();
    ctx.moveTo(px, pad.top);
    ctx.lineTo(px, pad.top + plotH);
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`${xTick}%`, px, pad.top + plotH + 8);
  }

  ctx.fillStyle = colors.textMuted;
  ctx.font = '11px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Attendance Rate (%) — 75% UGC Norm', pad.left + plotW / 2, height - 10);

  if (students.length >= 2) {
    const yStart = regression.slope * xMin + regression.intercept;
    const yEnd = regression.slope * xMax + regression.intercept;
    ctx.save();
    ctx.strokeStyle = colors.secondary;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(xToPx(xMin), yToPx(yStart));
    ctx.lineTo(xToPx(xMax), yToPx(yEnd));
    ctx.stroke();
    ctx.restore();
  }

  scatterPointsCache = students.map((s) => {
    const px = xToPx(s.attendance);
    const py = yToPx(s.average);
    let pointColor = colors.nominal;
    if (s.status === 'Academic Alert') pointColor = colors.alert;
    else if (s.status === 'Needs Review') pointColor = colors.warning;

    ctx.beginPath();
    ctx.arc(px, py, 5.5, 0, Math.PI * 2);
    ctx.fillStyle = pointColor;
    ctx.globalAlpha = 0.86;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = colors.surface;
    ctx.stroke();

    return { px, py, student: s };
  });

  if (!scatterListenersAttached) {
    scatterListenersAttached = true;

    const findNearest = (clientX, clientY) => {
      const cRect = canvasEl.getBoundingClientRect();
      const mx = clientX - cRect.left;
      const my = clientY - cRect.top;
      let nearest = null;
      let minDist = 14;
      for (const pt of scatterPointsCache) {
        const d = Math.hypot(pt.px - mx, pt.py - my);
        if (d < minDist) {
          minDist = d;
          nearest = pt;
        }
      }
      return nearest;
    };

    canvasEl.addEventListener('mousemove', (e) => {
      const hit = findNearest(e.clientX, e.clientY);
      if (hit) {
        canvasEl.style.cursor = 'pointer';
        tooltipEl.innerHTML = `<strong>${hit.student.name}</strong> (${hit.student.status})<br>Attendance: ${hit.student.attendance}% · Score: ${hit.student.average.toFixed(1)}%`;
        tooltipEl.style.left = `${hit.px}px`;
        tooltipEl.style.top = `${hit.py}px`;
        tooltipEl.classList.remove('hidden');
      } else {
        canvasEl.style.cursor = 'default';
        tooltipEl.classList.add('hidden');
      }
    });

    canvasEl.addEventListener('mouseleave', () => {
      tooltipEl.classList.add('hidden');
    });

    canvasEl.addEventListener('click', (e) => {
      const hit = findNearest(e.clientX, e.clientY);
      if (hit && onSelectStudent) {
        onSelectStudent(hit.student.id);
      }
    });
  }
}
