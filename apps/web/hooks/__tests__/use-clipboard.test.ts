import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useClipboard } from '../use-clipboard'

describe('useClipboard', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  it('should initialize with copied as false', () => {
    const { result } = renderHook(() => useClipboard())

    expect(result.current.copied).toBe(false)
  })

  it('should copy text to clipboard and set copied to true', async () => {
    const { result } = renderHook(() => useClipboard())

    await act(async () => {
      await result.current.copy('test text')
    })

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test text')
    expect(result.current.copied).toBe(true)
  })

  it('should reset copied state after default delay (2000ms)', async () => {
    const { result } = renderHook(() => useClipboard())

    await act(async () => {
      await result.current.copy('test text')
    })

    expect(result.current.copied).toBe(true)

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(result.current.copied).toBe(false)
  })

  it('should use custom reset delay', async () => {
    const { result } = renderHook(() => useClipboard({ resetDelay: 1000 }))

    await act(async () => {
      await result.current.copy('test text')
    })

    expect(result.current.copied).toBe(true)

    act(() => {
      vi.advanceTimersByTime(999)
    })

    expect(result.current.copied).toBe(true)

    act(() => {
      vi.advanceTimersByTime(1)
    })

    expect(result.current.copied).toBe(false)
  })

  it('should not auto-reset when resetDelay is 0', async () => {
    const { result } = renderHook(() => useClipboard({ resetDelay: 0 }))

    await act(async () => {
      await result.current.copy('test text')
    })

    expect(result.current.copied).toBe(true)

    act(() => {
      vi.advanceTimersByTime(10000)
    })

    expect(result.current.copied).toBe(true)
  })

  it('should call onSuccess callback when copy succeeds', async () => {
    const onSuccess = vi.fn()
    const { result } = renderHook(() => useClipboard({ onSuccess }))

    await act(async () => {
      await result.current.copy('test text')
    })

    expect(onSuccess).toHaveBeenCalledTimes(1)
  })

  it('should call onError callback when copy fails', async () => {
    const error = new Error('Copy failed')
    vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(error)

    const onError = vi.fn()
    const { result } = renderHook(() => useClipboard({ onError }))

    await act(async () => {
      await result.current.copy('test text')
    })

    expect(onError).toHaveBeenCalledWith(error)
    expect(result.current.copied).toBe(false)
  })

  it('should manually reset copied state', async () => {
    const { result } = renderHook(() => useClipboard())

    await act(async () => {
      await result.current.copy('test text')
    })

    expect(result.current.copied).toBe(true)

    act(() => {
      result.current.reset()
    })

    expect(result.current.copied).toBe(false)
  })

  it('should clear previous timeout when copying again quickly', async () => {
    const { result } = renderHook(() => useClipboard({ resetDelay: 2000 }))

    await act(async () => {
      await result.current.copy('first')
    })

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    await act(async () => {
      await result.current.copy('second')
    })

    expect(result.current.copied).toBe(true)

    act(() => {
      vi.advanceTimersByTime(1500)
    })

    // Should still be true because second copy reset the timer
    expect(result.current.copied).toBe(true)

    act(() => {
      vi.advanceTimersByTime(500)
    })

    // Now 2000ms since second copy
    expect(result.current.copied).toBe(false)
  })

  it('should cleanup timeout on unmount', async () => {
    const { result, unmount } = renderHook(() => useClipboard())

    await act(async () => {
      await result.current.copy('test text')
    })

    unmount()

    // Advancing timers after unmount should not cause issues
    act(() => {
      vi.advanceTimersByTime(5000)
    })
  })
})
