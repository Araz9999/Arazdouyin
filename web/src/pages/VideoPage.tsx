import { useEffect, useMemo } from 'react';
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
import { formatCount, formatDate, tagOf } from '../utils/format';
import { useSoundOn } from '../store/ui';

import { useI18n } from '../store/i18n';

export default function VideoPage({ params }: RouteProps) {
  const { t } = useI18n();
  const id = params.id;
  const state = useAsync<Video>(() => videoApi.get(id).then((res) => normalizeVideo(res.video)), [id]);
  const stored = useVideo(id);
  const video = stored ?? state.data ?? null;
  const soundOn = useSoundOn();

  useEffect(() => {
    if (state.data) feedStore.upsertVideo(state.data);
  }, [state.data]);

  useEffect(() => {
    if (video) reportView(video.id);
  }, [video?.id]);

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
