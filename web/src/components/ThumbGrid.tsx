import type { Video } from '../api/types';
import { formatCount, formatDuration } from '../utils/format';
import { navigate } from '../router/router';
import { PlayIcon } from './icons';
import { useI18n } from '../store/i18n';

export function ThumbGrid({ items }: { items: Video[] }) {
  const { t } = useI18n();
  if (!items.length) return null;
  return (
    <div className="thumb-grid">
      {items.map((v) => (
        <button key={v.id} className="thumb" onClick={() => navigate(`/video/${v.id}`)} title={v.caption}>
          {v.poster ? <img src={v.poster} alt="" loading="lazy" decoding="async" /> : <span className="thumb-fallback" />}
          <span className="thumb-play">
            <PlayIcon size={13} />
            {formatCount(v.stats.views)}
          </span>
          <span className={`thumb-dur${v.duration >= 60 ? ' long' : ''}`}>{formatDuration(v.duration)}</span>
          <span className="thumb-cap">{v.caption || t('no_caption')}</span>
        </button>
      ))}
    </div>
  );
}
