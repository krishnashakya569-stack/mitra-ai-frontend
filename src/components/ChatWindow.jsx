import { useState, useRef, useEffect } from 'react'
import MessageBubble from './MessageBubble'
import InputBar from './InputBar'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

function needsLocation(text = '') {
  return /\b(weather|temperature|rain|forecast|location|where am i|near me|nearby)\b/i.test(text)
}

export default function ChatWindow({ conversation, onUpdateMessages }) {
  const [loading, setLoading] = useState(false)
  const [location, setLocation] = useState(null)
  const [locationStatus, setLocationStatus] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation?.messages, loading])

  const requestLocation = () => new Promise((resolve) => {
    if (!navigator.geolocation) {
      setLocationStatus('Location is not supported in this browser.')
      resolve(null)
      return
    }

    setLocationStatus('Getting location…')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }
        setLocation(nextLocation)
        setLocationStatus('Location enabled')
        resolve(nextLocation)
      },
      () => {
        setLocationStatus('Location permission not allowed')
        resolve(null)
      },
      { enableHighAccuracy: false, timeout: 7000, maximumAge: 10 * 60 * 1000 }
    )
  })

  const sendMessage = async (text, attachment = null) => {
    if ((!text.trim() && !attachment) || loading) return
    const userMsg = { role: 'user', content: text || 'Please analyze this file.', attachment }
    const newMessages = [...(conversation?.messages || []), userMsg]
    onUpdateMessages(newMessages)
    setLoading(true)

    try {
      const messageLocation = needsLocation(text) ? (location || await requestLocation()) : location
      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          attachment,
          location: messageLocation,
        })
      })
      const data = await res.json()
      onUpdateMessages([...newMessages, { role: 'assistant', content: data.message || data.error }])
    } catch {
      onUpdateMessages([...newMessages, { role: 'assistant', content: '⚠️ Cannot connect to backend. Make sure the server is running.' }])
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
        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
          {locationStatus && <span style={{ color: location ? '#4ade80' : '#777', fontSize:12 }}>{locationStatus}</span>}
          <button onClick={requestLocation} title="Use my location" style={{ padding:'5px 10px', borderRadius:7, background:'transparent', border:'1px solid #333', color:'#777', fontSize:12, cursor:'pointer' }}>📍 Location</button>
          <button title="Share link" style={{ padding:'5px 10px', borderRadius:7, background:'transparent', border:'1px solid #333', color:'#777', fontSize:12, cursor:'pointer' }}>⬆ Share</button>
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto' }}>
        {isEmpty ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', textAlign:'center', padding:32 }}>
            <div style={{ width:60, height:60, background:'linear-gradient(135deg,#c96442,#e0855e)', borderRadius:18, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:26, fontWeight:800, marginBottom:20 }}>M</div>
            <h1 style={{ fontSize:26, fontWeight:600, color:'#ececec', marginBottom:10, letterSpacing:'-0.5px' }}>How can I help you today?</h1>
            <p style={{ color:'#666', fontSize:14, maxWidth:330, lineHeight:1.6 }}>Ask me anything — coding, writing, live news, weather, current affairs, files, or voice.</p>
            <div style={{ display:'flex', gap:10, marginTop:24, flexWrap:'wrap', justifyContent:'center' }}>
              {[
                ['🌦 Weather near me', 'What is the weather near me right now?'],
                ['📰 Latest news', 'Give me the latest top news in India today.'],
                ['🌍 Current affairs', 'Summarize today’s current affairs in India and the world.'],
                ['📍 My location', 'Where am I right now?'],
              ].map(([label, prompt]) => (
                <button key={label} onClick={() => sendMessage(prompt)} style={{ padding:'8px 14px', borderRadius:20, border:'1px solid #333', color:'#aaa', fontSize:12, cursor:'pointer', background:'#2a2a2a' }}>{label}</button>
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
