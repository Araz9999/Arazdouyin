import { WebSocketServer, WebSocket } from 'ws';

// Real-time In-memory Store for Live Broadcasting, PK Battles, Gifts, and Commerce
class LiveRoomManager {
  constructor() {
    this.rooms = new Map();
    this.clients = new Map(); // roomId -> Set of WebSocket clients
    this.wss = new WebSocketServer({ noServer: true });
    this.initDefaultRooms();
    this.setupWebSocketServer();
    this.startGlobalTick();
  }

  initDefaultRooms() {
    const defaultRooms = [
      {
        id: 'live-pk-arena',
        title: '🔥 BÖYÜK PK DÖYÜŞÜ: Murad Music vs Baku Beatmaker! 100K Donat Hədəfi',
        streamer: {
          id: 'user-murad',
          name: 'Murad_Music',
          avatar_color: '#fe2c55',
          verified: true,
          bio: 'Canlı ifa, gitara və Rus/Qafqaz hitləri',
          followers: '142.5K'
        },
        type: 'individual',
        category: 'Musiqi & PK',
        partner: null,
        status: 'live',
        viewers: 8420,
        likes: 42100,
        revenue_rub: 89400,
        diamonds: 178800,
        video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        co_host: {
          id: 'user-elvin',
          name: 'BakuBeatmaker',
          avatar_color: '#25f4ee',
          verified: true,
          score: 14200,
          tag: 'Mavi Komanda'
        },
        pk: {
          active: true,
          round_seconds_left: 174,
          team_a_score: 18650,
          team_b_score: 14200,
          penalty: 'Məğlub olan canlı yayımda bədahətən rep oxuyacaq və 20 jim edəcək!',
          mvp_a: { name: 'Araz_VIP', avatar_color: '#ffb400', gift: '🏎️ Superkar' },
          mvp_b: { name: 'Dmitry_99', avatar_color: '#8a5cff', gift: '👑 Tac' }
        },
        poll: {
          id: 'poll-1',
          question: 'Bu PK raundunda kim qalib gələcək?',
          options: [
            { id: 'opt-a', text: 'Murad Music (Qırmızı)', votes: 1240 },
            { id: 'opt-b', text: 'Baku Beatmaker (Mavi)', votes: 980 }
          ],
          total_votes: 2220,
          ended: false
        },
        lucky_draw: {
          id: 'ld-1',
          title: '🎁 500 FastCoin Uduşlu Sandıq',
          prize: '500 FastCoin + "Qızıl İzləyici" statusu',
          countdown_sec: 140,
          participants_count: 384,
          status: 'active',
          winners: []
        },
        featured_products: [
          {
            id: 'oz-1',
            title: 'Studio Kondensator Mikrofonu (RGB & Pop-filtr)',
            store: 'Ozon',
            store_logo: 'ozon',
            price: '3,290 ₽',
            original_price: '5,990 ₽',
            discount: '-45%',
            flash_sale: true,
            flash_seconds_left: 600,
            stock_left: 18,
            image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=300&q=80',
            is_pinned: true
          },
          {
            id: 'wb-1',
            title: 'Pro Monitor Qulaqlıqları (Hi-Res Audio)',
            store: 'Wildberries',
            store_logo: 'wildberries',
            price: '4,490 ₽',
            original_price: '7,500 ₽',
            discount: '-40%',
            flash_sale: true,
            flash_seconds_left: 900,
            stock_left: 9,
            image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=300&q=80',
            is_pinned: false
          }
        ],
        chat_messages: [
          { id: 'c-1', user: 'Alina_Spb', avatar_color: '#fe2c55', text: 'Murad möhtəşəm ifadır! Qırmızı komandaya dəstək! 🌹🌹', badge: 'VIP 5', is_donate: false, timestamp: Date.now() - 30000 },
          { id: 'c-2', user: 'Ruslan_Baku', avatar_color: '#ffb400', text: 'VK Донаты: 500 ₽ Murad üçün! Növbəti mahnı Gecələr olsun!', badge: 'VK Donat', is_donate: true, donate_amount: '500 ₽', donate_service: 'VK Donat', timestamp: Date.now() - 25000 },
          { id: 'c-3', user: 'Max_Gamer', avatar_color: '#25f4ee', text: 'BakuBeatmaker geri dönür, mavi komandaya raket göndərin 🚀!', badge: 'Top Fan', is_donate: false, timestamp: Date.now() - 15000 }
        ],
        gifts_feed: [
          { id: 'g-1', from: 'Araz_VIP', gift_name: 'Superkar', gift_icon: '🏎️', amount_rub: 1000, diamonds: 2000, timestamp: Date.now() - 40000 },
          { id: 'g-2', from: 'Ruslan_Baku', gift_name: 'VK Donat Superchat', gift_icon: '💬', amount_rub: 500, diamonds: 1000, timestamp: Date.now() - 25000 }
        ],
        angles: null,
        replay: null
      },
      {
        id: 'live-brand-ozon',
        title: '🛍️ Ozon & Wildberries Canlı Showroom: Geyim, Elektronika və Flaş Endirimlər!',
        streamer: {
          id: 'brand-ozon-wb',
          name: 'Ozon_Fashion_Official',
          avatar_color: '#005bff',
          verified: true,
          bio: 'Rəsmi Ozon & Wildberries brend yayım otağı. Eksklüziv canlı efir promokodları!',
          followers: '512.0K'
        },
        type: 'brand',
        category: 'Alış-veriş & Dəb',
        partner: 'ozon',
        status: 'live',
        viewers: 14200,
        likes: 98500,
        revenue_rub: 245000,
        diamonds: 490000,
        video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
        co_host: null,
        pk: null,
        poll: {
          id: 'poll-2',
          question: 'Növbəti hansı məhsula 60% flaş endirim açılsın?',
          options: [
            { id: 'opt-hoodie', text: 'Oversize Pambıq Hoodie', votes: 2450 },
            { id: 'opt-sneakers', text: 'Retro İdman Ayaqqabısı', votes: 3120 }
          ],
          total_votes: 5570,
          ended: false
        },
        lucky_draw: {
          id: 'ld-2',
          title: '🏷️ Wildberries 2,000 ₽ Alış-veriş Kuponu',
          prize: '2,000 ₽ dəyərində sərbəst Ozon/WB promokodu',
          countdown_sec: 180,
          participants_count: 890,
          status: 'active',
          winners: []
        },
        featured_products: [
          {
            id: 'wb-brand-1',
            title: 'Oversize Qalın Premium Pambıq Hoodie (Unisex)',
            store: 'Wildberries',
            store_logo: 'wildberries',
            price: '1,890 ₽',
            original_price: '4,200 ₽',
            discount: '-55%',
            flash_sale: true,
            flash_seconds_left: 450,
            stock_left: 24,
            image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=300&q=80',
            is_pinned: true
          },
          {
            id: 'oz-brand-2',
            title: 'Simsiz Səs-Küy Ləğvedici Qulaqlıq Pro ANC',
            store: 'Ozon',
            store_logo: 'ozon',
            price: '2,990 ₽',
            original_price: '6,400 ₽',
            discount: '-53%',
            flash_sale: true,
            flash_seconds_left: 720,
            stock_left: 12,
            image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=300&q=80',
            is_pinned: false
          },
          {
            id: 'oz-brand-3',
            title: 'Termo Paslanmayan Polad Smart Su Qabı 750ml',
            store: 'Ozon',
            store_logo: 'ozon',
            price: '890 ₽',
            original_price: '1,790 ₽',
            discount: '-50%',
            flash_sale: false,
            flash_seconds_left: 0,
            stock_left: 45,
            image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=300&q=80',
            is_pinned: false
          }
        ],
        chat_messages: [
          { id: 'c-b1', user: 'Ksenia_Style', avatar_color: '#ff2d55', text: 'Hoodie ölçüləri necədir? Oversize uyğundurmu?', badge: 'Alıcı', is_donate: false, timestamp: Date.now() - 45000 },
          { id: 'c-b2', user: 'Ozon_Moderator', avatar_color: '#005bff', text: 'Bəli, tam Avropa oversize kəsimidir! Flaş endirim bitmədən sifariş edin!', badge: 'Moderator', is_donate: false, timestamp: Date.now() - 30000 },
          { id: 'c-b3', user: 'Dmitry_K', avatar_color: '#28cd41', text: 'Sifariş verdim! 1 kliklə çox rahat ödənildi 👍', badge: 'Təsdiqlənmiş Alıcı', is_donate: false, timestamp: Date.now() - 15000 }
        ],
        gifts_feed: [
          { id: 'gb-1', from: 'Ksenia_Style', gift_name: 'Qəhvə', gift_icon: '☕', amount_rub: 50, diamonds: 100, timestamp: Date.now() - 35000 }
        ],
        angles: null,
        replay: null
      },
      {
        id: 'live-vk-play-esports',
        title: '🏆 VK Play Cup 2026: Böyük Qrand Final - CS2 & Dota 2 Çempionatı!',
        streamer: {
          id: 'official-vkplay',
          name: 'VK_Play_Esports',
          avatar_color: '#0077ff',
          verified: true,
          bio: 'VK Play rəsmi kibersport turnirlər şəbəkəsi. Canlı yayım və mükafat fondu!',
          followers: '980.0K'
        },
        type: 'official',
        category: 'Kibersport & Tədbir',
        partner: 'vk_play',
        status: 'live',
        viewers: 34500,
        likes: 184000,
        revenue_rub: 430000,
        diamonds: 860000,
        video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        co_host: null,
        pk: null,
        poll: {
          id: 'poll-esports',
          question: 'VK Play Cup Kubokunu hansı komanda qazanacaq?',
          options: [
            { id: 'opt-team1', text: 'Team Spirit / Aurora', votes: 8940 },
            { id: 'opt-team2', text: 'Virtus.pro / BetBoom', votes: 7650 }
          ],
          total_votes: 16590,
          ended: false
        },
        lucky_draw: {
          id: 'ld-esports',
          title: '🎮 VK Play 1000 Saat Bulud Qeyminq Abunəliyi',
          prize: 'VK Play Cloud VIP illik abunəlik və oyun dəsti',
          countdown_sec: 110,
          participants_count: 2450,
          status: 'active',
          winners: []
        },
        featured_products: [
          {
            id: 'vk-mouse',
            title: 'RGB Simsiz Qeyminq Siçanı 26000 DPI (Ultra-yüngül)',
            store: 'Ozon',
            store_logo: 'ozon',
            price: '3,890 ₽',
            original_price: '6,900 ₽',
            discount: '-44%',
            flash_sale: true,
            flash_seconds_left: 540,
            stock_left: 15,
            image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=300&q=80',
            is_pinned: true
          }
        ],
        chat_messages: [
          { id: 'c-e1', user: 'CyberSasha', avatar_color: '#af52de', text: 'Raund inanılmaz keçdi! VK Play serverləri əla işləyir!', badge: 'VK Fan', is_donate: false, timestamp: Date.now() - 40000 },
          { id: 'c-e2', user: 'Vlad_Gamer', avatar_color: '#ff9500', text: 'Рутуб Donat: 2,500 ₽ Komandanı dəstəkləyirəm! Qələbə bizimdir!', badge: 'Рутуб Donat', is_donate: true, donate_amount: '2,500 ₽', donate_service: 'Рутуб Donat', timestamp: Date.now() - 20000 }
        ],
        gifts_feed: [
          { id: 'ge-1', from: 'Vlad_Gamer', gift_name: 'Qızıl Əjdaha', gift_icon: '🐉', amount_rub: 5000, diamonds: 10000, timestamp: Date.now() - 20000 }
        ],
        angles: [
          { id: 'main', name: 'Əsas Yayım (Kast & Səhnə)', active: true },
          { id: 'game', name: 'Oyunçu Kamerası (Player Cam)', active: false },
          { id: 'tactical', name: 'Taktiki Xəritə (Radar)', active: false }
        ],
        replay: null
      },
      {
        id: 'live-vtuber-alisa',
        title: '🤖 CyberAlisa AI: 24/7 Virtual Yayımçı və Rəqəmsal İnsan Şousu!',
        streamer: {
          id: 'vtuber-alisa',
          name: 'CyberAlisa_AI',
          avatar_color: '#ff2d55',
          verified: true,
          bio: 'Növbəti nəsil AI Virtual Avatar & VTuber. Sual verin, real vaxtda cavab alın və musiqi sifariş edin!',
          followers: '320.0K'
        },
        type: 'vtuber',
        category: 'Virtual Yayımçı & AI',
        partner: null,
        status: 'live',
        viewers: 9150,
        likes: 67000,
        revenue_rub: 112000,
        diamonds: 224000,
        video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        co_host: null,
        pk: null,
        poll: {
          id: 'poll-vtuber',
          question: 'CyberAlisa növbəti hansı dildə mahnı ifa etsin?',
          options: [
            { id: 'opt-az', text: 'Azərbaycan dili (Sarı Gəlin Remix)', votes: 1890 },
            { id: 'opt-ru', text: 'Rus dili (Cyber Retro synthwave)', votes: 1420 }
          ],
          total_votes: 3310,
          ended: false
        },
        lucky_draw: {
          id: 'ld-vtuber',
          title: '✨ CyberAlisa VIP Rəqəmsal Nişanı',
          prize: 'Avatarla fərdi video mesaj və 300 FastCoin',
          countdown_sec: 155,
          participants_count: 512,
          status: 'active',
          winners: []
        },
        featured_products: [
          {
            id: 'vt-badge',
            title: 'CyberAlisa Hologramlı Merç Dəsti & Stikerlər',
            store: 'Wildberries',
            store_logo: 'wildberries',
            price: '990 ₽',
            original_price: '1,800 ₽',
            discount: '-45%',
            flash_sale: true,
            flash_seconds_left: 600,
            stock_left: 30,
            image: 'https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&w=300&q=80',
            is_pinned: true
          }
        ],
        chat_messages: [
          { id: 'c-v1', user: 'Neo_Baku', avatar_color: '#34c759', text: 'Alisa mimikaları çox təbiidir! Əsl rəqəmsal insan kimidir!', badge: 'AI Fan', is_donate: false, timestamp: Date.now() - 25000 },
          { id: 'c-v2', user: 'Polina_Art', avatar_color: '#af52de', text: 'VK Донаты: 300 ₽ Alisa, zəhmət olmasa bizə salam göndər!', badge: 'VK Donat', is_donate: true, donate_amount: '300 ₽', donate_service: 'VK Donat', timestamp: Date.now() - 10000 }
        ],
        gifts_feed: [
          { id: 'gv-1', from: 'Polina_Art', gift_name: 'Tac', gift_icon: '👑', amount_rub: 500, diamonds: 1000, timestamp: Date.now() - 10000 }
        ],
        angles: null,
        replay: null
      },
      {
        id: 'live-replay-fest',
        title: '📼 [YAYIM TƏKRARI] Rutube Fest Live 2026: Rok Konserti və Seçilmiş Anlar',
        streamer: {
          id: 'fest-rutube',
          name: 'Rutube_Live_Official',
          avatar_color: '#ff3b30',
          verified: true,
          bio: 'Рутуб festival və konsertlərinin rəsmi seçilmiş video arxivi',
          followers: '760.0K'
        },
        type: 'official',
        category: 'Konsert & Tədbir',
        partner: 'rutube',
        status: 'replay',
        viewers: 5600,
        likes: 124000,
        revenue_rub: 380000,
        diamonds: 760000,
        video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4',
        co_host: null,
        pk: null,
        poll: null,
        lucky_draw: null,
        featured_products: [
          {
            id: 'fest-tshirt',
            title: 'Rutube Fest 2026 Xatirə Festival Köynəyi (L/XL)',
            store: 'Ozon',
            store_logo: 'ozon',
            price: '1,290 ₽',
            original_price: '2,500 ₽',
            discount: '-48%',
            flash_sale: false,
            flash_seconds_left: 0,
            stock_left: 28,
            image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=300&q=80',
            is_pinned: true
          }
        ],
        chat_messages: [
          { id: 'c-r1', user: 'Music_Fan99', avatar_color: '#ff9500', text: 'Təkrarı izləmək əladır! Xüsusilə solo hissəsi möhtəşəm idi.', badge: 'İzləyici', is_donate: false, timestamp: Date.now() - 60000 }
        ],
        gifts_feed: [],
        angles: null,
        replay: {
          duration: '01:15:20',
          highlights: [
            { time: '02:15', label: 'Festivalın Açılışı & İşıq Şousu' },
            { time: '14:40', label: 'Gitara Solo & Fan Səsləri' },
            { time: '28:10', label: 'Ozon Festival Flaş Endirimi' },
            { time: '45:30', label: 'Böyük Səhnə Dueti' },
            { time: '01:02:15', label: 'Qapanış Fişəngləri' }
          ]
        }
      }
    ];

    for (const r of defaultRooms) {
      this.rooms.set(r.id, r);
      this.clients.set(r.id, new Set());
    }
  }

