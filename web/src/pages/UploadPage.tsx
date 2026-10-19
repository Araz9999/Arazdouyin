import { useEffect, useRef, useState, type DragEvent } from 'react';
import type { RouteProps } from '../router/router';
import { navigate } from '../router/router';
import { normalizeVideo, videoApi } from '../api/endpoints';
import { probeVideo, releaseProbe, uploadVideo, type Probe } from '../media/uploader';
import { feedStore } from '../store/feed';
import { useAuthStatus } from '../store/auth';
import { toast } from '../store/ui';
import { SpinnerIcon, UploadIcon } from '../components/icons';
import { formatDuration } from '../utils/format';

import { useI18n } from '../store/i18n';

const MAX_MB = 200;

export default function UploadPage(_props: RouteProps) {
  const { t } = useI18n();
  const status = useAuthStatus();
  const [file, setFile] = useState<File | null>(null);
  const [probe, setProbe] = useState<Probe | null>(null);
  const [caption, setCaption] = useState('');
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<'pick' | 'ready' | 'uploading' | 'done'>('pick');
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
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
    try {
      const uploaded = await uploadVideo(
        file,
        { caption: caption.trim(), duration: probe.duration, width: probe.width, height: probe.height },
        setProgress
      );
      setProgress(1);
      const created = await videoApi.create({
        caption: caption.trim(),
        duration: probe.duration,
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

  return (
    <div className="upload-page">
      <div className="page-head">
        <h1>{t('upload_title')}</h1>
      </div>
      <div className="upload-grid">
        <div
          className={`dropzone${dragging ? ' dragging' : ''}${file ? ' filled' : ''}`}
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
          {probe ? (
            <video className="upload-preview" src={probe.objectUrl} controls muted playsInline loop />
          ) : (
            <>
              <UploadIcon size={34} strokeWidth={1.6} />
              <p>{t('upload_drop_title')}</p>
              <span className="drop-hint">{t('upload_drop_hint')}</span>
              <span className="drop-length-info">{t('upload_length_info')}</span>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            hidden
            onChange={(e) => void accept(e.target.files?.[0] ?? null)}
          />
        </div>
        <div className="upload-form">
          <label className="field">
            <span>{t('upload_caption_label')}</span>
            <textarea
              rows={4}
              value={caption}
              maxLength={200}
              placeholder={t('upload_caption_placeholder')}
              onChange={(e) => setCaption(e.target.value)}
            />
          </label>
          <dl className="meta-list">
            <div>
              <dt>{t('upload_meta_duration')}</dt>
              <dd>
                {probe ? (
                  <>
                    <span>{formatDuration(probe.duration)}</span>
                    {probe.duration >= 60 ? (
                      <span className="upload-duration-pill"> ({t('tag_long_video')})</span>
                    ) : null}
                  </>
                ) : (
                  '—'
                )}
              </dd>
            </div>
            <div>
              <dt>{t('upload_meta_resolution')}</dt>
              <dd>{probe ? `${probe.width}×${probe.height}` : '—'}</dd>
            </div>
            <div>
              <dt>{t('upload_meta_size')}</dt>
              <dd>{file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : '—'}</dd>
            </div>
            <div>
              <dt>{t('upload_meta_filename')}</dt>
              <dd className="ellipsis">{file?.name ?? '—'}</dd>
            </div>
          </dl>
          {stage === 'uploading' || stage === 'done' ? (
            <div className="progress">
              <div className="progress-fill" style={{ transform: `scaleX(${progress})` }} />
              <span>{Math.round(progress * 100)}%</span>
            </div>
          ) : null}
          {error ? <p className="form-error">{error}</p> : null}
          <div className="row-actions">
            {file ? (
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
            ) : null}
            <button className="btn accent pill" onClick={publish} disabled={!probe || stage === 'uploading'}>
              {stage === 'uploading' ? <SpinnerIcon size={17} /> : null}
              <span>{stage === 'uploading' ? t('action_uploading') : t('action_publish')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
