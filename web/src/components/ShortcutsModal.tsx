import { useEffect } from 'react';
import { useI18n } from '../store/i18n';
import { CloseIcon } from './icons';

type Props = {
  open: boolean;
  onClose: () => void;
};

export function ShortcutsModal({ open, onClose }: Props) {
  const { t } = useI18n();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const shortcuts = [
    { label: t('shortcut_play_pause'), keys: ['Space', 'K'] },
    { label: t('shortcut_next_video'), keys: ['↓', 'J'] },
    { label: t('shortcut_prev_video'), keys: ['↑'] },
    { label: t('shortcut_seek_forward'), keys: ['→'] },
    { label: t('shortcut_seek_backward'), keys: ['←'] },
    { label: t('shortcut_sound'), keys: ['M'] },
    { label: t('shortcut_like'), keys: ['L'] },
    { label: t('shortcut_comments'), keys: ['C'] },
    { label: t('shortcut_speed'), keys: ['S', '>'] },
    { label: t('shortcut_search'), keys: ['Ctrl', 'K'] },
    { label: t('shortcut_help'), keys: ['?'] },
  ];

  return (
    <div className="sheet-root open shortcuts-modal-root" role="dialog" aria-modal="true" aria-label={t('shortcuts_title')}>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="shortcuts-dialog">
        <div className="shortcuts-head">
          <div className="shortcuts-title-wrap">
            <span className="shortcuts-icon-badge" aria-hidden="true">⌨</span>
            <div>
              <h2 className="shortcuts-title">{t('shortcuts_title')}</h2>
              <p className="shortcuts-desc">{t('shortcuts_desc')}</p>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label={t('shortcut_close')}>
            <CloseIcon size={20} />
          </button>
        </div>

        <div className="shortcuts-list">
          {shortcuts.map((s, idx) => (
            <div key={idx} className="shortcut-row">
              <span className="shortcut-label">{s.label}</span>
              <div className="shortcut-keys">
                {s.keys.map((k, ki) => (
                  <span key={ki} className="key-wrap">
                    <kbd className="key-cap">{k}</kbd>
                    {ki < s.keys.length - 1 && <span className="key-sep">/</span>}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="shortcuts-footer">
          <button className="btn ghost pill" onClick={onClose}>
            {t('shortcut_close')}
          </button>
        </div>
      </div>
    </div>
  );
}
