import { useEffect, useMemo, useRef, useState } from 'react';
import type { Comment, User, Video } from '../api/types';
import { videoApi } from '../api/endpoints';
import { Avatar } from './Avatar';
import { CloseIcon, HeartIcon, SendIcon, SpinnerIcon, TrashIcon } from './icons';
import { Loading, EmptyState, ErrorState } from './States';
import { bumpComments, useVideo } from '../store/feed';
import { invalidate } from '../api/client';
import { requireAuth, useSelf } from '../store/auth';
import { closeComments, toast, useCommentsOpen, useCommentsVideo } from '../store/ui';
import { navigate } from '../router/router';
import { formatCount, timeAgo } from '../utils/format';

import { useI18n } from '../store/i18n';

type Props = { video: Video };

function CommentRow({
  comment,
  me,
  onReply,
  onDelete
}: {
  comment: Comment;
  me: User | null;
  onReply: (c: Comment) => void;
  onDelete: (c: Comment) => void;
}) {
  const { t } = useI18n();
  return (
    <div className={`comment${comment.parent_id ? ' reply' : ''}`}>
      <Avatar user={comment.author} size={34} onClick={() => navigate(`/user/${comment.author.id}`)} />
      <div className="comment-body">
        <p className="comment-name">
          {comment.author.display_name || comment.author.username}
          <span className="comment-time">{timeAgo(comment.created_at)}</span>
        </p>
        <p className="comment-text">{comment.content}</p>
        <div className="comment-actions">
          <span className={`c-like${comment.liked ? ' on' : ''}`}>
            <HeartIcon size={15} on={comment.liked} />
            {comment.likes > 0 ? formatCount(comment.likes) : ''}
          </span>
          <button className="c-act" onClick={() => onReply(comment)}>
            {t('action_reply')}
          </button>
          {me && comment.author.id === me.id ? (
            <button className="c-act danger" onClick={() => onDelete(comment)} aria-label={t('action_delete')}>
              <TrashIcon size={14} />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* docs-perf-notes: the drawer only ever translates in X and the list scrolls on its own,
   so opening it costs a compositor move instead of a re-layout of the feed. */
export function CommentsDrawerBody({ video }: Props) {
  const { t } = useI18n();
  const me = useSelf();
  /* the prop is a snapshot taken when the drawer opened; the header count has to follow the
     store, otherwise bumpComments moves the rail number and this one stays where it was */
  const live = useVideo(video.id) ?? video;
  const [comments, setComments] = useState<Comment[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let alive = true;
    setStatus('loading');
    videoApi
      .comments(video.id)
      .then((raw) => {
        if (!alive) return;
        setComments(videoApi.parseComments(raw));
        setStatus('ready');
      })
      .catch((err: unknown) => {
        if (!alive) return;
        setError(err instanceof Error ? err.message : t('comments_load_failed'));
        setStatus('error');
      });
    return () => {
      alive = false;
    };
  }, [video.id, t]);

  const sorted = useMemo(() => {
    const replies = new Map<string, Comment[]>();
    for (const c of comments) {
      if (!c.parent_id) continue;
      const list = replies.get(c.parent_id) ?? [];
      list.push(c);
      replies.set(c.parent_id, list);
    }
    const out: Comment[] = [];
    for (const top of comments.filter((c) => !c.parent_id)) {
      out.push(top);
      for (const r of replies.get(top.id) ?? []) out.push(r);
    }
    return out;
  }, [comments]);

  const scrollToEnd = () => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  const send = () => {
    const content = text.trim();
    if (!content || sending) return;
    if (!me) {
      requireAuth();
      return;
    }
    const parentId = replyTo ? replyTo.parent_id ?? replyTo.id : null;
    const temp: Comment = {
      id: `tmp-${Math.random().toString(36).slice(2, 9)}`,
      content,
      created_at: Date.now(),
      likes: 0,
      liked: false,
      parent_id: parentId,
      author: {
        id: me.id,
        username: me.username,
        display_name: me.display_name,
        avatar_color: me.avatar_color,
        verified: me.verified
      }
    };
    setComments((list) => [...list, temp]);
    setText('');
    setReplyTo(null);
    setSending(true);
    bumpComments(video.id, 1);
    videoApi
      .addComment(video.id, content, parentId)
      .then((res) => {
        const created = res.comment ?? (Array.isArray(res.items) ? res.items[0] : undefined);
        setComments((list) => list.map((c) => (c.id === temp.id ? created ?? c : c)));
        /* the list GET is cached for 30s: without this the next open of this video's
           comments replays a response that predates the comment just posted */
        invalidate(`/videos/${video.id}/comments`);
        queueMicrotask(scrollToEnd);
      })
      .catch(() => {
        setComments((list) => list.filter((c) => c.id !== temp.id));
        bumpComments(video.id, -1);
        toast(t('comments_send_failed'), 'error');
      })
      .finally(() => setSending(false));
  };

  const remove = (c: Comment) => {
    if (c.id.startsWith('tmp-')) return;
    setComments((list) => list.filter((x) => x.id !== c.id));
    bumpComments(video.id, -1);
    videoApi
      .removeComment(c.id)
      .then(() => invalidate(`/videos/${video.id}/comments`))
      .catch(() => {
        setComments((list) => [...list, c]);
        bumpComments(video.id, 1);
        toast(t('comments_delete_failed'), 'error');
      });
  };

  return (
    <>
      <header className="drawer-head">
        <h3>{formatCount(live.stats.comments)}{t('comments_count_suffix')}</h3>
        <button className="icon-btn" onClick={closeComments} aria-label={t('action_cancel')}>
          <CloseIcon size={20} />
        </button>
      </header>
      <div className="comment-list" ref={listRef}>
        {status === 'loading' ? <Loading label={t('comments_loading')} /> : null}
        {status === 'error' ? <ErrorState text={error ?? t('comments_load_failed')} /> : null}
        {status === 'ready' && sorted.length === 0 ? <EmptyState text={t('comments_empty')} hint={t('comments_empty_hint')} /> : null}
        {sorted.map((c) => (
          <CommentRow key={c.id} comment={c} me={me} onReply={(x) => { setReplyTo(x); inputRef.current?.focus(); }} onDelete={remove} />
        ))}
      </div>
      <footer className="drawer-foot">
        {replyTo ? (
          <div className="reply-chip">
            <span>{t('comments_reply_to')} @{replyTo.author.display_name || replyTo.author.username}</span>
            <button className="icon-btn tiny" onClick={() => setReplyTo(null)} aria-label={t('comments_cancel_reply')}>
              <CloseIcon size={14} />
            </button>
          </div>
        ) : null}
        <div className="composer">
          <textarea
            ref={inputRef}
            rows={1}
            value={text}
            placeholder={t('comments_input_placeholder')}
            aria-label={t('comments_title')}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                send();
              }
            }}
          />
          <button className="send-btn" onClick={send} disabled={sending || !text.trim()} aria-label={t('comments_send')}>
            {sending ? <SpinnerIcon size={18} /> : <SendIcon size={19} />}
          </button>
        </div>
      </footer>
    </>
  );
}

export function CommentsDrawer() {
  const { t } = useI18n();
  const commentsOpen = useCommentsOpen();
  const commentsVideo = useCommentsVideo();
  const [retained, setRetained] = useState<Video | null>(commentsVideo);

  useEffect(() => {
    if (commentsOpen && commentsVideo) setRetained(commentsVideo);
  }, [commentsOpen, commentsVideo]);

  const open = commentsOpen && !!commentsVideo;
  const shown = open ? commentsVideo : retained;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeComments();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <section className={`drawer${open ? ' open' : ''}`} aria-hidden={!open} aria-label={t('comments_title')}>
      {shown ? <CommentsDrawerBody key={shown.id} video={shown} /> : null}
    </section>
  );
}
