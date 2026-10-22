export type User = {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_color: string;
  verified: boolean;
  following_count: number;
  follower_count: number;
};

export type VideoAuthor = {
  id: string;
  username: string;
  display_name: string;
  avatar_color: string;
  verified?: boolean;
};

export type VideoStats = {
  likes: number;
  comments: number;
  shares: number;
  views: number;
  favorites: number;
};

export type VideoProduct = {
  title: string;
  price: string;
  original_price?: string;
  sales?: string;
  tag?: string;
  sales_tag?: string;
};

export type Video = {
  id: string;
  caption: string;
  url: string;
  poster: string;
  duration: number;
  width: number;
  height: number;
  created_at: string | number;
  author: VideoAuthor;
  stats: VideoStats;
  liked: boolean;
  favorited: boolean;
  following: boolean;
  location?: string;
  product?: VideoProduct;
  featured?: boolean;
};

export type Comment = {
  id: string;
  content: string;
  created_at: string | number;
  likes: number;
  liked: boolean;
  author: VideoAuthor;
  parent_id: string | null;
};

export type Message = {
  id: string;
  content: string;
  created_at: string | number;
  from_me: boolean;
};

export type Conversation = {
  peer: User;
  last: Message | null;
  unread: number;
};

export type UserStats = {
  followers: number;
  following: number;
  likes_received: number;
  videos: number;
};

export type Paged<T> = { items: T[]; next_cursor?: string | null };
export type AuthResponse = { token: string; user: User };

export type SearchCategory = 'all' | 'videos' | 'users' | 'products' | 'live' | 'places' | 'music' | 'ai';

export type HotSearchItem = {
  rank: number;
  query: string;
  hotScore: string;
  tag: 'HOT' | 'NEW' | 'RISING';
  category: string;
};

export type LifestyleRecipe = {
  id: string;
  title: string;
  category: string;
  time: string;
  difficulty: string;
  rating: number;
  image: string;
  description: string;
  ingredients: string[];
  steps: string[];
  query: string;
};

export type LifestylePlace = {
  id: string;
  title: string;
  category: string;
  city: string;
  address: string;
  rating: number;
  vibe: string;
  checkins: string;
  image: string;
  description: string;
  query: string;
};

export type LifestyleReview = {
  id: string;
  title: string;
  author: string;
  category: string;
  score: string;
  summary: string;
  query: string;
};

export type LifestyleFashion = {
  id: string;
  title: string;
  style: string;
  tags: string[];
  description: string;
  query: string;
};

export type ChallengeItem = {
  tag: string;
  title: string;
  description: string;
  views: string;
  participants: string;
  reward: string;
  banner: string;
  joinedTag: string;
};

export type ProductItem = {
  id: string;
  title: string;
  price: string;
  original_price: string;
  discount: string;
  sales: string;
  rating: number;
  tag: string;
  image: string;
  category: string;
};

export type LiveStreamItem = {
  id: string;
  title: string;
  streamer: string;
  viewers: string;
  category: string;
  tag: string;
  avatar_color: string;
  verified: boolean;
};

export type MusicItem = {
  id: string;
  title: string;
  artist: string;
  duration: string;
  uses: string;
  cover: string;
};

export type PlaceItem = {
  id: string;
  name: string;
  city: string;
  category: string;
  distance: string;
  checkins: string;
  rating: number;
  photo: string;
  description: string;
};

export type MultiSearchResponse = {
  videos: Video[];
  users: User[];
  products: ProductItem[];
  live_streams: LiveStreamItem[];
  places: PlaceItem[];
  music: MusicItem[];
  next_cursor: string | null;
};

export type DiscoverResponse = {
  hot_searches: HotSearchItem[];
  lifestyle_guides: {
    recipes: LifestyleRecipe[];
    places: LifestylePlace[];
    reviews: LifestyleReview[];
    fashion: LifestyleFashion[];
  };
  challenges: ChallengeItem[];
};

export type ChallengeDetailResponse = {
  challenge: ChallengeItem;
  videos: Video[];
};

export type AiAssistResponse = {
  query: string;
  answer: string;
  related_tags: string[];
  suggestions: string[];
};

export type LiveRoomType = 'individual' | 'brand' | 'official' | 'vtuber' | 'event';
export type LivePartner = 'vk_play' | 'rutube' | 'ozon' | 'wildberries' | null;

export type LiveStreamer = {
  id: string;
  name: string;
  avatar_color: string;
  verified: boolean;
  bio: string;
  followers: string;
};

export type LiveCoHost = {
  id: string;
  name: string;
  avatar_color: string;
  verified: boolean;
  score: number;
  tag: string;
};

export type PkState = {
  active: boolean;
  round_seconds_left: number;
  team_a_score: number;
  team_b_score: number;
  penalty: string;
  mvp_a?: { name: string; avatar_color: string; gift: string };
  mvp_b?: { name: string; avatar_color: string; gift: string };
};

export type LivePollOption = {
  id: string;
  text: string;
  votes: number;
};

export type LivePoll = {
  id: string;
  question: string;
  options: LivePollOption[];
  total_votes: number;
  ended: boolean;
};

export type LuckyDraw = {
  id: string;
  title: string;
  prize: string;
  countdown_sec: number;
  participants_count: number;
  status: 'active' | 'awarded';
  winners: string[];
};

export type LiveProduct = {
  id: string;
  title: string;
  store: 'Ozon' | 'Wildberries' | 'FastMall';
  store_logo?: string;
  price: string;
  original_price: string;
  discount: string;
  flash_sale: boolean;
  flash_seconds_left: number;
  stock_left: number;
  image: string;
  is_pinned: boolean;
};

export type LiveComment = {
  id: string;
  user: string;
  avatar_color: string;
  text: string;
  badge: string;
  is_donate?: boolean;
  donate_amount?: string | null;
  donate_service?: string | null;
  timestamp: number;
};

export type LiveGiftEvent = {
  id: string;
  from: string;
  gift_name: string;
  gift_icon: string;
  amount_rub: number;
  diamonds: number;
  target_team?: string;
  timestamp: number;
};

export type LiveCameraAngle = {
  id: string;
  name: string;
  active: boolean;
};

export type LiveReplayHighlight = {
  time: string;
  label: string;
};

export type LiveRoom = {
  id: string;
  title: string;
  streamer: LiveStreamer;
  type: LiveRoomType;
  category: string;
  partner: LivePartner;
  status: 'live' | 'replay';
  viewers: number;
  likes: number;
  revenue_rub: number;
  diamonds: number;
  video_url: string;
  co_host: LiveCoHost | null;
  pk: PkState | null;
  poll: LivePoll | null;
  lucky_draw: LuckyDraw | null;
  featured_products: LiveProduct[];
  chat_messages: LiveComment[];
  gifts_feed: LiveGiftEvent[];
  angles: LiveCameraAngle[] | null;
  replay: { duration: string; highlights: LiveReplayHighlight[] } | null;
};
