/**
 * Share a strategy PNG using the Web Share API when available; otherwise download.
 */

export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',')
  if (parts.length < 2) {
    throw new Error('Invalid data URL')
  }
  const header = parts[0]
  const data = parts.slice(1).join(',')
  const mimeMatch = /data:([^;]+)/.exec(header)
  const mime = mimeMatch ? mimeMatch[1] : 'image/png'
  const binary = atob(data)
  const len = binary.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Blob([bytes], { type: mime })
}

export function strategyImageFilename(title: string): string {
  const base = title.trim() || 'strategy'
  const safe = base
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9\-_.]/g, '')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
  const name = safe.length > 0 ? safe.slice(0, 80) : 'strategy'
  return `${name}.png`
}

function triggerDownload(dataUrl: string, filename: string): void {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  a.rel = 'noopener'
  a.click()
}

export type ShareStrategyResult = 'shared' | 'downloaded'

/**
 * Try to share the PNG (mobile / supporting desktops). Falls back to download.
 */
export async function shareStrategyPng(
  dataUrl: string,
  options: { title: string }
): Promise<ShareStrategyResult> {
  const filename = strategyImageFilename(options.title)
  const blob = dataUrlToBlob(dataUrl)
  const file = new File([blob], filename, { type: 'image/png' })

  const shareData: ShareData = {
    files: [file],
    title: options.title,
    text: options.title,
  }

  if (typeof navigator.share === 'function') {
    try {
      if (typeof navigator.canShare === 'function' && !navigator.canShare(shareData)) {
        triggerDownload(dataUrl, filename)
        return 'downloaded'
      }
      await navigator.share(shareData)
      return 'shared'
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return 'shared'
      }
      triggerDownload(dataUrl, filename)
      return 'downloaded'
    }
  }

  triggerDownload(dataUrl, filename)
  return 'downloaded'
}
