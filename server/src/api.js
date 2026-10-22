import fs from 'node:fs';
import { GoogleGenAI } from '@google/genai';

import { createToken, hashPassword, verifyPassword } from './auth.js';
import { MAX_UPLOAD_BYTES } from './config.js';
import {
  authorVideos, conversations, createUser, deleteComment, ensureThread, feedVideos, getVideo,
  incrementShares, incrementViews, insertComment, insertMessage, insertVideo, listComments, listFollowers,
  listFollowing, listMessages, markThreadRead, mediaOwner, registerMediaObject, search, setFollow,
  setVideoFavorite, setVideoLike, updateUserProfile, userById, userByUsername, userStats,
} from './queries.js';
import { Router } from './router.js';
import { ensureMediaDir, resolveMediaPath, saveUpload, streamFile } from './media.js';
import { perfSnapshot } from './perfmon.js';
import { userFromRow, videoFromRow } from './models.js';
import {
  HOT_SEARCHES, LIFESTYLE_GUIDES, CHALLENGES, PRODUCTS_LIST,
  LIVE_STREAMS, MUSIC_TRACKS, PLACES_LIST
} from './discovery.js';
import { liveManager } from './live.js';
import {
  cursorPos, decodeCursor, encodeCursor, httpError, limitFrom, now, optionalColor, optionalNumber,
  optionalString, pickColor, requireString, syntheticPoster,
} from './util.js';

const USERNAME_RE = /^[a-zA-Z0-9._]{3,20}$/;
const FEED_LIMIT = 12;
const MAX_LIMIT = 50;

function decodeIdParam(raw, kind) {
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) throw httpError(404, 'not_found', `${kind} not found`);
  return value;
}

function readCursor(query) {
  const decoded = decodeCursor(query.get('cursor'));
  if (!decoded) return null;
  const [k, i] = cursorPos(decoded, ['k', 'i']);
  return { k, i };
}

function readSearchCursor(query) {
  const decoded = decodeCursor(query.get('cursor'));
  if (!decoded) return null;
  const out = {};
  for (const key of ['vk', 'vi', 'ui']) {
    if (Number.isInteger(decoded[key])) out[key] = decoded[key];
  }
  if (Number.isInteger(decoded.vdone)) out.vdone = 1;
  if (Number.isInteger(decoded.udone)) out.udone = 1;
  return out;
}

function pageResponse(page) {
  return { items: page.items, next_cursor: page.next_cursor ? encodeCursor(page.next_cursor) : null };
}

function normalizeMediaKey(raw) {
  const text = String(raw || '').trim();
  if (!text) throw httpError(400, 'invalid_request', 'media_key is required');
  let tail = text.split(/[\\/]/).filter(Boolean).pop() || '';
  try {
    tail = decodeURIComponent(tail);
  } catch {
    /* keep the raw segment; resolveMediaPath will reject anything unsafe */
  }
  return { filename: tail, absolute: resolveMediaPath(tail) };
}

// A media_key is only publishable by the account that uploaded it; otherwise any user
// could republish someone else's file as their own work by guessing the name.
function requireOwnedMedia(filename, ownerId) {
  const owner = mediaOwner(filename);
  if (owner === ownerId) return;
  if (owner === undefined) throw httpError(403, 'media_not_uploaded', 'upload the file through PUT /api/upload first');
  throw httpError(403, 'media_not_owned', 'that media belongs to another user');
}

function requireAuth(ctx) {
  if (ctx.viewer) return ctx.viewer;
  // A present-but-unusable Authorization header must not be answered as "anonymous".
  if (ctx.authFailed) throw httpError(401, 'invalid_token', 'token is invalid or expired');
  throw httpError(401, 'unauthorized', 'authentication required');
}

