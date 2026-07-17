import type { EvidenceFilters, Material } from '../types/game';
import { normalizeAnswer } from './normalize';

export const filterEvidence = (
  materials: Material[],
  filters: EvidenceFilters,
  starredIds: string[],
): Material[] => {
  const query = normalizeAnswer(filters.query);
  const starred = new Set(starredIds);

  return materials.filter((item) => {
    if (!item.boardEligible) return false;
    if (filters.starredOnly && !starred.has(item.id)) return false;
    if (filters.suspectId && !item.suspectIds.includes(filters.suspectId)) return false;
    if (filters.location && !item.locations.includes(filters.location)) return false;
    if (filters.timeLabel && !item.timeLabels.includes(filters.timeLabel)) return false;
    if (!query) return true;

    const searchable = normalizeAnswer(
      [item.title, item.summary, ...item.sections.map((section) => section.body)].join(' '),
    );
    return searchable.includes(query);
  });
};
