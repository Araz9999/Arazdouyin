// Mock and curated discovery data for lifestyle, trending searches, challenges, places, and music.

export const HOT_SEARCHES = [
  { rank: 1, query: 'Baku Fashion Week 2026', hotScore: '3.4M', tag: 'HOT', category: 'fashion' },
  { rank: 2, query: 'San Sebastian Cheesecake resepti', hotScore: '2.8M', tag: 'HOT', category: 'recipe' },
  { rank: 3, query: 'İçərişəhər gizli panoramik kafe', hotScore: '2.1M', tag: 'RISING', category: 'place' },
  { rank: 4, query: 'Tələbə üçün 5 büdcəli həyat hiyləsi', hotScore: '1.9M', tag: 'NEW', category: 'review' },
  { rank: 5, query: 'Dənizkənarı Bulvar günbatımı vlog', hotScore: '1.6M', tag: 'HOT', category: 'place' },
  { rank: 6, query: 'Matcha Latte evdə necə hazırlanır', hotScore: '1.3M', tag: 'RISING', category: 'recipe' },
  { rank: 7, query: 'Sony vs Apple qulaqlıq müqayisəsi', hotScore: '1.1M', tag: 'NEW', category: 'review' },
  { rank: 8, query: 'Minimalist 2026 yaz kombinləri', hotScore: '980K', tag: 'HOT', category: 'fashion' },
  { rank: 9, query: 'Şəki pitisi və halvası harada yeyilir', hotScore: '890K', tag: 'RISING', category: 'recipe' },
  { rank: 10, query: 'Dəri üçün 3 əsas qızıl qayda', hotScore: '750K', tag: 'NEW', category: 'review' }
];

