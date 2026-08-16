import { useMemo, useState } from 'react';

function pad(n) {
  return String(n).padStart(2, '0');
}
function toISO(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function computeRange(preset, custom = {}) {
  const now = new Date();
  let from;
  let to = new Date(now);

  switch (preset) {
    case 'today':
      from = new Date(now);
      break;
    case 'week': {
      from = new Date(now);
      const day = (from.getDay() + 6) % 7; // Monday = 0
      from.setDate(from.getDate() - day);
      break;
    }
    case 'month':
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'lastMonth': {
      from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      to = new Date(now.getFullYear(), now.getMonth(), 0);
      break;
    }
    case 'year':
      from = new Date(now.getFullYear(), 0, 1);
      break;
    case 'custom':
      return { from: custom.from || toISO(now), to: custom.to || toISO(now) };
    default:
      from = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return { from: toISO(from), to: toISO(to) };
}

export function useDateRange(initialPreset = 'month') {
  const [preset, setPreset] = useState(initialPreset);
  const [custom, setCustom] = useState({ from: '', to: '' });

  const range = useMemo(() => computeRange(preset, custom), [preset, custom]);

  return { preset, setPreset, custom, setCustom, range };
}
