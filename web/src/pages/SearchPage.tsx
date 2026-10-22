import { useEffect, useRef, useState } from 'react';
import type { RouteProps } from '../router/router';
import { navigate } from '../router/router';
import { searchApi } from '../api/endpoints';
import type {
  AiAssistResponse,
  ChallengeItem,
  DiscoverResponse,
  LiveStreamItem,
  MusicItem,
  PlaceItem,
  ProductItem,
  SearchCategory,
  User,
  Video
} from '../api/types';
import { Avatar } from '../components/Avatar';
import { ThumbGrid } from '../components/ThumbGrid';
import { EmptyState, ErrorState, Loading } from '../components/States';
import {
  FireIcon,
  PlayIcon,
  PauseIcon,
  SearchIcon,
  VerifiedIcon,
  WandIcon
} from './../components/icons';
import { formatCount } from '../utils/format';
import { toggleFollow, useIsFollowing } from '../store/feed';
import { requireAuth } from '../store/auth';
import { toast } from '../store/ui';
import { useI18n, type TranslationKey } from '../store/i18n';

function UserCell({ user }: { user: User }) {
  const { t } = useI18n();
  const following = useIsFollowing(user.id);
  return (
    <div className="user-cell">
      <Avatar user={user} size={44} onClick={() => navigate(`/user/${user.id}`)} />
      <div className="user-cell-main">
        <button className="user-cell-name" onClick={() => navigate(`/user/${user.id}`)}>
          {user.display_name || user.username}
          {user.verified ? <VerifiedIcon size={14} /> : null}
        </button>
        <p className="user-cell-sub">
          @{user.username} · {formatCount(user.follower_count)} {t('user_stat_followers')}
        </p>
      </div>
      <button
        className={`btn pill small ${following ? 'ghost' : 'accent'}`}
        onClick={() => requireAuth(() => toggleFollow(user.id))}
      >
        {following ? t('action_following') : `+ ${t('action_follow')}`}
      </button>
    </div>
  );
}

function ProductCard({ product }: { product: ProductItem }) {
  const { t } = useI18n();
  return (
    <div className="search-product-card">
      <div className="product-card-img-wrap">
        <img src={product.image} alt={product.title} loading="lazy" />
        <span className="product-card-disc">{product.discount}</span>
      </div>
      <div className="product-card-body">
        <span className="product-card-tag">{product.tag}</span>
        <h4 className="product-card-title">{product.title}</h4>
        <div className="product-card-price-row">
          <strong className="product-price">{product.price}</strong>
          <del className="product-orig-price">{product.original_price}</del>
        </div>
        <div className="product-card-foot">
          <span className="product-sales">{product.sales}</span>
          <button
            className="btn accent pill small product-buy-btn"
            onClick={() => toast(`${product.title} (${product.price}) ${t('shopping_cart_btn')}!`, 'ok')}
          >
            {t('shopping_cart_btn')}
          </button>
        </div>
      </div>
    </div>
  );
}

function LiveCard({ live }: { live: LiveStreamItem }) {
  const { t } = useI18n();
  return (
    <div className="search-live-card">
      <div className="live-card-badge">
        <span className="live-pulse-dot" />
        <span>{live.tag}</span>
      </div>
      <div className="live-card-overlay">
        <h4 className="live-card-title">{live.title}</h4>
        <div className="live-card-streamer">
          <span className="live-avatar" style={{ backgroundColor: live.avatar_color }}>
            {live.streamer[0]}
          </span>
          <span className="live-name">@{live.streamer}</span>
          <span className="live-viewers">👥 {live.viewers} {t('live_viewers_suffix')}</span>
        </div>
      </div>
      <button
        className="live-card-action"
        onClick={() => toast(`${live.title} canlı yayımına qoşulursunuz...`, 'ok')}
      >
        Yayımı İzlə
      </button>
    </div>
  );
}

function PlaceCard({ place, onSearch }: { place: PlaceItem; onSearch: (query: string) => void }) {
  const { t } = useI18n();
  return (
    <div className="search-place-card">
      <div className="place-img-wrap">
        <img src={place.photo} alt={place.name} loading="lazy" />
        <span className="place-dist">{place.distance}</span>
      </div>
      <div className="place-info">
        <div className="place-head">
          <span className="place-cat">{place.category}</span>
          <span className="place-rating">★ {place.rating}</span>
        </div>
        <h4 className="place-title">{place.name}</h4>
        <p className="place-desc">{place.description}</p>
        <div className="place-foot">
          <span className="place-checkins">📍 {place.checkins} {t('place_checkins_suffix')}</span>
          <button className="btn ghost pill small" onClick={() => onSearch(place.name)}>
            Videoları Gör
          </button>
        </div>
      </div>
    </div>
  );
}