export const LIFESTYLE_GUIDES = {
  recipes: [
    {
      id: 'rec-1',
      title: 'San Sebastian Cheesecake (Ev Üsulu)',
      category: 'Desert',
      time: '35 dəq',
      difficulty: 'Asan',
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=400&q=80',
      description: 'İçi kremalı, üstü mükəmməl karamelizə olunmuş əfsanəvi ispan çizkeyki.',
      ingredients: ['500q krem pendir', '3 ədəd yumurta', '1 stəkan şəkər tozu', '200ml qaymaq', '1 xörək qaşığı un'],
      steps: [
        'Pendiri və şəkəri mikserlə aşağı sürətdə 2 dəqiqə qarışdırın.',
        'Yumurtaları bir-bir əlavə edərək hər dəfə yavaşca qarışdırın.',
        'Qaymağı və unu əlavə edib hamar kütlə alınana qədər çalın.',
        '210°C sobada 25-30 dəqiqə üstü qızarana qədər bişirin.'
      ],
      query: 'San Sebastian Cheesecake'
    },
    {
      id: 'rec-2',
      title: 'Avokado Toast & Poşe Yumurta',
      category: 'Səhər Yeməyi',
      time: '10 dəq',
      difficulty: 'Çox Asan',
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=400&q=80',
      description: 'Zülal və faydalı yağlarla zəngin, enerjili və estetik gənclik səhər yeməyi.',
      ingredients: ['1 yetişmiş avokado', '2 dilim çovdar çörəyi', '1 yumurta', 'Limon suyu', 'Çili bibər və dəniz duzu'],
      steps: [
        'Çörək dilimlərini tavada və ya tosterdə qızardın.',
        'Avokadonu çəngəllə əzib limon suyu, duz və istiotla qarışdırın.',
        'Qaynar sirkəli suya yumurtanı sındırıb 3 dəqiqə poşe edin.',
        'Çörəyin üzərinə avokado və poşe yumurtanı qoyub çili səpin.'
      ],
      query: 'Avokado Toast'
    },
    {
      id: 'rec-3',
      title: 'Buzlu Matcha Latte (Kafe Dadında)',
      category: 'İçki',
      time: '5 dəq',
      difficulty: 'Çox Asan',
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=400&q=80',
      description: 'Yapon seremonial matcha tozu və badam südü ilə hazırlanan təbii enerji içkisi.',
      ingredients: ['2q seremonial matcha tozu', '60ml isti su (80°C)', '150ml badam və ya yulaf südü', 'Buz kubları', '1 çay qaşığı vanil şərbəti'],
      steps: [
        'Matcha tozunu isti su ilə bambuk çırpıcı ilə köpüklənənə qədər çırpın.',
        'Stəkana bol buz doldurun və südlə şərbəti əlavə edin.',
        'Üzərinə ehtiyatla yaşıl matchanı süzüb təbəqəli vizual yaradın.'
      ],
      query: 'Matcha Latte'
    }
  ],
  places: [
    {
      id: 'plc-1',
      title: 'İçərişəhər Panoramik Rooftop Lounge',
      category: 'Kafe & Lounge',
      city: 'Bakı',
      address: 'İçərişəhər, Qala küç. 14',
      rating: 4.9,
      vibe: 'Tarixi & Romantik',
      checkins: '14.2K',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80',
      description: 'Qız Qalası və Xəzər dənizinə açılan unudulmaz mənzərə, keyfiyyətli qəhvə və musiqi.',
      query: 'İçərişəhər kafe'
    },
    {
      id: 'plc-2',
      title: 'Nizami Street Retro Kitab Evi & Coffee',
      category: 'Kitab & Qəhvə',
      city: 'Bakı',
      address: 'Nizami küç. 86 (Torqovaya)',
      rating: 4.8,
      vibe: 'Sakit & Yaradıcı',
      checkins: '9.8K',
      image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=400&q=80',
      description: 'Dərslərini oxumaq, işləmək və təzə çəkilmiş V60 filter qəhvəsi içmək üçün ən yaxşı məkan.',
      query: 'Nizami Street kitab evi'
    },
    {
      id: 'plc-3',
      title: 'Dənizkənarı Bulvar Sunset Terrace',
      category: 'Açıq Hava',
      city: 'Bakı',
      address: 'Neftçilər prospekti, Bulvar xiyabanı',
      rating: 4.9,
      vibe: 'Dəniz Küləyi & Rahat',
      checkins: '32.1K',
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80',
      description: 'Gün batımı vaxtı selfi və gəzinti üçün şəhərin ən estetik guşəsi.',
      query: 'Bakı Bulvar günbatımı'
    }
  ],
  reviews: [
    {
      id: 'rev-1',
      title: 'Tələbə Büdcəsi ilə Şəhərdə 1 Günlük Plan',
      author: 'Ayan_Lifestyle',
      category: 'Büdcə Hiyləsi',
      score: '9.8/10',
      summary: 'Cəmi 15 AZN ilə necə həm muzey gəzmək, həm qəhvə içmək və dadlı yemək olar? Tam siyahı və tələbə endirimləri xəritəsi.',
      query: 'Tələbə büdcəsi'
    },
    {
      id: 'rev-2',
      title: 'Sony WH-1000XM5 vs AirPods Max (2026 Testi)',
      author: 'TechAzerbaijan',
      category: 'Texnologiya',
      score: '9.5/10',
      summary: 'Səs izolyasiyası, batareya ömrü və gündəlik metro/tələbə istifadəsi üçün hansı daha sərfəlidir? Ətraflı qulaqlıq müqayisəsi.',
      query: 'Qulaqlıq müqayisəsi'
    },
    {
      id: 'rev-3',
      title: 'Parlaq Dəri Üçün 3 Əsas Koreya Baxım Addımı',
      author: 'Leyla_Beauty',
      category: 'Gözəllik',
      score: '9.9/10',
      summary: 'Artıq 10 addımlıq rutinə ehtiyac yoxdur: C vitamini, hialuron turşusu və SPF ilə cam kimi dəri sirri.',
      query: 'Dəri baxımı'
    }
  ],
  fashion: [
    {
      id: 'fsh-1',
      title: '2026 Yaz Streetwear Trendləri',
      style: 'Oversize & Minimalist',
      tags: ['Kargo Şalvar', 'Ağ Krossovka', 'Vintage Gödəkçə'],
      description: 'Rahatlıq və fərdilik ön planda: neytral torpaq tonları və retro aksesuarlar.',
      query: 'Streetwear 2026'
    },
    {
      id: 'fsh-2',
      title: 'Kapsul Qarderob: 10 Parça ilə 30 Kombin',
      style: 'Smart Casual',
      tags: ['Ağ Köynək', 'Klassik Blazer', 'Düz Kəsim Cins'],
      description: 'Az xərclə hər gün fərqli və dəbli görünməyin riyaziyyatı.',
      query: 'Kapsul qarderob'
    }
  ]
};

