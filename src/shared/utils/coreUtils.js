export const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const isoDaysAgo = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const withTs = (daysAgo, offset = 0) => Date.now() - daysAgo * 86400000 + offset;

export const distributeTotal = (total, count) => {
  const base = Math.floor(total / count);
  const rem = total - base * count;
  return Array.from({ length: count }, (_, i) => base + (i < rem ? 1 : 0));
};

export const genId = (p = "id") => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const ALNUM = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateJoinCode(existing = [], length = 6) {
  for (let tries = 0; tries < 30; tries += 1) {
    let code = "";
    for (let i = 0; i < length; i += 1) code += ALNUM[Math.floor(Math.random() * ALNUM.length)];
    if (!existing.includes(code)) return code;
  }
  return Math.random().toString(36).slice(2, 2 + length).toUpperCase();
}