  setupWebSocketServer() {
    this.wss.on('connection', (ws, req) => {
      let currentRoomId = null;
      try {
        const url = new URL(req.url, 'http://localhost');
        currentRoomId = url.searchParams.get('roomId') || 'live-pk-arena';
      } catch {
        currentRoomId = 'live-pk-arena';
      }

      this.joinRoom(currentRoomId, ws);

      // Send initial state snapshot
      const room = this.rooms.get(currentRoomId);
      if (room) {
        ws.send(JSON.stringify({
          type: 'init',
          room: this.sanitizeRoom(room)
        }));
      }

      ws.on('message', (raw) => {
        try {
          const payload = JSON.parse(raw.toString());
          this.handleClientMessage(currentRoomId, payload, ws);
        } catch (e) {
          console.warn('[ws] failed to parse client payload:', e?.message);
        }
      });

      ws.on('close', () => {
        this.leaveRoom(currentRoomId, ws);
      });

      ws.on('error', () => {
        this.leaveRoom(currentRoomId, ws);
      });
    });
  }

  joinRoom(roomId, ws) {
    if (!this.clients.has(roomId)) {
      this.clients.set(roomId, new Set());
    }
    this.clients.get(roomId).add(ws);
    const room = this.rooms.get(roomId);
    if (room && room.status === 'live') {
      room.viewers += 1;
      this.broadcast(roomId, { type: 'viewer_count', viewers: room.viewers });
    }
  }

