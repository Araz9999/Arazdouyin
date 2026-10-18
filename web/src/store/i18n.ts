import { createStore, useStore } from './reactive';

export type Lang = 'tr' | 'ru';

export type TranslationKey = keyof typeof translations.tr;

export const translations = {
  tr: {
    // Brand & Slogan
    brand_name: 'FastVideo',
    brand_sub: 'Kısa Video Topluluğu',
    brand_slogan: 'Harika anları yakalayan kısa video topluluğu',

    // Nav
    nav_recommend: 'Sana Özel',
    nav_following: 'Takip Edilen',
    nav_friends: 'Arkadaşlar',
    nav_my: 'Profilim',
    nav_live: 'Canlı Yayın',
    nav_upload: 'Yükle',
    nav_messages: 'Mesajlar',
    nav_login: 'Giriş Yap',
    nav_recent_login: 'Son Giriş',
    nav_login_account: 'Hesaba Giriş Yap',
    nav_fan_club: 'Hayran Kulübü',
    nav_about: 'Hakkında',
    nav_help: 'Yardım',

    // TopBar
    search_placeholder: 'Kullanıcı, video veya etiket ara...',
    search_label: 'Arama',
    search_shortcut: 'Ctrl K',
    my_home: 'Profilim',

    // Actions & Rail
    action_like: 'Beğen',
    action_comment: 'Yorum',
    action_favorite: 'Kaydet',
    action_share: 'Paylaş',
    action_follow: 'Takip Et',
    action_following: 'Takip Ediliyor',
    action_sound_on: 'Sesi Aç',
    action_sound_off: 'Sesi Kapat',
    action_refresh: 'Yenile',
    action_reply: 'Yanıtla',
    action_delete: 'Sil',
    action_cancel: 'İptal',
    action_save: 'Kaydet',
    action_publish: 'Yayınla',
    action_reselect: 'Yeniden Seç',
    action_uploading: 'Yükleniyor...',
    action_logout: 'Çıkış Yap',

    // Feed & Videos
    feed_preparing: 'Videolar hazırlanıyor...',
    feed_loading_more: 'Daha fazla yükleniyor…',
    feed_empty_following: 'Takip ettiğin kişilerin videolarını görmek için giriş yap',
    feed_empty_following_hint: 'Bazı üreticileri takip etmeye başla',
    feed_empty_recommend: 'Henüz video bulunmuyor',
    feed_original_sound: 'orijinal sesi',
    views_suffix: ' izlenme',
    shares_suffix: ' paylaşım',
    no_caption: 'Açıklama yok',

    // Comments
    comments_title: 'Yorumlar',
    comments_count_suffix: ' yorum',
    comments_loading: 'Yorumlar yükleniyor...',
    comments_empty: 'Henüz yorum yapılmamış',
    comments_empty_hint: 'İlk yorumu sen yap!',
    comments_input_placeholder: 'Bir yorum yaz... (Ctrl+Enter ile gönder)',
    comments_reply_to: 'Yanıtlanan:',
    comments_cancel_reply: 'Yanıtı iptal et',
    comments_send: 'Gönder',
    comments_load_failed: 'Yorumlar yüklenemedi',
    comments_send_failed: 'Yorum gönderilemedi',
    comments_delete_failed: 'Yorum silinemedi',

    // Share & Toasts
    share_success: 'Paylaşıldı!',
    link_copied: 'Video bağlantısı panoya kopyalandı',
    share_title_prefix: 'FastVideo',
    share_text_template: '{author} adlı kullanıcının videosu',
    op_failed: 'İşlem başarısız, lütfen tekrar deneyin',
    follow_failed: 'Takip edilemedi',
    unfollow_failed: 'Takipten çıkılamadı',
    welcome_user: 'Hoş geldin, {name}',
    profile_updated: 'Profil bilgileri güncellendi',
    publish_success: 'Video başarıyla yayınlandı!',
    publish_failed: 'Video yüklenemedi',

    // Auth
    auth_tab_login: 'Giriş Yap',
    auth_tab_register: 'Kayıt Ol',
    auth_username: 'Kullanıcı Adı',
    auth_username_placeholder: 'Harf, rakam veya alt çizgi',
    auth_password: 'Şifre',
    auth_password_placeholder: 'En az 6 karakter',
    auth_display_name: 'Görünen İsim',
    auth_display_name_placeholder: 'İsteğe bağlı',
    auth_btn_login: 'Giriş Yap',
    auth_btn_register: 'Kayıt Ol ve Giriş Yap',
    auth_sheet_title: 'Devam etmek için giriş yap',
    auth_sheet_desc: 'Beğenmek, yorum yapmak, takip etmek ve video yüklemek için giriş yapmalısınız.',
    auth_tip: 'Giriş yaptıktan sonra içerikleri beğenebilir, yorum yapabilir ve video yayınlayabilirsiniz.',
    auth_error_required: 'Lütfen kullanıcı adı ve şifreyi doldurun',
    auth_error_failed: 'Giriş yapılamadı',
    login_card_foot: 'Oturum bilgisi bu tarayıcıda güvenle saklanır.',

    // Upload Page
    upload_title: 'Video Yayınla',
    upload_guard_title: 'Video Yükle',
    upload_guard_desc: 'İlk kısa videonu yayınlamak için hemen giriş yap.',
    upload_go_login: 'Giriş Yap',
    upload_drop_title: 'Videoyu buraya sürükleyin veya dosya seçin',
    upload_drop_hint: 'mp4 / webm desteklenir, maksimum 200MB',
    upload_file_invalid: 'Lütfen geçerli bir video dosyası seçin (mp4 / webm)',
    upload_file_too_large: 'Dosya çok büyük, maksimum 200MB',
    upload_caption_label: 'Video Açıklaması',
    upload_caption_placeholder: 'Açıklama ekleyin, #etiket ile daha çok kişiye ulaşın',
    upload_meta_duration: 'Süre',
    upload_meta_resolution: 'Çözünürlük',
    upload_meta_size: 'Boyut',
    upload_meta_filename: 'Dosya Adı',
    upload_read_failed: 'Video dosyası okunamadı',

    // User / Profile Page
    user_tab_works: 'Videolar',
    user_tab_likes: 'Beğenilenler',
    user_stat_likes: 'Beğeni',
    user_stat_following: 'Takip',
    user_stat_followers: 'Takipçi',
    user_edit_profile: 'Profili Düzenle',
    user_no_works: 'Henüz video paylaşılmamış',
    user_no_likes: 'Henüz beğenilen video yok',
    user_no_followers: 'Henüz takipçisi yok',
    user_no_following: 'Henüz kimseyi takip etmiyor',
    user_edit_name: 'Görünen İsim',
    user_edit_bio: 'Biyografi',
    user_edit_bio_placeholder: 'Kendinden bahset...',
    user_edit_color: 'Avatar Rengi',
    user_message_btn: 'Mesaj Gönder',
    user_not_found: 'Kullanıcı bulunamadı',

    // Messages Page
    msg_title: 'Özel Mesajlar',
    msg_conv_loading: 'Sohbetler yükleniyor...',
    msg_conv_empty: 'Henüz mesajlaşma yok',
    msg_conv_empty_hint: 'Bir kullanıcının profilinden "Mesaj Gönder" butonuna tıklayarak sohbet başlatın',
    msg_select_chat: 'Sohbet başlatmak için soldan bir kişi seçin',
    msg_chat_with: 'ile sohbet',
    msg_no_messages: 'Henüz mesaj yok',
    msg_say_hi: 'İlk mesajı göndererek merhaba de!',
    msg_input_placeholder: 'Bir mesaj yaz...',
    msg_load_failed: 'Mesajlar yüklenemedi',
    msg_last_empty: 'Henüz mesaj yok',

    // Search Page
    search_results_title: '“{query}” için sonuçlar',
    search_results_count: '{count} sonuç',
    search_section_users: 'Kullanıcılar',
    search_section_videos: 'Videolar',
    search_empty_input: 'Aramak için bir anahtar kelime girin',
    search_empty_input_hint: 'Kullanıcı adı, isim veya video açıklamalarında arayın',
    search_no_videos: 'Eşleşen video bulunamadı',
    search_load_more: 'Daha Fazla Yükle',
    search_loading: 'Aranıyor...',

    // Video Page
    vp_title: 'Video Detayı',
    vp_not_found: 'Video bulunamadı',
    vp_back: 'Geri Dön',
    vp_loading: 'Video açılıyor...',

    // States
    state_loading: 'Yükleniyor...',
    state_reload: 'Yeniden Dene',
    page_not_found: 'Sayfa Bulunamadı',
    page_not_found_hint: 'Sol menüden ana sayfaya dönebilirsiniz',

    // Time & Count
    time_just_now: 'Az önce',
    time_mins_ago: '{n} dk önce',
    time_hours_ago: '{n} sa önce',
    time_days_ago: '{n} gün önce',
    count_k: ' B',
    count_m: ' M',

    // System & Errors
    err_bad_json: 'Servis geçersiz bir yanıt döndürdü',
    err_network: 'Ağ hatası, lütfen bağlantınızı kontrol edin',
    err_request_failed: 'İstek başarısız oldu ({status})',
    err_upload_parse: 'Yükleme yanıtı okunamadı',
    err_upload_network: 'Ağ bağlantısı kesildi, yükleme başarısız',
    err_video_unreadable: 'Video dosyası okunamadı (lütfen MP4 veya WebM kullanın)',
    err_load_failed: 'Yükleme başarısız',
    video_play_pause: 'Oynat veya Duraklat',
  },
  ru: {
    // Brand & Slogan
    brand_name: 'FastVideo',
    brand_sub: 'Сообщество коротких видео',
    brand_slogan: 'Сообщество для ярких коротких видео',

    // Nav
    nav_recommend: 'Главная',
    nav_following: 'Подписки',
    nav_friends: 'Друзья',
    nav_my: 'Профиль',
    nav_live: 'Эфир',
    nav_upload: 'Загрузить',
    nav_messages: 'Сообщения',
    nav_login: 'Войти',
    nav_recent_login: 'Недавний вход',
    nav_login_account: 'Войти в аккаунт',
    nav_fan_club: 'Фан-клуб',
    nav_about: 'О нас',
    nav_help: 'Помощь',

    // TopBar
    search_placeholder: 'Поиск авторов, видео или тегов...',
    search_label: 'Поиск',
    search_shortcut: 'Ctrl K',
    my_home: 'Мой профиль',

    // Actions & Rail
    action_like: 'Нравится',
    action_comment: 'Коммент.',
    action_favorite: 'В избранное',
    action_share: 'Поделиться',
    action_follow: 'Подписаться',
    action_following: 'Вы подписаны',
    action_sound_on: 'Включить звук',
    action_sound_off: 'Выключить звук',
    action_refresh: 'Обновить',
    action_reply: 'Ответить',
    action_delete: 'Удалить',
    action_cancel: 'Отмена',
    action_save: 'Сохранить',
    action_publish: 'Опубликовать',
    action_reselect: 'Выбрать другое',
    action_uploading: 'Загрузка...',
    action_logout: 'Выйти',

    // Feed & Videos
    feed_preparing: 'Подбираем видео для вас...',
    feed_loading_more: 'Загрузка еще…',
    feed_empty_following: 'Войдите, чтобы видеть видео из подписок',
    feed_empty_following_hint: 'Подпишитесь на интересных авторов',
    feed_empty_recommend: 'Здесь пока нет видео',
    feed_original_sound: 'оригинальный звук',
    views_suffix: ' просмотров',
    shares_suffix: ' репостов',
    no_caption: 'Без описания',

    // Comments
    comments_title: 'Комментарии',
    comments_count_suffix: ' коммент.',
    comments_loading: 'Загрузка комментариев...',
    comments_empty: 'Пока нет комментариев',
    comments_empty_hint: 'Будьте первым, кто оставит комментарий!',
    comments_input_placeholder: 'Написать комментарий... (Ctrl+Enter для отправки)',
    comments_reply_to: 'В ответ:',
    comments_cancel_reply: 'Отменить ответ',
    comments_send: 'Отправить',
    comments_load_failed: 'Не удалось загрузить комментарии',
    comments_send_failed: 'Не удалось отправить комментарий',
    comments_delete_failed: 'Не удалось удалить комментарий',

    // Share & Toasts
    share_success: 'Успешно отправлено!',
    link_copied: 'Ссылка на видео скопирована в буфер обмена',
    share_title_prefix: 'FastVideo',
    share_text_template: 'Видео от {author}',
    op_failed: 'Ошибка операции, попробуйте позже',
    follow_failed: 'Не удалось подписаться',
    unfollow_failed: 'Не удалось отписаться',
    welcome_user: 'Добро пожаловать, {name}',
    profile_updated: 'Профиль успешно обновлен',
    publish_success: 'Видео успешно опубликовано!',
    publish_failed: 'Не удалось опубликовать видео',

    // Auth
    auth_tab_login: 'Вход',
    auth_tab_register: 'Регистрация',
    auth_username: 'Имя пользователя',
    auth_username_placeholder: 'Буквы / цифры / подчеркивание',
    auth_password: 'Пароль',
    auth_password_placeholder: 'Не менее 6 символов',
    auth_display_name: 'Отображаемое имя',
    auth_display_name_placeholder: 'Необязательно',
    auth_btn_login: 'Войти',
    auth_btn_register: 'Зарегистрироваться и войти',
    auth_sheet_title: 'Войдите для продолжения',
    auth_sheet_desc: 'Лайки, комментарии, подписки и загрузка видео доступны после авторизации.',
    auth_tip: 'После входа вы сможете ставить лайки, писать комментарии и публиковать свои видео.',
    auth_error_required: 'Пожалуйста, заполните имя пользователя и пароль',
    auth_error_failed: 'Ошибка входа',
    login_card_foot: 'Сессия сохраняется на устройстве.',

    // Upload Page
    upload_title: 'Публикация видео',
    upload_guard_title: 'Загрузка видео',
    upload_guard_desc: 'Войдите, чтобы опубликовать свое первое короткое видео.',
    upload_go_login: 'Войти',
    upload_drop_title: 'Перетащите видео сюда или нажмите для выбора',
    upload_drop_hint: 'Форматы mp4 / webm, размер файла до 200 МБ',
    upload_file_invalid: 'Пожалуйста, выберите видеофайл (mp4 / webm)',
    upload_file_too_large: 'Файл слишком большой (максимум 200 МБ)',
    upload_caption_label: 'Описание видео',
    upload_caption_placeholder: 'Добавьте описание, используйте #теги для продвижения',
    upload_meta_duration: 'Длительность',
    upload_meta_resolution: 'Разрешение',
    upload_meta_size: 'Размер',
    upload_meta_filename: 'Файл',
    upload_read_failed: 'Не удалось прочитать видео',

    // User / Profile Page
    user_tab_works: 'Видео',
    user_tab_likes: 'Понравившиеся',
    user_stat_likes: 'Лайков',
    user_stat_following: 'Подписки',
    user_stat_followers: 'Подписчики',
    user_edit_profile: 'Редактировать',
    user_no_works: 'Пока нет видео',
    user_no_likes: 'Пока нет понравившихся видео',
    user_no_followers: 'Пока нет подписчиков',
    user_no_following: 'Пока нет подписок',
    user_edit_name: 'Имя',
    user_edit_bio: 'О себе',
    user_edit_bio_placeholder: 'Расскажите о себе...',
    user_edit_color: 'Цвет аватара',
    user_message_btn: 'Сообщение',
    user_not_found: 'Пользователь не найден',

    // Messages Page
    msg_title: 'Сообщения',
    msg_conv_loading: 'Загрузка диалогов...',
    msg_conv_empty: 'Пока нет диалогов',
    msg_conv_empty_hint: 'Нажмите «Сообщение» в профиле автора, чтобы начать чат',
    msg_select_chat: 'Выберите диалог для общения',
    msg_chat_with: 'Чат с',
    msg_no_messages: 'Пока нет сообщений',
    msg_say_hi: 'Отправьте первое сообщение!',
    msg_input_placeholder: 'Напишите сообщение...',
    msg_load_failed: 'Не удалось загрузить сообщения',
    msg_last_empty: 'Пока нет сообщений',

    // Search Page
    search_results_title: 'Результаты по запросу «{query}»',
    search_results_count: '{count} результатов',
    search_section_users: 'Пользователи',
    search_section_videos: 'Видео',
    search_empty_input: 'Введите поисковый запрос',
    search_empty_input_hint: 'Поиск по нику, имени или описанию видео',
    search_no_videos: 'Подходящих видео не найдено',
    search_load_more: 'Загрузить еще',
    search_loading: 'Поиск...',

    // Video Page
    vp_title: 'Просмотр видео',
    vp_not_found: 'Видео не найдено',
    vp_back: 'Назад',
    vp_loading: 'Открываем видео...',

    // States
    state_loading: 'Загрузка...',
    state_reload: 'Повторить',
    page_not_found: 'Страница не найдена',
    page_not_found_hint: 'Вы можете вернуться на главную страницу',

    // Time & Count
    time_just_now: 'Только что',
    time_mins_ago: '{n} мин назад',
    time_hours_ago: '{n} ч назад',
    time_days_ago: '{n} дн назад',
    count_k: ' тыс.',
    count_m: ' млн',

    // System & Errors
    err_bad_json: 'Сервер вернул недействительный ответ',
    err_network: 'Сетевая ошибка, проверьте подключение к интернету',
    err_request_failed: 'Ошибка запроса ({status})',
    err_upload_parse: 'Не удалось обработать ответ загрузки',
    err_upload_network: 'Сбой сети, ошибка загрузки',
    err_video_unreadable: 'Не удалось прочитать видеофайл (используйте MP4 или WebM)',
    err_load_failed: 'Ошибка загрузки',
    video_play_pause: 'Воспроизведение или пауза',
  }
};

