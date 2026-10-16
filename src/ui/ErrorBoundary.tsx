import { Component, type ReactNode } from 'react'

/** If WebGL is unavailable or the 3D scene fails, the DOM story still works on its own. */
export class ErrorBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    console.warn('3D scene unavailable; showing the DOM story only.', error)
    this.props.onError()
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}
