import { useEffect, useRef, useState, type DragEvent } from 'react';
import type { RouteProps } from '../router/router';
import { navigate } from '../router/router';
import { normalizeVideo, videoApi } from '../api/endpoints';
import { probeVideo, releaseProbe, uploadVideo, type Probe } from '../media/uploader';
import { feedStore } from '../store/feed';
import { useAuthStatus } from '../store/auth';
import { toast } from '../store/ui';
import { SpinnerIcon, UploadIcon, WandIcon } from '../components/icons';
import { formatDuration } from '../utils/format';
import { VideoEditor, type VideoEditorState } from '../components/VideoEditor';
import { useI18n } from '../store/i18n';

const MAX_MB = 200;

export default function UploadPage(_props: RouteProps) {
  const { t, lang } = useI18n();
  const status = useAuthStatus();
  const [file, setFile] = useState<File | null>(null);
  const [probe, setProbe] = useState<Probe | null>(null);
  const [caption, setCaption] = useState('');
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<'pick' | 'ready' | 'uploading' | 'done'>('pick');
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [editorState, setEditorState] = useState<VideoEditorState | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const probeRef = useRef<Probe | null>(null);

  useEffect(
    () => () => {
      releaseProbe(probeRef.current);
    },
    []
  );

  if (status !== 'ready') {
    return (
      <div className="upload-page">
        <div className="guard-card">
          <h1>{t('upload_guard_title')}</h1>
          <p>{t('upload_guard_desc')}</p>
          <button className="btn accent pill" onClick={() => navigate('/login')}>
            {t('upload_go_login')}
          </button>
        </div>
      </div>
    );
  }

  const accept = async (picked: File | null) => {
    if (!picked) return;
    if (!picked.type.startsWith('video/')) {
      setError(t('upload_file_invalid'));
      return;
    }
    if (picked.size > MAX_MB * 1024 * 1024) {
      setError(t('upload_file_too_large'));
      return;
    }
    setError(null);
    releaseProbe(probeRef.current);
    setFile(picked);
    setStage('pick');
    setProgress(0);
    try {
      const result = await probeVideo(picked);
      probeRef.current = result;
      setProbe(result);
      setStage('ready');
    } catch (err) {
      setFile(null);
      setError(err instanceof Error ? err.message : t('upload_read_failed'));
    }
  };

  const publish = async () => {
    if (!file || !probe || stage === 'uploading') return;
    setStage('uploading');
    setProgress(0);
    setError(null);

    const finalDuration = editorState
      ? Math.max(0.5, Math.round(((editorState.trimEnd - editorState.trimStart) / editorState.speed) * 10) / 10)
      : probe.duration;

    const finalCaption = caption.trim();

    try {
      const uploaded = await uploadVideo(
        file,
        { caption: finalCaption, duration: finalDuration, width: probe.width, height: probe.height },
        setProgress
      );
      setProgress(1);
      const created = await videoApi.create({
        caption: finalCaption,
        duration: finalDuration,
        width: probe.width,
        height: probe.height,
        poster: probe.poster,
        media_key: uploaded.media_key
      });
      const video = normalizeVideo(created.video);
      feedStore.upsertVideo(video);
      setStage('done');
      toast(t('publish_success'), 'ok');
      navigate(`/video/${video.id}`);
    } catch (err) {
      setStage('ready');
      setError(err instanceof Error ? err.message : t('publish_failed'));
      toast(t('publish_failed'), 'error');
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    void accept(e.dataTransfer.files?.[0] ?? null);
  };

  const handleAiHookQuick = () => {
    const hook =
      lang === 'ru'
        ? 'Смотри до конца, такого ты точно не ожидал! 😱 #тренды #рек #FastVideo #Shorts'
        : 'Bunu sonuna kadar izleyenler şokta! 😱 Kesinlikle denemelisiniz #Viral #Trend #Keşfet #Shorts #FastVideo';
    setCaption(hook);
    toast(t('editor_ai_hook'), 'ok');
  };

  return (
    <div className="upload-page">
      <div className="page-head">
        <h1>{t('upload_title')}</h1>
      </div>

      {!probe ? (
        <div className="upload-grid upload-grid-empty">
          <div
            className={`dropzone${dragging ? ' dragging' : ''}`}
            role="button"
            tabIndex={0}
            aria-label={t('upload_drop_title')}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key !== 'Enter' && e.key !== ' ') return;
              e.preventDefault();
              inputRef.current?.click();
            }}
          >
            <UploadIcon size={44} strokeWidth={1.6} />
            <p>{t('upload_drop_title')}</p>
            <span className="drop-hint">{t('upload_drop_hint')}</span>
            <span className="drop-length-info">{t('upload_length_info')}</span>
            <input
              ref={inputRef}
              type="file"
              accept="video/*"
              hidden
              onChange={(e) => void accept(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>
      ) : (
        <div className="upload-editor-layout">
          {/* CapCut Video Editing Suite */}
          <VideoEditor
            videoUrl={probe.objectUrl}
            duration={probe.duration}
            onStateChange={setEditorState}
            onApplyAiCaption={(c) => setCaption(c)}
          />

          {/* Publishing Form & Metadata */}
          <div className="upload-publish-bar">
            <div className="publish-caption-box">
              <div className="caption-head-row">
                <label className="caption-label">{t('upload_caption_label')}</label>
                <button
                  type="button"
                  className="btn ghost pill small ai-quick-btn"
                  onClick={handleAiHookQuick}
                  title="Yapay zeka ile viral başlık ve etiket üret"
                >
                  <WandIcon size={13} />
                  <span>{t('editor_ai_hook')}</span>
                </button>
              </div>
              <textarea
                rows={3}
                value={caption}
                maxLength={200}
                placeholder={t('upload_caption_placeholder')}
                onChange={(e) => setCaption(e.target.value)}
                className="publish-caption-input"
              />
            </div>

            <div className="publish-meta-summary">
              <div className="meta-summary-item">
                <span>{t('upload_meta_duration')}:</span>
                <strong>
                  {formatDuration(
                    editorState
                      ? Math.max(0.5, (editorState.trimEnd - editorState.trimStart) / editorState.speed)
                      : probe.duration
                  )}
                </strong>
              </div>
              <div className="meta-summary-item">
                <span>{t('upload_meta_resolution')}:</span>
                <strong>{probe.width}×{probe.height}</strong>
              </div>
              <div className="meta-summary-item">
                <span>{t('upload_meta_size')}:</span>
                <strong>{file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : '—'}</strong>
              </div>
              <div className="meta-summary-item">
                <span>{t('action_speed')}:</span>
                <strong>{editorState ? `${editorState.speed}x` : '1.0x'}</strong>
              </div>
            </div>

            {stage === 'uploading' || stage === 'done' ? (
              <div className="progress publish-progress">
                <div className="progress-fill" style={{ transform: `scaleX(${progress})` }} />
                <span>{Math.round(progress * 100)}%</span>
              </div>
            ) : null}

            {error ? <p className="form-error">{error}</p> : null}

            <div className="publish-actions-row">
              <button
                className="btn ghost pill"
                onClick={() => {
                  releaseProbe(probeRef.current);
                  probeRef.current = null;
                  setProbe(null);
                  setFile(null);
                  setStage('pick');
                }}
              >
                {t('action_reselect')}
              </button>
              <button
                className="btn accent pill publish-submit-btn"
                onClick={publish}
                disabled={!probe || stage === 'uploading'}
              >
                {stage === 'uploading' ? <SpinnerIcon size={17} /> : null}
                <span>{stage === 'uploading' ? t('action_uploading') : t('action_publish')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
