import { useState, useCallback, useEffect, useRef } from 'react'
import { api } from '@/api'
import { useApi } from '@/hooks/useApi'
import { supabase } from '@/lib/supabase'
import { fmt } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Skeleton'
import { toast } from '@/components/ui/Toast'

const STATUS_ICON = { sent: '✓', delivered: '✓✓', read: '✓✓' }

function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' })
}

function fmtDay(ts) {
  const d = new Date(ts)
  const today = new Date()
  const diff = Math.floor((today - d) / 86400000)
  if (diff === 0) return 'Hoy'
  if (diff === 1) return 'Ayer'
  return d.toLocaleDateString('es-UY', { day: '2-digit', month: 'short' })
}

function groupByDay(messages) {
  const groups = []
  let currentDay = null
  for (const msg of messages) {
    const day = msg.ts.slice(0, 10)
    if (day !== currentDay) {
      groups.push({ type: 'day', day, label: fmtDay(msg.ts) })
      currentDay = day
    }
    groups.push({ type: 'msg', ...msg })
  }
  return groups
}

function lastMessage(conv) {
  if (!conv.messages?.length) return null
  return conv.messages[conv.messages.length - 1]
}

function ConvItem({ conv, active, onClick }) {
  const last = lastMessage(conv)
  const unread = conv.messages?.filter(m => m.from === 'client' && m.status !== 'read').length ?? 0

  return (
    <div onClick={onClick} style={{
      padding: '12px 16px', cursor: 'pointer',
      background: active ? 'rgba(45,158,95,0.08)' : 'transparent',
      borderBottom: '1px solid var(--border)',
      borderLeft: active ? '2px solid var(--green-l)' : '2px solid transparent',
      transition: 'all .13s',
    }}
    onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
    onMouseLeave={e => { e.currentTarget.style.background = active ? 'rgba(45,158,95,0.08)' : 'transparent' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12, color: 'var(--white)', flex: 1 }} className="truncate">
          {conv.client}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          {unread > 0 && (
            <span style={{
              background: 'var(--green-l)', color: '#000', borderRadius: 100,
              fontSize: 9, fontFamily: 'var(--font-ui)', fontWeight: 700,
              padding: '1px 6px', minWidth: 16, textAlign: 'center',
            }}>{unread}</span>
          )}
          <span style={{ fontSize: 9, color: 'var(--muted2)' }}>{last ? fmtDay(last.ts) : ''}</span>
        </div>
      </div>
      <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2, fontStyle: 'italic' }}>
        {conv.invoiceId} · {conv.invoiceAmount ? fmt(conv.invoiceAmount) : ''}
      </div>
      {last && (
        <div style={{ fontSize: 10, color: 'var(--muted2)', marginTop: 4 }} className="truncate">
          {last.from === 'agent' ? '🤖 ' : ''}{last.text}
        </div>
      )}
    </div>
  )
}

