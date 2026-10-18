import { useEffect, useRef, useState } from 'react';
import type { RouteProps } from '../router/router';
import { navigate } from '../router/router';
import { searchApi } from '../api/endpoints';
import type { User, Video } from '../api/types';
import { Avatar } from '../components/Avatar';
import { ThumbGrid } from '../components/ThumbGrid';
import { EmptyState, ErrorState, Loading } from '../components/States';
import { SearchIcon, VerifiedIcon } from '../components/icons';
import { formatCount } from '../utils/format';
import { toggleFollow, useIsFollowing } from '../store/feed';
import { requireAuth } from '../store/auth';
import { useI18n } from '../store/i18n';

function UserCell({ user }: { user: User }) {
  const { t } = useI18n();
  const following = useIsFollowing(user.id);
  return (
    <div className="user-cell">
      <Avatar user={user} size={44} onClick={() => navigate(`/user/${user.id}`)} />
      <div className="user-cell-main">
        <button className="user-cell-name" onClick={() => navigate(`/user/${user.id}`)}>
          {user.display_name || user.username}
          {user.verified ? <VerifiedIcon size={14} /> : null}
        </button>
        <p className="user-cell-sub">@{user.username} · {formatCount(user.follower_count)} {t('user_stat_followers')}</p>
      </div>
      <button
        className={`btn pill small ${following ? 'ghost' : 'accent'}`}
        onClick={() => requireAuth(() => toggleFollow(user.id))}
      >
        {following ? t('action_following') : `+ ${t('action_follow')}`}
      </button>
    </div>
  );
}

export default function SearchPage({ route }: RouteProps) {
  const { t } = useI18n();
  const q = route.query.get('q') ?? '';
  const [videos, setVideos] = useState<Video[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const moreCtrl = useRef<AbortController | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => () => moreCtrl.current?.abort(), []);

  useEffect(() => {
    /* a page tail belongs to the query that asked for it: abort it here, otherwise its
       append writes the previous query's videos into these results */
    moreCtrl.current?.abort();
    if (!q.trim()) {
      setVideos([]);
      setUsers([]);
      setCursor(null);
      return;
    }
    /* docs-perf-notes: one controller per query, aborted on the next keystroke or unmount, so a
       slow "ab" response can never overwrite the "abc" result it arrived after. */
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    searchApi
      .search(q, null, 20, ctrl.signal)
      .then((res) => {
        if (ctrl.signal.aborted) return;
        setVideos(res.videos);
        setUsers(res.users);
        setCursor(res.nextCursor);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (ctrl.signal.aborted || (err instanceof DOMException && err.name === 'AbortError')) return;
        setError(err instanceof Error ? err.message : t('op_failed'));
        setLoading(false);
      });
    return () => ctrl.abort();
  }, [q, nonce, t]);

  const more = () => {
    if (!cursor || loading) return;
    moreCtrl.current?.abort();
    const ctrl = new AbortController();
    moreCtrl.current = ctrl;
    setLoading(true);
    searchApi
      .search(q, cursor, 20, ctrl.signal)
      .then((res) => {
        if (ctrl.signal.aborted) return;
        setVideos((v) => [...v, ...res.videos]);
        setCursor(res.nextCursor);
      })
      .catch(() => setError(t('op_failed')))
      .finally(() => setLoading(false));
  };

  if (!q.trim()) return <EmptyState text={t('search_empty_input')} hint={t('search_empty_input_hint')} />;
  if (error && !videos.length) return <ErrorState text={error} onRetry={() => setNonce((n) => n + 1)} />;
  if (loading && !videos.length && !users.length) return <Loading label={t('search_loading')} />;

  return (
    <div className="search-page">
      <div className="page-head">
        <SearchIcon className="head-ico" />
        <h1>{t('search_results_title', { query: q })}</h1>
        <span className="head-count">{t('search_results_count', { count: formatCount(videos.length + users.length) })}</span>
      </div>
      {users.length ? (
        <section className="section">
          <h2 className="section-title">{t('search_section_users')}</h2>
          <div className="user-list">
            {users.map((u) => (
              <UserCell key={u.id} user={u} />
            ))}
          </div>
        </section>
      ) : null}
      <section className="section">
        <h2 className="section-title">{t('search_section_videos')}</h2>
        {videos.length ? <ThumbGrid items={videos} /> : <EmptyState text={t('search_no_videos')} />}
        {cursor ? (
          <button className="btn ghost block" onClick={more} disabled={loading}>
            {loading ? t('state_loading') : t('search_load_more')}
          </button>
        ) : null}
      </section>
    </div>
  );
}
