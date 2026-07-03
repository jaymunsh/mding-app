import type { MermaidColorMode } from "./MarkdownPreview"

export function createHtmlPreviewBridgeScript(colorMode: MermaidColorMode): string {
  return `
;(function () {
  var appTheme = ${JSON.stringify(colorMode)}

  function syncTheme() {
    document.documentElement.dataset.mdingTheme = appTheme
    document.documentElement.dataset.theme = appTheme
    document.documentElement.style.colorScheme = appTheme
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
      var attempts = 0
      html.style.scrollBehavior = "auto"

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

  syncTheme()

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
