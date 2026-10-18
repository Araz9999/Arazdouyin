import { useEffect, useRef, useState } from 'react';
import type { RouteProps } from '../router/router';
import { navigate } from '../router/router';
import { chatApi } from '../api/endpoints';
import type { Conversation, Message } from '../api/types';
import { Avatar } from '../components/Avatar';
import { BackIcon, SendIcon, SpinnerIcon } from '../components/icons';
import { EmptyState, ErrorState, Loading } from '../components/States';
import { useAsync } from '../hooks/useAsync';
import { useSelf } from '../store/auth';
import { timeAgo } from '../utils/format';

import { useI18n } from '../store/i18n';

export default function MessagesPage({ params }: RouteProps) {
  const { t } = useI18n();
  const peer = params.peer ?? '';
  const me = useSelf();
  const convs = useAsync<Conversation[]>(() => chatApi.conversations(), []);
  const [thread, setThread] = useState<Message[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const [peerName, setPeerName] = useState('');

  useEffect(() => {
    if (!peer) return;
    let alive = true;
    setStatus('loading');
    const load = () =>
      chatApi
        .messages(peer)
        .then((items) => {
          if (!alive) return;
          setThread(items);
          setStatus('ready');
        })
        .catch(() => {
          if (!alive) return;
          setStatus('error');
        });
    void load();
    const id = window.setInterval(load, 8000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [peer]);

  useEffect(() => {
    const found = (convs.data ?? []).find((c) => c.peer?.id === peer);
    if (found) setPeerName(found.peer.display_name || found.peer.username);
  }, [convs.data, peer]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [thread]);

  const send = () => {
    const content = text.trim();
    if (!content || !peer || sending) return;
    const temp: Message = {
      id: `tmp-${Math.random().toString(36).slice(2, 9)}`,
      content,
      created_at: Date.now(),
      from_me: true
    };
    setThread((list) => [...list, temp]);
    setText('');
    setSending(true);
    chatApi
      .send(peer, content)
      .then((res) => {
        const created = res.message;
        setThread((list) => list.map((m) => (m.id === temp.id ? created ?? m : m)));
      })
      .catch(() => {
        setThread((list) => list.filter((m) => m.id !== temp.id));
        setStatus('ready');
      })
      .finally(() => setSending(false));
  };

  const items = convs.data ?? [];

  return (
    <div className="msg-page">
      <aside className={`conv-list${peer ? ' hide-mobile' : ''}`}>
        <div className="page-head tight">
          <h1>{t('msg_title')}</h1>
        </div>
        {convs.loading && !items.length ? <Loading label={t('msg_conv_loading')} /> : null}
        {convs.error && !items.length ? <ErrorState text={convs.error} onRetry={convs.reload} /> : null}
        {!convs.loading && !items.length ? <EmptyState text={t('msg_conv_empty')} hint={t('msg_conv_empty_hint')} /> : null}
        {items.map((c) => (
          <button
            key={c.peer.id}
            className={`conv${c.peer.id === peer ? ' on' : ''}`}
            onClick={() => navigate(`/messages/${c.peer.id}`)}
          >
            <Avatar user={c.peer} size={40} />
            <div className="conv-main">
              <p className="conv-name">{c.peer.display_name || c.peer.username}</p>
              <p className="conv-last">{c.last?.content ?? t('msg_last_empty')}</p>
            </div>
            {c.unread > 0 ? <span className="badge">{c.unread}</span> : null}
          </button>
        ))}
      </aside>
      <section className={`thread${peer ? ' show-mobile' : ''}`}>
        {!peer ? (
          <div className="thread-empty">
            <p>{t('msg_select_chat')}</p>
          </div>
        ) : (
          <>
            <header className="thread-head">
              <button className="icon-btn only-mobile" onClick={() => navigate('/messages')} aria-label={t('vp_back')}>
                <BackIcon size={20} />
              </button>
              <strong>{peerName || t('msg_title')}</strong>
              {me ? <span className="thread-sub">{t('msg_chat_with')} {me.display_name || me.username}</span> : null}
            </header>
            <div className="bubbles" ref={listRef}>
              {status === 'loading' ? <Loading label={t('msg_conv_loading')} /> : null}
              {status === 'error' ? <ErrorState text={t('msg_load_failed')} /> : null}
              {status === 'ready' && !thread.length ? <EmptyState text={t('msg_no_messages')} hint={t('msg_say_hi')} /> : null}
              {thread.map((m) => (
                <div key={m.id} className={`bubble-row${m.from_me ? ' me' : ''}`}>
                  <div className="bubble">
                    {m.content}
                    <span className="bubble-time">{timeAgo(m.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
            <footer className="thread-foot">
              <input
                value={text}
                placeholder={t('msg_input_placeholder')}
                aria-label={t('msg_title')}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') send();
                }}
              />
              <button className="send-btn" onClick={send} disabled={sending || !text.trim()} aria-label={t('comments_send')}>
                {sending ? <SpinnerIcon size={18} /> : <SendIcon size={19} />}
              </button>
            </footer>
          </>
        )}
      </section>
    </div>
  );
}
