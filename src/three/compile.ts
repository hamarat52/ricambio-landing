import { type Camera, HalfFloatType, type Material, type Mesh, type Object3D, type Scene, type WebGLRenderer, WebGLRenderTarget } from 'three'

let target: WebGLRenderTarget | null = null

const yieldToMain = () => new Promise<void>((r) => setTimeout(r, 0))

/**
 * Pre-compile a scene's materials for the program variant they will actually
 * use, one material per task:
 * - everything renders into the post-processing (or split-view) render
 *   target, which selects linear output and no tone mapping; compiling
 *   against the screen builds the wrong variant and forces a synchronous
 *   recompile on the first frame;
 * - each new program costs tens of milliseconds of main-thread work, so the
 *   loop yields between materials instead of blocking for one long task.
 * KHR_parallel_shader_compile (where available) finishes the GPU side async.
 */
export async function compileForComposer(gl: WebGLRenderer, scene: Object3D, camera: Camera, targetScene?: Scene): Promise<void> {
  target ??= new WebGLRenderTarget(1, 1, { type: HalfFloatType })
  const lightsFrom = targetScene ?? (scene as Scene)
  const seen = new Set<string>()
  const objects: Object3D[] = []
  scene.traverseVisible((o) => {
    const m = (o as Mesh).material as Material | Material[] | undefined
    if (!m) return
    const list = Array.isArray(m) ? m : [m]
    if (list.some((mat) => !seen.has(mat.uuid))) {
      list.forEach((mat) => seen.add(mat.uuid))
      objects.push(o)
    }
  })
  const pending: Promise<unknown>[] = []
  for (const o of objects) {
    const prev = gl.getRenderTarget()
    gl.setRenderTarget(target)
    pending.push(gl.compileAsync(o, camera, lightsFrom).catch(() => {}))
    gl.setRenderTarget(prev)
    await yieldToMain()
  }
  await Promise.all(pending)
}