function MusicRow({ music, isPlaying, onTogglePlay, onSearch }: { music: MusicItem; isPlaying: boolean; onTogglePlay: () => void; onSearch: (q: string) => void }) {
  const { t } = useI18n();
  return (
    <div className="search-music-row">
      <div className="music-cover-wrap" onClick={onTogglePlay}>
        <img src={music.cover} alt={music.title} loading="lazy" />
        <button className="music-play-btn" aria-label="Play/Pause">
          {isPlaying ? <PauseIcon size={14} /> : <PlayIcon size={14} />}
        </button>
      </div>
      <div className="music-details">
        <strong className="music-title">{music.title}</strong>
        <span className="music-artist">{music.artist} · {music.duration}</span>
        <span className="music-uses">🎵 {music.uses} {t('music_uses_suffix')}</span>
      </div>
      <button className="btn ghost pill small" onClick={() => onSearch(music.title)}>
        İstifadə Et
      </button>
    </div>
  );
}

const CATEGORIES: { id: SearchCategory; labelKey: TranslationKey; icon: string }[] = [
  { id: 'all', labelKey: 'search_cat_all', icon: '🔍' },
  { id: 'videos', labelKey: 'search_cat_videos', icon: '🎬' },
  { id: 'users', labelKey: 'search_cat_users', icon: '👤' },
  { id: 'products', labelKey: 'search_cat_products', icon: '🛍️' },
  { id: 'live', labelKey: 'search_cat_live', icon: '🔴' },
  { id: 'places', labelKey: 'search_cat_places', icon: '📍' },
  { id: 'music', labelKey: 'search_cat_music', icon: '🎵' },
  { id: 'ai', labelKey: 'search_cat_ai', icon: '🤖' }
];

