/**
 * 3D → DOM bridge. <ScreenAnchor> (three/ScreenAnchor.tsx) projects a 3D point
 * to screen pixels every frame; DOM annotations read it from here. Kept free
 * of three.js so the DOM bundle stays small.
 */
export interface AnchorPoint {
  x: number
  y: number
  /** On screen and in front of the camera. */
  visible: boolean
}

export const anchors: Record<string, AnchorPoint> = {}

export function getAnchor(name: string): AnchorPoint {
  return (anchors[name] ??= { x: 0, y: 0, visible: false })
}
