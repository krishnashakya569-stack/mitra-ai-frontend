import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'

function cleanSpeechText(text) {
  return text
    .replace(/```[\s\S]*?```/g, ' code block ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[#*_>\-]/g, ' ')
    .replace(/[,:;]+/g, ' ')
    .replace(/[.!?]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export default function MessageBubble({ message }) {
  const [copied, setCopied] = useState(false)
  const [liked, setLiked] = useState(null)
  const [speaking, setSpeaking] = useState(false)
  const [voices, setVoices] = useState([])
  const isUser = message.role === 'user'

  useEffect(() => {
    if (!window.speechSynthesis) return
    const loadVoices = () => setVoices(window.speechSynthesis.getVoices())
    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices
    return () => {
      window.speechSynthesis.onvoiceschanged = null
    }
  }, [])

  const copy = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const speak = () => {
    if (!window.speechSynthesis) return

    if (speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(cleanSpeechText(message.content))
    utterance.rate = 0.92
    utterance.pitch = 1.08
    utterance.volume = 1

    const preferredVoice =
      voices.find(v => /zira|samantha|aria|female/i.test(v.name)) ||
      voices.find(v => /en-IN/i.test(v.lang) && /female/i.test(v.name)) ||
      voices.find(v => /^en/i.test(v.lang))

    if (preferredVoice) utterance.voice = preferredVoice

    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

  return (
    <div className="msg-fade group" style={{ maxWidth:720, margin:'0 auto 4px', padding:'12px 20px', display:'flex', gap:12 }}>
      {isUser
        ? <div style={{ width:30, height:30, borderRadius:'50%', background:'#1d3a5f', display:'flex', alignItems:'center', justifyContent:'center', color:'#60a5fa', fontSize:12, fontWeight:600, flexShrink:0, marginTop:1 }}>U</div>
        : <div style={{ width:30, height:30, background:'linear-gradient(135deg,#c96442,#e0855e)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:12, fontWeight:700, flexShrink:0, marginTop:1 }}>M</div>
      }
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:12, fontWeight:600, color: isUser ? '#60a5fa' : '#c96442', marginBottom:5, letterSpacing:'0.2px' }}>{isUser ? 'You' : 'Mitra AI'}</p>
        {message.attachment && (
          <div style={{ marginBottom:8, padding:'6px 10px', background:'#2a2a2a', borderRadius:8, fontSize:12, color:'#888', display:'inline-flex', alignItems:'center', gap:6 }}>
            📎 {message.attachment.name || 'Attached file'}
          </div>
        )}
        <div className="prose" style={{ fontSize:14.5, color:'#d4d4d4', lineHeight:1.75 }}>
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
        {!isUser && (
          <div style={{ display:'flex', gap:2, marginTop:8 }}>
            <button onClick={copy} style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 9px', borderRadius:6, border:'none', background:'transparent', fontSize:12, color: copied ? '#4ade80' : '#555', cursor:'pointer', transition:'all 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background='#2a2a2a'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}>
              {copied ? '✓ Copied' : '⧉ Copy'}
            </button>
            <button onClick={speak} style={{ padding:'4px 9px', borderRadius:6, border:'none', background: speaking ? '#2a2a2a' : 'transparent', fontSize:13, color: speaking ? '#c96442' : '#555', cursor:'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background='#2a2a2a'}
              onMouseLeave={e => { if(!speaking) e.currentTarget.style.background='transparent'; }}>
              {speaking ? '🔊 Stop' : '🔈 Listen'}
            </button>
            <button onClick={() => setLiked('up')} style={{ padding:'4px 9px', borderRadius:6, border:'none', background: liked==='up' ? '#2a2a2a' : 'transparent', fontSize:13, color: liked==='up' ? '#4ade80' : '#555', cursor:'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background='#2a2a2a'}
              onMouseLeave={e => { if(liked!=='up') e.currentTarget.style.background='transparent'; }}>👍</button>
            <button onClick={() => setLiked('down')} style={{ padding:'4px 9px', borderRadius:6, border:'none', background: liked==='down' ? '#2a2a2a' : 'transparent', fontSize:13, color: liked==='down' ? '#f87171' : '#555', cursor:'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background='#2a2a2a'}
              onMouseLeave={e => { if(liked!=='down') e.currentTarget.style.background='transparent'; }}>👎</button>
          </div>
        )}
      </div>
    </div>
  )
}
