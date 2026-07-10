type SidebarSection = {
  sectionId: string
}

export function sortNodesBySectionOrder(
  nodes: SidebarSection[],
  sectionOrder: string[] | undefined
): void {
  if (sectionOrder == null || sectionOrder.length === 0) return

  const sectionOrderMap = createSectionOrderMap(sectionOrder)
  if (sectionOrderMap.size === 0) return

  nodes.sort((leftNode, rightNode) => {
    const leftIndex = sectionOrderMap.get(leftNode.sectionId)
    const rightIndex = sectionOrderMap.get(rightNode.sectionId)
    if (leftIndex != null && rightIndex != null) return leftIndex - rightIndex
    if (leftIndex != null) return -1
    if (rightIndex != null) return 1
    return 0
  })
}

function createSectionOrderMap(sectionOrder: string[]): Map<string, number> {
  const sectionOrderMap = new Map<string, number>()
  for (const [index, section] of sectionOrder.entries()) {
    const normalizedSection = normalizeSectionId(section)
    if (normalizedSection !== "" && !sectionOrderMap.has(normalizedSection)) {
      sectionOrderMap.set(normalizedSection, index)
    }
  }
  return sectionOrderMap
}

function normalizeSectionId(section: string): string {
  const normalizedSection = section.replaceAll("\\", "/")
  let startIndex = 0
  let endIndex = normalizedSection.length
  while (startIndex < endIndex && normalizedSection[startIndex] === "/") startIndex += 1
  while (endIndex > startIndex && normalizedSection[endIndex - 1] === "/") endIndex -= 1
  return normalizedSection.slice(startIndex, endIndex)
}
