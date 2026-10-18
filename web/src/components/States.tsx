import type { ReactNode } from 'react';
import { SpinnerIcon } from './icons';
import { useI18n } from '../store/i18n';

export function Loading({ label }: { label?: string }) {
  const { t } = useI18n();
  return (
    <div className="state-block">
      <SpinnerIcon className="dim" size={26} />
      <span>{label ?? t('state_loading')}</span>
    </div>
  );
}

export function EmptyState({ text, hint, action }: { text: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="state-block empty">
      <div className="empty-mark" aria-hidden="true" />
      <p className="empty-text">{text}</p>
      {hint ? <p className="empty-hint">{hint}</p> : null}
      {action}
    </div>
  );
}

export function ErrorState({ text, onRetry }: { text: string; onRetry?: () => void }) {
  const { t } = useI18n();
  return (
    <div className="state-block error">
      <p>{text}</p>
      {onRetry ? (
        <button className="btn ghost small" onClick={onRetry}>
          {t('state_reload')}
        </button>
      ) : null}
    </div>
  );
}
