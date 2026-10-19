import { useEffect, useMemo, useRef } from 'react';
import type { RouteProps } from '../router/router';
import { Link } from '../router/Link';
import { navigate } from '../router/router';
import type { Video } from '../api/types';
import { normalizeVideo, videoApi } from '../api/endpoints';
import { useAsync } from '../hooks/useAsync';
import { ErrorState, Loading } from '../components/States';
import { Avatar } from '../components/Avatar';
import { ActionRail } from '../components/ActionRail';
import { CommentsDrawerBody } from '../components/CommentsDrawer';
import { BackIcon, VerifiedIcon } from '../components/icons';
import { feedStore, reportView, useVideo } from '../store/feed';
import { formatCount, formatDate, formatDuration, tagOf } from '../utils/format';
import { useSoundOn } from '../store/ui';

import { useI18n } from '../store/i18n';

export default function VideoPage({ params }: RouteProps) {
  const { t } = useI18n();
  const id = params.id;
  const state = useAsync<Video>(() => videoApi.get(id).then((res) => normalizeVideo(res.video)), [id]);
  const stored = useVideo(id);
  const video = stored ?? state.data ?? null;
  const soundOn = useSoundOn();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (state.data) feedStore.upsertVideo(state.data);
  }, [state.data]);

  useEffect(() => {
    if (video) reportView(video.id);
  }, [video?.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable ||
          target.closest('input, textarea, [contenteditable="true"]'))
      ) {
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const vid = videoRef.current;
      if (!vid) return;

      if (e.code === 'Space' || e.key === ' ' || e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        if (vid.paused) void vid.play().catch(() => undefined);
        else vid.pause();
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        vid.currentTime = Math.min(vid.duration || 0, vid.currentTime + 5);
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        vid.currentTime = Math.max(0, vid.currentTime - 5);
        return;
      }

      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        vid.muted = !vid.muted;
        return;
      }

      if (e.key === 's' || e.key === 'S' || e.key === '>') {
        e.preventDefault();
        const rates = [1, 1.25, 1.5, 2];
        const curIdx = rates.indexOf(vid.playbackRate);
        vid.playbackRate = rates[(curIdx + 1) % rates.length];
        return;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const tags = useMemo(() => (video ? tagOf(video.caption) : []), [video]);

  if (state.loading && !video) return <Loading label={t('vp_loading')} />;
  if (state.error && !video) return <ErrorState text={state.error} onRetry={state.reload} />;
  if (!video) return <ErrorState text={t('vp_not_found')} />;

  const author = video.author;

  return (
    <div className="video-page">
      <div className="page-head">
        <button className="icon-btn" onClick={() => navigate('/')} aria-label={t('vp_back')}>
          <BackIcon size={22} />
        </button>
        <h1>{t('vp_title')}</h1>
      </div>
      <div className="vp-body">
        <div className="vp-left">
          <div className="vp-player">
            <video
              ref={videoRef}
              src={video.url}
              poster={video.poster || undefined}
              controls
              playsInline
              autoPlay={!soundOn}
              muted={!soundOn}
            />
          </div>
          <div className="vp-caption">
            <Link to={`/user/${author.id}`} className="vp-author">
              <Avatar user={author} size={40} />
              <span>
                <strong>{author.display_name || author.username}</strong>
                {author.verified ? <VerifiedIcon size={14} /> : null}
                <em>@{author.username}</em>
              </span>
            </Link>
            <p className="vp-text">{video.caption || t('no_caption')}</p>
            {tags.length ? (
              <div className="vp-tags">
                {tags.map((tg) => (
                  <Link key={tg} to={`/search?q=${encodeURIComponent(`#${tg}`)}`} className="tag">
                    #{tg}
                  </Link>
                ))}
              </div>
            ) : null}
            <p className="vp-meta">
              {video.duration > 0 ? (
                <span className={`meta-duration${video.duration >= 60 ? ' long' : ''}`}>
                  ⏱ {formatDuration(video.duration)}
                </span>
              ) : null}
              <span>{formatDate(video.created_at)}</span>
              <span>{formatCount(video.stats.views)}{t('views_suffix')}</span>
              <span>{formatCount(video.stats.shares)}{t('shares_suffix')}</span>
            </p>
          </div>
        </div>
        <div className="vp-rail">
          <ActionRail video={video} />
        </div>
        <div className="vp-comments drawer inline">
          <CommentsDrawerBody key={video.id} video={video} />
        </div>
      </div>
    </div>
  );
}
