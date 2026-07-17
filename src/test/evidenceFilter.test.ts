import { describe, expect, it } from 'vitest';
import type { EvidenceFilters, Material } from '../types/game';
import { filterEvidence } from '../utils/evidenceFilter';

const evidence: Material[] = [
  {
    id: 'one',
    chapterId: 'chapter-1',
    title: 'Журнал доступа',
    eyebrow: 'лог',
    kind: 'log',
    summary: 'Проход через архив',
    sections: [{ body: 'Карта сотрудника' }],
    suspectIds: ['s1'],
    locations: ['archive'],
    timeLabels: ['00:17'],
    boardEligible: true,
  },
  {
    id: 'two',
    chapterId: 'chapter-1',
    title: 'Справка',
    eyebrow: 'фон',
    kind: 'document',
    summary: 'Описание здания',
    sections: [{ body: 'Общий контекст' }],
    suspectIds: [],
    locations: ['station'],
    timeLabels: [],
    boardEligible: false,
  },
];

const filters: EvidenceFilters = {
  query: '',
  suspectId: '',
  location: '',
  timeLabel: '',
  starredOnly: false,
};

describe('фильтрация улик', () => {
  it('не включает материалы, не предназначенные для доски', () => {
    expect(filterEvidence(evidence, filters, []).map((item) => item.id)).toEqual(['one']);
  });

  it('совмещает поиск, человека, место, время и важность', () => {
    expect(
      filterEvidence(
        evidence,
        {
          query: 'КАРТА',
          suspectId: 's1',
          location: 'archive',
          timeLabel: '00:17',
          starredOnly: true,
        },
        ['one'],
      ).map((item) => item.id),
    ).toEqual(['one']);
  });
});