function ChatPanel({ conv, onBack }) {
  const [msgs, setMsgs]       = useState(conv?.messages ?? [])
  const [text, setText]       = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef             = useRef(null)

  // Sincronizar cuando cambia la conversación activa
  useEffect(() => { setMsgs(conv?.messages ?? []) }, [conv?.id])

  // Realtime: escuchar mensajes nuevos en esta conversación
  useEffect(() => {
    if (!conv?.id) return
    const channel = supabase
      .channel(`chat-${conv.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `conversation_id=eq.${conv.id}`,
      }, (payload) => {
        const m = payload.new
        setMsgs(prev => {
          // evitar duplicados de mensajes optimistas
          if (prev.some(x => x.id === m.id)) return prev
          return [...prev.filter(x => !String(x.id).startsWith('opt-')), {
            id: m.id, from: m.from_role, text: m.body, ts: m.sent_at, status: m.status,
          }]
        })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [conv?.id])

  // Auto-scroll al fondo
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs.length])

  const handleSend = async () => {
    const body = text.trim()
    if (!body || !conv?.id || sending) return
    const optimistic = { id: `opt-${Date.now()}`, from: 'agent', text: body, ts: new Date().toISOString(), status: 'sent' }
    setMsgs(m => [...m, optimistic])
    setText('')
    setSending(true)
    try {
      await api.sendMessage(conv.id, body)
    } catch {
      setMsgs(m => m.filter(x => x.id !== optimistic.id))
      toast.error('Error al enviar el mensaje')
    } finally {
      setSending(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  if (!conv) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--muted)' }}>
        <div style={{ fontSize: 40 }}>💬</div>
        <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 14, color: 'var(--white)' }}>Seleccioná una conversación</div>
        <div style={{ fontSize: 11 }}>Elegí un cliente de la lista para ver el historial de WhatsApp</div>
      </div>
    )
  }

  const items = groupByDay(msgs)

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '14px 20px', borderBottom: '1px solid var(--border)',
        background: 'rgba(37,211,102,0.05)',
        display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
      }}>
        {onBack && (
          <button onClick={onBack} className="agente-back-btn" style={{
            display: 'none', background: 'none', border: 'none',
            color: 'var(--green-l)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '4px 2px',
          }}>‹</button>
        )}
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(37,211,102,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        }}>📲</div>
        <div>
          <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 14 }}>{conv.client}</div>
          <div style={{ fontSize: 10, color: 'var(--muted)' }}>{conv.phone}</div>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: 'var(--muted2)', fontStyle: 'italic' }}>{conv.invoiceId}</div>
          <div style={{ fontSize: 12, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--white)' }}>{fmt(conv.invoiceAmount)}</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '16px 20px',
        display: 'flex', flexDirection: 'column', gap: 4,
        background: 'rgba(0,0,0,0.12)',
      }}>
        {items.map((item, i) => {
          if (item.type === 'day') {
            return (
              <div key={`day-${i}`} style={{ textAlign: 'center', margin: '8px 0' }}>
                <span style={{
                  fontSize: 9, color: 'var(--muted2)', fontFamily: 'var(--font-ui)',
                  background: 'var(--surface2)', padding: '2px 10px', borderRadius: 100, letterSpacing: '.05em',
                }}>{item.label}</span>
              </div>
            )
          }
          const isAgent = item.from === 'agent'
          return (
            <div key={item.id} style={{ display: 'flex', justifyContent: isAgent ? 'flex-end' : 'flex-start', marginBottom: 2 }}>
              <div style={{
                maxWidth: '68%', padding: '9px 13px',
                borderRadius: isAgent ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                background: isAgent ? 'rgba(37,211,102,0.14)' : 'var(--surface2)',
                border: `1px solid ${isAgent ? 'rgba(37,211,102,0.22)' : 'var(--border)'}`,
                opacity: item.id?.toString().startsWith('opt-') ? 0.7 : 1,
              }}>
                {isAgent && (
                  <div style={{ fontSize: 9, color: 'rgba(37,211,102,0.8)', fontFamily: 'var(--font-ui)', fontWeight: 700, marginBottom: 3 }}>
                    🤖 Agente IA
                  </div>
                )}
                <div style={{ fontSize: 12, lineHeight: 1.55, color: 'var(--white)' }}>{item.text}</div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <span style={{ fontSize: 9, color: 'var(--muted2)' }}>{fmtTime(item.ts)}</span>
                  {isAgent && (
                    <span style={{ fontSize: 9, color: item.status === 'read' ? '#53bdeb' : 'var(--muted2)' }}>
                      {STATUS_ICON[item.status] ?? '✓'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '10px 14px', borderTop: '1px solid var(--border)',
        background: 'var(--surface)', flexShrink: 0,
        display: 'flex', gap: 8, alignItems: 'flex-end',
      }}>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Escribir mensaje… (Enter para enviar)"
          rows={1}
          style={{
            flex: 1, resize: 'none',
            background: 'var(--surface2)', border: '1px solid var(--border2)',
            borderRadius: 20, padding: '8px 14px',
            color: 'var(--white)', fontSize: 12, fontFamily: 'var(--font-mono)',
            outline: 'none', lineHeight: 1.4, maxHeight: 80, overflowY: 'auto',
          }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          style={{
            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
            background: text.trim() ? 'var(--green-l)' : 'var(--surface3)',
            border: 'none', cursor: text.trim() ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, transition: 'background .15s', color: 'var(--white)',
          }}
        >
          {sending ? '…' : '➤'}
        </button>
      </div>
    </div>
  )
}

export function AgenteIA() {
  const { data: convs, loading, refetch } = useApi(useCallback(() => api.getConversations(null), []))
  const [selected, setSelected] = useState(null)
  const [search, setSearch]     = useState('')

  // Realtime: recargar conversaciones cuando llega un mensaje nuevo
  useEffect(() => {
    const channel = supabase
      .channel('messages-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        refetch()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [refetch])

  const filteredConvs = (convs ?? []).filter(c =>
    c.client.toLowerCase().includes(search.toLowerCase()) ||
    (c.invoiceId ?? '').toLowerCase().includes(search.toLowerCase())
  )
  const activeConv = (convs ?? []).find(c => c.clientId === selected) ?? null

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Sidebar — lista de conversaciones */}
      <div className={`agente-sidebar${selected ? ' agente-sidebar--hidden' : ''}`} style={{
        width: 300, flexShrink: 0,
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Conversaciones</div>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--muted)', pointerEvents: 'none' }}>⌕</span>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar cliente…"
              style={{
                width: '100%', background: 'var(--surface2)', border: '1px solid var(--border2)',
                borderRadius: 6, padding: '6px 10px 6px 24px',
                color: 'var(--white)', fontSize: 11, fontFamily: 'var(--font-mono)', outline: 'none',
              }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            [1,2,3,4].map(i => (
              <div key={i} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <Skeleton h={12} w={160} style={{ marginBottom: 6 }} />
                <Skeleton h={10} w={100} />
              </div>
            ))
          ) : filteredConvs.length === 0 ? (
            <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--muted)', fontSize: 11 }}>
              {search ? `Sin resultados para "${search}"` : 'Sin conversaciones activas'}
            </div>
          ) : filteredConvs.map(conv => (
            <ConvItem
              key={conv.clientId}
              conv={conv}
              active={selected === conv.clientId}
              onClick={() => setSelected(conv.clientId)}
            />
          ))}
        </div>

        {/* Stats footer */}
        {!loading && convs && (
          <div style={{
            padding: '10px 16px', borderTop: '1px solid var(--border)',
            display: 'flex', gap: 16, flexShrink: 0,
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>{convs.length}</div>
              <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--font-ui)' }}>ACTIVAS</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--green-l)' }}>
                {convs.reduce((s, c) => s + (c.messages?.filter(m => m.from === 'client' && m.status !== 'read').length ?? 0), 0) || '—'}
              </div>
              <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--font-ui)' }}>NO LEÍDOS</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>
                {convs.reduce((s, c) => s + (c.messages?.length ?? 0), 0)}
              </div>
              <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--font-ui)' }}>MENSAJES</div>
            </div>
          </div>
        )}
      </div>

      {/* Chat panel */}
      <ChatPanel conv={activeConv} onBack={selected ? () => setSelected(null) : null} />
    </div>
  )
}
