const mobileDetailMaxWidth = 759
const backSwipeEdgeWidth = 24
const backSwipeMinDistance = 70
const backSwipeMaxVerticalDrift = 56
const backSwipeHorizontalDominance = 1.35

export type BackSwipeGesture = {
  readonly currentX: number
  readonly currentY: number
  readonly isEditing: boolean
  readonly startX: number
  readonly startY: number
  readonly viewportWidth: number
}

export function shouldNavigateBackFromEdgeSwipe(gesture: BackSwipeGesture): boolean {
  if (gesture.isEditing || gesture.viewportWidth > mobileDetailMaxWidth) {
    return false
  }
  if (gesture.startX > backSwipeEdgeWidth) {
    return false
  }

  const deltaX = gesture.currentX - gesture.startX
  const deltaY = Math.abs(gesture.currentY - gesture.startY)

  return (
    deltaX >= backSwipeMinDistance &&
    deltaY <= backSwipeMaxVerticalDrift &&
    deltaX >= deltaY * backSwipeHorizontalDominance
  )
}

export function startsFromBackSwipeEdge(clientX: number, viewportWidth: number): boolean {
  return clientX <= backSwipeEdgeWidth && viewportWidth <= mobileDetailMaxWidth
}