export const CHALLENGES = [
  {
    tag: 'BakuDance2026',
    title: 'Bakı Küçə Rəqsi Çağırışı',
    description: 'Şəhərin sevimli məkanında öz rəqs bacarığını göstər, trend musiqi ilə videonu çək və qalib ol!',
    views: '18.5M',
    participants: '24.1K',
    reward: '2,500 AZN Mükafat Fondu',
    banner: 'https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&w=800&q=80',
    joinedTag: '#BakuDance2026'
  },
  {
    tag: 'MasterResept',
    title: '15 Dəqiqəyə Şef Yeməyi',
    description: 'Evdə olan ərzaqlarla 15 dəqiqədə ən dadlı və estetik reseptini paylaş.',
    views: '12.4M',
    participants: '16.8K',
    reward: 'Şef Mətbəx Dəsti',
    banner: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80',
    joinedTag: '#MasterResept'
  },
  {
    tag: 'GencIstedad',
    title: 'Gənc İstedadlar Klubu',
    description: 'Rəsm, vokal, idman və ya qrafika: öz istedadını bütün dünyaya nümayiş etdir!',
    views: '14.1M',
    participants: '31.0K',
    reward: 'Yaradıcı Təqaüd',
    banner: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
    joinedTag: '#GencIstedad'
  },
  {
    tag: 'SeherKesfi',
    title: 'Gizli Şəhər Guşələri',
    description: 'Hamının bilmədiyi maraqlı həyət, retro küçə və ya mənzərəni çək, xəritəyə əlavə et.',
    views: '9.8M',
    participants: '11.5K',
    reward: 'Dron və Gimbal Dəsti',
    banner: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=800&q=80',
    joinedTag: '#SeherKesfi'
  },
  {
    tag: 'VlogHeyatim',
    title: 'Gündəlik Həyatım Vlog',
    description: 'Səhər oyanışından axşama qədər günün ən maraqlı anlarını 60 saniyədə topla.',
    views: '22.3M',
    participants: '45.9K',
    reward: 'FastVideo Creator Badge',
    banner: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80',
    joinedTag: '#VlogHeyatim'
  }
];

export const PRODUCTS_LIST = [
  {
    id: 'prd-1',
    title: 'Smart Vlog Simsiz Mikrofon (Type-C & Lightning)',
    price: '34.90 ₼',
    original_price: '59.00 ₼',
    discount: '-41%',
    sales: '3.4K satıldı',
    rating: 4.9,
    tag: 'Trend Məhsul',
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=300&q=80',
    category: 'tech'
  },
  {
    id: 'prd-2',
    title: 'LED Ring Light & Tripod Telefon Tutucu Dəsti',
    price: '28.50 ₼',
    original_price: '45.00 ₼',
    discount: '-36%',
    sales: '8.2K satıldı',
    rating: 4.8,
    tag: 'Çox Satılan',
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=300&q=80',
    category: 'tech'
  },
  {
    id: 'prd-3',
    title: 'Xüsusi Qovrulmuş Efiopiya Yirgacheffe Qəhvəsi 250q',
    price: '18.00 ₼',
    original_price: '26.00 ₼',
    discount: '-30%',
    sales: '2.1K satıldı',
    rating: 5.0,
    tag: 'FastMall Seçimi',
    image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=300&q=80',
    category: 'food'
  },
  {
    id: 'prd-4',
    title: 'Vintage Oversize Qara Hoodie (100% Pambıq)',
    price: '45.00 ₼',
    original_price: '75.00 ₼',
    discount: '-40%',
    sales: '1.9K satıldı',
    rating: 4.8,
    tag: 'Dəb & Stil',
    image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=300&q=80',
    category: 'fashion'
  },
  {
    id: 'prd-5',
    title: 'Termo Paslanmayan Polad Su Qabı 750ml (Mat Qara)',
    price: '19.90 ₼',
    original_price: '32.00 ₼',
    discount: '-38%',
    sales: '5.6K satıldı',
    rating: 4.9,
    tag: 'Eko Həyat',
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=300&q=80',
    category: 'lifestyle'
  }
];

