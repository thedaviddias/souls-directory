import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { shortcuts, useKeyboardShortcuts } from '../use-keyboard-shortcuts'

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    // Clear DOM
    document.body.innerHTML = ''
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with showShortcuts as false', () => {
    const { result } = renderHook(() => useKeyboardShortcuts())

    expect(result.current.showShortcuts).toBe(false)
  })

  it('should return shortcuts array', () => {
    const { result } = renderHook(() => useKeyboardShortcuts())

    expect(result.current.shortcuts).toBe(shortcuts)
    expect(result.current.shortcuts).toHaveLength(4)
  })

  it('should toggle shortcuts modal on ? key', () => {
    const { result } = renderHook(() => useKeyboardShortcuts())

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }))
    })

    expect(result.current.showShortcuts).toBe(true)

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }))
    })

    expect(result.current.showShortcuts).toBe(false)
  })

  it('should close shortcuts modal on Escape', () => {
    const { result } = renderHook(() => useKeyboardShortcuts())

    // Open modal first
    act(() => {
      result.current.setShowShortcuts(true)
    })

    expect(result.current.showShortcuts).toBe(true)

    // Press Escape
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    })

    expect(result.current.showShortcuts).toBe(false)
  })

  it('should focus search input on / key', () => {
    const searchInput = document.createElement('input')
    searchInput.setAttribute('data-search-input', 'true')
    searchInput.focus = vi.fn()
    document.body.appendChild(searchInput)

    renderHook(() => useKeyboardShortcuts())

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '/' }))
    })

    expect(searchInput.focus).toHaveBeenCalled()
  })

  it('should click copy button for number keys 1-9', () => {
    // Create mock soul cards
    for (let i = 0; i < 3; i++) {
      const card = document.createElement('div')
      card.setAttribute('data-soul-card', 'true')

      const copyBtn = document.createElement('button')
      copyBtn.setAttribute('data-copy-button', 'true')
      copyBtn.click = vi.fn()

      card.appendChild(copyBtn)
      document.body.appendChild(card)
    }

    renderHook(() => useKeyboardShortcuts())

    // Press 2 to copy second card
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '2' }))
    })

    const cards = document.querySelectorAll('[data-soul-card]')
    const secondCardBtn = cards[1].querySelector('[data-copy-button]') as HTMLButtonElement

    expect(secondCardBtn.click).toHaveBeenCalled()
  })

  it('should not trigger shortcuts when typing in input', () => {
    const searchInput = document.createElement('input')
    searchInput.setAttribute('data-search-input', 'true')
    searchInput.focus = vi.fn()
    document.body.appendChild(searchInput)

    const { result } = renderHook(() => useKeyboardShortcuts())

    // Simulate typing in an input
    const inputElement = document.createElement('input')
    document.body.appendChild(inputElement)

    act(() => {
      const event = new KeyboardEvent('keydown', { key: '?' })
      Object.defineProperty(event, 'target', { value: inputElement })
      window.dispatchEvent(event)
    })

    // Modal should not open because we're in an input
    expect(result.current.showShortcuts).toBe(false)
  })

  it('should blur input on Escape key even when in input', () => {
    const inputElement = document.createElement('input')
    inputElement.blur = vi.fn()
    document.body.appendChild(inputElement)

    renderHook(() => useKeyboardShortcuts())

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'Escape' })
      Object.defineProperty(event, 'target', { value: inputElement })
      window.dispatchEvent(event)
    })

    expect(inputElement.blur).toHaveBeenCalled()
  })

  it('should not trigger number shortcuts with modifier keys', () => {
    const card = document.createElement('div')
    card.setAttribute('data-soul-card', 'true')

    const copyBtn = document.createElement('button')
    copyBtn.setAttribute('data-copy-button', 'true')
    copyBtn.click = vi.fn()

    card.appendChild(copyBtn)
    document.body.appendChild(card)

    renderHook(() => useKeyboardShortcuts())

    // Press 1 with Ctrl key
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '1', ctrlKey: true }))
    })

    expect(copyBtn.click).not.toHaveBeenCalled()

    // Press 1 with Meta key
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '1', metaKey: true }))
    })

    expect(copyBtn.click).not.toHaveBeenCalled()

    // Press 1 with Alt key
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '1', altKey: true }))
    })

    expect(copyBtn.click).not.toHaveBeenCalled()
  })

  it('should allow setShowShortcuts to be called directly', () => {
    const { result } = renderHook(() => useKeyboardShortcuts())

    act(() => {
      result.current.setShowShortcuts(true)
    })

    expect(result.current.showShortcuts).toBe(true)

    act(() => {
      result.current.setShowShortcuts(false)
    })

    expect(result.current.showShortcuts).toBe(false)
  })

  it('should cleanup event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

    const { unmount } = renderHook(() => useKeyboardShortcuts())

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
  })
})
