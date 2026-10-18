import { useEffect } from 'react';
import type { RouteProps } from '../router/router';
import { navigate } from '../router/router';
import { AuthForm } from '../components/AuthForm';
import { BrandMark } from '../components/icons';
import { useAuthStatus } from '../store/auth';
import { useI18n } from '../store/i18n';
import { LangSwitcher } from '../components/LangSwitcher';

export default function LoginPage(_props: RouteProps) {
  const { t } = useI18n();
  const status = useAuthStatus();

  useEffect(() => {
    if (status === 'ready') navigate('/my', true);
  }, [status]);

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <BrandMark size={40} />
          <div>
            <strong>FastVideo</strong>
            <span>{t('brand_slogan')}</span>
          </div>
        </div>
        <AuthForm />
        <div style={{ marginTop: 16 }}>
          <LangSwitcher />
        </div>
      </div>
      <p className="login-foot">{t('login_card_foot')}</p>
    </div>
  );
}