// The upload endpoint lets the client send either URL-encoded JSON or literal JSON.
function parseMetaHeader(raw) {
  if (raw === undefined) return {};
  const value = Array.isArray(raw) ? raw[0] : raw;
  let text = String(value);
  try {
    const decoded = decodeURIComponent(text);
    if (decoded.includes('{')) text = decoded;
  } catch {
    /* not percent-encoded: assume literal JSON */
  }
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw httpError(400, 'invalid_meta', 'X-Meta must be URL-encoded JSON');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw httpError(400, 'invalid_meta', 'X-Meta must be URL-encoded JSON');
  }
  return parsed;
}

let dummyHashCache = null;
function dummyHash() {
  if (!dummyHashCache) dummyHashCache = hashPassword('constant-time-placeholder').hash;
  return dummyHashCache;
}

export function buildRouter() {
  const router = new Router();
  const route = (method, pattern, handler, options = {}) => router.add(method, pattern, handler, options);

  /* ------------------------------------------------------------------- auth -- */

  route('POST', '/api/auth/register', ({ body }) => {
    const username = requireString(body, 'username', { max: 20 }).toLowerCase();
    if (!USERNAME_RE.test(username)) {
      throw httpError(400, 'invalid_username', 'username must be 3-20 characters: letters, digits, dot or underscore');
    }
    const password = body.password;
    if (typeof password !== 'string' || password.length < 6 || password.length > 200) {
      throw httpError(400, 'invalid_password', 'password must be 6-200 characters');
    }
    if (userByUsername(username)) throw httpError(409, 'username_taken', 'that username is already taken');
    const displayName = optionalString(body, 'display_name', { max: 40 }) || username;
    const { salt, hash } = hashPassword(password);
    let id;
    try {
      id = createUser({
        username,
        passwordHash: hash,
        passwordSalt: salt,
        displayName,
        bio: '',
        avatarColor: pickColor(username),
        verified: false,
        createdAt: now(),
      });
    } catch (error) {
      // The read above only short-circuits the common case; two concurrent signups with
      // the same name still reach the UNIQUE index, and that must read as 409, not 500.
      if (!/UNIQUE constraint failed/.test(String(error && error.message))) throw error;
      throw httpError(409, 'username_taken', 'that username is already taken');
    }
    return { token: createToken(id), user: userFromRow(userById(id)) };
  }, { public: true });

  route('POST', '/api/auth/login', ({ body }) => {
    const username = requireString(body, 'username', { max: 40 }).toLowerCase();
    const password = typeof body.password === 'string' ? body.password : '';
    const row = userByUsername(username);
    // Hash a fixed placeholder when the user is missing, so "unknown user" is not
    // measurably faster than "wrong password".
    const ok = verifyPassword(password, row ? row.password_hash : dummyHash());
    if (!row || !ok) throw httpError(401, 'invalid_credentials', 'incorrect username or password');
    return { token: createToken(row.id), user: userFromRow(userById(row.id)) };
  }, { public: true });

  /* ------------------------------------------------------------------ users -- */

  route('GET', '/api/users/me', (ctx) => {
    const id = requireAuth(ctx);
    return { user: userFromRow(userById(id)) };
  });

  route('PATCH', '/api/users/me', (ctx) => {
    const id = requireAuth(ctx);
    const body = ctx.body;
    const patch = {};
    if (body.display_name !== undefined) patch.displayName = requireString(body, 'display_name', { max: 40 });
    if (body.bio !== undefined) patch.bio = optionalString(body, 'bio', { max: 200 }) || '';
    if (body.avatar_color !== undefined) {
      const color = optionalColor(body.avatar_color, 'avatar_color');
      if (color) patch.avatarColor = color;
    }
    return { user: userFromRow(updateUserProfile(id, patch)) };
  });

  route('GET', '/api/users/:id', ({ params }) => {
    const id = decodeIdParam(params.id, 'user');
    const row = userById(id);
    if (!row) throw httpError(404, 'not_found', 'user not found');
    return { user: userFromRow(row), stats: userStats(id) };
  });

  route('GET', '/api/users/:id/videos', ({ params, query, viewer }) => {
    const id = decodeIdParam(params.id, 'user');
    const limit = limitFrom(query.get('limit'), 24, MAX_LIMIT);
    return pageResponse(authorVideos(id, viewer || 0, readCursor(query), limit));
  });

  route('POST', '/api/users/:id/follow', ({ params, viewer, authFailed }) => {
    const id = requireAuth({ viewer, authFailed });
    const result = setFollow(id, decodeIdParam(params.id, 'user'), true);
    return { following: result.following, followers: result.followers };
  });

  route('DELETE', '/api/users/:id/follow', ({ params, viewer, authFailed }) => {
    const id = requireAuth({ viewer, authFailed });
    const result = setFollow(id, decodeIdParam(params.id, 'user'), false);
    return { following: result.following, followers: result.followers };
  });

  route('GET', '/api/users/:id/followers', ({ params, query }) => {
    const limit = limitFrom(query.get('limit'), 30, MAX_LIMIT);
    return pageResponse(listFollowers(decodeIdParam(params.id, 'user'), readCursor(query), limit));
  });

  route('GET', '/api/users/:id/following', ({ params, query }) => {
    const limit = limitFrom(query.get('limit'), 30, MAX_LIMIT);
    return pageResponse(listFollowing(decodeIdParam(params.id, 'user'), readCursor(query), limit));
  });

  /* ------------------------------------------------------------------ feed -- */

  route('GET', '/api/feed', ({ query, viewer }) => {
    const limit = limitFrom(query.get('limit'), FEED_LIMIT, MAX_LIMIT);
    const tab = query.get('tab') || 'recommend';
    return pageResponse(feedVideos(viewer || 0, readCursor(query), limit, { tab }));
  });

  route('GET', '/api/following-feed', ({ query, viewer }) => {
    const limit = limitFrom(query.get('limit'), FEED_LIMIT, MAX_LIMIT);
    return pageResponse(feedVideos(viewer || 0, readCursor(query), limit, { followedOnly: true }));
  });

  /* ----------------------------------------------------------------- videos -- */

  route('GET', '/api/videos/:id', ({ params, viewer }) => ({
    video: videoFromRow(getVideo(decodeIdParam(params.id, 'video'), viewer || 0)),
  }));

  route('POST', '/api/videos', ({ viewer, authFailed, body }) => {
    const id = requireAuth({ viewer, authFailed });
    const caption = optionalString(body, 'caption', { max: 300 }) || '';
    const duration = optionalNumber(body, 'duration', { min: 0, max: 3600, fallback: 0 });
    const width = Math.trunc(optionalNumber(body, 'width', { min: 1, max: 8192, fallback: 1080 }));
    const height = Math.trunc(optionalNumber(body, 'height', { min: 1, max: 8192, fallback: 1920 }));
    const poster = optionalString(body, 'poster', { max: 200000 }) || syntheticPoster(caption || '新作品', id);
    const { filename, absolute } = normalizeMediaKey(body.media_key);
    if (!fs.existsSync(absolute)) throw httpError(400, 'media_not_found', `unknown media_key: ${filename}`);
    requireOwnedMedia(filename, id);
    const createdAt = now();
    const videoId = insertVideo({
      authorId: id,
      caption,
      url: `/media/${encodeURIComponent(filename)}`,
      poster,
      mediaKey: filename,
      duration,
      width,
      height,
      createdAt,
      sortKey: createdAt,
    });
    return { video: videoFromRow(getVideo(videoId, id)) };
  });

  route('PUT', '/api/upload', async ({ req, viewer, authFailed }) => {
    const id = requireAuth({ viewer, authFailed });
    parseMetaHeader(req.headers['x-meta']);
    await ensureMediaDir();
    const saved = await saveUpload(req, {
      ownerId: id,
      contentType: req.headers['content-type'],
      maxBytes: MAX_UPLOAD_BYTES,
    });
    registerMediaObject({
      mediaKey: saved.filename,
      ownerId: id,
      bytes: saved.bytes,
      contentType: saved.contentType,
      origin: 'upload',
    });
    return { media_key: saved.filename, url: `/media/${encodeURIComponent(saved.filename)}`, bytes: saved.bytes };
  }, { raw: true });

  route('POST', '/api/videos/:id/like', ({ params, viewer, authFailed }) => {
    const id = requireAuth({ viewer, authFailed });
    const { counters } = setVideoLike(id, decodeIdParam(params.id, 'video'), true);
    return { liked: true, likes: counters.likes };
  });

  route('DELETE', '/api/videos/:id/like', ({ params, viewer, authFailed }) => {
    const id = requireAuth({ viewer, authFailed });
    const { counters } = setVideoLike(id, decodeIdParam(params.id, 'video'), false);
    return { liked: false, likes: counters.likes };
  });

  route('POST', '/api/videos/:id/favorite', ({ params, viewer, authFailed }) => {
    const id = requireAuth({ viewer, authFailed });
    const { counters } = setVideoFavorite(id, decodeIdParam(params.id, 'video'), true);
    return { favorited: true, favorites: counters.favorites };
  });

  route('DELETE', '/api/videos/:id/favorite', ({ params, viewer, authFailed }) => {
    const id = requireAuth({ viewer, authFailed });
    const { counters } = setVideoFavorite(id, decodeIdParam(params.id, 'video'), false);
    return { favorited: false, favorites: counters.favorites };
  });

  route('POST', '/api/videos/:id/views', ({ params }) => ({
    views: incrementViews(decodeIdParam(params.id, 'video')),
  }));

  route('POST', '/api/videos/:id/share', ({ params, viewer, authFailed }) => {
    requireAuth({ viewer, authFailed });
    return { shares: incrementShares(decodeIdParam(params.id, 'video')) };
  });

  /* --------------------------------------------------------------- comments -- */

  route('GET', '/api/videos/:id/comments', ({ params, query, viewer }) => {
    const videoId = decodeIdParam(params.id, 'video');
    const limit = limitFrom(query.get('limit'), 20, MAX_LIMIT);
    const page = listComments(videoId, viewer || 0, readCursor(query), limit);
    return {
      items: page.items,
      next_cursor: page.next_cursor ? encodeCursor(page.next_cursor) : null,
      total: page.total,
    };
  });

  route('POST', '/api/videos/:id/comments', ({ params, viewer, authFailed, body }) => {
    const id = requireAuth({ viewer, authFailed });
    const videoId = decodeIdParam(params.id, 'video');
    const content = requireString(body, 'content', { max: 500 });
    const rawParent = body.parent_id;
    const parentId = rawParent === undefined || rawParent === null || rawParent === ''
      ? undefined
      : decodeIdParam(rawParent, 'comment');
    return { comment: insertComment({ videoId, authorId: id, parentId, content }) };
  });

  route('DELETE', '/api/comments/:id', ({ params, viewer, authFailed }) => {
    const id = requireAuth({ viewer, authFailed });
    deleteComment(decodeIdParam(params.id, 'comment'), id);
    return { ok: true };
  });

  /* --------------------------------------------------------------- discover -- */

  route('GET', '/api/discover', () => ({
    hot_searches: HOT_SEARCHES,
    lifestyle_guides: LIFESTYLE_GUIDES,
    challenges: CHALLENGES,
  }));

  route('GET', '/api/challenges/:tag', ({ params, viewer }) => {
    const rawTag = (params.tag || '').replace(/^#/, '').toLowerCase();
    const found = CHALLENGES.find((c) => c.tag.toLowerCase() === rawTag) || {
      tag: params.tag,
      title: `#${params.tag} Çağırışı`,
      description: `#${params.tag} trend videoları və icma iştirakçıları.`,
      views: '1.5M',
      participants: '2.4K',
      reward: 'FastVideo Creator Nişanı',
      banner: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
      joinedTag: `#${params.tag}`,
    };
    const searchResult = search(params.tag, viewer || 0, null, { videoLimit: 24, userLimit: 0 });
    return {
      challenge: found,
      videos: searchResult.videos,
    };
  });

  /* ----------------------------------------------------------------- search -- */

  route('GET', '/api/search', ({ query, viewer }) => {
    const term = (query.get('q') || '').trim();
    const limit = limitFrom(query.get('limit'), 20, MAX_LIMIT);
    if (!term) {
      return {
        videos: [],
        users: [],
        products: [],
        live_streams: [],
        places: [],
        music: [],
        next_cursor: null,
      };
    }
    const result = search(term, viewer || 0, readSearchCursor(query), { videoLimit: limit, userLimit: limit });
    const needle = term.toLowerCase();

    const matchedProducts = PRODUCTS_LIST.filter(
      (p) => p.title.toLowerCase().includes(needle) || p.tag.toLowerCase().includes(needle) || p.category.toLowerCase().includes(needle)
    );
    const matchedLive = LIVE_STREAMS.filter(
      (l) => l.title.toLowerCase().includes(needle) || l.category.toLowerCase().includes(needle) || l.streamer.toLowerCase().includes(needle)
    );
    const matchedPlaces = PLACES_LIST.filter(
      (pl) => pl.name.toLowerCase().includes(needle) || pl.city.toLowerCase().includes(needle) || pl.category.toLowerCase().includes(needle) || pl.description.toLowerCase().includes(needle)
    );
    const matchedMusic = MUSIC_TRACKS.filter(
      (m) => m.title.toLowerCase().includes(needle) || m.artist.toLowerCase().includes(needle)
    );

    return {
      videos: result.videos,
      users: result.users,
      products: matchedProducts,
      live_streams: matchedLive,
      places: matchedPlaces,
      music: matchedMusic,
      next_cursor: result.next_cursor ? encodeCursor(result.next_cursor) : null,
    };
  });

  /* -------------------------------------------------------------- AI Assist -- */

  route('POST', '/api/ai/assist', async ({ body }) => {
    const query = requireString(body, 'query', { max: 500 }).trim();
    if (!query) throw httpError(400, 'invalid_query', 'query is required');

    let answer = '';
    let suggestions = [];
    let relatedTags = [];

    try {
      const ai = new GoogleGenAI();
      const prompt = `You are FastVideo AI Assistant (inspired by GigaChat/YandexGPT/Alice style), a smart, youth-friendly lifestyle discovery assistant inside the FastVideo short-video platform.
User Query: "${query}"

Guidelines:
1. Provide a direct, helpful, friendly answer in the same language as the user query (Azerbaijani, Turkish, or Russian).
2. If asking for a recipe, give a quick ingredient list and 3-4 numbered steps.
3. If asking for places or cafes (e.g. in Baku, Istanbul, etc.), recommend 2-3 specific spots with their vibe, location, and why youth love them.
4. If asking for reviews or advice (tech, budget, style, viral videos), give concise pros/cons or actionable tips.
5. At the very end of your response, output exactly these two lines:
TAGS: #tag1, #tag2, #tag3
SUGGESTIONS: suggestion1 | suggestion2`;

      const res = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
      });

      const rawText = res.text || '';
      const lines = rawText.split('\n');
      const cleanLines = [];
      for (const line of lines) {
        if (line.startsWith('TAGS:')) {
          relatedTags = line.replace('TAGS:', '').split(',').map((s) => s.trim().replace(/^#/, '')).filter(Boolean);
        } else if (line.startsWith('SUGGESTIONS:')) {
          suggestions = line.replace('SUGGESTIONS:', '').split('|').map((s) => s.trim()).filter(Boolean);
        } else {
          cleanLines.push(line);
        }
      }
      answer = cleanLines.join('\n').trim();
    } catch {
      // Graceful smart lifestyle fallback
      const qLower = query.toLowerCase();
      if (qLower.includes('resept') || qLower.includes('cheesecake') || qLower.includes('yemək') || qLower.includes('qəhvə')) {
        answer = `🍳 **Tövsiyə olunan Resept:**\n\n1. Ərzaqları otaq temperaturuna gətirin.\n2. Orta dərəcəli istilikdə 15 dəqiqə ərzində bişirin.\n3. Servis edərkən üzərinə təzə nanə və giləmeyvələr əlavə edin.\n\n💡 *FastVideo ipucu: Videonuzu #MasterResept etiketi ilə paylaşaraq trendə düşün!*`;
        relatedTags = ['MasterResept', 'SanSebastian', 'EvMetbexi'];
        suggestions = ['10 dəqiqəlik səhər yeməyi', 'Buzlu qəhvə resepti'];
      } else if (qLower.includes('yer') || qLower.includes('kafe') || qLower.includes('məkan') || qLower.includes('bakı')) {
        answer = `📍 **Gənclər üçün Populyar Məkanlar:**\n\n• **İçərişəhər Panoramik Rooftop:** Qız Qalası mənzərəsi, estetik fotolar üçün ideal.\n• **Nizami Street Kitab Evi & Coffee:** Dərs oxumaq və sakit söhbət üçün.\n• **Dənizkənarı Bulvar Günbatımı Terrace:** Axşam gəzintiləri və canlı musiqi.\n\n💡 *Bu məkanlarda çəkilən videoları #SeherKesfi etiketi ilə axtarın!*`;
        relatedTags = ['SeherKesfi', 'Iceriseher', 'BakuCafe'];
        suggestions = ['Bulvarda ən yaxşı yerlər', 'Büdcəli kafelər'];
      } else {
        answer = `✨ **FastVideo Ağıllı Köməkçi:**\n\n"${query}" ilə bağlı ən populyar videolar, məhsullar və trendlər icmamızda aktiv şəkildə paylaşılır.\n\n• Trend videoları izləmək üçün axtarış bölməsində "Videolar" tabına keçin.\n• Mövzu ilə bağlı çağırışlara qoşularaq auditoriyanızı böyüdün.`;
        relatedTags = ['Trend2026', 'ViralVideo', 'FastVideo'];
        suggestions = ['Həftənin ən çox izlənən çağırışı nədir?', 'Bakıda ən yaxşı kafelər'];
      }
    }

    if (!relatedTags.length) relatedTags = ['Trend2026', 'Viral', 'Baku'];
    if (!suggestions.length) suggestions = ['San Sebastian Cheesecake resepti', 'Bakıda ən yaxşı gənclik kafeləri', 'Tələbə üçün büdcəli həyat hiylələri'];

    return {
      query,
      answer,
      related_tags: relatedTags,
      suggestions: suggestions.slice(0, 3),
    };
  });

  /* --------------------------------------------------------------- messages -- */

  route('GET', '/api/conversations', (ctx) => ({ items: conversations(requireAuth(ctx)) }));

  route('GET', '/api/messages/:userId', ({ params, query, viewer, authFailed }) => {
    const id = requireAuth({ viewer, authFailed });
    const peer = decodeIdParam(params.userId, 'user');
    const limit = limitFrom(query.get('limit'), 50, MAX_LIMIT);
    const threadId = ensureThread(id, peer);
    const page = listMessages(threadId, id, readCursor(query), limit);
    markThreadRead(threadId, id);
    return pageResponse(page);
  });

  route('POST', '/api/messages/:userId', ({ params, viewer, authFailed, body }) => {
    const id = requireAuth({ viewer, authFailed });
    const peer = decodeIdParam(params.userId, 'user');
    const content = requireString(body, 'content', { max: 1000 });
    const threadId = ensureThread(id, peer);
    const createdAt = now();
    const messageId = insertMessage({ threadId, senderId: id, recipientId: peer, content, createdAt });
    return { message: { id: messageId, content, created_at: createdAt, from_me: true } };
  });

  /* ------------------------------------------------------------------ media -- */

  const mediaHandler = ({ req, res, params }) => streamFile(req, res, resolveMediaPath(params.filename));
  route('GET', '/media/:filename', mediaHandler, { raw: true, public: true });
  route('HEAD', '/media/:filename', mediaHandler, { raw: true, public: true });

  /* ----------------------------------------------------------------- live -- */

  route('GET', '/api/live/rooms', ({ query }) => {
    const filter = query.get('filter') || 'all';
    return { items: liveManager.getRoomsList(filter) };
  }, { public: true });

  route('GET', '/api/live/rooms/:id', ({ params }) => {
    const room = liveManager.getRoom(params.id);
    if (!room) throw httpError(404, 'not_found', 'live room not found');
    return { room };
  }, { public: true });

  route('POST', '/api/live/rooms/:id/comment', ({ params, body }) => {
    const comment = liveManager.addComment(params.id, {
      user: body.user || 'İzləyici',
      avatar_color: body.avatar_color || '#fe2c55',
      text: body.text || '',
      badge: body.badge || 'İzləyici',
      is_donate: Boolean(body.is_donate),
      donate_amount: body.donate_amount,
      donate_service: body.donate_service
    });
    if (!comment) throw httpError(404, 'not_found', 'room not found');
    return { ok: true, comment };
  }, { public: true });

  route('POST', '/api/live/rooms/:id/gift', ({ params, body }) => {
    const res = liveManager.sendGift(params.id, {
      from: body.from || 'İzləyici',
      gift_name: body.gift_name || 'Gül',
      gift_icon: body.gift_icon || '🌹',
      amount_rub: Number(body.amount_rub || 10),
      diamonds: Number(body.diamonds || 20),
      target_team: body.target_team || 'team_a',
      donate_service: body.donate_service,
      custom_message: body.custom_message
    });
    if (!res) throw httpError(404, 'not_found', 'room not found');
    return { ok: true, gift: res };
  }, { public: true });

  route('POST', '/api/live/rooms/:id/pk/boost', ({ params, body }) => {
    liveManager.boostPk(params.id, body.team || 'team_a', Number(body.points || 50));
    return { ok: true };
  }, { public: true });

  route('POST', '/api/live/rooms/:id/poll/vote', ({ params, body }) => {
    const poll = liveManager.votePoll(params.id, body.option_id);
    if (!poll) throw httpError(400, 'bad_request', 'could not vote on poll');
    return { ok: true, poll };
  }, { public: true });

  route('POST', '/api/live/rooms/:id/luckydraw/join', ({ params, body }) => {
    const draw = liveManager.joinLuckyDraw(params.id, body.user_name || 'İzləyici');
    if (!draw) throw httpError(400, 'bad_request', 'could not join lucky draw');
    return { ok: true, lucky_draw: draw };
  }, { public: true });

  route('POST', '/api/live/rooms/:id/buy', ({ params, body }) => {
    const prd = liveManager.buyProduct(params.id, body.product_id, body.user_name || 'İzləyici');
    if (!prd) throw httpError(400, 'out_of_stock', 'product not available or out of stock');
    return { ok: true, product: prd };
  }, { public: true });

  /* ----------------------------------------------------------------- health -- */

  route('GET', '/api/health', () => ({ ok: true, time: now() }), { public: true });

  // Instrumentation is opt-in (DY_ELMONITOR=1) so the production router never
  // carries benchmark-only routes and the API contract is untouched by default.
  if (process.env.DY_ELMONITOR) {
    route('GET', '/api/__perf', ({ query }) => perfSnapshot({ reset: query.get('reset') === '1' }), { public: true });
  }

  return router;
}
