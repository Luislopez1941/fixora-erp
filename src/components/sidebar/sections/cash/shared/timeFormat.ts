/** '06:00' -> '6:00 AM', '16:30' -> '4:30 PM' (los horarios se guardan en 24 h y se muestran en 12 h). */
export const fmt12 = (t?: string | null) => {
  if (!t || !/^\d{2}:\d{2}$/.test(t)) return t ?? '';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};

export const fmtRange = (a?: string | null, b?: string | null) => `${fmt12(a)} – ${fmt12(b)}`;
