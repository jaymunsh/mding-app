import type { MermaidColorMode } from "./MermaidPreview"

export function createHtmlPreviewBridgeScript(colorMode: MermaidColorMode, zoom = 1): string {
  return `
;(function () {
  var appTheme = ${JSON.stringify(colorMode)}
  var previewZoom = ${JSON.stringify(zoom)}

  function syncTheme() {
    document.documentElement.dataset.mdingTheme = appTheme
    document.documentElement.dataset.theme = appTheme
    document.documentElement.style.colorScheme = appTheme
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

  function scrollToHashTarget(id) {
    if (id === "") {
      document.documentElement.scrollTo({ top: 0, left: 0 })
      return
    }
    var target = document.getElementById(id)
    if (target) {
      var html = document.documentElement
      var previousScrollBehavior = html.style.scrollBehavior
      var scrollPaddingTop = parseFloat(getComputedStyle(html).scrollPaddingTop) || 0
      var parentTop = Math.max(0, target.offsetTop - scrollPaddingTop)
      var attempts = 0
      html.style.scrollBehavior = "auto"
      window.parent.postMessage({
        type: "mding:html-anchor-scroll",
        top: parentTop
      }, "*")

      function alignTarget() {
        var top = target.getBoundingClientRect().top - scrollPaddingTop
        if (Math.abs(top) > 2) {
          window.scrollBy({ top: top, left: 0, behavior: "auto" })
        }
        attempts += 1
        if (attempts >= 45) {
          html.style.scrollBehavior = previousScrollBehavior
          return
        }
        requestAnimationFrame(alignTarget)
      }

      alignTarget()
    }
  }

  var pendingScrollDeltaY = 0
  var scrollDeltaFrame = 0

  function flushScrollDelta() {
    scrollDeltaFrame = 0
    if (pendingScrollDeltaY === 0) {
      return
    }
    window.parent.postMessage({
      type: "mding:html-scroll-delta",
      deltaY: pendingScrollDeltaY
    }, "*")
    pendingScrollDeltaY = 0
  }

  function queueScrollDelta(deltaY) {
    pendingScrollDeltaY += deltaY
    if (scrollDeltaFrame === 0) {
      scrollDeltaFrame = window.requestAnimationFrame(flushScrollDelta)
    }
  }

  syncTheme()

  document.addEventListener("wheel", function (event) {
    event.preventDefault()
    queueScrollDelta(event.deltaY)
  }, { passive: false })

  var lastTouchY = null
  document.addEventListener("touchstart", function (event) {
    if (event.touches.length > 0) {
      lastTouchY = event.touches[0].clientY
    }
  }, { passive: true })

  document.addEventListener("touchmove", function (event) {
    if (lastTouchY === null || event.touches.length === 0) {
      return
    }
    var nextTouchY = event.touches[0].clientY
    queueScrollDelta(lastTouchY - nextTouchY)
    lastTouchY = nextTouchY
    event.preventDefault()
  }, { passive: false })

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
