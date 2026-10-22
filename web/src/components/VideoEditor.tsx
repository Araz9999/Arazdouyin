import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../store/i18n';
import { toast } from '../store/ui';
import {
  ScissorsIcon,
  WandIcon,
  FilterIcon,
  SparklesIcon,
  StickerIcon,
  TextIcon,
  PlayIcon,
  PauseIcon,
  CheckIcon
} from './icons';
import { formatDuration } from '../utils/format';

export type FilterType = 'normal' | 'cinema' | 'vintage' | 'cyberpunk' | 'warm' | 'cool' | 'sunset' | 'bw';
export type TransitionType = 'none' | 'fade' | 'zoom' | 'wipe' | 'glitch' | 'flash';

export type VideoEditorState = {
  trimStart: number;
  trimEnd: number;
  speed: number;
  filter: FilterType;
  filterIntensity: number;
  beautySmooth: number;
  beautyBright: number;
  beautyRosy: number;
  stickers: { id: string; emoji: string; x: number; y: number }[];
  textOverlay: string;
  textColor: string;
  textPosition: 'top' | 'center' | 'bottom';
  transition: TransitionType;
  splitPoints: number[];
  aiCaptions: string[];
};

type Props = {
  videoUrl: string;
  duration: number;
  onStateChange: (state: VideoEditorState) => void;
  onApplyAiCaption?: (caption: string) => void;
};

const STICKER_PALETTE = ['🔥', '✨', '💯', '👑', '🎬', '🚀', '❤️', '⚡', '🎉', '💃', '🍿', '🎧'];
const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0];
const FILTERS: { id: FilterType; labelTr: string; labelRu: string; style: string }[] = [
  { id: 'normal', labelTr: 'Normal', labelRu: 'Обычный', style: 'none' },
  { id: 'cinema', labelTr: 'Sinema', labelRu: 'Кино', style: 'contrast(1.25) saturate(1.15) hue-rotate(-10deg)' },
  { id: 'warm', labelTr: 'Sıcak', labelRu: 'Теплый', style: 'sepia(0.25) saturate(1.25) brightness(1.05)' },
  { id: 'cool', labelTr: 'Soğuk', labelRu: 'Холодный', style: 'hue-rotate(25deg) saturate(1.1) brightness(1.02)' },
  { id: 'vintage', labelTr: 'Nostalji', labelRu: 'Винтаж', style: 'sepia(0.4) contrast(1.1) brightness(0.95)' },
  { id: 'cyberpunk', labelTr: 'Siber', labelRu: 'Кибер', style: 'contrast(1.3) saturate(1.6) hue-rotate(180deg)' },
  { id: 'sunset', labelTr: 'Günbatımı', labelRu: 'Закат', style: 'saturate(1.5) contrast(1.15) hue-rotate(-20deg)' },
  { id: 'bw', labelTr: 'Siyah/Beyaz', labelRu: 'Ч/Б', style: 'grayscale(1) contrast(1.2)' }
];

