import { useEffect, useState } from 'react'
import Sidebar from './components/Sidebar'
import ChatWindow from './components/ChatWindow'
import AuthPanel from './components/AuthPanel'
import { supabase } from './lib/supabase'

function App() {
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [authError, setAuthError] = useState('')
  const [conversations, setConversations] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [loadingChats, setLoadingChats] = useState(false)

  useEffect(() => {
    if (!supabase) {
      setAuthError('Supabase is not configured yet.')
      setAuthLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
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

    loadConversations()
  }, [session?.user?.id])

  const loadConversations = async () => {
    setLoadingChats(true)
    const { data, error } = await supabase
      .from('conversations')
      .select('id,title,messages,updated_at')
      .order('updated_at', { ascending: false })

    if (error) {
      setAuthError(error.message)
    } else if (data.length) {
      setConversations(data)
      setActiveId(data[0].id)
    } else {
      await newConversation()
    }
    setLoadingChats(false)
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
    if (!session?.user) return
    const { data, error } = await supabase
      .from('conversations')
      .insert({ user_id: session.user.id, title: 'New conversation', messages: [] })
      .select('id,title,messages,updated_at')
      .single()

    if (error) {
      setAuthError(error.message)
      return
    }

    setConversations(prev => [data, ...prev])
    setActiveId(data.id)
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
    <div style={{ display:'flex', height:'100vh', background:'#212121' }}>
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={setActiveId}
        onNew={newConversation}
        user={session.user}
        onSignOut={signOut}
      />
      {loadingChats || !activeConv ? (
        <div style={{ flex:1, display:'grid', placeItems:'center', color:'#777' }}>Loading chats…</div>
      ) : (
        <ChatWindow conversation={activeConv} onUpdateMessages={updateMessages} />
      )}
    </div>
  )
}

export default App
