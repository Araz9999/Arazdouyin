export function toBool(value) {
  return value === 1 || value === true;
}

export function authorFromRow(row) {
  return {
    id: row.author_id,
    username: row.author_username,
    display_name: row.author_display_name,
    avatar_color: row.author_avatar_color,
    verified: toBool(row.author_verified),
  };
}

export function videoFromRow(row) {
  return {
    id: row.id,
    caption: row.caption,
    url: row.url,
    poster: row.poster,
    duration: row.duration,
    width: row.width,
    height: row.height,
    created_at: row.created_at,
    author: authorFromRow(row),
    stats: {
      likes: row.likes,
      comments: row.comment_count,
      shares: row.shares,
      views: row.views,
      favorites: row.favorites,
    },
    liked: toBool(row.viewer_liked),
    favorited: toBool(row.viewer_favorited),
    following: toBool(row.viewer_following),
    location: (row.caption && row.caption.includes('上海')) ? '上海 · 武康路 800m' :
              (row.caption && row.caption.includes('咖啡')) ? '上海 · 巨鹿路 1.2km' :
              (row.caption && row.caption.includes('海边')) ? '三亚 · 亚龙湾 2.5km' :
              (row.id % 2 === 0) ? '同城精选 · 1.6km' : undefined,
    product: (row.caption && (row.caption.includes('咖啡') || row.caption.includes('探店'))) ? {
      title: '云南高山精品挂耳手冲咖啡豆 (10包装)',
      price: '¥39.9',
      original_price: '¥69.0',
      sales: '已售 2.3万',
      tag: '抖音商城 · 超值爆款'
    } : (row.caption && (row.caption.includes('背包') || row.caption.includes('数码') || row.id % 3 === 1)) ? {
      title: '数码极客防泼水多功能双肩包',
      price: '¥199',
      original_price: '¥299',
      sales: '已售 9800',
      tag: '达人好物'
    } : (row.id % 3 === 0) ? {
      title: '复古黑胶无线蓝牙桌面音响',
      price: '¥129',
      original_price: '¥189',
      sales: '已售 1.4万',
      tag: '热卖好物'
    } : undefined,
    featured: Boolean(row.duration >= 60 || row.views >= 30 || row.id % 2 === 1),
  };
}

export function userFromRow(row) {
  return {
    id: row.id,
    username: row.username,
    display_name: row.display_name,
    bio: row.bio,
    avatar_color: row.avatar_color,
    verified: toBool(row.verified),
    following_count: row.following_count,
    follower_count: row.follower_count,
  };
}

export function commentFromRow(row) {
  return {
    id: row.id,
    content: row.content,
    created_at: row.created_at,
    likes: row.likes,
    liked: toBool(row.viewer_liked),
    parent_id: row.parent_id === null || row.parent_id === undefined ? null : row.parent_id,
    author: {
      id: row.author_id,
      username: row.author_username,
      display_name: row.author_display_name,
      avatar_color: row.author_avatar_color,
    },
  };
}

export function messageFromRow(row, viewerId) {
  return {
    id: row.id,
    content: row.content,
    created_at: row.created_at,
    from_me: row.sender_id === viewerId,
  };
}
