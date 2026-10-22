import React, { useEffect, useRef, useState } from 'react';
import type { RouteProps } from '../router/router';
import { navigate } from '../router/router';
import { liveApi } from '../api/endpoints';
import type { LiveGiftEvent, LiveProduct, LiveRoom } from '../api/types';
import { useI18n } from '../store/i18n';
import { requireAuth, useSelf } from '../store/auth';
import { toast } from '../store/ui';
import {
  FireIcon,
  LiveIcon,
  PlayIcon,
  PauseIcon,
  ShoppingBagIcon,
  VerifiedIcon,
  VolumeIcon
} from '../components/icons';

const GIFT_CATALOG = [
  { id: 'rose', name: 'Gül / Роза', icon: '🌹', rub: 10, diamonds: 20 },
  { id: 'coffee', name: 'Qəhvə / Кофе', icon: '☕', rub: 50, diamonds: 100 },
  { id: 'rocket', name: 'Raket / Ракета', icon: '🚀', rub: 250, diamonds: 500 },
  { id: 'crown', name: 'Tac / Корона', icon: '👑', rub: 500, diamonds: 1000 },
  { id: 'supercar', name: 'Superkar / Спорткар', icon: '🏎️', rub: 1000, diamonds: 2000 },
  { id: 'dragon', name: 'Qızıl Əjdaha / Золотой Дракон', icon: '🐉', rub: 5000, diamonds: 10000 }
];

