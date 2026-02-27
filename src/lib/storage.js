const STORAGE_KEY = "shopfloor-ki-results";
const MAX_ENTRIES = 20;

export function saveResult(result) {
  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    feature: result.feature || "data",
    timestamp: Date.now(),
    title: result.title || result.data?.title || "Analyse",
    data: result,
  };

  const all = getResults();
  all.unshift(entry);

  // Trim to max entries
  if (all.length > MAX_ENTRIES) {
    all.length = MAX_ENTRIES;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return entry;
}

export function getResults() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return parsed.sort((a, b) => b.timestamp - a.timestamp);
  } catch {
    return [];
  }
}

export function deleteResult(id) {
  const all = getResults().filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}
