import { useEffect, useMemo, useState } from 'react';
import type { RouteProps } from '../router/router';
import { navigate } from '../router/router';
import { FeedScroller } from '../components/FeedScroller';
import { EmptyState, ErrorState, Loading } from '../components/States';
import { VolumeIcon } from '../components/icons';
import { ensureFeed, feedKey, refreshFeed, useFeedItems, useFeedMeta } from '../store/feed';
import type { FeedKind } from '../store/feed';
import { useAuthStatus } from '../store/auth';
import { setSound, useSoundOn } from '../store/ui';
import { ShortcutsModal } from '../components/ShortcutsModal';

/* docs-perf-notes: the HUD is the only thing on this page that cares about the speaker
   toggle, so it owns that subscription. Before, a sound flip re-rendered FeedPage and
   cascaded into the scroller + every card. */
import { useI18n } from '../store/i18n';

function FeedHud({ feedKey: key, kind, onOpenShortcuts }: { feedKey: string; kind: FeedKind; onOpenShortcuts: () => void }) {
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
      <button
        className="hud-btn hud-btn-shortcuts"
        title={`${t('shortcuts_title')} (?)`}
        aria-label={t('shortcuts_title')}
        onClick={onOpenShortcuts}
      >
        <span className="hud-keyboard-icon" aria-hidden="true">⌨</span>
      </button>
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

import type { TranslationKey } from '../store/i18n';

const FEED_TABS: { kind: FeedKind; path: string; labelKey: TranslationKey }[] = [
  { kind: 'nearby', path: '/nearby', labelKey: 'tab_nearby' },
  { kind: 'friends', path: '/friends', labelKey: 'tab_friends' },
  { kind: 'following', path: '/follow', labelKey: 'tab_following' },
  { kind: 'recommend', path: '/', labelKey: 'tab_recommend' },
  { kind: 'shopping', path: '/shopping', labelKey: 'tab_shopping' },
  { kind: 'featured', path: '/featured', labelKey: 'tab_featured' }
];

export default function FeedPage({ params }: RouteProps) {
  const { t } = useI18n();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const rawKind = params.mode as FeedKind;
  const validKinds: FeedKind[] = ['recommend', 'following', 'friends', 'nearby', 'shopping', 'featured'];
  const kind: FeedKind = validKinds.includes(rawKind) ? rawKind : 'recommend';
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
      <header className="feed-header-bar">
        <nav className="feed-top-tabs" aria-label="Feed Navigation">
          {FEED_TABS.map((tab) => (
            <button
              key={tab.kind}
              className={`feed-tab-btn${kind === tab.kind ? ' active' : ''}`}
              onClick={() => navigate(tab.path)}
            >
              <span className="feed-tab-label">{t(tab.labelKey)}</span>
              {kind === tab.kind ? <span className="feed-tab-indicator" /> : null}
            </button>
          ))}
        </nav>
        {kind === 'nearby' ? (
          <div className="feed-sub-bar nearby-sub-bar">
            <span>📍 Kadıköy, İstanbul · &lt; 2 km</span>
          </div>
        ) : null}
        {kind === 'shopping' ? (
          <div className="feed-sub-bar shopping-sub-bar">
            <span>🛍️ FastMall · Özel İndirimler & Canlı Satışlar</span>
          </div>
        ) : null}
      </header>
      <FeedScroller
        feedKey={key}
        kind={kind}
        items={items}
        empty={empty}
        onOpenShortcuts={() => setShortcutsOpen(true)}
      />
      <FeedHud
        feedKey={key}
        kind={kind}
        onOpenShortcuts={() => setShortcutsOpen(true)}
      />
      {meta.loadingMore ? <div className="feed-more">{t('feed_loading_more')}</div> : null}
      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </>
  );
}
