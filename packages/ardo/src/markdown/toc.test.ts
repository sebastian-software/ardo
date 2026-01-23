import { describe, it, expect } from 'vitest'
import { flattenToc } from './toc'
import type { TOCItem } from '../config/types'

describe('flattenToc', () => {
  it('returns empty array for empty toc', () => {
    const result = flattenToc([])
    expect(result).toEqual([])
  })

  it('returns flat array for flat toc', () => {
    const toc: TOCItem[] = [
      { id: 'intro', text: 'Introduction', level: 2 },
      { id: 'features', text: 'Features', level: 2 },
      { id: 'conclusion', text: 'Conclusion', level: 2 },
    ]

    const result = flattenToc(toc)

    expect(result).toHaveLength(3)
    expect(result[0].id).toBe('intro')
    expect(result[1].id).toBe('features')
    expect(result[2].id).toBe('conclusion')
  })

  it('flattens nested toc items', () => {
    const toc: TOCItem[] = [
      {
        id: 'intro',
        text: 'Introduction',
        level: 2,
        children: [
          { id: 'overview', text: 'Overview', level: 3 },
          { id: 'goals', text: 'Goals', level: 3 },
        ],
      },
      { id: 'features', text: 'Features', level: 2 },
    ]

    const result = flattenToc(toc)

    expect(result).toHaveLength(4)
    expect(result[0].id).toBe('intro')
    expect(result[1].id).toBe('overview')
    expect(result[2].id).toBe('goals')
    expect(result[3].id).toBe('features')
  })

  it('handles deeply nested items', () => {
    const toc: TOCItem[] = [
      {
        id: 'level1',
        text: 'Level 1',
        level: 2,
        children: [
          {
            id: 'level2',
            text: 'Level 2',
            level: 3,
            children: [{ id: 'level3', text: 'Level 3', level: 4 }],
          },
        ],
      },
    ]

    const result = flattenToc(toc)

    expect(result).toHaveLength(3)
    expect(result.map((item) => item.id)).toEqual(['level1', 'level2', 'level3'])
  })
})
