'use client'

import { logger } from '@/lib/logger'
import {
  MAX_TOTAL_BYTES,
  expandDroppedItems,
  formatBytes,
  isMarkdownFile,
  isSoulFile,
  isTextFile,
  normalizePath,
  unwrapSingleTopLevelFolder,
} from '@/lib/upload-utils'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

// =============================================================================
// Types
// =============================================================================

export interface NormalizedFile {
  file: File
  path: string
}

export interface SourceValidation {
  issues: string[]
  ready: boolean
}

export interface UseFileUploadReturn {
  // State
  files: File[]
  normalizedFiles: NormalizedFile[]
  isDragging: boolean
  content: string
  /** Set when file read or drop expansion fails */
  fileError: string | null
  clearFileError: () => void

  // Multi-file support
  currentFileIndex: number
  totalMarkdownFiles: number
  hasNextFile: boolean
  markdownFiles: NormalizedFile[]
  goToNextFile: () => void

  // Ref
  fileInputRef: React.RefObject<HTMLInputElement | null>

  // Handlers
  handleDragOver: (e: React.DragEvent) => void
  handleDragLeave: (e: React.DragEvent) => void
  handleDrop: (e: React.DragEvent) => void
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  removeFile: (index: number) => void
  clearFiles: () => void
  setContent: (value: string) => void

  // Validation
  sourceValidation: SourceValidation
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Manages file upload: drag/drop, file reading, and validation.
 *
 * Flow:
 * 1. User selects/drops files → `files` state updates
 * 2. `normalizedFiles` memo recalculates with clean paths
 * 3. Effect reads the first .md file → `content` state updates
 * 4. `sourceValidation` memo checks if ready to proceed
 */
export function useFileUpload(sourceType: 'file' | 'github'): UseFileUploadReturn {
  // -------------------------------------------------------------------------
  // Core state
  // -------------------------------------------------------------------------

  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [contentMap, setContentMap] = useState<Map<number, string>>(new Map())
  const [currentFileIndex, setCurrentFileIndex] = useState(0)
  const [fileError, setFileError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const clearFileError = useCallback(() => setFileError(null), [])

  // -------------------------------------------------------------------------
  // Derived: normalized file paths
  // -------------------------------------------------------------------------

  const normalizedFiles = useMemo<NormalizedFile[]>(() => {
    if (files.length === 0) return []

    const mapped = files.map((file) => ({
      file,
      path: normalizePath(file.webkitRelativePath || file.name),
    }))

    return unwrapSingleTopLevelFolder(mapped)
  }, [files])

  // -------------------------------------------------------------------------
  // Derived: markdown files and current content
  // -------------------------------------------------------------------------

  const markdownFiles = useMemo<NormalizedFile[]>(() => {
    // Sort to prioritize SOUL.md files first
    return normalizedFiles
      .filter((f) => isMarkdownFile(f.path))
      .sort((a, b) => {
        const aIsSoul = isSoulFile(a.path)
        const bIsSoul = isSoulFile(b.path)
        if (aIsSoul && !bIsSoul) return -1
        if (!aIsSoul && bIsSoul) return 1
        return 0
      })
  }, [normalizedFiles])

  const content = contentMap.get(currentFileIndex) ?? ''
  const totalMarkdownFiles = markdownFiles.length
  const hasNextFile = currentFileIndex < markdownFiles.length - 1

  // Setter for current file's content (used by GitHub import)
  const setContent = useCallback(
    (value: string) => {
      setContentMap((prev) => new Map(prev).set(currentFileIndex, value))
    },
    [currentFileIndex]
  )

  // Advance to next file
  const goToNextFile = useCallback(() => {
    setCurrentFileIndex((prev) => prev + 1)
  }, [])

  // -------------------------------------------------------------------------
  // Effect: auto-read markdown content when files change
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (markdownFiles.length === 0) {
      return
    }

    setFileError(null)

    // Read ALL markdown files into contentMap
    markdownFiles.forEach((mdFile, index) => {
      const reader = new FileReader()

      reader.onload = (event) => {
        const text = event.target?.result
        if (typeof text === 'string') {
          setContentMap((prev) => new Map(prev).set(index, text))
        }
      }

      reader.onerror = () => {
        const err = new Error(`Failed to read file: ${mdFile.path}`)
        logger.error('File read failed', err, { path: mdFile.path })
        setFileError(`Could not read ${mdFile.path}. The file may be corrupted or inaccessible.`)
      }

      reader.readAsText(mdFile.file)
    })
  }, [markdownFiles])

  // -------------------------------------------------------------------------
  // Handlers: drag and drop
  // -------------------------------------------------------------------------

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    setFileError(null)

    try {
      const items = e.dataTransfer.items
      const expanded = await expandDroppedItems(items)

      if (expanded.length > 0) {
        setFiles((prev) => [...prev, ...expanded])
      }
    } catch (error) {
      logger.error('Failed to expand dropped items', error)
      setFileError('Could not read dropped files. Try selecting files manually instead.')
    }
  }, [])

  // -------------------------------------------------------------------------
  // Handler: file input change
  // -------------------------------------------------------------------------

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files

    if (selected && selected.length > 0) {
      const newFiles = Array.from(selected)
      setFiles((prev) => [...prev, ...newFiles])
    }

    // Reset input to allow re-selecting the same file
    e.target.value = ''
  }, [])

  // -------------------------------------------------------------------------
  // Handler: remove/clear files
  // -------------------------------------------------------------------------

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const clearFiles = useCallback(() => {
    setFiles([])
    setContentMap(new Map())
    setCurrentFileIndex(0)
    setFileError(null)
  }, [])

  // -------------------------------------------------------------------------
  // Derived: validation
  // -------------------------------------------------------------------------

  const sourceValidation = useMemo<SourceValidation>(() => {
    const issues: string[] = []

    // Only validate when in 'file' mode
    if (sourceType !== 'file') {
      return { issues: [], ready: content.length > 0 }
    }

    // Check: at least one file
    if (files.length === 0) {
      issues.push('Add at least one file.')
    }

    // Check: must have a markdown file
    const hasMarkdown = normalizedFiles.some((f) => isMarkdownFile(f.path))
    if (files.length > 0 && !hasMarkdown) {
      issues.push('A markdown file (.md) is required.')
    }

    // Check: all files must be text
    const invalidFiles = files.filter((file) => !isTextFile(file))
    if (invalidFiles.length > 0) {
      issues.push('Remove non-text files.')
    }

    // Check: total size limit
    const totalBytes = files.reduce((sum, f) => sum + f.size, 0)
    if (totalBytes > MAX_TOTAL_BYTES) {
      issues.push(`Total file size exceeds ${formatBytes(MAX_TOTAL_BYTES)}.`)
    }

    // Ready when no issues AND we have content
    const ready = issues.length === 0 && content.length > 0

    return { issues, ready }
  }, [sourceType, files, normalizedFiles, content])

  // -------------------------------------------------------------------------
  // Return
  // -------------------------------------------------------------------------

  return {
    files,
    normalizedFiles,
    isDragging,
    content,
    fileError,
    clearFileError,
    currentFileIndex,
    totalMarkdownFiles,
    hasNextFile,
    markdownFiles,
    goToNextFile,
    fileInputRef,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileSelect,
    removeFile,
    clearFiles,
    setContent,
    sourceValidation,
  }
}
