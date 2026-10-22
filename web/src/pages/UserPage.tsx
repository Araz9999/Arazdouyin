import { useEffect, useRef, useState } from 'react';
import type { RouteProps } from '../router/router';
import { navigate } from '../router/router';
import { normalizePage, userApi } from '../api/endpoints';
import { useAsync } from '../hooks/useAsync';
import type { User, Video } from '../api/types';
import { Avatar } from '../components/Avatar';
import { ThumbGrid } from '../components/ThumbGrid';
import { EmptyState, ErrorState, Loading } from '../components/States';
import { EditIcon, VerifiedIcon } from '../components/icons';
import { pushRecent } from '../utils/recents';
import { formatCount, formatDuration, timeAgo } from '../utils/format';
import { requireAuth, updateMe, useSelf } from '../store/auth';
import { toggleFollow, useIsFollowing } from '../store/feed';
import { toast } from '../store/ui';
import { getWatchHistory, clearWatchHistory, removeWatchItem, type WatchHistoryItem } from '../utils/watchHistory';

import { useI18n } from '../store/i18n';

type Tab = 'works' | 'likes' | 'history';
type Rel = 'followers' | 'following';

function EditPanel({ user, onDone }: { user: User; onDone: (saved: boolean) => void }) {
  const { t } = useI18n();
  const [name, setName] = useState(user.display_name);
  const [bio, setBio] = useState(user.bio);
  const [color, setColor] = useState(user.avatar_color);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await updateMe({ display_name: name.trim() || user.display_name, bio, avatar_color: color });
      toast(t('profile_updated'), 'ok');
      onDone(true);
    } catch (err) {
      toast(err instanceof Error ? err.message : t('op_failed'), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="edit-panel">
      <label className="field">
        <span>{t('user_edit_name')}</span>
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={24} />
      </label>
      <label className="field">
        <span>{t('user_edit_bio')}</span>
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={120} placeholder={t('user_edit_bio_placeholder')} />
      </label>
      <label className="field">
        <span>{t('user_edit_color')}</span>
        <div className="swatches">
          {['#fe2c55', '#25f4ee', '#8a5cff', '#ffb400', '#3ce492', '#ff6a3d'].map((c) => (
            <button
              key={c}
              className={`swatch${c === color ? ' on' : ''}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
              aria-label={`Color ${c}`}
            />
          ))}
        </div>
      </label>
      <div className="row-actions">
        <button className="btn ghost pill" onClick={() => onDone(false)}>
          {t('action_cancel')}
        </button>
        <button className="btn accent pill" onClick={save} disabled={busy}>
          {t('action_save')}
        </button>
      </div>
    </div>
  );
}

function RelList({ id, rel, onPick }: { id: string; rel: Rel; onPick: (u: User) => void }) {
  const { t } = useI18n();
  const state = useAsync<User[]>((signal) => userApi.list(id, rel, null, 30, signal).then((r) => r.items ?? []), [id, rel]);
  if (state.loading) return <Loading label={t('state_loading')} />;
  if (state.error) return <ErrorState text={state.error} />;
  const items = state.data ?? [];
  if (!items.length) return <EmptyState text={rel === 'followers' ? t('user_no_followers') : t('user_no_following')} />;
  return (
    <div className="rel-list">
      {items.map((u) => (
        <Avatar key={u.id} user={u} size={40} onClick={() => onPick(u)} className="rel-item" />
      ))}
    </div>
  );
}

export default function UserPage({ params }: RouteProps) {
  const { t } = useI18n();
  const me = useSelf();
  const requested = params.id === 'me' ? me?.id : params.id;
  const id = requested ?? '';
  const selfMode = params.id === 'me';

  useEffect(() => {
    if (selfMode && !me) navigate('/login');
  }, [selfMode, me]);

  const profile = useAsync<{ user: User; stats: { followers: number; following: number; likes_received: number; videos: number } }>(
    () => userApi.byId(id).then((r) => ({ user: r.user, stats: r.stats })),
    [id],
    !!id
  );

  useEffect(() => {
    if (profile.data) pushRecent(profile.data.user);
  }, [profile.data]);

  const [tab, setTab] = useState<Tab>('works');
  const [rel, setRel] = useState<Rel | null>(null);
  const [editing, setEditing] = useState(false);
  const [extra, setExtra] = useState<Video[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [moreBusy, setMoreBusy] = useState(false);
  const moreCtrl = useRef<AbortController | null>(null);
  const [history, setHistory] = useState<WatchHistoryItem[]>(() => (selfMode ? getWatchHistory() : []));

  useEffect(() => {
    if (!selfMode) return;
    setHistory(getWatchHistory());
    const onUpdate = (e: Event) => {
      setHistory((e as CustomEvent<WatchHistoryItem[]>).detail ?? getWatchHistory());
    };
    window.addEventListener('dy:history_updated', onUpdate);
    return () => window.removeEventListener('dy:history_updated', onUpdate);
  }, [selfMode]);

  const listState = useAsync<{ items: Video[]; next: string | null }>(
    (signal) =>
      userApi
        .videos(id, null, 24, tab === 'likes' ? 'likes' : undefined, signal)
        .then((raw) => {
          const page = normalizePage<Video>(raw);
          return { items: page.items, next: page.nextCursor };
        }),
    [id, tab],
    !!id && tab !== 'history'
  );

  useEffect(
    () => () => {
      moreCtrl.current?.abort();
    },
    []
  );

  useEffect(() => {
    /* a page tail from the previous tab/user must not append to the list being reset */
    moreCtrl.current?.abort();
    setExtra([]);
    setNext(listState.data?.next ?? null);
  }, [listState.data]);

  const loadMore = () => {
    if (!next || moreBusy) return;
    setMoreBusy(true);
    const ctrl = new AbortController();
    moreCtrl.current = ctrl;
    userApi
      .videos(id, next, 24, tab === 'likes' ? 'likes' : undefined, ctrl.signal)
      .then((raw) => {
        if (ctrl.signal.aborted) return;
        const page = normalizePage<Video>(raw);
        setExtra((list) => [...list, ...page.items]);
        setNext(page.nextCursor);
      })
      .catch(() => {
        if (!ctrl.signal.aborted) toast(t('op_failed'), 'error');
      })
      .finally(() => setMoreBusy(false));
  };

  const user = profile.data?.user;
  const stats = profile.data?.stats;
  const isSelf = !!user && !!me && user.id === me.id;
  const following = useIsFollowing(user?.id ?? '');

  if (!id) return <EmptyState text={t('auth_sheet_title')} action={<button className="btn accent pill" onClick={() => navigate('/login')}>{t('nav_login')}</button>} />;
  if (profile.loading && !user) return <Loading label={t('state_loading')} />;
  if (profile.error && !user) return <ErrorState text={profile.error} onRetry={profile.reload} />;
  if (!user) return <ErrorState text={t('user_not_found')} />;

  const items = [...(listState.data?.items ?? []), ...extra];

  return (
    <div className="user-page">
      <div className="cover" style={{ background: `linear-gradient(120deg, ${user.avatar_color}55, #17171c 60%)` }}>
        <span className="cover-label">{t('user_tab_works')}</span>
      </div>
      <div className="profile">
        <Avatar user={user} size={84} className="profile-avatar" />
        <div className="profile-main">
          <h1 className="profile-name">
            {user.display_name || user.username}
            {user.verified ? <VerifiedIcon size={16} /> : null}
          </h1>
          <p className="profile-id">
            @{user.username}
            {user.bio ? <span className="profile-bio"> · {user.bio}</span> : null}
          </p>
          <div className="profile-stats">
            <button className="stat" onClick={() => setRel('following')}>
              <strong>{formatCount(stats?.following ?? user.following_count)}</strong>
              <span>{t('user_stat_following')}</span>
            </button>
            <button className="stat" onClick={() => setRel('followers')}>
              <strong>{formatCount(stats?.followers ?? user.follower_count)}</strong>
              <span>{t('user_stat_followers')}</span>
            </button>
            <span className="stat">
              <strong>{formatCount(stats?.likes_received ?? 0)}</strong>
              <span>{t('user_stat_likes')}</span>
            </span>
            <span className="stat">
              <strong>{formatCount(stats?.videos ?? items.length)}</strong>
              <span>{t('user_tab_works')}</span>
            </span>
          </div>
        </div>
        <div className="profile-actions">
          {isSelf ? (
            <button className="btn ghost pill" onClick={() => setEditing((v) => !v)}>
              <EditIcon size={16} />
              <span>{t('user_edit_profile')}</span>
            </button>
          ) : (
            <>
              <button
                className={`btn pill ${following ? 'ghost' : 'accent'}`}
                onClick={() => requireAuth(() => toggleFollow(user.id))}
              >
                {following ? t('action_following') : `+ ${t('action_follow')}`}
              </button>
              <button
                className="btn outline pill"
                onClick={() => requireAuth(() => navigate(`/messages/${user.id}`))}
              >
                {t('user_message_btn')}
              </button>
            </>
          )}
        </div>
        {editing && isSelf ? (
          <EditPanel
            user={user}
            onDone={(saved) => {
              setEditing(false);
              if (saved) profile.reload();
            }}
          />
        ) : null}
      </div>
      {rel ? (
        <div className="rel-panel">
          <div className="rel-head">
            <h2>{rel === 'followers' ? t('user_stat_followers') : t('user_stat_following')}</h2>
            <button className="btn ghost pill small" onClick={() => setRel(null)}>
              {t('action_cancel')}
            </button>
          </div>
          <RelList id={user.id} rel={rel} onPick={(u) => navigate(`/user/${u.id}`)} />
        </div>
      ) : null}
      <div className="tabs">
        <button className={`tab-btn${tab === 'works' ? ' on' : ''}`} onClick={() => setTab('works')}>
          {t('user_tab_works')}
        </button>
        <button className={`tab-btn${tab === 'likes' ? ' on' : ''}`} onClick={() => setTab('likes')}>
          {t('user_tab_likes')}
        </button>
        {isSelf ? (
          <button className={`tab-btn${tab === 'history' ? ' on' : ''}`} onClick={() => setTab('history')}>
            {t('user_tab_history')} {history.length > 0 ? `(${history.length})` : ''}
          </button>
        ) : null}
      </div>
      {tab === 'history' ? (
        <div className="watch-history-panel">
          {history.length > 0 ? (
            <div className="history-head">
              <span className="history-count">{history.length} video</span>
              <button
                className="btn ghost pill small"
                onClick={() => {
                  clearWatchHistory();
                  toast(t('history_cleared_toast'), 'info');
                }}
              >
                {t('history_clear_all')}
              </button>
            </div>
          ) : null}
          {history.length === 0 ? (
            <EmptyState text={t('user_no_history')} hint={t('user_no_history_hint')} />
          ) : (
            <div className="history-grid">
              {history.map((item) => (
                <div key={item.videoId} className="history-card">
                  <div className="history-thumb-wrap" onClick={() => navigate(`/video/${item.videoId}`)}>
                    {item.video.poster ? (
                      <img src={item.video.poster} alt="" loading="lazy" />
                    ) : (
                      <div className="history-fallback-poster" />
                    )}
                    <span className="history-dur">{formatDuration(item.duration)}</span>
                  </div>
                  <div className="history-info">
                    <p className="history-caption" onClick={() => navigate(`/video/${item.videoId}`)}>
                      {item.video.caption || t('no_caption')}
                    </p>
                    <div className="history-meta">
                      <span className="history-author">@{item.video.author.display_name || item.video.author.username}</span>
                      <span className="history-time">{timeAgo(item.watchedAt)}</span>
                    </div>
                    <div className="history-actions">
                      <button className="btn accent pill small" onClick={() => navigate(`/video/${item.videoId}`)}>
                        {t('history_resume')}
                      </button>
                      <button
                        className="btn ghost pill small"
                        onClick={() => removeWatchItem(item.videoId)}
                        title={t('action_delete')}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {listState.loading && !items.length ? <Loading label={t('state_loading')} /> : null}
          {listState.error && !items.length ? <ErrorState text={listState.error} onRetry={listState.reload} /> : null}
          {!listState.loading && !items.length ? (
            <EmptyState text={tab === 'works' ? t('user_no_works') : t('user_no_likes')} />
          ) : null}
          {items.length ? (
            <>
              <ThumbGrid items={items} />
              {next ? (
                <button className="btn ghost block" onClick={loadMore} disabled={moreBusy}>
                  {moreBusy ? t('state_loading') : t('search_load_more')}
                </button>
              ) : null}
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
