import type { MermaidColorMode } from "./MermaidPreview"

export function createHtmlPreviewBridgeScript(
  colorMode: MermaidColorMode,
  zoom = 1,
  initialReadingProgress = 0,
): string {
  return `
;(function () {
  var appTheme = ${JSON.stringify(colorMode)}
  var previewZoom = ${JSON.stringify(zoom)}
  var initialReadingProgress = ${JSON.stringify(clampProgress(initialReadingProgress))}
  var restoreFrameCount = 45
  var progressSaveDelayMs = 900
  var progressTimer = 0
  var searchMatches = []

  function syncTheme() {
    document.documentElement.dataset.mdingTheme = appTheme
    document.documentElement.dataset.theme = appTheme
    document.documentElement.style.colorScheme = appTheme
  }

  function syncZoom(zoom) {
    if (!Number.isFinite(zoom) || zoom <= 0) {
      return
    }
    previewZoom = zoom
    document.documentElement.style.zoom = String(previewZoom)
  }

  function targetIdFromHref(href) {
    if (!href || href.charAt(0) !== "#") {
      return null
    }
    if (href === "#") {
      return ""
    }
    try {
      return decodeURIComponent(href.slice(1))
    } catch (error) {
      return href.slice(1)
    }
  }

  function clampProgress(ratio) {
    if (!Number.isFinite(ratio) || ratio <= 0) {
      return 0
    }
    if (ratio >= 1) {
      return 1
    }
    return ratio
  }

  function maxScrollTop() {
    return Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
  }

  function readingProgress() {
    var maxTop = maxScrollTop()
    if (maxTop <= 0) {
      return 0
    }
    return clampProgress(window.scrollY / maxTop)
  }

  function postReadingProgress() {
    window.parent.postMessage({
      type: "mding:html-reading-progress",
      ratio: readingProgress()
    }, "*")
  }

  function scheduleReadingProgress() {
    if (progressTimer !== 0) {
      window.clearTimeout(progressTimer)
    }
    progressTimer = window.setTimeout(function () {
      progressTimer = 0
      postReadingProgress()
    }, progressSaveDelayMs)
  }

  function restoreReadingProgress() {
    if (initialReadingProgress <= 0) {
      return
    }
    var frame = 0
    var lastAppliedTop = null

    function restore() {
      var nextTop = Math.round(maxScrollTop() * initialReadingProgress)
      if (lastAppliedTop === null && window.scrollY > 2 && Math.abs(window.scrollY - nextTop) > 2) {
        return
      }
      if (lastAppliedTop !== null && Math.abs(window.scrollY - lastAppliedTop) > 2) {
        return
      }
      window.scrollTo({ top: nextTop, left: 0, behavior: "auto" })
      lastAppliedTop = nextTop
      frame += 1
      if (frame < restoreFrameCount) {
        requestAnimationFrame(restore)
      }
    }

    requestAnimationFrame(restore)
  }

  function scrollToHashTarget(id) {
    if (id === "") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" })
      postReadingProgress()
      return
    }
    var target = document.getElementById(id)
    if (target) {
      var html = document.documentElement
      var previousScrollBehavior = html.style.scrollBehavior
      var scrollPaddingTop = parseFloat(getComputedStyle(html).scrollPaddingTop) || 0
      var targetTop = Math.max(0, target.offsetTop - scrollPaddingTop)
      var attempts = 0
      html.style.scrollBehavior = "auto"
      window.scrollTo({ top: targetTop, left: 0, behavior: "auto" })

      function alignTarget() {
        var top = target.getBoundingClientRect().top - scrollPaddingTop
        if (Math.abs(top) > 2) {
          window.scrollTo({ top: Math.max(0, window.scrollY + top), left: 0, behavior: "auto" })
        }
        attempts += 1
        if (attempts >= 45) {
          html.style.scrollBehavior = previousScrollBehavior
          postReadingProgress()
          return
        }
        requestAnimationFrame(alignTarget)
      }

      alignTarget()
    }
  }

  function clearSearch() {
    var marks = Array.from(document.querySelectorAll("mark.document-search-match"))
    marks.forEach(function (mark) {
      var parent = mark.parentNode
      if (!parent) {
        return
      }
      parent.replaceChild(document.createTextNode(mark.textContent || ""), mark)
      parent.normalize()
    })
    searchMatches = []
  }

  function searchableTextNodes() {
    var excludedTags = {
      SCRIPT: true,
      STYLE: true,
      TEXTAREA: true,
      INPUT: true,
      BUTTON: true,
      MARK: true
    }
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        var parent = node.parentElement
        if (!parent || excludedTags[parent.tagName]) {
          return NodeFilter.FILTER_REJECT
        }
        if (!(node.textContent || "").trim()) {
          return NodeFilter.FILTER_REJECT
        }
        return NodeFilter.FILTER_ACCEPT
      }
    })
    var nodes = []
    var current = walker.nextNode()
    while (current) {
      nodes.push(current)
      current = walker.nextNode()
    }
    return nodes
  }

  function replaceTextNodeMatches(textNode, query) {
    var text = textNode.data
    var lowerText = text.toLocaleLowerCase()
    var lowerQuery = query.toLocaleLowerCase()
    var fragment = document.createDocumentFragment()
    var matches = []
    var cursor = 0
    var index = lowerText.indexOf(lowerQuery)

    while (index !== -1) {
      if (index > cursor) {
        fragment.appendChild(document.createTextNode(text.slice(cursor, index)))
      }
      var mark = document.createElement("mark")
      mark.className = "document-search-match"
      mark.textContent = text.slice(index, index + query.length)
      fragment.appendChild(mark)
      matches.push(mark)
      cursor = index + query.length
      index = lowerText.indexOf(lowerQuery, cursor)
    }

    if (matches.length === 0) {
      return []
    }
    if (cursor < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(cursor)))
    }
    textNode.replaceWith(fragment)
    return matches
  }

  function postSearchResult(activeIndex) {
    window.parent.postMessage({
      type: "mding:html-preview-search-result",
      count: searchMatches.length,
      activeIndex: searchMatches.length === 0 ? -1 : activeIndex
    }, "*")
  }

  function applySearch(query, activeIndex) {
    clearSearch()
    var normalizedQuery = typeof query === "string" ? query.trim() : ""
    if (!normalizedQuery) {
      postSearchResult(-1)
      return
    }
    searchableTextNodes().forEach(function (textNode) {
      searchMatches = searchMatches.concat(replaceTextNodeMatches(textNode, normalizedQuery))
    })
    var clampedIndex = Math.max(0, Math.min(activeIndex || 0, searchMatches.length - 1))
    searchMatches.forEach(function (match, index) {
      match.classList.toggle("active", index === clampedIndex)
    })
    if (searchMatches[clampedIndex]) {
      searchMatches[clampedIndex].scrollIntoView({ block: "center", inline: "nearest" })
    }
    postSearchResult(clampedIndex)
  }

  syncTheme()
  syncZoom(previewZoom)
  restoreReadingProgress()
  window.addEventListener("scroll", scheduleReadingProgress, { passive: true })
  window.addEventListener("pagehide", postReadingProgress)
  window.addEventListener("beforeunload", postReadingProgress)
  window.addEventListener("message", function (event) {
    var data = event.data
    if (!data) {
      return
    }
    if (data.type === "mding:html-preview-zoom") {
      syncZoom(data.zoom)
      return
    }
    if (data.type === "mding:html-preview-search") {
      applySearch(data.query, data.activeIndex)
    }
  })

  document.addEventListener("click", function (event) {
    var target = event.target
    if (!target || typeof target.closest !== "function") {
      return
    }
    var link = target.closest("a[href]")
    if (!link) {
      return
    }
    var id = targetIdFromHref(link.getAttribute("href"))
    if (id === null) {
      return
    }
    event.preventDefault()
    scrollToHashTarget(id)
  }, true)
})()
`
}

function clampProgress(ratio: number): number {
  if (!Number.isFinite(ratio) || ratio <= 0) {
    return 0
  }
  if (ratio >= 1) {
    return 1
  }
  return ratio
}
