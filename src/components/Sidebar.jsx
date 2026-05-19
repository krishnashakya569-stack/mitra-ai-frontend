export default function Sidebar({ conversations, activeId, onSelect, onNew, user, onSignOut, isMobile = false, isOpen = true }) {
  return (
    <div style={{
      width: isMobile ? '82vw' : 256,
      maxWidth: isMobile ? 330 : 256,
      background:'#171717',
      display:'flex',
      flexDirection:'column',
      height:'100dvh',
      borderRight:'1px solid #2a2a2a',
      flexShrink:0,
      position: isMobile ? 'fixed' : 'relative',
      left: 0,
      top: 0,
      zIndex: 30,
      transform: isOpen ? 'translateX(0)' : 'translateX(-105%)',
      transition: 'transform 0.22s ease',
      boxShadow: isMobile ? '18px 0 50px rgba(0,0,0,0.35)' : 'none',
    }}>
      <div style={{ padding:'16px 12px 10px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:9, padding:'7px 9px', borderRadius:10 }}>
          <div style={{ width:30, height:30, background:'linear-gradient(135deg,#c96442,#e0855e)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:14, fontWeight:800, flexShrink:0 }}>M</div>
          <span style={{ fontWeight:600, color:'#ececec', fontSize:15, letterSpacing:'-0.2px' }}>Mitra AI</span>
        </div>
      </div>

      <button onClick={onNew}
        style={{ margin:'2px 10px 12px', display:'flex', alignItems:'center', gap:8, padding:'10px 12px', borderRadius:9, border:'1px solid #333', background:'transparent', cursor:'pointer', color:'#aaa', fontSize:14, transition:'all 0.15s', width:'calc(100% - 20px)' }}>
        <span style={{ fontSize:16, lineHeight:1 }}>+</span> New conversation
      </button>

      <p style={{ padding:'4px 18px', fontSize:10.5, color:'#555', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:4 }}>Recent</p>

      <div style={{ flex:1, overflowY:'auto', padding:'0 6px' }}>
        {conversations.map(conv => (
          <button key={conv.id} onClick={() => onSelect(conv.id)}
            style={{ width:'100%', textAlign:'left', padding:'10px 12px', borderRadius:8, marginBottom:2, fontSize:14, border:'none', cursor:'pointer', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', transition:'all 0.12s',
              background: conv.id === activeId ? '#2a2a2a' : 'transparent',
              color: conv.id === activeId ? '#ececec' : '#888' }}>
            {conv.title}
          </button>
        ))}
      </div>

      <div style={{ padding:'12px 14px', borderTop:'1px solid #252525' }}>
        <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:10 }}>
          <div style={{ width:30, height:30, borderRadius:'50%', background:'#1d3a5f', display:'flex', alignItems:'center', justifyContent:'center', color:'#60a5fa', fontSize:12, fontWeight:600, flexShrink:0 }}>{user?.email?.[0]?.toUpperCase() || 'U'}</div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:13, color:'#ccc', fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.email}</div>
          </div>
        </div>
        <button onClick={onSignOut} style={{ width:'100%', padding:'9px 10px', borderRadius:8, border:'1px solid #333', background:'transparent', color:'#888', cursor:'pointer' }}>Sign out</button>
      </div>
    </div>
  )
}
