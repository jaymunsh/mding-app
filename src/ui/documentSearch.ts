const searchMarkSelector = "mark.document-search-match"
const excludedSearchTags = new Set(["SCRIPT", "STYLE", "TEXTAREA", "INPUT", "BUTTON", "MARK"])

export type DocumentSearchMatch = HTMLElement

export function applyDocumentSearch(
  root: HTMLElement,
  query: string,
): readonly DocumentSearchMatch[] {
  clearDocumentSearch(root)
  const normalizedQuery = query.trim()
  if (normalizedQuery.length === 0) {
    return []
  }

  const matches: DocumentSearchMatch[] = []
  for (const textNode of collectSearchableTextNodes(root)) {
    matches.push(...replaceTextNodeMatches(textNode, normalizedQuery))
  }
  return matches
}

export function clearDocumentSearch(root: HTMLElement): void {
  const marks = Array.from(root.querySelectorAll(searchMarkSelector))
  for (const mark of marks) {
    const parent = mark.parentNode
    if (parent === null) {
      continue
    }
    parent.replaceChild(document.createTextNode(mark.textContent ?? ""), mark)
    parent.normalize()
  }
}

export function setActiveDocumentSearchMatch(
  matches: readonly DocumentSearchMatch[],
  activeIndex: number,
): void {
  matches.forEach((match, index) => {
    match.classList.toggle("active", index === activeIndex)
  })
  matches[activeIndex]?.scrollIntoView({ block: "center", inline: "nearest" })
}

function collectSearchableTextNodes(root: HTMLElement): readonly Text[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement
      if (parent === null || excludedSearchTags.has(parent.tagName)) {
        return NodeFilter.FILTER_REJECT
      }
      if ((node.textContent ?? "").trim().length === 0) {
        return NodeFilter.FILTER_REJECT
      }
      return NodeFilter.FILTER_ACCEPT
    },
  })
  const nodes: Text[] = []
  let current = walker.nextNode()
  while (current !== null) {
    if (current instanceof Text) {
      nodes.push(current)
    }
    current = walker.nextNode()
  }
  return nodes
}

function replaceTextNodeMatches(textNode: Text, query: string): readonly DocumentSearchMatch[] {
  const text = textNode.data
  const lowerText = text.toLocaleLowerCase()
  const lowerQuery = query.toLocaleLowerCase()
  const fragment = document.createDocumentFragment()
  const matches: DocumentSearchMatch[] = []
  let cursor = 0
  let index = lowerText.indexOf(lowerQuery)

  while (index !== -1) {
    if (index > cursor) {
      fragment.append(document.createTextNode(text.slice(cursor, index)))
    }

    const mark = document.createElement("mark")
    mark.className = "document-search-match"
    mark.textContent = text.slice(index, index + query.length)
    fragment.append(mark)
    matches.push(mark)

    cursor = index + query.length
    index = lowerText.indexOf(lowerQuery, cursor)
  }

  if (matches.length === 0) {
    return []
  }

  if (cursor < text.length) {
    fragment.append(document.createTextNode(text.slice(cursor)))
  }
  textNode.replaceWith(fragment)
  return matches
}
