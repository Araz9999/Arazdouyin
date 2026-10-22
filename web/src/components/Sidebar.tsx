import { useEffect, useState } from 'react';
import { Link } from '../router/Link';
import { useRoute } from '../router/router';
import { Avatar } from './Avatar';
import { BrandMark, FriendIcon, HomeIcon, LiveIcon, MeIcon, FollowIcon, MapPinIcon, ShoppingBagIcon, CrownIcon } from './icons';
import { useAuthStatus, useSelf } from '../store/auth';
import { readRecents, type RecentUser } from '../utils/recents';

import { useI18n, type TranslationKey } from '../store/i18n';
import { LangSwitcher } from './LangSwitcher';

const NAV_KEYS: { to: string; labelKey: TranslationKey; Icon: typeof HomeIcon }[] = [
  { to: '/', labelKey: 'tab_recommend', Icon: HomeIcon },
  { to: '/follow', labelKey: 'tab_following', Icon: FollowIcon },
  { to: '/friends', labelKey: 'tab_friends', Icon: FriendIcon },
  { to: '/nearby', labelKey: 'tab_nearby', Icon: MapPinIcon },
  { to: '/shopping', labelKey: 'tab_shopping', Icon: ShoppingBagIcon },
  { to: '/featured', labelKey: 'tab_featured', Icon: CrownIcon },
  { to: '/my', labelKey: 'nav_my', Icon: MeIcon },
  { to: '/live', labelKey: 'nav_live', Icon: LiveIcon }
];

function isActive(route: string, to: string) {
  if (to === '/') return route === '/' || route === '';
  return route === to || route.startsWith(`${to}/`);
}

export function Sidebar() {
  const { t } = useI18n();
  const route = useRoute();
  const user = useSelf();
  const status = useAuthStatus();
  const [recents, setRecents] = useState<RecentUser[]>([]);

  useEffect(() => {
    setRecents(readRecents());
    const onFocus = () => setRecents(readRecents());
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [route.path]);

  return (
    <aside className="sidebar">
      <div className="brand">
        <BrandMark size={30} />
        <div className="brand-text">
          <strong>FastVideo</strong>
          <span>{t('brand_sub')}</span>
        </div>
      </div>
      <nav className="nav">
        {NAV_KEYS.map(({ to, labelKey, Icon }) => (
          <Link key={to} to={to} className={`nav-row ${isActive(route.path, to) ? 'active' : ''}`}>
            <Icon size={22} on={isActive(route.path, to)} />
            <span>{t(labelKey)}</span>
          </Link>
        ))}
      </nav>
      <div className="side-sep" />
      <div className="recent">
        <p className="side-title">{t('nav_recent_login')}</p>
        {status === 'ready' && user ? (
          <Link to="/my" className="recent-row">
            <Avatar user={user} size={28} />
            <span className="recent-name">{user.display_name || user.username}</span>
          </Link>
        ) : (
          <Link to="/login" className="recent-row">
            <span className="recent-dot" />
            <span className="recent-name">{t('nav_login_account')}</span>
          </Link>
        )}
        {recents.slice(0, 4).map((r) => (
          <Link key={r.id} to={`/user/${r.id}`} className="recent-row">
            <Avatar user={r} size={24} />
            <span className="recent-name">{r.display_name}</span>
          </Link>
        ))}
      </div>
      <div className="side-lang" style={{ padding: '0 12px 12px' }}>
        <LangSwitcher />
      </div>
      <div className="side-foot">
        <span>{t('nav_fan_club')}</span>
        <span>{t('nav_about')}</span>
        <span>{t('nav_help')}</span>
      </div>
    </aside>
  );
}
