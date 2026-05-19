import { useRef, useState } from 'react'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'
const MIN_RECORDING_MS = 1200

export default function InputBar({ onSend, loading, isMobile = false }) {
  const [text, setText] = useState('')
  const [attached, setAttached] = useState(null)
  const [recording, setRecording] = useState(false)
  const [speechError, setSpeechError] = useState('')
  const [transcribing, setTranscribing] = useState(false)
  const textRef = useRef(null)
  const fileRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])
  const startedAtRef = useRef(0)

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const base64 = ev.target.result.split(',')[1]
      setAttached({ name: file.name, data: base64, mimeType: file.type })
    }
    reader.readAsDataURL(file)
  }

  const handle = () => {
    if ((!text.trim() && !attached) || loading || transcribing) return
    onSend(text || 'Please describe or analyze this file.', attached)
    setText('')
    setAttached(null)
    if (fileRef.current) fileRef.current.value = ''
    if (textRef.current) textRef.current.style.height = 'auto'
  }

  const startRecording = async () => {
    try {
      setSpeechError('')
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      })
      streamRef.current = stream
      chunksRef.current = []
      startedAtRef.current = Date.now()

      const options = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? { mimeType: 'audio/webm;codecs=opus' }
        : undefined
      const recorder = new MediaRecorder(stream, options)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }

      recorder.onstop = async () => {
        try {
          setTranscribing(true)
          const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
          const formData = new FormData()
          formData.append('audio', blob, 'speech.webm')

          const response = await fetch(`${BACKEND_URL}/api/transcribe`, {
            method: 'POST',
            body: formData,
          })
          const data = await response.json()

          if (!response.ok) throw new Error(data.error || 'Could not transcribe voice input.')
          if (data.text) setText((current) => `${current.trim()}${current.trim() ? ' ' : ''}${data.text}`)
        } catch (error) {
          setSpeechError(error.message || 'Voice input could not be transcribed.')
        } finally {
          setTranscribing(false)
          streamRef.current?.getTracks().forEach(track => track.stop())
          streamRef.current = null
        }
      }

      recorder.start(250)
      setRecording(true)
    } catch (error) {
      setSpeechError(
        error.name === 'NotAllowedError'
          ? 'Please allow microphone permission in your browser.'
          : 'Microphone could not start. Please check browser permission and try again.'
      )
    }
  }

  const stopRecording = () => {
    const elapsed = Date.now() - startedAtRef.current
    if (elapsed < MIN_RECORDING_MS) {
      setSpeechError('Speak for at least one full second, then stop recording.')
      return
    }

    mediaRecorderRef.current?.stop()
    setRecording(false)
  }

  const toggleRecording = () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setSpeechError('Voice input is not supported in this browser.')
      return
    }

    if (recording) stopRecording()
    else startRecording()
  }

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handle() }
  }

  const onInput = (e) => {
    setText(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px'
  }

  const canSend = (text.trim() || attached) && !loading && !transcribing

  return (
    <div style={{ padding: isMobile ? '8px 10px 10px' : '8px 20px 18px', maxWidth:760, width:'100%', margin:'0 auto', flexShrink:0 }}>
      <input ref={fileRef} type="file" accept="image/*,.pdf,.txt,.csv,.json,.md" style={{ display:'none' }} onChange={handleFile} />

      {attached && (
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 12px', marginBottom:8, background:'#2a2a2a', borderRadius:9, fontSize:12, color:'#aaa', border:'1px solid #333' }}>
          <span>📎</span>
          <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{attached.name}</span>
          <button onClick={() => { setAttached(null); if(fileRef.current) fileRef.current.value=''; }}
            style={{ background:'none', border:'none', color:'#666', cursor:'pointer', fontSize:16, lineHeight:1, padding:'0 2px', flexShrink:0 }}>×</button>
        </div>
      )}

      {speechError && <div style={{ marginBottom:8, fontSize:12, color:'#f87171' }}>{speechError}</div>}

      <div style={{ border:`1px solid ${canSend ? '#444' : '#2e2e2e'}`, borderRadius:14, background:'#2f2f2f', overflow:'hidden', transition:'border-color 0.2s' }}>
        <div style={{ display:'flex', alignItems:'flex-end', gap: isMobile ? 6 : 8, padding: isMobile ? '10px 9px 7px 12px' : '12px 12px 8px 16px' }}>
          <textarea ref={textRef} value={text} onChange={onInput} onKeyDown={onKey}
            placeholder={recording ? 'Listening…' : transcribing ? 'Transcribing…' : 'Message Mitra AI...'}
            rows={1}
            style={{ flex:1, minWidth:0, border:'none', background:'transparent', resize:'none', outline:'none', fontSize:isMobile ? 16 : 14.5, color:'#ececec', fontFamily:'inherit', lineHeight:1.6, maxHeight:140, caretColor:'#c96442' }}
          />
          <button onClick={toggleRecording} title={recording ? 'Stop recording' : 'Start recording'}
            style={{ width:isMobile ? 38 : 34, height:isMobile ? 38 : 34, borderRadius:9, background:recording ? '#ef4444' : '#3a3a3a', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, color:'white', fontSize:16, transition:'all 0.2s' }}>
            {recording ? '■' : '🎙'}
          </button>
          <button onClick={handle} disabled={!canSend}
            style={{ width:isMobile ? 38 : 34, height:isMobile ? 38 : 34, borderRadius:9, background: canSend ? '#c96442' : '#3a3a3a', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor: canSend ? 'pointer' : 'not-allowed', flexShrink:0, color: canSend ? 'white' : '#555', fontSize:17, transition:'all 0.2s' }}>
            ↑
          </button>
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, padding: isMobile ? '0 10px 9px' : '0 14px 10px' }}>
          <button onClick={() => fileRef.current.click()}
            style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#777', border:'1px solid #3a3a3a', borderRadius:6, padding:'4px 10px', background:'transparent', cursor:'pointer', transition:'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background='#333'; e.currentTarget.style.color='#bbb'; }}
            onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#777'; }}>
            📎 Attach file
          </button>
          {!isMobile && <span style={{ fontSize:11, color:'#444' }}>{recording ? 'Recording… speak clearly, then click again' : transcribing ? 'Turning speech into text…' : 'Mic ready · speak for 1–2 seconds minimum'}</span>}
        </div>
      </div>
    </div>
  )
}