const STORAGE_KEY = 'dy:lang';

function getInitialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'tr' || saved === 'ru') return saved;
    // Check navigator language
    if (typeof navigator !== 'undefined') {
      const nav = navigator.language?.toLowerCase() || '';
      if (nav.startsWith('ru')) return 'ru';
    }
  } catch {
    /* fallback to default */
  }
  return 'tr';
}

const initialLang = getInitialLang();
if (typeof document !== 'undefined') {
  document.documentElement.lang = initialLang;
  document.title = initialLang === 'ru' ? 'FastVideo · Короткие видео' : 'FastVideo · Kısa Video';
}

const store = createStore<{ lang: Lang }>({ lang: initialLang });

export function getLang(): Lang {
  return store.get().lang;
}

export function setLang(lang: Lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* storage disabled */
  }
  store.set({ lang });
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang;
    document.title = lang === 'ru' ? 'FastVideo · Короткие видео' : 'FastVideo · Kısa Video';
  }
}

export function t(key: TranslationKey, params?: Record<string, string | number>): string {
  const currentLang = store.get().lang;
  const dict = translations[currentLang] || translations.tr;
  let text: string = dict[key] || translations.tr[key] || key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return text;
}

export function useI18n() {
  const state = useStore(store, (s) => s);
  return {
    lang: state.lang,
    setLang,
    t: (key: TranslationKey, params?: Record<string, string | number>) => {
      const dict = translations[state.lang] || translations.tr;
      let text: string = dict[key] || translations.tr[key] || key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        }
      }
      return text;
    }
  };
}
