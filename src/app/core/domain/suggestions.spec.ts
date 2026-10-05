import { OWNERS } from '../../../testing/fixtures';
import {
  canonicalCatName,
  catSuggestions,
  containsName,
  findOwnerByName,
  isKnownCat,
  ownerSuggestions,
} from './suggestions';

describe('suggestions', () => {
  describe('owners', () => {
    it('matches names containing the query, case-insensitively', () => {
      expect(ownerSuggestions(OWNERS, 'tho', null).map((o) => o.name)).toEqual(['Thomas Berger']);
      expect(ownerSuggestions(OWNERS, 'MAR', null).map((o) => o.name)).toEqual(['Maria Huber']);
    });

    it('returns nothing for an empty query and skips the selected owner', () => {
      expect(ownerSuggestions(OWNERS, '  ', null)).toEqual([]);
      expect(ownerSuggestions(OWNERS, 'maria', 'o1')).toEqual([]);
    });

    it('limits to five owners', () => {
      const many = Array.from({ length: 8 }, (_, i) => ({
        ...OWNERS[0],
        id: `x${i}`,
        name: `Anna ${i}`,
      }));
      expect(ownerSuggestions(many, 'anna', null).length).toBe(5);
    });

    it('finds exact names regardless of case', () => {
      expect(findOwnerByName(OWNERS, ' maria huber ')?.id).toBe('o1');
      expect(findOwnerByName(OWNERS, 'Maria')).toBeUndefined();
    });
  });

  describe('cats', () => {
    it('lists the selected owner’s cats first, even without a query', () => {
      expect(catSuggestions(OWNERS, OWNERS[0], [], '')).toEqual([
        { name: 'Minka', source: 'von Maria Huber' },
        { name: 'Felix', source: 'von Maria Huber' },
      ]);
    });

    it('adds other known cats that match the query and skips chosen ones', () => {
      expect(catSuggestions(OWNERS, OWNERS[0], ['Minka'], 'i')).toEqual([
        { name: 'Felix', source: 'von Maria Huber' },
        { name: 'Tiger', source: 'bekannt' },
      ]);
    });

    it('knows cats and their spelling', () => {
      expect(isKnownCat(OWNERS, 'luna')).toBeTrue();
      expect(isKnownCat(OWNERS, 'Pünktchen')).toBeFalse();
      expect(canonicalCatName(OWNERS, ' luna ')).toBe('Luna');
      expect(canonicalCatName(OWNERS, ' Pünktchen ')).toBe('Pünktchen');
      expect(containsName(['Minka'], 'MINKA')).toBeTrue();
    });
  });
});