export const LIVE_STREAMS = [
  {
    id: 'live-1',
    title: 'Canlı Akustik Gitar & Şəhər Gecəsi 🎸',
    streamer: 'Murad_Music',
    viewers: '4.8K',
    category: 'Musiqi',
    tag: 'CANLI',
    avatar_color: '#fe2c55',
    verified: true
  },
  {
    id: 'live-2',
    title: '15 Dəqiqədə Şirniyyat Hazırlayırıq 🍰 Sual-Cavab',
    streamer: 'LeylaKitchen',
    viewers: '2.9K',
    category: 'Mətbəx',
    tag: 'CANLI',
    avatar_color: '#ffb400',
    verified: true
  },
  {
    id: 'live-3',
    title: 'Bakı Küçələrindən Canlı Söhbət & İzləyici İntiqamı 🌃',
    streamer: 'Emin_Vlogs',
    viewers: '6.4K',
    category: 'Həyat Tərzi',
    tag: 'CANLI',
    avatar_color: '#25f4ee',
    verified: false
  },
  {
    id: 'live-4',
    title: 'Gamer Turniri: Final Qarşılaşması 🎮',
    streamer: 'BakuEsports',
    viewers: '11.2K',
    category: 'Oyun',
    tag: 'CANLI',
    avatar_color: '#8a5cff',
    verified: true
  }
];

export const MUSIC_TRACKS = [
  {
    id: 'msc-1',
    title: 'Xəzər Küləyi (Night Remix)',
    artist: 'DJ Baku Pulse',
    duration: '02:45',
    uses: '184.2K video',
    cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 'msc-2',
    title: 'Summer Vibes & Sunset',
    artist: 'FastWave Beat',
    duration: '01:50',
    uses: '92.5K video',
    cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 'msc-3',
    title: 'Acoustic Soul Session',
    artist: 'Laman & Elvin',
    duration: '03:10',
    uses: '64.8K video',
    cover: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 'msc-4',
    title: 'Urban Hip-Hop Beat 2026',
    artist: 'Metro Baku Sound',
    duration: '02:15',
    uses: '240.1K video',
    cover: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=200&q=80'
  }
];

export const PLACES_LIST = [
  {
    id: 'plc-loc-1',
    name: 'İçərişəhər Tarixi Qoruq',
    city: 'Bakı',
    category: 'Mədəniyyət & Tarix',
    distance: '0.8 km',
    checkins: '128.4K',
    rating: 4.9,
    photo: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=300&q=80',
    description: 'Qız Qalası, Şirvanşahlar Sarayı və qədim daş küçələrlə zəngin tarixi mərkəz.'
  },
  {
    id: 'plc-loc-2',
    name: 'Dənizkənarı Milli Park (Bulvar)',
    city: 'Bakı',
    category: 'Gəzinti & Park',
    distance: '1.2 km',
    checkins: '310.2K',
    rating: 4.9,
    photo: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=300&q=80',
    description: 'Xəzər sahilində 16 km-lik möhtəşəm gəzinti xiyabanı və fəvvarələr.'
  },
  {
    id: 'plc-loc-3',
    name: 'Flame Towers & Dağüstü Park',
    city: 'Bakı',
    category: 'Mənzərə & Panorama',
    distance: '2.5 km',
    checkins: '195.0K',
    rating: 5.0,
    photo: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=300&q=80',
    description: 'Şəhərin simvolu olan Alov Qüllələri və bütün Bakı körfəzinə açılan möhtəşəm mənzərə.'
  },
  {
    id: 'plc-loc-4',
    name: 'Nizami Küçəsi (Torqovaya)',
    city: 'Bakı',
    category: 'Alış-veriş & Kafe',
    distance: '1.0 km',
    checkins: '240.5K',
    rating: 4.8,
    photo: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=300&q=80',
    description: 'Piyadalar üçün ayrılmış memarlıq incisi, kafelər və musiqiçilərin toplandığı küçə.'
  }
];
