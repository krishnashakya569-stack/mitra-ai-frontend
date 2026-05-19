import { useState } from 'react'

export default function AuthPanel({ onSignIn, onSignUp, loading, error }) {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const submit = (event) => {
    event.preventDefault()
    if (mode === 'signin') onSignIn(email, password)
    else onSignUp(email, password)
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#212121', padding:20 }}>
      <div style={{ width:'100%', maxWidth:400, background:'#171717', border:'1px solid #2f2f2f', borderRadius:18, padding:24, boxShadow:'0 18px 60px rgba(0,0,0,0.35)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
          <div style={{ width:38, height:38, background:'linear-gradient(135deg,#c96442,#e0855e)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800 }}>M</div>
          <div>
            <div style={{ color:'#ececec', fontWeight:600 }}>Mitra AI</div>
            <div style={{ color:'#777', fontSize:12 }}>Your chats, waiting for you</div>
          </div>
        </div>

        <div style={{ display:'flex', gap:8, marginBottom:18 }}>
          <button onClick={() => setMode('signin')} style={{ flex:1, padding:'9px 12px', borderRadius:10, border:'1px solid #333', background:mode==='signin' ? '#2a2a2a' : 'transparent', color:mode==='signin' ? '#ececec' : '#888', cursor:'pointer' }}>Sign in</button>
          <button onClick={() => setMode('signup')} style={{ flex:1, padding:'9px 12px', borderRadius:10, border:'1px solid #333', background:mode==='signup' ? '#2a2a2a' : 'transparent', color:mode==='signup' ? '#ececec' : '#888', cursor:'pointer' }}>Create account</button>
        </div>

        <form onSubmit={submit} style={{ display:'grid', gap:12 }}>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" required
            style={{ width:'100%', padding:'12px 13px', borderRadius:10, border:'1px solid #333', background:'#262626', color:'#ececec', outline:'none' }} />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" minLength={6} required
            style={{ width:'100%', padding:'12px 13px', borderRadius:10, border:'1px solid #333', background:'#262626', color:'#ececec', outline:'none' }} />
          {error && <div style={{ color:'#f87171', fontSize:13 }}>{error}</div>}
          <button disabled={loading} style={{ marginTop:4, padding:'12px 14px', border:'none', borderRadius:10, background:'#c96442', color:'white', fontWeight:600, cursor:loading ? 'wait' : 'pointer' }}>
            {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  )
}
