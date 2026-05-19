import { useEffect, useState } from 'react'
import Sidebar from './components/Sidebar'
import ChatWindow from './components/ChatWindow'
import AuthPanel from './components/AuthPanel'
import { supabase, supabaseConfigError } from './lib/supabase'

function App() {
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [authError, setAuthError] = useState('')
  const [conversations, setConversations] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [loadingChats, setLoadingChats] = useState(false)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth <= 768
      setIsMobile(mobile)
      if (!mobile) setSidebarOpen(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    if (!supabase) {
      setAuthError(supabaseConfigError || 'Supabase is not configured yet.')
      setAuthLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) setAuthError(error.message)
      setSession(data?.session || null)
      setAuthLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session?.user) {
      setConversations([])
      setActiveId(null)
      return
    }

    loadConversations(session.user.id)
  }, [session?.user?.id])

  const loadConversations = async (userId) => {
    setLoadingChats(true)
    setAuthError('')

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('id,title,messages,updated_at')
        .order('updated_at', { ascending: false })

      if (error) throw error

      if (data?.length) {
        setConversations(data)
        setActiveId(data[0].id)
        return
      }

      await createConversation(userId)
    } catch (error) {
      setAuthError(error.message || 'Could not load your chats.')
      setConversations([])
      setActiveId(null)
    } finally {
      setLoadingChats(false)
    }
  }

  const createConversation = async (userId = session?.user?.id) => {
    if (!userId) return null

    const { data, error } = await supabase
      .from('conversations')
      .insert({ user_id: userId, title: 'New conversation', messages: [] })
      .select('id,title,messages,updated_at')
      .single()

    if (error) throw error

    setConversations(prev => [data, ...prev])
    setActiveId(data.id)
    return data
  }

  const signIn = async (email, password) => {
    setAuthError('')
    setAuthLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setAuthError(error.message)
    setAuthLoading(false)
  }

  const signUp = async (email, password) => {
    setAuthError('')
    setAuthLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) setAuthError(error.message)
    else setAuthError('Account created. Check your email if confirmation is enabled, then sign in.')
    setAuthLoading(false)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const newConversation = async () => {
    setAuthError('')
    try {
      await createConversation()
      if (isMobile) setSidebarOpen(false)
    } catch (error) {
      setAuthError(error.message || 'Could not create a new conversation.')
    }
  }

  const selectConversation = (id) => {
    setActiveId(id)
    if (isMobile) setSidebarOpen(false)
  }

  const updateMessages = async (messages) => {
    const activeConversation = conversations.find(c => c.id === activeId)
    if (!activeConversation) return

    const title = messages[0]?.content.slice(0, 35) || 'New conversation'
    const nextConversation = { ...activeConversation, messages, title, updated_at: new Date().toISOString() }

    setConversations(prev => prev
      .map(c => c.id === activeId ? nextConversation : c)
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)))

    const { error } = await supabase
      .from('conversations')
      .update({ title, messages, updated_at: nextConversation.updated_at })
      .eq('id', activeId)

    if (error) setAuthError(error.message)
  }

  if (authLoading) {
    return <div style={{ minHeight:'100vh', display:'grid', placeItems:'center', background:'#212121', color:'#aaa' }}>Loading Mitra AI…</div>
  }

  if (!session) {
    return <AuthPanel onSignIn={signIn} onSignUp={signUp} loading={authLoading} error={authError} />
  }

  const activeConv = conversations.find(c => c.id === activeId)

  return (
    <div style={{ display:'flex', height:'100dvh', width:'100vw', overflow:'hidden', background:'#212121', position:'relative' }}>
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:20 }} />
      )}

      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={selectConversation}
        onNew={newConversation}
        user={session.user}
        onSignOut={signOut}
        isMobile={isMobile}
        isOpen={!isMobile || sidebarOpen}
      />

      {loadingChats ? (
        <div style={{ flex:1, display:'grid', placeItems:'center', color:'#777' }}>Loading chats…</div>
      ) : activeConv ? (
        <ChatWindow conversation={activeConv} onUpdateMessages={updateMessages} isMobile={isMobile} onToggleSidebar={() => setSidebarOpen(true)} />
      ) : (
        <div style={{ flex:1, display:'grid', placeItems:'center', background:'#212121', color:'#aaa', padding:24, textAlign:'center' }}>
          <div style={{ maxWidth:420 }}>
            <div style={{ color:'#ececec', fontSize:22, fontWeight:600, marginBottom:8 }}>No conversation loaded</div>
            <div style={{ color: authError ? '#f87171' : '#888', fontSize:14, lineHeight:1.6, marginBottom:18 }}>
              {authError || 'Start a new conversation to begin using Mitra AI.'}
            </div>
            <button onClick={newConversation} style={{ padding:'10px 14px', borderRadius:10, border:'none', background:'#c96442', color:'white', cursor:'pointer', fontWeight:600 }}>
              Start new conversation
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