export default function LivePage({ params }: RouteProps) {
  const { t } = useI18n();
  const user = useSelf();
  const roomIdParam = params.roomId;

  const [activeFilter, setActiveFilter] = useState<'all' | 'pk' | 'brand' | 'official' | 'vtuber' | 'events' | 'replay'>('all');
  const [rooms, setRooms] = useState<LiveRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRoom, setActiveRoom] = useState<LiveRoom | null>(null);

  // Video and audio controls
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [activeAngle, setActiveAngle] = useState('main');

  // Interactive panels
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [giftTab, setGiftTab] = useState<'gifts' | 'donat'>('gifts');
  const [selectedGiftId, setSelectedGiftId] = useState('rocket');
  const [donateService, setDonateService] = useState<'VK Donat' | 'Рутуб Donat'>('VK Donat');
  const [donateAmount, setDonateAmount] = useState('500');
  const [donateMessage, setDonateMessage] = useState('');
  const [pkTargetTeam, setPkTargetTeam] = useState<'team_a' | 'team_b'>('team_a');

  // E-Commerce drawer
  const [showProductDrawer, setShowProductDrawer] = useState(false);

  // Lucky draw modal
  const [showLuckyDrawModal, setShowLuckyDrawModal] = useState(false);
  const [hasJoinedDraw, setHasJoinedDraw] = useState(false);

  // Chat message input
  const [chatInput, setChatInput] = useState('');
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Live animated gift banner
  const [activeGiftBanner, setActiveGiftBanner] = useState<LiveGiftEvent | null>(null);

  // Simulated user diamond balance
  const [userDiamonds, setUserDiamonds] = useState(5400);

  // Follow state
  const [isFollowingStreamer, setIsFollowingStreamer] = useState(false);

  // WebSocket connection reference
  const wsRef = useRef<WebSocket | null>(null);

  // Load Rooms list
  useEffect(() => {
    let unmounted = false;
    liveApi
      .rooms(activeFilter)
      .then((data) => {
        if (!unmounted) {
          setRooms(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!unmounted) setLoading(false);
      });
    return () => {
      unmounted = true;
    };
  }, [activeFilter]);

  // Load or switch Active Room
  useEffect(() => {
    if (!roomIdParam) {
      setActiveRoom(null);
      return;
    }

    setLoading(true);
    liveApi
      .room(roomIdParam)
      .then((room) => {
        setActiveRoom(room);
        setLoading(false);
      })
      .catch(() => {
        toast('Yayım otağı tapılmadı', 'error');
        setLoading(false);
      });
  }, [roomIdParam]);

  // WebSocket real-time connection for active room
  useEffect(() => {
    if (!activeRoom) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?roomId=${encodeURIComponent(activeRoom.id)}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'init' && payload.room) {
          setActiveRoom(payload.room);
        } else if (payload.type === 'chat' && payload.comment) {
          setActiveRoom((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              chat_messages: [...prev.chat_messages, payload.comment].slice(-80)
            };
          });
        } else if (payload.type === 'gift' && payload.gift) {
          setActiveGiftBanner(payload.gift);
          setTimeout(() => setActiveGiftBanner(null), 4000);
          setActiveRoom((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              revenue_rub: payload.revenue_rub ?? prev.revenue_rub,
              diamonds: payload.diamonds ?? prev.diamonds,
              gifts_feed: [...prev.gifts_feed, payload.gift].slice(-50)
            };
          });
        } else if (payload.type === 'pk_update' && payload.pk) {
          setActiveRoom((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              pk: payload.pk,
              likes: payload.likes ?? prev.likes
            };
          });
        } else if (payload.type === 'poll_update' && payload.poll) {
          setActiveRoom((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              poll: payload.poll
            };
          });
        } else if (payload.type === 'luckydraw_update' && payload.lucky_draw) {
          setActiveRoom((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              lucky_draw: payload.lucky_draw
            };
          });
        } else if (payload.type === 'product_sold') {
          setActiveRoom((prev) => {
            if (!prev) return prev;
            const updated = prev.featured_products.map((p) =>
              p.id === payload.productId ? { ...p, stock_left: payload.stock_left } : p
            );
            return {
              ...prev,
              featured_products: updated
            };
          });
        } else if (payload.type === 'viewer_count' && typeof payload.viewers === 'number') {
          setActiveRoom((prev) => (prev ? { ...prev, viewers: payload.viewers } : prev));
        }
      } catch {
        /* ignore parse error */
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [activeRoom?.id]);

  // Auto scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeRoom?.chat_messages.length]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeRoom) return;

    const senderName = user?.display_name || user?.username || 'İzləyici';
    const text = chatInput.trim();
    setChatInput('');

    // Send via WebSocket if connected, else via REST
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'comment',
          user: senderName,
          text,
          badge: user ? 'VIP' : 'İzləyici'
        })
      );
    } else {
      liveApi.comment(activeRoom.id, {
        user: senderName,
        text,
        badge: user ? 'VIP' : 'İzləyici'
      });
    }
  };

  const handleSendGift = () => {
    if (!activeRoom) return;
    const selected = GIFT_CATALOG.find((g) => g.id === selectedGiftId) || GIFT_CATALOG[0];

    if (userDiamonds < selected.diamonds) {
      toast('Balans kifayət deyil. Zəhmət olmasa balansı artırın.', 'error');
      return;
    }

    setUserDiamonds((prev) => prev - selected.diamonds);
    setShowGiftModal(false);

    const senderName = user?.display_name || user?.username || 'Araz_VIP';

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'gift',
          from: senderName,
          gift_name: selected.name,
          gift_icon: selected.icon,
          amount_rub: selected.rub,
          diamonds: selected.diamonds,
          target_team: pkTargetTeam
        })
      );
    } else {
      liveApi.gift(activeRoom.id, {
        from: senderName,
        gift_name: selected.name,
        gift_icon: selected.icon,
        amount_rub: selected.rub,
        diamonds: selected.diamonds,
        target_team: pkTargetTeam
      });
    }

    toast(`${selected.icon} ${selected.name} uğurla göndərildi!`, 'ok');
  };

  const handleSendDonat = () => {
    if (!activeRoom) return;
    const amount = Number(donateAmount) || 100;
    const diamondsEquivalent = amount * 2;

    setShowGiftModal(false);
    const senderName = user?.display_name || user?.username || 'Araz_VIP';

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'gift',
          from: senderName,
          gift_name: `${donateService} Superchat`,
          gift_icon: '💬',
          amount_rub: amount,
          diamonds: diamondsEquivalent,
          target_team: pkTargetTeam,
          donate_service: donateService,
          custom_message: donateMessage
        })
      );
    } else {
      liveApi.gift(activeRoom.id, {
        from: senderName,
        gift_name: `${donateService} Superchat`,
        gift_icon: '💬',
        amount_rub: amount,
        diamonds: diamondsEquivalent,
        target_team: pkTargetTeam,
        donate_service: donateService,
        custom_message: donateMessage
      });
    }

    setDonateMessage('');
    toast(`${donateService} ilə ${amount} ₽ göndərildi! Yayımçı mesajınızı oxuyacaq!`, 'ok');
  };

  const handleBoostPk = (team: 'team_a' | 'team_b') => {
    if (!activeRoom) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'pk_boost',
          team,
          points: 50
        })
      );
    } else {
      liveApi.boostPk(activeRoom.id, team, 50);
    }
  };

  const handleVotePoll = (optionId: string) => {
    if (!activeRoom) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'poll_vote',
          optionId
        })
      );
    } else {
      liveApi.votePoll(activeRoom.id, optionId);
    }
    toast('Səsiniz qeydə alındı!', 'ok');
  };

  const handleJoinLuckyDraw = () => {
    if (!activeRoom || hasJoinedDraw) return;
    setHasJoinedDraw(true);
    const senderName = user?.display_name || user?.username || 'İzləyici';

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'luckydraw_join',
          userName: senderName
        })
      );
    } else {
      liveApi.joinLuckyDraw(activeRoom.id, senderName);
    }
    toast('Təbriklər! Siz Uduşlu Sandıq püşkatmasına qoşuldunuz!', 'ok');
  };

  const handleBuyProduct = (product: LiveProduct) => {
    if (!activeRoom) return;
    requireAuth(() => {
      const senderName = user?.display_name || user?.username || 'İzləyici';
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'buy_product',
            productId: product.id,
            userName: senderName
          })
        );
      } else {
        liveApi.buyProduct(activeRoom.id, product.id, senderName);
      }
      toast(`${product.store}: ${product.title} sifariş edildi!`, 'ok');
    });
  };

  const handleSeekReplay = (timeStr: string) => {
    if (!videoRef.current) return;
    const parts = timeStr.split(':').map(Number);
    let seconds = 0;
    if (parts.length === 3) seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    else if (parts.length === 2) seconds = parts[0] * 60 + parts[1];
    videoRef.current.currentTime = seconds;
    videoRef.current.play();
    toast(`⏱ ${timeStr} anına keçildi!`, 'info');
  };

  return (
    <div className="live-page-layout">
      {/* Top Banner / Breadcrumb when in room */}
      {activeRoom ? (
        <div className="live-room-container">
          {/* Main Video Viewport */}
          <div className="live-viewport-card">
            {/* On-screen animated gift banner fly-in */}
            {activeGiftBanner ? (
              <div className="live-gift-flyin-banner">
                <span className="gift-flyin-icon">{activeGiftBanner.gift_icon}</span>
                <div className="gift-flyin-info">
                  <strong>{activeGiftBanner.from}</strong>
                  <span>{activeGiftBanner.gift_name} hədiyyə etdi! (+{activeGiftBanner.amount_rub} ₽)</span>
                </div>
              </div>
            ) : null}

            {/* Video Player */}
            <div className="live-video-box">
              <video
                ref={videoRef}
                src={activeRoom.video_url}
                autoPlay
                loop
                playsInline
                muted={isMuted}
                className="live-video-element"
              />

              {/* Multi-angle switcher for events */}
              {activeRoom.angles && activeRoom.angles.length > 0 ? (
                <div className="live-angles-bar">
                  <span className="angles-label">{t('live_camera_angles')}:</span>
                  {activeRoom.angles.map((ang) => (
                    <button
                      key={ang.id}
                      className={`angle-btn${activeAngle === ang.id ? ' active' : ''}`}
                      onClick={() => setActiveAngle(ang.id)}
                    >
                      {ang.name}
                    </button>
                  ))}
                </div>
              ) : null}

              {/* Video control pills */}
              <div className="live-overlay-controls">
                <button
                  className="live-ctrl-btn"
                  onClick={() => {
                    if (videoRef.current) {
                      if (isPlaying) videoRef.current.pause();
                      else videoRef.current.play();
                      setIsPlaying(!isPlaying);
                    }
                  }}
                  title="Oynat / Dayandır"
                >
                  {isPlaying ? <PauseIcon size={18} /> : <PlayIcon size={18} />}
                </button>
                <button
                  className="live-ctrl-btn"
                  onClick={() => setIsMuted(!isMuted)}
                  title="Səs"
                >
                  <VolumeIcon size={18} on={!isMuted} />
                </button>
                <button
                  className="live-ctrl-btn back-lobby-btn"
                  onClick={() => navigate('/live')}
                  title="Lobbiyə qayıt"
                >
                  ✕ Çıxış
                </button>
              </div>

              {/* Top Streamer Info Bar */}
              <div className="live-streamer-header">
                <div className="streamer-profile">
                  <div className="streamer-avatar" style={{ backgroundColor: activeRoom.streamer.avatar_color }}>
                    {activeRoom.streamer.name[0]}
                    {activeRoom.status === 'live' && <span className="live-pulse-dot" />}
                  </div>
                  <div className="streamer-meta">
                    <div className="streamer-name-row">
                      <strong>{activeRoom.streamer.name}</strong>
                      {activeRoom.streamer.verified && <VerifiedIcon size={14} />}
                      {activeRoom.partner ? (
                        <span className={`partner-badge ${activeRoom.partner}`}>
                          {activeRoom.partner === 'vk_play'
                            ? 'VK Play'
                            : activeRoom.partner === 'rutube'
                            ? 'Рутуб'
                            : activeRoom.partner.toUpperCase()}
                        </span>
                      ) : null}
                    </div>
                    <span className="streamer-followers">{activeRoom.streamer.followers} izləyici</span>
                  </div>
                  <button
                    className={`btn small pill ${isFollowingStreamer ? 'ghost' : 'accent'}`}
                    onClick={() => {
                      setIsFollowingStreamer(!isFollowingStreamer);
                      toast(isFollowingStreamer ? 'İzləmədən çıxıldı' : 'Yayımçı izlənilir!', 'info');
                    }}
                  >
                    {isFollowingStreamer ? t('live_following_btn') : t('live_follow_btn')}
                  </button>
                </div>

                <div className="live-stats-bar">
                  <div className="live-stat-chip">
                    <span className="chip-label">{t('live_revenue_label')}</span>
                    <strong className="chip-val rub">
                      {activeRoom.revenue_rub.toLocaleString()} ₽
                    </strong>
                  </div>
                  <div className="live-stat-chip">
                    <span className="chip-label">💎 {t('live_diamonds_label')}</span>
                    <strong className="chip-val dia">
                      {activeRoom.diamonds.toLocaleString()}
                    </strong>
                  </div>
                  <div className="live-viewers-badge">
                    <LiveIcon size={14} />
                    <span>{activeRoom.viewers.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* PK BATTLE DUAL-SCREEN PROGRESS & ARENA */}
              {activeRoom.pk && activeRoom.pk.active ? (
                <div className="live-pk-arena-bar">
                  <div className="pk-header-row">
                    <div className="pk-team-label red">
                      <span className="team-flag">🔴 Qırmızı</span>
                      <strong>{activeRoom.streamer.name}</strong>
                      <span className="team-score">{activeRoom.pk.team_a_score.toLocaleString()} xal</span>
                    </div>

                    <div className="pk-timer-badge">
                      <FireIcon size={16} />
                      <span>
                        PK: {Math.floor(activeRoom.pk.round_seconds_left / 60)}:
                        {String(activeRoom.pk.round_seconds_left % 60).padStart(2, '0')}
                      </span>
                    </div>

                    <div className="pk-team-label blue">
                      <span className="team-flag">🔵 Mavi</span>
                      <strong>{activeRoom.co_host?.name || 'Rəqib'}</strong>
                      <span className="team-score">{activeRoom.pk.team_b_score.toLocaleString()} xal</span>
                    </div>
                  </div>

                  {/* Tug-of-War Bar */}
                  <div className="pk-progress-track">
                    {(() => {
                      const total = (activeRoom.pk.team_a_score + activeRoom.pk.team_b_score) || 1;
                      const pctA = Math.max(10, Math.min(90, Math.round((activeRoom.pk.team_a_score / total) * 100)));
                      return (
                        <>
                          <div className="pk-bar red" style={{ width: `${pctA}%` }}>
                            {pctA}%
                          </div>
                          <div className="pk-bar blue" style={{ width: `${100 - pctA}%` }}>
                            {100 - pctA}%
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Penalty & Fast Boost Buttons */}
                  <div className="pk-footer-row">
                    <div className="pk-penalty-text">
                      <strong>⚠️ {t('live_pk_penalty_label')}</strong> {activeRoom.pk.penalty}
                    </div>
                    <div className="pk-boost-actions">
                      <button className="btn pk-boost-btn red" onClick={() => handleBoostPk('team_a')}>
                        🔥 {t('live_pk_boost_red')} (+50)
                      </button>
                      <button className="btn pk-boost-btn blue" onClick={() => handleBoostPk('team_b')}>
                        ⚡ {t('live_pk_boost_blue')} (+50)
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* FLOATING ACTION OVERLAYS (Lucky Draw, Poll, Products) */}
              <div className="live-floating-actions-col">
                {/* Lucky Draw Box */}
                {activeRoom.lucky_draw ? (
                  <button
                    className="lucky-draw-floating-btn"
                    onClick={() => setShowLuckyDrawModal(true)}
                    title={activeRoom.lucky_draw.title}
                  >
                    <span className="draw-box-icon">🎁</span>
                    <span className="draw-timer">
                      {Math.floor(activeRoom.lucky_draw.countdown_sec / 60)}:
                      {String(activeRoom.lucky_draw.countdown_sec % 60).padStart(2, '0')}
                    </span>
                  </button>
                ) : null}

                {/* E-Commerce Shelf Button */}
                {activeRoom.featured_products && activeRoom.featured_products.length > 0 ? (
                  <button
                    className="live-shelf-floating-btn"
                    onClick={() => setShowProductDrawer(true)}
                    title={t('live_shelf_title')}
                  >
                    <ShoppingBagIcon size={20} />
                    <span className="shelf-badge">{activeRoom.featured_products.length}</span>
                  </button>
                ) : null}
              </div>

              {/* Interactive Live Poll Card Overlay */}
              {activeRoom.poll && !activeRoom.poll.ended ? (
                <div className="live-poll-card-overlay">
                  <div className="poll-title-row">
                    <span className="poll-badge">📊 {t('live_poll_title')}</span>
                    <span className="poll-total">{activeRoom.poll.total_votes} səs</span>
                  </div>
                  <p className="poll-question">{activeRoom.poll.question}</p>
                  <div className="poll-options-list">
                    {activeRoom.poll.options.map((opt) => {
                      const total = activeRoom.poll?.total_votes || 1;
                      const pct = Math.round((opt.votes / total) * 100);
                      return (
                        <button
                          key={opt.id}
                          className="poll-option-btn"
                          onClick={() => handleVotePoll(opt.id)}
                        >
                          <div className="poll-fill-bar" style={{ width: `${pct}%` }} />
                          <span className="poll-opt-text">{opt.text}</span>
                          <span className="poll-opt-pct">{pct}% ({opt.votes})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {/* VOD Replay Highlights Bar */}
              {activeRoom.status === 'replay' && activeRoom.replay ? (
                <div className="live-replay-highlights-bar">
                  <div className="replay-badge-tag">
                    <span className="replay-chip">{t('live_replay_badge')}</span>
                    <span>Müddət: {activeRoom.replay.duration}</span>
                  </div>
                  <div className="highlights-chips-scroll">
                    {activeRoom.replay.highlights.map((h, i) => (
                      <button
                        key={i}
                        className="highlight-chip-btn"
                        onClick={() => handleSeekReplay(h.time)}
                      >
                        ⏱ <strong>{h.time}</strong> {h.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Bottom Actions Bar */}
            <div className="live-bottom-action-bar">
              <button
                className="btn accent pill gift-open-btn"
                onClick={() => setShowGiftModal(true)}
              >
                🎁 {t('live_gifts_title')}
              </button>
              <div className="user-balance-pill">
                <span>{t('live_balance_label')}</span>
                <strong>{userDiamonds.toLocaleString()} 💎</strong>
                <button
                  className="topup-link"
                  onClick={() => {
                    setUserDiamonds((prev) => prev + 2000);
                    toast('+2,000 Almaz balansınıza əlavə edildi!', 'ok');
                  }}
                >
                  +{t('live_topup_btn')}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Live Chat & Donations Stream */}
          <div className="live-chat-panel">
            <div className="chat-panel-header">
              <h3>Canlı Söhbət & Donatlar</h3>
              <span className="chat-count">{activeRoom.chat_messages.length} mesaj</span>
            </div>

            <div className="chat-messages-container">
              {activeRoom.chat_messages.map((c) => (
                <div
                  key={c.id}
                  className={`chat-msg-row${c.is_donate ? ' donate-superchat' : ''}`}
                >
                  <span
                    className="msg-avatar-dot"
                    style={{ backgroundColor: c.avatar_color }}
                  >
                    {c.user[0]}
                  </span>
                  <div className="msg-bubble">
                    <div className="msg-header-line">
                      <span className="msg-user">{c.user}</span>
                      {c.badge && (
                        <span className={`msg-badge ${c.is_donate ? 'donate' : ''}`}>
                          {c.badge}
                        </span>
                      )}
                      {c.donate_amount && (
                        <span className="donate-amount-badge">💰 {c.donate_amount}</span>
                      )}
                    </div>
                    <p className="msg-text">{c.text}</p>
                  </div>
                </div>
              ))}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat Input */}
            <form className="chat-input-form" onSubmit={handleSendChat}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={t('live_chat_placeholder')}
                className="live-chat-input"
              />
              <button type="submit" className="btn accent pill small">
                {t('live_chat_send')}
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* LOBBY VIEW: All live broadcasting rooms & channels */
        <div className="live-lobby-container">
          <div className="live-lobby-hero">
            <div className="lobby-hero-title">
              <span className="live-now-badge">
                <span className="pulse-ping" />
                CANLI YAYIM
              </span>
              <h1>{t('live_lobby_title')}</h1>
              <p>{t('live_lobby_subtitle')}</p>
            </div>

            {/* Category / Mode Switcher Tabs */}
            <nav className="live-lobby-tabs" aria-label="Live filter tabs">
              <button
                className={`lobby-tab-btn${activeFilter === 'all' ? ' active' : ''}`}
                onClick={() => setActiveFilter('all')}
              >
                🌐 {t('live_tab_all')}
              </button>
              <button
                className={`lobby-tab-btn${activeFilter === 'pk' ? ' active' : ''}`}
                onClick={() => setActiveFilter('pk')}
              >
                ⚔️ {t('live_tab_pk')}
              </button>
              <button
                className={`lobby-tab-btn${activeFilter === 'brand' ? ' active' : ''}`}
                onClick={() => setActiveFilter('brand')}
              >
                🛍️ {t('live_tab_brand')}
              </button>
              <button
                className={`lobby-tab-btn${activeFilter === 'official' ? ' active' : ''}`}
                onClick={() => setActiveFilter('official')}
              >
                🛡️ {t('live_tab_official')}
              </button>
              <button
                className={`lobby-tab-btn${activeFilter === 'vtuber' ? ' active' : ''}`}
                onClick={() => setActiveFilter('vtuber')}
              >
                🤖 {t('live_tab_vtuber')}
              </button>
              <button
                className={`lobby-tab-btn${activeFilter === 'events' ? ' active' : ''}`}
                onClick={() => setActiveFilter('events')}
              >
                🏆 {t('live_tab_events')}
              </button>
              <button
                className={`lobby-tab-btn${activeFilter === 'replay' ? ' active' : ''}`}
                onClick={() => setActiveFilter('replay')}
              >
                📼 {t('live_tab_replay')}
              </button>
            </nav>
          </div>

          {/* Rooms Grid */}
          {loading ? (
            <div className="loading-state">
              <div className="spinner" />
              <p>Yayımlar yüklənir...</p>
            </div>
          ) : rooms.length === 0 ? (
            <div className="empty-state">
              <p>Bu kateqoriya üzrə hazırda aktiv yayım yoxdur.</p>
            </div>
          ) : (
            <div className="live-rooms-grid">
              {rooms.map((r) => (
                <div
                  key={r.id}
                  className="live-room-card"
                  onClick={() => navigate(`/live/${r.id}`)}
                >
                  <div className="room-thumb-wrap">
                    <video
                      src={r.video_url}
                      muted
                      loop
                      playsInline
                      className="room-thumb-video"
                      onMouseEnter={(e) => e.currentTarget.play().catch(() => undefined)}
                      onMouseLeave={(e) => e.currentTarget.pause()}
                    />
                    <div className="room-thumb-scrim" />

                    {/* Live status badge */}
                    <div className="room-badge-top">
                      <span className={`room-status-badge ${r.status}`}>
                        {r.status === 'live' ? 'CANLI' : 'TƏKRAR'}
                      </span>
                      <span className="room-viewers-badge">
                        👁️ {r.viewers.toLocaleString()}
                      </span>
                    </div>

                    {/* Partner logo */}
                    {r.partner ? (
                      <span className={`partner-watermark ${r.partner}`}>
                        {r.partner === 'vk_play'
                          ? 'VK Play'
                          : r.partner === 'rutube'
                          ? 'Рутуб'
                          : r.partner.toUpperCase()}
                      </span>
                    ) : null}

                    {/* PK Duel Indicator */}
                    {r.pk && r.pk.active ? (
                      <div className="room-pk-indicator">
                        <span>⚔️ PK Döyüşü</span>
                        <div className="pk-avatars-pair">
                          <span className="avatar-dot-a">{r.streamer.name[0]}</span>
                          <span className="vs-tag">VS</span>
                          <span className="avatar-dot-b">{r.co_host?.name[0] || 'B'}</span>
                        </div>
                      </div>
                    ) : null}

                    {/* Shopping Indicator */}
                    {r.featured_products && r.featured_products.length > 0 ? (
                      <div className="room-shopping-indicator">
                        🛍️ {r.featured_products[0].store} Flaş Endirimi
                      </div>
                    ) : null}
                  </div>

                  <div className="room-info-block">
                    <div className="room-streamer-row">
                      <div
                        className="room-streamer-avatar"
                        style={{ backgroundColor: r.streamer.avatar_color }}
                      >
                        {r.streamer.name[0]}
                      </div>
                      <div className="room-text-meta">
                        <h3 className="room-title">{r.title}</h3>
                        <div className="room-author-row">
                          <span className="author-name">{r.streamer.name}</span>
                          {r.streamer.verified && <VerifiedIcon size={12} />}
                          <span className="room-category-pill">{r.category}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: Virtual Gifts & VK/Rutube Donate */}
      {showGiftModal && (
        <div className="modal-backdrop" onClick={() => setShowGiftModal(false)}>
          <div className="modal-content gift-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('live_gifts_title')}</h2>
              <button className="close-btn" onClick={() => setShowGiftModal(false)}>
                ✕
              </button>
            </div>

            <div className="gift-modal-tabs">
              <button
                className={`tab-btn${giftTab === 'gifts' ? ' active' : ''}`}
                onClick={() => setGiftTab('gifts')}
              >
                🎁 {t('live_gifts_tab_regular')}
              </button>
              <button
                className={`tab-btn${giftTab === 'donat' ? ' active' : ''}`}
                onClick={() => setGiftTab('donat')}
              >
                💬 {t('live_gifts_tab_donate')}
              </button>
            </div>

            {giftTab === 'gifts' ? (
              <div className="gift-catalog-tab">
                {activeRoom?.pk && activeRoom.pk.active ? (
                  <div className="pk-team-select-row">
                    <span>Dəstəklədiyiniz komanda:</span>
                    <button
                      className={`team-btn red${pkTargetTeam === 'team_a' ? ' selected' : ''}`}
                      onClick={() => setPkTargetTeam('team_a')}
                    >
                      🔴 Qırmızı ({activeRoom.streamer.name})
                    </button>
                    <button
                      className={`team-btn blue${pkTargetTeam === 'team_b' ? ' selected' : ''}`}
                      onClick={() => setPkTargetTeam('team_b')}
                    >
                      🔵 Mavi ({activeRoom.co_host?.name || 'Rəqib'})
                    </button>
                  </div>
                ) : null}

                <div className="gifts-grid">
                  {GIFT_CATALOG.map((g) => (
                    <button
                      key={g.id}
                      className={`gift-item-card${selectedGiftId === g.id ? ' selected' : ''}`}
                      onClick={() => setSelectedGiftId(g.id)}
                    >
                      <span className="gift-card-icon">{g.icon}</span>
                      <strong className="gift-card-name">{g.name}</strong>
                      <span className="gift-card-rub">{g.rub} ₽</span>
                      <span className="gift-card-dia">💎 {g.diamonds}</span>
                    </button>
                  ))}
                </div>

                <div className="modal-footer-action">
                  <div className="balance-info">
                    <span>{t('live_balance_label')}</span>
                    <strong>{userDiamonds.toLocaleString()} 💎</strong>
                  </div>
                  <button className="btn accent pill" onClick={handleSendGift}>
                    {t('live_gifts_send_btn')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="donate-superchat-tab">
                <div className="service-picker-row">
                  <button
                    className={`service-btn vk${donateService === 'VK Donat' ? ' active' : ''}`}
                    onClick={() => setDonateService('VK Donat')}
                  >
                    VK Донаты
                  </button>
                  <button
                    className={`service-btn rutube${donateService === 'Рутуб Donat' ? ' active' : ''}`}
                    onClick={() => setDonateService('Рутуб Donat')}
                  >
                    Рутуб Donat
                  </button>
                </div>

                <div className="donate-presets-row">
                  {['100', '500', '1000', '2500', '5000'].map((val) => (
                    <button
                      key={val}
                      className={`preset-btn${donateAmount === val ? ' active' : ''}`}
                      onClick={() => setDonateAmount(val)}
                    >
                      {val} ₽
                    </button>
                  ))}
                </div>

                <div className="donate-field">
                  <label>Məbləğ (₽):</label>
                  <input
                    type="number"
                    value={donateAmount}
                    onChange={(e) => setDonateAmount(e.target.value)}
                    placeholder={t('live_donate_input_placeholder')}
                    className="modal-input"
                  />
                </div>

                <div className="donate-field">
                  <label>Yayımçının ekranda oxuyacağı mesaj:</label>
                  <textarea
                    rows={3}
                    value={donateMessage}
                    onChange={(e) => setDonateMessage(e.target.value)}
                    placeholder={t('live_donate_msg_placeholder')}
                    className="modal-textarea"
                  />
                </div>

                <div className="modal-footer-action">
                  <span className="commission-hint">0% komissiya • Birbaşa yayımçı balansına keçir</span>
                  <button className="btn accent pill" onClick={handleSendDonat}>
                    {donateAmount} ₽ Donat Göndər
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: Lucky Draw (Uduşlu Sandıq) */}
      {showLuckyDrawModal && activeRoom?.lucky_draw && (
        <div className="modal-backdrop" onClick={() => setShowLuckyDrawModal(false)}>
          <div className="modal-content lucky-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="lucky-banner-header">
              <span className="lucky-big-icon">🎁</span>
              <h2>{activeRoom.lucky_draw.title}</h2>
              <p className="lucky-prize-desc">{activeRoom.lucky_draw.prize}</p>
            </div>

            <div className="lucky-stats-box">
              <div className="lucky-timer-row">
                <span>Püşkatmanın bitməsinə:</span>
                <strong>
                  {Math.floor(activeRoom.lucky_draw.countdown_sec / 60)} dəq{' '}
                  {activeRoom.lucky_draw.countdown_sec % 60} san
                </strong>
              </div>
              <div className="lucky-participants-row">
                <span>İştirak edən izləyicilər:</span>
                <strong>{activeRoom.lucky_draw.participants_count} nəfər</strong>
              </div>
            </div>

            <div className="modal-footer-action">
              <button
                className={`btn pill w-full ${hasJoinedDraw ? 'ghost' : 'accent'}`}
                onClick={handleJoinLuckyDraw}
                disabled={hasJoinedDraw}
              >
                {hasJoinedDraw ? '✓ İştirakınız qeydə alındı' : t('live_lucky_draw_join')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRAWER: E-Commerce Showcase (Ozon & Wildberries) */}
      {showProductDrawer && activeRoom?.featured_products && (
        <div className="modal-backdrop" onClick={() => setShowProductDrawer(false)}>
          <div className="product-drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3>{t('live_shelf_title')}</h3>
              <button className="close-btn" onClick={() => setShowProductDrawer(false)}>
                ✕
              </button>
            </div>

            <div className="drawer-products-list">
              {activeRoom.featured_products.map((p) => (
                <div key={p.id} className="live-product-card">
                  <div className="prd-img-wrap">
                    <img src={p.image} alt={p.title} />
                    <span className={`prd-store-tag ${p.store.toLowerCase()}`}>
                      {p.store}
                    </span>
                  </div>
                  <div className="prd-details">
                    <h4 className="prd-title">{p.title}</h4>
                    <div className="prd-price-row">
                      <strong className="prd-price">{p.price}</strong>
                      <span className="prd-orig-price">{p.original_price}</span>
                      <span className="prd-discount">{p.discount}</span>
                    </div>

                    {p.flash_sale ? (
                      <div className="prd-flash-bar">
                        <span className="flash-badge">{t('live_flash_sale_badge')}</span>
                        <span className="stock-label">
                          {t('live_stock_left')} {p.stock_left} ədəd
                        </span>
                      </div>
                    ) : null}

                    <button
                      className="btn accent pill small buy-btn"
                      onClick={() => handleBuyProduct(p)}
                      disabled={p.stock_left <= 0}
                    >
                      {p.stock_left <= 0 ? 'Bitdi' : t('live_buy_now')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
