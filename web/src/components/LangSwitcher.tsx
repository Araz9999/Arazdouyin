import { useI18n, type Lang } from '../store/i18n';

export function LangSwitcher({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useI18n();

  const toggle = (next: Lang) => {
    if (next !== lang) setLang(next);
  };

  if (compact) {
    return (
      <div className="lang-switcher-compact" role="group" aria-label="Dil / Язык">
        <button
          type="button"
          className={`lang-btn ${lang === 'az' ? 'active' : ''}`}
          onClick={() => toggle('az')}
          title="Azərbaycan"
        >
          AZ
        </button>
        <span className="lang-sep">/</span>
        <button
          type="button"
          className={`lang-btn ${lang === 'tr' ? 'active' : ''}`}
          onClick={() => toggle('tr')}
          title="Türkçe"
        >
          TR
        </button>
        <span className="lang-sep">/</span>
        <button
          type="button"
          className={`lang-btn ${lang === 'ru' ? 'active' : ''}`}
          onClick={() => toggle('ru')}
          title="Русский"
        >
          RU
        </button>
      </div>
    );
  }

  return (
    <div className="lang-switcher" role="group" aria-label="Dil / Язык">
      <button
        type="button"
        className={`lang-tab ${lang === 'az' ? 'active' : ''}`}
        onClick={() => toggle('az')}
      >
        <span className="lang-flag">🇦🇿</span>
        <span>Azərbaycan</span>
      </button>
      <button
        type="button"
        className={`lang-tab ${lang === 'tr' ? 'active' : ''}`}
        onClick={() => toggle('tr')}
      >
        <span className="lang-flag">🇹🇷</span>
        <span>Türkçe</span>
      </button>
      <button
        type="button"
        className={`lang-tab ${lang === 'ru' ? 'active' : ''}`}
        onClick={() => toggle('ru')}
      >
        <span className="lang-flag">🇷🇺</span>
        <span>Русский</span>
      </button>
    </div>
  );
}
