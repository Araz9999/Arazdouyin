import { useEffect } from 'react';
import { closeAuthSheet, useAuthSheet } from '../store/auth';
import { AuthForm } from './AuthForm';
import { CloseIcon } from './icons';
import { useI18n } from '../store/i18n';

export function AuthSheet() {
  const { t } = useI18n();
  const sheetOpen = useAuthSheet();

  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAuthSheet();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sheetOpen]);

  return (
    <div className={`sheet-root ${sheetOpen ? 'open' : ''}`} aria-hidden={!sheetOpen}>
      <div className="sheet-backdrop" onClick={closeAuthSheet} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label={t('auth_btn_login')}>
        <button className="sheet-close icon-btn" onClick={closeAuthSheet} aria-label={t('action_cancel')}>
          <CloseIcon size={20} />
        </button>
        <div className="sheet-head">
          <h2>{t('auth_sheet_title')}</h2>
          <p>{t('auth_sheet_desc')}</p>
        </div>
        <AuthForm compact />
      </div>
    </div>
  );
}
