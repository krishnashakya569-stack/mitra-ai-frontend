import { useState, useRef, useEffect } from 'react'
import MessageBubble from './MessageBubble'
import InputBar from './InputBar'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

export default function ChatWindow({ conversation, onUpdateMessages }) {
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation?.messages, loading])

  const sendMessage = async (text, attachment = null) => {
    if ((!text.trim() && !attachment) || loading) return
    const userMsg = { role: 'user', content: text || 'Please analyze this file.', attachment }
    const newMessages = [...(conversation?.messages || []), userMsg]
    onUpdateMessages(newMessages)
    setLoading(true)
    try {
      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages.map(m => ({ role: m.role, content: m.content })), attachment })
      })
      const data = await res.json()
      onUpdateMessages([...newMessages, { role: 'assistant', content: data.message || data.error }])
    } catch {
      onUpdateMessages([...newMessages, { role: 'assistant', content: '⚠️ Cannot connect to backend. Make sure the server is running on port 5000.' }])
    } finally {
      setLoading(false)
    }
  }

  const isEmpty = !conversation?.messages?.length

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', background:'#212121', minWidth:0 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 18px', borderBottom:'1px solid #2a2a2a' }}>
        <div style={{ display:'flex', alignItems:'center', gap:7, padding:'5px 11px', borderRadius:8, background:'#2a2a2a', border:'1px solid #333', fontSize:12, color:'#aaa', cursor:'pointer' }}>
          <span style={{ color:'#c96442' }}>✦</span> Mitra AI <span style={{ fontSize:10, color:'#666' }}>▾</span>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          <button title="Share link" style={{ padding:'5px 10px', borderRadius:7, background:'transparent', border:'1px solid #333', color:'#777', fontSize:12, cursor:'pointer' }}>⬆ Share</button>
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto' }}>
        {isEmpty ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', textAlign:'center', padding:32 }}>
            <div style={{ width:60, height:60, background:'linear-gradient(135deg,#c96442,#e0855e)', borderRadius:18, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:26, fontWeight:800, marginBottom:20 }}>M</div>
            <h1 style={{ fontSize:26, fontWeight:600, color:'#ececec', marginBottom:10, letterSpacing:'-0.5px' }}>How can I help you today?</h1>
            <p style={{ color:'#666', fontSize:14, maxWidth:300, lineHeight:1.6 }}>Ask me anything — coding, writing, analysis, math, or just a chat.</p>
            <div style={{ display:'flex', gap:10, marginTop:24, flexWrap:'wrap', justifyContent:'center' }}>
              {['✍️ Write something', '💻 Help with code', '📊 Analyze data', '🌐 Explain a topic'].map(s => (
                <div key={s} style={{ padding:'8px 14px', borderRadius:20, border:'1px solid #333', color:'#888', fontSize:12, cursor:'pointer', background:'#2a2a2a' }}>{s}</div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ paddingTop:24, paddingBottom:8 }}>
            {conversation.messages.map((msg, i) => <MessageBubble key={i} message={msg} />)}
            {loading && (
              <div className="msg-fade" style={{ maxWidth:720, margin:'0 auto 20px', padding:'0 20px', display:'flex', gap:12 }}>
                <div style={{ width:30, height:30, background:'linear-gradient(135deg,#c96442,#e0855e)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:12, fontWeight:700, flexShrink:0 }}>M</div>
                <div style={{ display:'flex', gap:5, alignItems:'center', paddingTop:8 }}>
                  <span className="dot-1" style={{ width:7, height:7, borderRadius:'50%', background:'#c96442', display:'inline-block' }}></span>
                  <span className="dot-2" style={{ width:7, height:7, borderRadius:'50%', background:'#c96442', display:'inline-block' }}></span>
                  <span className="dot-3" style={{ width:7, height:7, borderRadius:'50%', background:'#c96442', display:'inline-block' }}></span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <InputBar onSend={sendMessage} loading={loading} />
    </div>
  )
}