export function VideoEditor({ videoUrl, duration, onStateChange, onApplyAiCaption }: Props) {
  const { t, lang } = useI18n();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeTab, setActiveTab] = useState<'trim' | 'speed' | 'filters' | 'beauty' | 'stickers' | 'text' | 'transitions' | 'templates' | 'ai'>('trim');

  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(duration > 0 ? duration : 15);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1.0);
  const [filter, setFilter] = useState<FilterType>('normal');
  const [filterIntensity, setFilterIntensity] = useState(100);
  const [beautySmooth, setBeautySmooth] = useState(0);
  const [beautyBright, setBeautyBright] = useState(0);
  const [beautyRosy, setBeautyRosy] = useState(0);
  const [stickers, setStickers] = useState<{ id: string; emoji: string; x: number; y: number }[]>([]);
  const [textOverlay, setTextOverlay] = useState('');
  const [textColor, setTextColor] = useState('#fe2c55');
  const [textPosition, setTextPosition] = useState<'top' | 'center' | 'bottom'>('center');
  const [transition, setTransition] = useState<TransitionType>('none');
  const [splitPoints, setSplitPoints] = useState<number[]>([]);
  const [aiCaptions, setAiCaptions] = useState<string[]>([]);
  const [activeAiCaptionIndex, setActiveAiCaptionIndex] = useState(-1);

  // Sync state up
  useEffect(() => {
    onStateChange({
      trimStart,
      trimEnd,
      speed,
      filter,
      filterIntensity,
      beautySmooth,
      beautyBright,
      beautyRosy,
      stickers,
      textOverlay,
      textColor,
      textPosition,
      transition,
      splitPoints,
      aiCaptions
    });
  }, [
    trimStart,
    trimEnd,
    speed,
    filter,
    filterIntensity,
    beautySmooth,
    beautyBright,
    beautyRosy,
    stickers,
    textOverlay,
    textColor,
    textPosition,
    transition,
    splitPoints,
    aiCaptions,
    onStateChange
  ]);

  // Video playback loop within trim boundaries
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    v.playbackRate = speed;

    const onTimeUpdate = () => {
      setCurrentTime(v.currentTime);
      if (v.currentTime >= trimEnd || v.currentTime < trimStart) {
        v.currentTime = trimStart;
      }
      if (aiCaptions.length > 0) {
        const segDur = Math.max(1, (trimEnd - trimStart) / aiCaptions.length);
        const idx = Math.min(aiCaptions.length - 1, Math.floor((v.currentTime - trimStart) / segDur));
        setActiveAiCaptionIndex(idx >= 0 ? idx : -1);
      }
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    v.addEventListener('timeupdate', onTimeUpdate);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);

    return () => {
      v.removeEventListener('timeupdate', onTimeUpdate);
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
    };
  }, [trimStart, trimEnd, speed, aiCaptions]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      void v.play();
    } else {
      v.pause();
    }
  };

  const seek = (time: number) => {
    const v = videoRef.current;
    if (!v) return;
    const clamped = Math.min(trimEnd, Math.max(trimStart, time));
    v.currentTime = clamped;
    setCurrentTime(clamped);
  };

  const handleSplit = () => {
    const v = videoRef.current;
    const tSplit = v ? v.currentTime : currentTime;
    if (tSplit > trimStart + 0.5 && tSplit < trimEnd - 0.5) {
      setSplitPoints((prev) => [...prev, Math.round(tSplit * 10) / 10].sort((a, b) => a - b));
      toast(`${Math.round(tSplit * 10) / 10}s noktasından bölündü!`, 'ok');
    } else {
      toast('Bölme işlemi için imleci video içine taşıyın', 'info');
    }
  };

  // Compute CSS filter string
  const videoFilterStyle = useMemo(() => {
    const selected = FILTERS.find((f) => f.id === filter);
    const filterCss = selected && selected.id !== 'normal' ? selected.style : '';

    const bVal = 1 + (beautyBright / 100) * 0.25;
    const sVal = 1 + (beautyRosy / 100) * 0.35;
    const cVal = 1 - (beautySmooth / 100) * 0.12;
    const beautyCss = `brightness(${bVal}) saturate(${sVal}) contrast(${cVal})`;

    return `${filterCss} ${beautyCss}`.trim();
  }, [filter, beautyBright, beautyRosy, beautySmooth]);

  // AI 1-Click Auto Enhance
  const handleAiAutoEnhance = () => {
    setFilter('cinema');
    setFilterIntensity(85);
    setBeautySmooth(40);
    setBeautyBright(25);
    setBeautyRosy(25);
    toast(t('editor_ai_enhance_done'), 'ok');
  };

  // AI Auto Captions
  const handleAiCaptions = () => {
    const captions =
      lang === 'ru'
        ? [
            'Не пропусти этот момент! 🔥',
            'Смотри до самого конца ✨',
            'Повтори этот тренд прямо сейчас! 🚀',
            'Ставь лайк и подписывайся! ❤️'
          ]
        : [
            'Bu anı kaçırmayın! 🔥',
            'Sonuna kadar izleyin ✨',
            'Bunu mutlaka kaydedip deneyin! 🚀',
            'Beğenmeyi ve takip etmeyi unutmayın! ❤️'
          ];
    setAiCaptions(captions);
    toast(t('editor_ai_captions_done'), 'ok');
  };

  // AI Viral Hook Generator
  const handleAiHook = () => {
    const hooks =
      lang === 'ru'
        ? 'Смотри, что произошло в самом конце! 😱 Такое невозможно забыть #тренды #рек #видео #FastVideo'
        : 'Bunu sonuna kadar izleyenler şokta! 😱 Mutlaka kaydedin ve deneyin #Viral #Trend #Keşfet #Shorts #FastVideo';
    onApplyAiCaption?.(hooks);
    toast(t('editor_ai_hook'), 'ok');
  };

  // CapCut 1-Tap Template Handler
  const applyTemplate = (name: 'trend' | 'vlog' | 'cinema' | 'beat') => {
    if (name === 'trend') {
      setSpeed(1.25);
      setFilter('cinema');
      setBeautyRosy(35);
      setTextOverlay('🔥 TRENDING');
      setTextColor('#fe2c55');
      setTextPosition('top');
      setTransition('glitch');
      toast('Viral Trend şablonu uygulandı!', 'ok');
    } else if (name === 'vlog') {
      setSpeed(1.0);
      setFilter('warm');
      setBeautySmooth(45);
      setBeautyBright(20);
      setTextOverlay('✨ Daily Moments');
      setTextColor('#ffffff');
      setTextPosition('bottom');
      setTransition('fade');
      toast('Vlog Aesthetic şablonu uygulandı!', 'ok');
    } else if (name === 'cinema') {
      setSpeed(0.75);
      setFilter('cinema');
      setBeautySmooth(20);
      setTransition('zoom');
      setTextOverlay('🎬 CINEMATIC');
      setTextColor('#25f4ee');
      setTextPosition('center');
      toast('Cinematic Reel şablonu uygulandı!', 'ok');
    } else if (name === 'beat') {
      setSpeed(1.5);
      setFilter('cyberpunk');
      setTransition('flash');
      setStickers([{ id: 'beat-1', emoji: '⚡', x: 20, y: 30 }, { id: 'beat-2', emoji: '🚀', x: 80, y: 70 }]);
      toast('Fast Beat şablonu uygulandı!', 'ok');
    }
  };

  const addSticker = (emoji: string) => {
    setStickers((prev) => [
      ...prev,
      { id: `stk-${Date.now()}-${Math.random()}`, emoji, x: 50, y: 50 }
    ]);
  };

  const removeSticker = (id: string) => {
    setStickers((prev) => prev.filter((s) => s.id !== id));
  };

  const effectiveDuration = Math.max(0.5, trimEnd - trimStart) / speed;

  return (
    <div className="capcut-studio">
      <div className="studio-header">
        <div className="studio-branding">
          <span className="capcut-badge">CapCut</span>
          <div className="studio-title-wrap">
            <h2>{t('editor_title')}</h2>
            <p className="studio-subtitle">{t('editor_subtitle')}</p>
          </div>
        </div>
        <div className="studio-top-actions">
          <span className="editor-duration-tag">
            ⏱ {formatDuration(effectiveDuration)}
            {speed !== 1 ? ` (${speed}x)` : ''}
          </span>
          <button className="btn accent pill small" onClick={handleAiAutoEnhance}>
            <WandIcon size={14} />
            <span>{t('editor_ai_enhance')}</span>
          </button>
        </div>
      </div>

      <div className="studio-body">
        {/* Left: Video Canvas Monitor */}
        <div className="studio-monitor">
          <div className={`monitor-frame transition-${transition}`}>
            <video
              ref={videoRef}
              src={videoUrl}
              style={{ filter: videoFilterStyle }}
              playsInline
              loop
              autoPlay
              muted
              className="monitor-video"
            />

            {/* Live Text Overlay */}
            {textOverlay ? (
              <div
                className={`monitor-text-overlay pos-${textPosition}`}
                style={{ color: textColor }}
              >
                <span>{textOverlay}</span>
              </div>
            ) : null}

            {/* AI Auto-Captions Overlay */}
            {aiCaptions.length > 0 && activeAiCaptionIndex >= 0 ? (
              <div className="monitor-ai-caption">
                <span>{aiCaptions[activeAiCaptionIndex]}</span>
              </div>
            ) : null}

            {/* Dynamic Stickers */}
            {stickers.map((stk) => (
              <div
                key={stk.id}
                className="monitor-sticker"
                style={{ left: `${stk.x}%`, top: `${stk.y}%` }}
                onClick={() => removeSticker(stk.id)}
                title="Tıklayarak kaldır"
              >
                <span>{stk.emoji}</span>
                <span className="stk-del">✕</span>
              </div>
            ))}

            {/* Overlay Play/Pause Trigger */}
            <button
              className="monitor-tap-layer"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {!isPlaying ? (
                <div className="monitor-paused-badge">
                  <PlayIcon size={36} />
                </div>
              ) : null}
            </button>
          </div>

          {/* Timeline & Scrubber Bar */}
          <div className="studio-timeline-box">
            <div className="timeline-hud">
              <button className="timeline-play-btn" onClick={togglePlay}>
                {isPlaying ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
              </button>
              <span className="timeline-clock">
                {formatDuration(currentTime)} / {formatDuration(duration)}
              </span>
              <button className="btn ghost pill small split-btn" onClick={handleSplit}>
                <ScissorsIcon size={14} />
                <span>{t('editor_split_btn')}</span>
              </button>
            </div>

            <div className="timeline-track-wrap">
              {/* Split markers */}
              {splitPoints.map((pt) => (
                <div
                  key={pt}
                  className="split-marker"
                  style={{ left: `${(pt / duration) * 100}%` }}
                  title={`Split: ${pt}s`}
                />
              ))}

              {/* Scrubber slider */}
              <input
                type="range"
                min={0}
                max={duration || 10}
                step={0.1}
                value={currentTime}
                onChange={(e) => seek(parseFloat(e.target.value))}
                className="timeline-slider"
              />

              {/* Trim In/Out Indicators */}
              <div
                className="trim-highlight-bar"
                style={{
                  left: `${(trimStart / (duration || 1)) * 100}%`,
                  width: `${((trimEnd - trimStart) / (duration || 1)) * 100}%`
                }}
              />
            </div>

            <div className="trim-handles-row">
              <label className="trim-handle-box">
                <span>{t('editor_trim_start')}: {formatDuration(trimStart)}</span>
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, trimEnd - 1)}
                  step={0.5}
                  value={trimStart}
                  onChange={(e) => setTrimStart(parseFloat(e.target.value))}
                />
              </label>
              <label className="trim-handle-box">
                <span>{t('editor_trim_end')}: {formatDuration(trimEnd)}</span>
                <input
                  type="range"
                  min={trimStart + 1}
                  max={duration || 60}
                  step={0.5}
                  value={trimEnd}
                  onChange={(e) => setTrimEnd(parseFloat(e.target.value))}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Right: CapCut Tool Panels */}
        <div className="studio-tools-panel">
          <nav className="tools-nav-bar">
            <button
              className={`tool-nav-btn${activeTab === 'trim' ? ' active' : ''}`}
              onClick={() => setActiveTab('trim')}
            >
              <ScissorsIcon size={16} />
              <span>{t('editor_tab_trim')}</span>
            </button>
            <button
              className={`tool-nav-btn${activeTab === 'speed' ? ' active' : ''}`}
              onClick={() => setActiveTab('speed')}
            >
              <span>⚡</span>
              <span>{t('editor_tab_speed')}</span>
            </button>
            <button
              className={`tool-nav-btn${activeTab === 'filters' ? ' active' : ''}`}
              onClick={() => setActiveTab('filters')}
            >
              <FilterIcon size={16} />
              <span>{t('editor_tab_filters')}</span>
            </button>
            <button
              className={`tool-nav-btn${activeTab === 'beauty' ? ' active' : ''}`}
              onClick={() => setActiveTab('beauty')}
            >
              <SparklesIcon size={16} />
              <span>{t('editor_tab_beauty')}</span>
            </button>
            <button
              className={`tool-nav-btn${activeTab === 'stickers' ? ' active' : ''}`}
              onClick={() => setActiveTab('stickers')}
            >
              <StickerIcon size={16} />
              <span>{t('editor_tab_stickers')}</span>
            </button>
            <button
              className={`tool-nav-btn${activeTab === 'text' ? ' active' : ''}`}
              onClick={() => setActiveTab('text')}
            >
              <TextIcon size={16} />
              <span>{t('editor_tab_text')}</span>
            </button>
            <button
              className={`tool-nav-btn${activeTab === 'transitions' ? ' active' : ''}`}
              onClick={() => setActiveTab('transitions')}
            >
              <span>🎞️</span>
              <span>{t('editor_tab_transitions')}</span>
            </button>
            <button
              className={`tool-nav-btn${activeTab === 'templates' ? ' active' : ''}`}
              onClick={() => setActiveTab('templates')}
            >
              <span>✨</span>
              <span>{t('editor_tab_templates')}</span>
            </button>
            <button
              className={`tool-nav-btn${activeTab === 'ai' ? ' active' : ''}`}
              onClick={() => setActiveTab('ai')}
            >
              <WandIcon size={16} />
              <span>{t('editor_tab_ai')}</span>
            </button>
          </nav>

          <div className="tool-settings-content">
            {/* Trim Tab */}
            {activeTab === 'trim' && (
              <div className="tool-pane">
                <h3>{t('editor_tab_trim')}</h3>
                <p className="pane-desc">Videonun en iyi kısmını seçin ve gereksiz bölümleri atın.</p>
                <div className="trim-actions-list">
                  <div className="trim-stat">
                    <span>Orijinal Süre:</span>
                    <strong>{formatDuration(duration)}</strong>
                  </div>
                  <div className="trim-stat">
                    <span>Kırpılmış Süre:</span>
                    <strong className="accent-text">{formatDuration(trimEnd - trimStart)}</strong>
                  </div>
                  {splitPoints.length > 0 && (
                    <div className="split-list">
                      <span>Bölünmüş Noktalar:</span>
                      <div className="split-chips">
                        {splitPoints.map((pt, i) => (
                          <span key={pt} className="split-chip">
                            Parça {i + 1}: {pt}s
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <button
                    className="btn ghost pill small"
                    onClick={() => {
                      setTrimStart(0);
                      setTrimEnd(duration);
                      setSplitPoints([]);
                    }}
                  >
                    {t('editor_reset_trim')}
                  </button>
                </div>
              </div>
            )}

            {/* Speed Tab */}
            {activeTab === 'speed' && (
              <div className="tool-pane">
                <h3>{t('editor_tab_speed')}</h3>
                <p className="pane-desc">Ağır çekim veya dinamik hızlandırma ile tempoyu ayarlayın.</p>
                <div className="speed-buttons-grid">
                  {SPEED_OPTIONS.map((rate) => (
                    <button
                      key={rate}
                      className={`speed-option-btn${speed === rate ? ' active' : ''}`}
                      onClick={() => setSpeed(rate)}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Filters Tab */}
            {activeTab === 'filters' && (
              <div className="tool-pane">
                <h3>{t('editor_tab_filters')}</h3>
                <div className="filters-grid">
                  {FILTERS.map((f) => (
                    <button
                      key={f.id}
                      className={`filter-card-btn${filter === f.id ? ' active' : ''}`}
                      onClick={() => setFilter(f.id)}
                    >
                      <div className="filter-card-preview" style={{ filter: f.style }}>
                        <span className="filter-letter">{f.labelTr[0]}</span>
                      </div>
                      <span className="filter-title">{lang === 'ru' ? f.labelRu : f.labelTr}</span>
                      {filter === f.id && <CheckIcon size={14} className="filter-check" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Beauty Tab */}
            {activeTab === 'beauty' && (
              <div className="tool-pane">
                <h3>{t('editor_tab_beauty')}</h3>
                <p className="pane-desc">CapCut yüz pürüzsüzleştirme ve ışık dengesi.</p>
                <div className="sliders-stack">
                  <label className="slider-row">
                    <span>{t('editor_beauty_smooth')} ({beautySmooth}%)</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={beautySmooth}
                      onChange={(e) => setBeautySmooth(parseInt(e.target.value, 10))}
                    />
                  </label>
                  <label className="slider-row">
                    <span>{t('editor_beauty_bright')} ({beautyBright}%)</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={beautyBright}
                      onChange={(e) => setBeautyBright(parseInt(e.target.value, 10))}
                    />
                  </label>
                  <label className="slider-row">
                    <span>{t('editor_beauty_rosy')} ({beautyRosy}%)</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={beautyRosy}
                      onChange={(e) => setBeautyRosy(parseInt(e.target.value, 10))}
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Stickers Tab */}
            {activeTab === 'stickers' && (
              <div className="tool-pane">
                <h3>{t('editor_tab_stickers')}</h3>
                <p className="pane-desc">Videonun üzerine dokunarak çıkartma yerleştirin.</p>
                <div className="stickers-palette-grid">
                  {STICKER_PALETTE.map((stk) => (
                    <button
                      key={stk}
                      className="sticker-pick-btn"
                      onClick={() => addSticker(stk)}
                    >
                      {stk}
                    </button>
                  ))}
                </div>
                {stickers.length > 0 && (
                  <button
                    className="btn ghost pill small clear-stk-btn"
                    onClick={() => setStickers([])}
                  >
                    Tüm Çıkartmaları Temizle ({stickers.length})
                  </button>
                )}
              </div>
            )}

            {/* Text Overlay Tab */}
            {activeTab === 'text' && (
              <div className="tool-pane">
                <h3>{t('editor_tab_text')}</h3>
                <input
                  type="text"
                  value={textOverlay}
                  placeholder={t('editor_text_placeholder')}
                  onChange={(e) => setTextOverlay(e.target.value)}
                  className="studio-input"
                  maxLength={50}
                />
                <div className="text-controls-row">
                  <div className="color-swatches-inline">
                    {['#ffffff', '#fe2c55', '#25f4ee', '#ffff00', '#ff9800', '#9c27b0'].map((c) => (
                      <button
                        key={c}
                        className={`text-swatch${textColor === c ? ' active' : ''}`}
                        style={{ backgroundColor: c }}
                        onClick={() => setTextColor(c)}
                      />
                    ))}
                  </div>
                  <div className="pos-picker">
                    {(['top', 'center', 'bottom'] as const).map((pos) => (
                      <button
                        key={pos}
                        className={`pos-btn${textPosition === pos ? ' active' : ''}`}
                        onClick={() => setTextPosition(pos)}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Transitions Tab */}
            {activeTab === 'transitions' && (
              <div className="tool-pane">
                <h3>{t('editor_tab_transitions')}</h3>
                <div className="transitions-grid">
                  {(['none', 'fade', 'zoom', 'wipe', 'glitch', 'flash'] as TransitionType[]).map((tr) => (
                    <button
                      key={tr}
                      className={`transition-btn${transition === tr ? ' active' : ''}`}
                      onClick={() => setTransition(tr)}
                    >
                      <span className="tr-title">{tr.toUpperCase()}</span>
                      {transition === tr && <CheckIcon size={14} />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Templates Tab */}
            {activeTab === 'templates' && (
              <div className="tool-pane">
                <h3>{t('editor_tab_templates')}</h3>
                <p className="pane-desc">Tek dokunuşla profesyonel CapCut şablonları uygulayın.</p>
                <div className="templates-list">
                  <button className="template-card" onClick={() => applyTemplate('trend')}>
                    <div className="template-icon">🔥</div>
                    <div className="template-info">
                      <strong>Viral Trend</strong>
                      <span>1.25x Hız · Sinema Filtresi · Glitch Geçişi</span>
                    </div>
                  </button>
                  <button className="template-card" onClick={() => applyTemplate('vlog')}>
                    <div className="template-icon">🌿</div>
                    <div className="template-info">
                      <strong>Vlog Aesthetic</strong>
                      <span>1.0x Normal · Sıcak Ton · Pürüzsüz Cilt · Fade</span>
                    </div>
                  </button>
                  <button className="template-card" onClick={() => applyTemplate('cinema')}>
                    <div className="template-icon">🎬</div>
                    <div className="template-info">
                      <strong>Cinematic Reel</strong>
                      <span>0.75x Ağır Çekim · Sinema Kontrastı · Zoom</span>
                    </div>
                  </button>
                  <button className="template-card" onClick={() => applyTemplate('beat')}>
                    <div className="template-icon">⚡</div>
                    <div className="template-info">
                      <strong>Fast Beat</strong>
                      <span>1.5x Dinamik Hız · Siber Filtre · Flash Geçiş</span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* AI Assisted Editing Tab */}
            {activeTab === 'ai' && (
              <div className="tool-pane">
                <h3>{t('editor_tab_ai')}</h3>
                <p className="pane-desc">Yapay zeka ile video kurgunuzu ve erişiminizi katlayın.</p>
                <div className="ai-tools-list">
                  <div className="ai-card">
                    <div className="ai-card-head">
                      <WandIcon size={18} />
                      <strong>{t('editor_ai_captions')}</strong>
                    </div>
                    <p>Otomatik olarak konuşmaları analiz edip dinamik altyazılar üretir.</p>
                    <button className="btn accent pill small" onClick={handleAiCaptions}>
                      {aiCaptions.length > 0 ? 'Altyazıları Güncelle' : 'Altyazı Oluştur'}
                    </button>
                    {aiCaptions.length > 0 && (
                      <div className="ai-caption-preview">
                        {aiCaptions.map((cap, i) => (
                          <div key={i} className="ai-sub-line">
                            <span className="ai-sub-tag">0{i * 3}s:</span> <span>{cap}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="ai-card">
                    <div className="ai-card-head">
                      <SparklesIcon size={18} />
                      <strong>{t('editor_ai_hook')}</strong>
                    </div>
                    <p>Keşfet ve trendlere uygun viral başlık ve etiket önerileri üretir.</p>
                    <button className="btn ghost pill small" onClick={handleAiHook}>
                      Başlık & Etiket Üret
                    </button>
                  </div>

                  <div className="ai-card">
                    <div className="ai-card-head">
                      <FilterIcon size={18} />
                      <strong>{t('editor_ai_enhance')}</strong>
                    </div>
                    <p>Işık, kontrast ve renk canlılığını tek tıkla en uygun seviyeye getirir.</p>
                    <button className="btn accent pill small" onClick={handleAiAutoEnhance}>
                      1-Tıkla İyileştir
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
