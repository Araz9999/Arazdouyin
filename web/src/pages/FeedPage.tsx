import { useEffect, useMemo } from 'react';
import type { RouteProps } from '../router/router';
import { navigate } from '../router/router';
import { FeedScroller } from '../components/FeedScroller';
import { EmptyState, ErrorState, Loading } from '../components/States';
import { VolumeIcon } from '../components/icons';
import { ensureFeed, feedKey, refreshFeed, useFeedItems, useFeedMeta } from '../store/feed';
import type { FeedKind } from '../store/feed';
import { useAuthStatus } from '../store/auth';
import { setSound, useSoundOn } from '../store/ui';

/* docs-perf-notes: the HUD is the only thing on this page that cares about the speaker
   toggle, so it owns that subscription. Before, a sound flip re-rendered FeedPage and
   cascaded into the scroller + every card. */
import { useI18n } from '../store/i18n';

function FeedHud({ feedKey: key, kind }: { feedKey: string; kind: FeedKind }) {
  const { t } = useI18n();
  const soundOn = useSoundOn();
  return (
    <div className="feed-hud">
      <button
        className="hud-btn"
        title={soundOn ? t('action_sound_off') : t('action_sound_on')}
        aria-label={soundOn ? t('action_sound_off') : t('action_sound_on')}
        aria-pressed={!soundOn}
        onClick={() => setSound(!soundOn)}
      >
        <VolumeIcon size={17} on={soundOn} strokeWidth={1.9} />
      </button>
      <FeedRefreshButton feedKey={key} kind={kind} />
    </div>
  );
}

function FeedRefreshButton({ feedKey: key, kind }: { feedKey: string; kind: FeedKind }) {
  const { t } = useI18n();
  const { status } = useFeedMeta(key);
  return (
    <button
      className="hud-btn"
      title={t('action_refresh')}
      aria-label={t('action_refresh')}
      onClick={() => refreshFeed(key, kind)}
      disabled={status === 'loading'}
    >
      <span className={`hud-refresh${status === 'loading' ? ' spinning' : ''}`}>↻</span>
    </button>
  );
}

export default function FeedPage({ params }: RouteProps) {
  const { t } = useI18n();
  const kind: FeedKind = params.mode === 'following' ? 'following' : 'recommend';
  const key = feedKey(kind);
  const items = useFeedItems(key);
  const meta = useFeedMeta(key);
  const status = useAuthStatus();

  useEffect(() => {
    if (kind === 'following' && status !== 'ready') return;
    ensureFeed(key, kind);
  }, [key, kind, status]);

  const needLogin = kind === 'following' && status === 'anon';
  const { status: feedStatus, error: feedError } = meta;

  const empty = useMemo(
    () =>
      needLogin ? (
        <EmptyState
          text={t('feed_empty_following')}
          action={
            <button className="btn accent pill" onClick={() => navigate('/login')}>
              {t('nav_login')}
            </button>
          }
        />
      ) : feedStatus === 'loading' || (feedStatus === 'idle' && items.length === 0) ? (
        <Loading label={t('feed_preparing')} />
      ) : feedStatus === 'error' ? (
        <ErrorState text={feedError ?? t('comments_load_failed')} onRetry={() => refreshFeed(key, kind)} />
      ) : (
        <EmptyState text={t('feed_empty_recommend')} hint={kind === 'following' ? t('feed_empty_following_hint') : undefined} />
      ),
    [needLogin, feedStatus, feedError, items.length, key, kind, t]
  );

  return (
    <>
      <FeedScroller feedKey={key} kind={kind} items={items} empty={empty} />
      <FeedHud feedKey={key} kind={kind} />
      {meta.loadingMore ? <div className="feed-more">{t('feed_loading_more')}</div> : null}
    </>
  );
}