  leaveRoom(roomId, ws) {
    const set = this.clients.get(roomId);
    if (set) {
      set.delete(ws);
      const room = this.rooms.get(roomId);
      if (room && room.status === 'live' && room.viewers > 10) {
        room.viewers -= 1;
        this.broadcast(roomId, { type: 'viewer_count', viewers: room.viewers });
      }
    }
  }

  handleClientMessage(roomId, msg, ws) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    switch (msg.type) {
      case 'comment': {
        this.addComment(roomId, {
          user: msg.user || 'Qonaq İzləyici',
          avatar_color: msg.avatar_color || '#fe2c55',
          text: msg.text || '',
          badge: msg.badge || 'İzləyici',
          is_donate: false
        });
        break;
      }
      case 'gift': {
        this.sendGift(roomId, {
          from: msg.from || 'İzləyici',
          gift_name: msg.gift_name,
          gift_icon: msg.gift_icon,
          amount_rub: Number(msg.amount_rub || 10),
          diamonds: Number(msg.diamonds || 20),
          target_team: msg.target_team || 'team_a', // for PK
          donate_service: msg.donate_service,
          custom_message: msg.custom_message
        });
        break;
      }
      case 'pk_boost': {
        this.boostPk(roomId, msg.team, Number(msg.points || 50));
        break;
      }
      case 'poll_vote': {
        this.votePoll(roomId, msg.optionId);
        break;
      }
      case 'luckydraw_join': {
        this.joinLuckyDraw(roomId, msg.userName || 'İzləyici');
        break;
      }
      case 'buy_product': {
        this.buyProduct(roomId, msg.productId, msg.userName);
        break;
      }
      default:
        break;
    }
  }

  broadcast(roomId, payload) {
    const set = this.clients.get(roomId);
    if (!set || set.size === 0) return;
    const json = JSON.stringify(payload);
    for (const ws of set) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(json);
      }
    }
  }

  addComment(roomId, { user, avatar_color, text, badge, is_donate, donate_amount, donate_service }) {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    const comment = {
      id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      user,
      avatar_color: avatar_color || '#fe2c55',
      text,
      badge: badge || 'İzləyici',
      is_donate: Boolean(is_donate),
      donate_amount: donate_amount || null,
      donate_service: donate_service || null,
      timestamp: Date.now()
    };
    room.chat_messages.push(comment);
    if (room.chat_messages.length > 80) room.chat_messages.shift();
    this.broadcast(roomId, { type: 'chat', comment });
    return comment;
  }

  sendGift(roomId, { from, gift_name, gift_icon, amount_rub, diamonds, target_team, donate_service, custom_message }) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    // Update room earnings
    room.revenue_rub += amount_rub;
    room.diamonds += diamonds;

    // If PK battle active, boost team points
    if (room.pk && room.pk.active) {
      if (target_team === 'team_b') {
        room.pk.team_b_score += diamonds;
        room.pk.mvp_b = { name: from, avatar_color: '#25f4ee', gift: `${gift_icon} ${gift_name}` };
      } else {
        room.pk.team_a_score += diamonds;
        room.pk.mvp_a = { name: from, avatar_color: '#fe2c55', gift: `${gift_icon} ${gift_name}` };
      }
      this.broadcast(roomId, { type: 'pk_update', pk: room.pk });
    }

    const giftEvent = {
      id: `g-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      from,
      gift_name,
      gift_icon,
      amount_rub,
      diamonds,
      target_team,
      timestamp: Date.now()
    };
    room.gifts_feed.push(giftEvent);
    if (room.gifts_feed.length > 50) room.gifts_feed.shift();

    // Also add to chat as special message or donate superchat
    if (donate_service || custom_message) {
      this.addComment(roomId, {
        user: from,
        avatar_color: '#ffb400',
        text: custom_message ? `${donate_service || 'Donat'}: ${amount_rub} ₽ — "${custom_message}"` : `${gift_icon} ${gift_name} (${amount_rub} ₽) göndərdi!`,
        badge: donate_service || 'Superchat',
        is_donate: true,
        donate_amount: `${amount_rub} ₽`,
        donate_service
      });
    }

    this.broadcast(roomId, {
      type: 'gift',
      gift: giftEvent,
      revenue_rub: room.revenue_rub,
      diamonds: room.diamonds
    });

    return giftEvent;
  }

  boostPk(roomId, team, points) {
    const room = this.rooms.get(roomId);
    if (!room || !room.pk || !room.pk.active) return;
    if (team === 'team_b') {
      room.pk.team_b_score += points;
    } else {
      room.pk.team_a_score += points;
    }
    room.likes += points * 2;
    this.broadcast(roomId, { type: 'pk_update', pk: room.pk, likes: room.likes });
  }

  votePoll(roomId, optionId) {
    const room = this.rooms.get(roomId);
    if (!room || !room.poll || room.poll.ended) return null;
    const opt = room.poll.options.find((o) => o.id === optionId);
    if (opt) {
      opt.votes += 1;
      room.poll.total_votes += 1;
      this.broadcast(roomId, { type: 'poll_update', poll: room.poll });
    }
    return room.poll;
  }

  joinLuckyDraw(roomId, userName) {
    const room = this.rooms.get(roomId);
    if (!room || !room.lucky_draw || room.lucky_draw.status !== 'active') return null;
    room.lucky_draw.participants_count += 1;
    this.broadcast(roomId, { type: 'luckydraw_update', lucky_draw: room.lucky_draw });
    return room.lucky_draw;
  }

  buyProduct(roomId, productId, userName = 'İzləyici') {
    const room = this.rooms.get(roomId);
    if (!room || !room.featured_products) return null;
    const prd = room.featured_products.find((p) => p.id === productId);
    if (prd && prd.stock_left > 0) {
      prd.stock_left -= 1;
      this.addComment(roomId, {
        user: userName,
        avatar_color: '#34c759',
        text: `🔥 "${prd.title.slice(0, 30)}..." məhsulunu sifariş etdi!`,
        badge: `${prd.store} Alıcı`,
        is_donate: false
      });
      this.broadcast(roomId, {
        type: 'product_sold',
        productId,
        stock_left: prd.stock_left,
        buyer: userName
      });
      return prd;
    }
    return null;
  }

  startGlobalTick() {
    // Background tick to manage countdowns, organic engagement & natural viewer counts
    setInterval(() => {
      for (const [roomId, room] of this.rooms.entries()) {
        if (room.status !== 'live') continue;

        // PK countdown
        if (room.pk && room.pk.active) {
          if (room.pk.round_seconds_left > 0) {
            room.pk.round_seconds_left -= 1;
            // Occasional organic points
            if (Math.random() < 0.3) {
              const delta = Math.floor(Math.random() * 25) + 5;
              if (Math.random() < 0.5) room.pk.team_a_score += delta;
              else room.pk.team_b_score += delta;
            }
          } else {
            // Round ended, reset or declare winner
            room.pk.round_seconds_left = 180;
            const winner = room.pk.team_a_score >= room.pk.team_b_score ? room.streamer.name : room.co_host.name;
            this.addComment(roomId, {
              user: 'PK Hakimi',
              avatar_color: '#ff3b30',
              text: `🏁 PK DÖYÜŞÜ BİTDİ! Qalib: ${winner}! Məğlub tərəf cəzanı icra edir: ${room.pk.penalty}`,
              badge: 'HAKİM',
              is_donate: false
            });
          }
          this.broadcast(roomId, { type: 'pk_update', pk: room.pk });
        }

        // Lucky draw countdown
        if (room.lucky_draw && room.lucky_draw.status === 'active') {
          if (room.lucky_draw.countdown_sec > 0) {
            room.lucky_draw.countdown_sec -= 1;
          } else {
            // Announce winner
            const sampleWinners = ['Araz_VIP', 'Ksenia_Style', 'Murad_Fan', 'Leyla_Baku', 'Dmitry_Spb'];
            const winner = sampleWinners[Math.floor(Math.random() * sampleWinners.length)];
            room.lucky_draw.winners = [winner];
            room.lucky_draw.status = 'awarded';
            room.lucky_draw.countdown_sec = 180; // restart cycle
            this.addComment(roomId, {
              user: 'FastVideo Sandıq',
              avatar_color: '#ffb400',
              text: `🎉 Uduşlu Sandıq açıldı! Qalib: @${winner}! Təbriklər! Mükafat: ${room.lucky_draw.prize}`,
              badge: 'MÜKAFAT',
              is_donate: false
            });
            setTimeout(() => {
              if (room.lucky_draw) {
                room.lucky_draw.status = 'active';
                room.lucky_draw.participants_count = Math.floor(Math.random() * 80) + 20;
              }
            }, 8000);
          }
          this.broadcast(roomId, { type: 'luckydraw_update', lucky_draw: room.lucky_draw });
        }

        // Flash sale countdowns
        if (room.featured_products) {
          for (const prd of room.featured_products) {
            if (prd.flash_sale && prd.flash_seconds_left > 0) {
              prd.flash_seconds_left -= 1;
            }
          }
        }
      }
    }, 1000);
  }

  sanitizeRoom(room) {
    return {
      ...room
    };
  }

  getRoomsList(filter = 'all') {
    const list = Array.from(this.rooms.values());
    if (filter === 'pk') return list.filter((r) => r.pk && r.pk.active);
    if (filter === 'brand') return list.filter((r) => r.type === 'brand');
    if (filter === 'official') return list.filter((r) => r.type === 'official');
    if (filter === 'vtuber') return list.filter((r) => r.type === 'vtuber');
    if (filter === 'replay') return list.filter((r) => r.status === 'replay');
    if (filter === 'events') return list.filter((r) => r.partner === 'vk_play' || r.partner === 'rutube');
    if (filter === 'ecommerce') return list.filter((r) => r.featured_products && r.featured_products.length > 0);
    return list;
  }

  getRoom(id) {
    return this.rooms.get(id) || null;
  }
}

export const liveManager = new LiveRoomManager();