export default function SearchPage({ route, params }: RouteProps) {
  const { t } = useI18n();
  const qParam = route.query.get('q') ?? '';
  const catParam = (route.query.get('cat') as SearchCategory) || 'all';
  const challengeTag = route.query.get('challenge') ?? params?.challenge ?? '';

  const [inputVal, setInputVal] = useState(qParam);
  const [activeCat, setActiveCat] = useState<SearchCategory>(catParam);
  const [discoverData, setDiscoverData] = useState<DiscoverResponse | null>(null);
  const [activeLifestyleTab, setActiveLifestyleTab] = useState<'recipes' | 'places' | 'reviews' | 'fashion'>('recipes');
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);

  // Search Results
  const [videos, setVideos] = useState<Video[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [liveStreams, setLiveStreams] = useState<LiveStreamItem[]>([]);
  const [places, setPlaces] = useState<PlaceItem[]>([]);
  const [musicList, setMusicList] = useState<MusicItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Challenge Detail
  const [activeChallenge, setActiveChallenge] = useState<ChallengeItem | null>(null);
  const [challengeVideos, setChallengeVideos] = useState<Video[]>([]);

  // AI Assistant State
  const [aiQuery, setAiQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<AiAssistResponse | null>(null);
  const [playingMusicId, setPlayingMusicId] = useState<string | null>(null);

  const moreCtrl = useRef<AbortController | null>(null);

  // Load Discover Data (Hot searches, lifestyle guides, challenges)
  useEffect(() => {
    const ctrl = new AbortController();
    searchApi.discover(ctrl.signal)
      .then((data) => setDiscoverData(data))
      .catch(() => undefined);
    return () => ctrl.abort();
  }, []);

  // Sync Input when URL query changes
  useEffect(() => {
    setInputVal(qParam);
  }, [qParam]);

  // Load Challenge details if challenge param present
  useEffect(() => {
    if (!challengeTag) {
      setActiveChallenge(null);
      setChallengeVideos([]);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    searchApi.challenge(challengeTag, ctrl.signal)
      .then((res) => {
        setActiveChallenge(res.challenge);
        setChallengeVideos(res.videos);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : t('op_failed'));
        setLoading(false);
      });
    return () => ctrl.abort();
  }, [challengeTag, t]);

  // Execute Search when query or category changes
  useEffect(() => {
    if (challengeTag) return;
    moreCtrl.current?.abort();

    if (!qParam.trim()) {
      setVideos([]);
      setUsers([]);
      setProducts([]);
      setLiveStreams([]);
      setPlaces([]);
      setMusicList([]);
      setCursor(null);
      return;
    }

    if (activeCat === 'ai') {
      // Trigger AI Assist automatically for the query
      setAiLoading(true);
      searchApi.aiAssist(qParam)
        .then((res) => {
          setAiResponse(res);
          setAiLoading(false);
        })
        .catch(() => setAiLoading(false));
      return;
    }

    const ctrl = new AbortController();
    moreCtrl.current = ctrl;
    setLoading(true);
    setError(null);

    searchApi.searchMulti(qParam, activeCat, null, 20, ctrl.signal)
      .then((res) => {
        if (ctrl.signal.aborted) return;
        setVideos(res.videos);
        setUsers(res.users);
        setProducts(res.products);
        setLiveStreams(res.liveStreams);
        setPlaces(res.places);
        setMusicList(res.music);
        setCursor(res.nextCursor);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (ctrl.signal.aborted || (err instanceof DOMException && err.name === 'AbortError')) return;
        setError(err instanceof Error ? err.message : t('op_failed'));
        setLoading(false);
      });

    return () => ctrl.abort();
  }, [qParam, activeCat, challengeTag, t]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = inputVal.trim();
    if (clean) {
      navigate(`/search?q=${encodeURIComponent(clean)}&cat=${activeCat}`);
    } else {
      navigate('/search');
    }
  };

  const handleLaunchSearch = (term: string, cat: SearchCategory = 'all') => {
    setInputVal(term);
    setActiveCat(cat);
    navigate(`/search?q=${encodeURIComponent(term)}&cat=${cat}`);
  };

  const handleAskAi = (promptText?: string) => {
    const q = promptText || aiQuery || inputVal || 'San Sebastian Cheesecake resepti';
    setAiLoading(true);
    searchApi.aiAssist(q)
      .then((res) => {
        setAiResponse(res);
        setAiLoading(false);
      })
      .catch(() => {
        setAiLoading(false);
        toast('AI cavab verə bilmədi, bir az sonra yenidən cəhd edin', 'error');
      });
  };

  const handleJoinChallenge = (tag: string) => {
    requireAuth(() => {
      navigate(`/upload?caption=${encodeURIComponent(`#${tag} `)}`);
    });
  };

  const hasSearchQuery = Boolean(qParam.trim());

  return (
    <div className="search-page-v2">
      {/* Top Search Input Header */}
      <div className="search-v2-header">
        <form className="search-v2-input-wrap" onSubmit={handleSearchSubmit}>
          <SearchIcon className="search-v2-icon" size={20} />
          <input
            type="search"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder={t('search_placeholder')}
            className="search-v2-input"
            autoFocus={!hasSearchQuery && !challengeTag}
          />
          {inputVal ? (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => {
                setInputVal('');
                navigate('/search');
              }}
            >
              ✕
            </button>
          ) : null}
          <button type="submit" className="btn accent pill small search-submit-btn">
            {t('search_label')}
          </button>
        </form>

        {/* Categories Bar */}
        <nav className="search-cat-bar" aria-label="Search Categories">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`search-cat-pill${activeCat === cat.id ? ' active' : ''}`}
              onClick={() => {
                setActiveCat(cat.id);
                if (hasSearchQuery) {
                  navigate(`/search?q=${encodeURIComponent(qParam)}&cat=${cat.id}`);
                }
              }}
            >
              <span className="cat-icon">{cat.icon}</span>
              <span>{t(cat.labelKey)}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* VIEW A: Challenge Detail Page */}
      {challengeTag && activeChallenge ? (
        <div className="challenge-detail-view">
          <div className="challenge-hero-card">
            <div className="challenge-banner-wrap">
              <img src={activeChallenge.banner} alt={activeChallenge.title} />
              <div className="challenge-banner-scrim" />
              <div className="challenge-hero-info">
                <span className="challenge-tag-badge">#{activeChallenge.tag}</span>
                <h1 className="challenge-title">{activeChallenge.title}</h1>
                <p className="challenge-desc">{activeChallenge.description}</p>
                <div className="challenge-stats-row">
                  <span>👀 <strong>{activeChallenge.views}</strong> {t('challenge_views_label')}</span>
                  <span>👥 <strong>{activeChallenge.participants}</strong> {t('challenge_participants_label')}</span>
                  <span>🏆 <strong>{activeChallenge.reward}</strong></span>
                </div>
              </div>
            </div>
            <div className="challenge-action-bar">
              <button
                className="btn ghost pill"
                onClick={() => navigate('/search')}
              >
                {t('search_back_to_discover')}
              </button>
              <button
                className="btn accent pill"
                onClick={() => handleJoinChallenge(activeChallenge.tag)}
              >
                <WandIcon size={16} />
                <span>{t('challenge_join_btn')}</span>
              </button>
            </div>
          </div>

          <section className="section challenge-videos-section">
            <h2 className="section-title">Çağırış Videoları ({challengeVideos.length})</h2>
            {challengeVideos.length > 0 ? (
              <ThumbGrid items={challengeVideos} />
            ) : (
              <EmptyState
                text="Bu çağırış üzrə ilk videonu sən çək!"
                action={
                  <button className="btn accent pill" onClick={() => handleJoinChallenge(activeChallenge.tag)}>
                    {t('challenge_join_btn')}
                  </button>
                }
              />
            )}
          </section>
        </div>
      ) : activeCat === 'ai' ? (
        /* VIEW B: AI Assistant Mode */
        <div className="ai-assistant-container">
          <div className="ai-assistant-header">
            <div className="ai-branding-lead">
              <span className="ai-logo-pill">Giga / YandexGPT AI</span>
              <h2>{t('ai_assist_title')}</h2>
              <p>{t('ai_assist_subtitle')}</p>
            </div>
          </div>

          {/* Quick Prompts Bar */}
          <div className="ai-quick-prompts">
            <span className="quick-label">⚡ {t('ai_assist_suggested')}:</span>
            <div className="quick-chips">
              {[
                'San Sebastian Cheesecake resepti',
                'Bakıda gənclər üçün ən yaxşı kafelər',
                'Tələbə üçün 5 büdcəli həyat hiyləsi',
                'Viral video necə çəkilir?'
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  className="ai-suggestion-chip"
                  onClick={() => {
                    setAiQuery(suggestion);
                    handleAskAi(suggestion);
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Response Area */}
          <div className="ai-chat-thread">
            {aiLoading ? (
              <div className="ai-bubble ai-loading-bubble">
                <WandIcon size={20} className="spinning" />
                <span>{t('ai_thinking')}</span>
              </div>
            ) : aiResponse ? (
              <div className="ai-bubble ai-response-bubble">
                <div className="ai-response-head">
                  <span className="ai-badge-sm">🤖 FastVideo AI</span>
                  <span className="ai-query-tag">"{aiResponse.query}"</span>
                </div>
                <div className="ai-markdown-content">
                  {aiResponse.answer.split('\n\n').map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))}
                </div>

                {/* Related Hashtags */}
                {aiResponse.related_tags && aiResponse.related_tags.length > 0 && (
                  <div className="ai-tags-row">
                    <span>Əlaqəli Mövzular:</span>
                    {aiResponse.related_tags.map((tag) => (
                      <button
                        key={tag}
                        className="ai-tag-pill"
                        onClick={() => handleLaunchSearch(`#${tag}`, 'videos')}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                )}

                {/* Follow up suggestions */}
                {aiResponse.suggestions && aiResponse.suggestions.length > 0 && (
                  <div className="ai-followup-box">
                    <span className="followup-title">Daha ətraflı soruş:</span>
                    <div className="followup-buttons">
                      {aiResponse.suggestions.map((s) => (
                        <button
                          key={s}
                          className="followup-btn"
                          onClick={() => {
                            setAiQuery(s);
                            handleAskAi(s);
                          }}
                        >
                          → {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="ai-welcome-box">
                <WandIcon size={36} />
                <h3>Süni intellektdən istənilən məlumatı soruşun</h3>
                <p>Reseptlər, gəzinti məkanları, texnoloji cihaz rəyləri və həyat hiylələri haqqında ani və dəqiq cavablar alın.</p>
              </div>
            )}
          </div>

          {/* AI Input Form */}
          <form
            className="ai-input-bar"
            onSubmit={(e) => {
              e.preventDefault();
              handleAskAi();
            }}
          >
            <input
              type="text"
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              placeholder={t('ai_assist_placeholder')}
              className="ai-chat-input"
            />
            <button type="submit" className="btn accent pill" disabled={aiLoading || !aiQuery.trim()}>
              {t('ai_assist_send')}
            </button>
          </form>
        </div>
      ) : !hasSearchQuery ? (
        /* VIEW C: Discovery Hub (Hot Searches Board, Challenges, Lifestyle Guides) */
        <div className="discovery-hub-container">
          {/* 1. Hot Searches Board (Trendlər Lövhəsi) */}
          <section className="discover-section hot-board-section">
            <div className="section-head-row">
              <div className="section-title-wrap">
                <FireIcon size={20} className="flame-icon" />
                <h2 className="section-heading">{t('discover_hot_board_title')}</h2>
              </div>
              <span className="live-updated-tag">🔥 Canlı Yenilənir</span>
            </div>

            <div className="hot-board-grid">
              {(discoverData?.hot_searches ?? []).map((item) => (
                <button
                  key={item.rank}
                  className="hot-board-item"
                  onClick={() => handleLaunchSearch(item.query, 'all')}
                >
                  <span className={`hot-rank rank-${item.rank}`}>{item.rank}</span>
                  <div className="hot-item-content">
                    <span className="hot-item-query">{item.query}</span>
                    <div className="hot-item-meta">
                      <span className="hot-score">🔥 {item.hotScore}</span>
                      <span className={`hot-badge badge-${item.tag.toLowerCase()}`}>
                        {item.tag === 'HOT' ? t('discover_hot_badge') : item.tag === 'NEW' ? t('discover_new_badge') : t('discover_rising_badge')}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* 2. Topic & Challenges (Mövzu və Çağırışlar) */}
          <section className="discover-section challenges-section">
            <div className="section-head-row">
              <h2 className="section-heading">{t('discover_challenges_title')}</h2>
            </div>
            <div className="challenges-scroll-row">
              {(discoverData?.challenges ?? []).map((ch) => (
                <div key={ch.tag} className="challenge-card">
                  <div className="challenge-card-banner">
                    <img src={ch.banner} alt={ch.title} loading="lazy" />
                    <span className="challenge-card-tag">#{ch.tag}</span>
                  </div>
                  <div className="challenge-card-body">
                    <h3 className="challenge-card-title">{ch.title}</h3>
                    <p className="challenge-card-desc">{ch.description}</p>
                    <div className="challenge-card-meta">
                      <span>👥 {ch.participants} {t('challenge_participants_label')}</span>
                      <span>👀 {ch.views}</span>
                    </div>
                    <div className="challenge-card-actions">
                      <button
                        className="btn ghost pill small"
                        onClick={() => navigate(`/search?challenge=${encodeURIComponent(ch.tag)}`)}
                      >
                        Bax
                      </button>
                      <button
                        className="btn accent pill small"
                        onClick={() => handleJoinChallenge(ch.tag)}
                      >
                        {t('challenge_join_btn')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 3. Youth Lifestyle Search Engine (Gənclər üçün Həyat Tərzi Kəşfi) */}
          <section className="discover-section lifestyle-section">
            <div className="section-head-row">
              <div className="section-title-wrap">
                <span className="lifestyle-sparkle">✨</span>
                <div>
                  <h2 className="section-heading">{t('discover_lifestyle_title')}</h2>
                  <p className="section-subheading">{t('discover_lifestyle_subtitle')}</p>
                </div>
              </div>
            </div>

            <div className="lifestyle-tabs-bar">
              <button
                className={`lifestyle-tab-btn${activeLifestyleTab === 'recipes' ? ' active' : ''}`}
                onClick={() => setActiveLifestyleTab('recipes')}
              >
                🍳 {t('discover_tab_recipes')}
              </button>
              <button
                className={`lifestyle-tab-btn${activeLifestyleTab === 'places' ? ' active' : ''}`}
                onClick={() => setActiveLifestyleTab('places')}
              >
                📍 {t('discover_tab_places')}
              </button>
              <button
                className={`lifestyle-tab-btn${activeLifestyleTab === 'reviews' ? ' active' : ''}`}
                onClick={() => setActiveLifestyleTab('reviews')}
              >
                ⭐ {t('discover_tab_reviews')}
              </button>
              <button
                className={`lifestyle-tab-btn${activeLifestyleTab === 'fashion' ? ' active' : ''}`}
                onClick={() => setActiveLifestyleTab('fashion')}
              >
                👗 {t('discover_tab_fashion')}
              </button>
            </div>

            {/* Recipes Tab */}
            {activeLifestyleTab === 'recipes' && (
              <div className="lifestyle-grid">
                {(discoverData?.lifestyle_guides.recipes ?? []).map((rec) => (
                  <div key={rec.id} className="lifestyle-recipe-card">
                    <div className="recipe-img-wrap">
                      <img src={rec.image} alt={rec.title} loading="lazy" />
                      <span className="recipe-time">⏱ {rec.time}</span>
                    </div>
                    <div className="recipe-content">
                      <div className="recipe-tags">
                        <span className="recipe-diff">{rec.difficulty}</span>
                        <span className="recipe-rating">★ {rec.rating}</span>
                      </div>
                      <h3 className="recipe-title">{rec.title}</h3>
                      <p className="recipe-desc">{rec.description}</p>

                      {/* Expandable Recipe Steps */}
                      {expandedRecipeId === rec.id ? (
                        <div className="recipe-expanded-steps">
                          <strong>{t('recipe_ingredients')}:</strong>
                          <ul>
                            {rec.ingredients.map((ing, i) => (
                              <li key={i}>{ing}</li>
                            ))}
                          </ul>
                          <strong>{t('recipe_steps')}:</strong>
                          <ol>
                            {rec.steps.map((step, i) => (
                              <li key={i}>{step}</li>
                            ))}
                          </ol>
                        </div>
                      ) : null}

                      <div className="recipe-actions">
                        <button
                          className="btn ghost pill small"
                          onClick={() => setExpandedRecipeId((prev) => (prev === rec.id ? null : rec.id))}
                        >
                          {expandedRecipeId === rec.id ? 'Bağla' : 'Reseptə Bax'}
                        </button>
                        <button
                          className="btn accent pill small"
                          onClick={() => handleLaunchSearch(rec.query, 'videos')}
                        >
                          Videoları Gör
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Places Tab */}
            {activeLifestyleTab === 'places' && (
              <div className="lifestyle-grid">
                {(discoverData?.lifestyle_guides.places ?? []).map((plc) => (
                  <div key={plc.id} className="lifestyle-place-card">
                    <div className="place-img-wrap">
                      <img src={plc.image} alt={plc.title} loading="lazy" />
                      <span className="place-vibe">{plc.vibe}</span>
                    </div>
                    <div className="place-body">
                      <div className="place-cat-row">
                        <span>{plc.category}</span>
                        <span>★ {plc.rating}</span>
                      </div>
                      <h3 className="place-title">{plc.title}</h3>
                      <p className="place-address">📍 {plc.address}</p>
                      <p className="place-desc">{plc.description}</p>
                      <div className="place-action-row">
                        <span className="place-checkin-count">👥 {plc.checkins} {t('place_checkins_suffix')}</span>
                        <button
                          className="btn accent pill small"
                          onClick={() => handleLaunchSearch(plc.query, 'videos')}
                        >
                          Kəşf Et
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Reviews Tab */}
            {activeLifestyleTab === 'reviews' && (
              <div className="lifestyle-grid">
                {(discoverData?.lifestyle_guides.reviews ?? []).map((rev) => (
                  <div key={rev.id} className="lifestyle-review-card">
                    <div className="review-top-row">
                      <span className="review-cat">{rev.category}</span>
                      <span className="review-score">Score: {rev.score}</span>
                    </div>
                    <h3 className="review-title">{rev.title}</h3>
                    <p className="review-summary">{rev.summary}</p>
                    <div className="review-foot">
                      <span className="review-author">Müəllif: @{rev.author}</span>
                      <button
                        className="btn ghost pill small"
                        onClick={() => handleLaunchSearch(rev.query, 'videos')}
                      >
                        İcmala Bax
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Fashion Tab */}
            {activeLifestyleTab === 'fashion' && (
              <div className="lifestyle-grid">
                {(discoverData?.lifestyle_guides.fashion ?? []).map((fsh) => (
                  <div key={fsh.id} className="lifestyle-fashion-card">
                    <span className="fashion-style">{fsh.style}</span>
                    <h3 className="fashion-title">{fsh.title}</h3>
                    <p className="fashion-desc">{fsh.description}</p>
                    <div className="fashion-tags-wrap">
                      {fsh.tags.map((tg) => (
                        <span key={tg} className="fashion-tag">#{tg}</span>
                      ))}
                    </div>
                    <button
                      className="btn accent pill small"
                      onClick={() => handleLaunchSearch(fsh.query, 'videos')}
                    >
                      Kombinləri Gör
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : (
        /* VIEW D: Active Multi-Category Search Results */
        <div className="search-results-container">
          <div className="search-results-summary">
            <h2>{t('search_results_title', { query: qParam })}</h2>
            <span className="summary-count">
              {t('search_results_count', { count: formatCount(videos.length + users.length + products.length + liveStreams.length + places.length + musicList.length) })}
            </span>
          </div>

          {loading && !videos.length && !users.length ? (
            <Loading label={t('search_loading')} />
          ) : error && !videos.length ? (
            <ErrorState text={error} />
          ) : (
            <>
              {/* Users Match */}
              {(activeCat === 'all' || activeCat === 'users') && users.length > 0 ? (
                <section className="search-section">
                  <h3 className="search-section-heading">{t('search_section_users')} ({users.length})</h3>
                  <div className="search-users-list">
                    {users.map((u) => (
                      <UserCell key={u.id} user={u} />
                    ))}
                  </div>
                </section>
              ) : null}

              {/* Products Match */}
              {(activeCat === 'all' || activeCat === 'products') && products.length > 0 ? (
                <section className="search-section">
                  <h3 className="search-section-heading">{t('search_section_products')} ({products.length})</h3>
                  <div className="search-products-grid">
                    {products.map((p) => (
                      <ProductCard key={p.id} product={p} />
                    ))}
                  </div>
                </section>
              ) : null}

              {/* Live Streams Match */}
              {(activeCat === 'all' || activeCat === 'live') && liveStreams.length > 0 ? (
                <section className="search-section">
                  <h3 className="search-section-heading">{t('search_section_live')} ({liveStreams.length})</h3>
                  <div className="search-live-grid">
                    {liveStreams.map((l) => (
                      <LiveCard key={l.id} live={l} />
                    ))}
                  </div>
                </section>
              ) : null}

              {/* Places Match */}
              {(activeCat === 'all' || activeCat === 'places') && places.length > 0 ? (
                <section className="search-section">
                  <h3 className="search-section-heading">{t('search_section_places')} ({places.length})</h3>
                  <div className="search-places-grid">
                    {places.map((pl) => (
                      <PlaceCard key={pl.id} place={pl} onSearch={(query) => handleLaunchSearch(query, 'videos')} />
                    ))}
                  </div>
                </section>
              ) : null}

              {/* Music Tracks Match */}
              {(activeCat === 'all' || activeCat === 'music') && musicList.length > 0 ? (
                <section className="search-section">
                  <h3 className="search-section-heading">{t('search_section_music')} ({musicList.length})</h3>
                  <div className="search-music-list">
                    {musicList.map((m) => (
                      <MusicRow
                        key={m.id}
                        music={m}
                        isPlaying={playingMusicId === m.id}
                        onTogglePlay={() => setPlayingMusicId((prev) => (prev === m.id ? null : m.id))}
                        onSearch={(query) => handleLaunchSearch(query, 'videos')}
                      />
                    ))}
                  </div>
                </section>
              ) : null}

              {/* Videos Match */}
              {(activeCat === 'all' || activeCat === 'videos') ? (
                <section className="search-section">
                  <h3 className="search-section-heading">{t('search_section_videos')} ({videos.length})</h3>
                  {videos.length > 0 ? (
                    <ThumbGrid items={videos} />
                  ) : (
                    <EmptyState text={t('search_no_videos')} />
                  )}
                </section>
              ) : null}

              {/* Load More Button */}
              {cursor ? (
                <button
                  className="btn ghost block"
                  onClick={() => {
                    if (!cursor || loading) return;
                    setLoading(true);
                    searchApi.searchMulti(qParam, activeCat, cursor, 20)
                      .then((res) => {
                        setVideos((v) => [...v, ...res.videos]);
                        setCursor(res.nextCursor);
                      })
                      .finally(() => setLoading(false));
                  }}
                  disabled={loading}
                >
                  {loading ? t('state_loading') : t('search_load_more')}
                </button>
              ) : null}
            </>
          )}
        </div>
      )}
    </div>
  );
}
