import { useState, useRef, useCallback } from 'react'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

interface ConversionFile {
  id: string
  name: string
  status: 'pending' | 'converting' | 'done' | 'error'
  progress: number
  outputUrl?: string
  error?: string
}

export function AudioConverter() {
  const [files, setFiles] = useState<ConversionFile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const ffmpegRef = useRef<FFmpeg | null>(null)
  const dragCounterRef = useRef(0)
  const [isDragging, setIsDragging] = useState(false)

  const loadFFmpeg = async () => {
    if (ffmpegRef.current) return ffmpegRef.current

    const ffmpeg = new FFmpeg()

    ffmpeg.on('progress', ({ progress }) => {
      setFiles(prev => prev.map(f =>
        f.status === 'converting' ? { ...f, progress: Math.round(progress * 100) } : f
      ))
    })

    setIsLoading(true)
    try {
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      })
      ffmpegRef.current = ffmpeg
    } catch (error) {
      console.error('FFmpeg load error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }

    return ffmpeg
  }

  const convertFile = async (file: File, fileId: string) => {
    const ffmpeg = await loadFFmpeg()

    const inputName = `input_${fileId}${getExtension(file.name)}`
    const outputName = `output_${fileId}.mp3`

    setFiles(prev => prev.map(f =>
      f.id === fileId ? { ...f, status: 'converting', progress: 0 } : f
    ))

    try {
      await ffmpeg.writeFile(inputName, await fetchFile(file))

      await ffmpeg.exec([
        '-i', inputName,
        '-vn',
        '-ar', '44100',
        '-ac', '2',
        '-b:a', '192k',
        outputName
      ])

      const data = await ffmpeg.readFile(outputName)
      const blob = new Blob([new Uint8Array(data as Uint8Array)], { type: 'audio/mpeg' })
      const url = URL.createObjectURL(blob)

      setFiles(prev => prev.map(f =>
        f.id === fileId ? { ...f, status: 'done', progress: 100, outputUrl: url } : f
      ))

      await ffmpeg.deleteFile(inputName)
      await ffmpeg.deleteFile(outputName)
    } catch (error) {
      console.error('Conversion error:', error)
      setFiles(prev => prev.map(f =>
        f.id === fileId ? { ...f, status: 'error', error: String(error) } : f
      ))
    }
  }

  const getExtension = (filename: string) => {
    const match = filename.match(/\.[^.]+$/)
    return match ? match[0].toLowerCase() : ''
  }

  const handleFiles = useCallback((fileList: FileList | File[]) => {
    const supportedExtensions = [
      // Audio
      '.wav', '.aiff', '.aif', '.m4a', '.aac', '.caf', '.flac', '.ogg', '.wma', '.mp3',
      // Video
      '.mp4', '.mov', '.avi', '.mkv', '.webm', '.wmv', '.flv', '.m4v', '.3gp', '.mpeg', '.mpg'
    ]
    const newFiles: ConversionFile[] = []

    Array.from(fileList).forEach(file => {
      const ext = getExtension(file.name)
      if (supportedExtensions.includes(ext) || file.type.startsWith('audio/') || file.type.startsWith('video/')) {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
        newFiles.push({
          id,
          name: file.name,
          status: 'pending',
          progress: 0,
        })

        setTimeout(() => convertFile(file, id), 0)
      }
    })

    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles])
    }
  }, [])

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current++
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current--
    if (dragCounterRef.current === 0) {
      setIsDragging(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    dragCounterRef.current = 0

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
  }

  const downloadFile = (file: ConversionFile) => {
    if (!file.outputUrl) return

    const a = document.createElement('a')
    a.href = file.outputUrl
    a.download = file.name.replace(/\.[^.]+$/, '.mp3')
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const removeFile = (fileId: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === fileId)
      if (file?.outputUrl) {
        URL.revokeObjectURL(file.outputUrl)
      }
      return prev.filter(f => f.id !== fileId)
    })
  }

  const downloadAll = () => {
    files.filter(f => f.status === 'done' && f.outputUrl).forEach(downloadFile)
  }

  const completedCount = files.filter(f => f.status === 'done').length

  return (
    <div className="converter">
      <div
        className={`drop-zone ${isDragging ? 'dragging' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="drop-zone-content">
          <div className="drop-icon">
            {isLoading ? (
              <div className="spinner" />
            ) : (
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            )}
          </div>
          <p className="drop-text">
            {isLoading
              ? 'FFmpegを読み込み中...'
              : 'ファイルをドラッグ＆ドロップ'}
          </p>
          <p className="drop-subtext">
            音声: WAV, AIFF, M4A, AAC, FLAC, OGG, WMA
          </p>
          <p className="drop-subtext">
            動画: MP4, MOV, AVI, MKV, WebM, WMV, FLV
          </p>
          <label className="file-select-btn">
            ファイルを選択
            <input
              type="file"
              multiple
              accept="audio/*,video/*,.wav,.aiff,.aif,.m4a,.aac,.caf,.flac,.ogg,.wma,.mp4,.mov,.avi,.mkv,.webm,.wmv,.flv,.m4v,.3gp,.mpeg,.mpg"
              onChange={handleFileSelect}
            />
          </label>
        </div>
      </div>

      {files.length > 0 && (
        <div className="file-list">
          <div className="file-list-header">
            <h2>変換ファイル ({completedCount}/{files.length})</h2>
            {completedCount > 1 && (
              <button className="download-all-btn" onClick={downloadAll}>
                すべてダウンロード
              </button>
            )}
          </div>

          {files.map(file => (
            <div key={file.id} className={`file-item ${file.status}`}>
              <div className="file-info">
                <span className="file-name">{file.name}</span>
                <span className="file-status">
                  {file.status === 'pending' && '待機中...'}
                  {file.status === 'converting' && `変換中... ${file.progress}%`}
                  {file.status === 'done' && '完了'}
                  {file.status === 'error' && `エラー: ${file.error}`}
                </span>
              </div>

              {file.status === 'converting' && (
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${file.progress}%` }} />
                </div>
              )}

              <div className="file-actions">
                {file.status === 'done' && (
                  <button className="btn-download" onClick={() => downloadFile(file)}>
                    ダウンロード
                  </button>
                )}
                <button className="btn-remove" onClick={() => removeFile(file.id)}>
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
