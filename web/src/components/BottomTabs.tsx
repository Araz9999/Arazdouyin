import { Link } from '../router/Link';
import { navigate, useRoute } from '../router/router';
import { FriendIcon, HomeIcon, MeIcon, PlusIcon, FollowIcon } from './icons';
import { requireAuth } from '../store/auth';
import { useI18n } from '../store/i18n';

export function BottomTabs() {
  const { t } = useI18n();
  const route = useRoute();
  const active = (to: string) => (to === '/' ? route.path === '/' : route.path === to || route.path.startsWith(`${to}/`));
  return (
    <nav className="tabbar">
      <Link to="/" className={`tab ${active('/') ? 'on' : ''}`}>
        <HomeIcon size={22} on={active('/')} />
        <span>{t('nav_recommend')}</span>
      </Link>
      <Link to="/follow" className={`tab ${active('/follow') ? 'on' : ''}`}>
        <FollowIcon size={22} on={active('/follow')} />
        <span>{t('nav_following')}</span>
      </Link>
      <button className="tab tab-add" onClick={() => requireAuth(() => navigate('/upload'))} aria-label={t('nav_upload')}>
        <PlusIcon size={20} />
      </button>
      <Link to="/friends" className={`tab ${active('/friends') ? 'on' : ''}`}>
        <FriendIcon size={22} on={active('/friends')} />
        <span>{t('nav_friends')}</span>
      </Link>
      <Link to="/my" className={`tab ${active('/my') ? 'on' : ''}`}>
        <MeIcon size={22} on={active('/my')} />
        <span>{t('nav_my')}</span>
      </Link>
    </nav>
  );
}
