import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, Download, Trash2, FolderDown, Image as ImageIcon } from 'lucide-react';
import {
  getStoredSnapshots,
  deleteStoredSnapshot,
  clearStoredSnapshots,
  type StoredSnapshot,
} from '../../utils/snapshot';

export const SnapshotsGalleryCard: React.FC = () => {
  const { t } = useTranslation();
  const [snapshots, setSnapshots] = useState<StoredSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadSnapshots = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await getStoredSnapshots();
      setSnapshots(list);
    } catch (err) {
      console.warn('Failed to load snapshots:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSnapshots();
    // Poll or re-check periodically for new captures
    const timer = setInterval(loadSnapshots, 4000);
    return () => clearInterval(timer);
  }, [loadSnapshots]);

  const handleDownload = (snapshot: StoredSnapshot) => {
    const url = URL.createObjectURL(snapshot.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = snapshot.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 8000);
  };

  const handleDelete = async (id: string) => {
    await deleteStoredSnapshot(id);
    setSnapshots((prev) => prev.filter((s) => s.id !== id));
  };

  const handleClearAll = async () => {
    if (snapshots.length === 0) return;
    await clearStoredSnapshots();
    setSnapshots([]);
  };

  const handleDownloadAll = () => {
    snapshots.forEach((snap, idx) => {
      setTimeout(() => {
        handleDownload(snap);
      }, idx * 250);
    });
  };

  return (
    <div className="bg-card border border-border/70 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground font-display flex items-center gap-2">
              {t('studio.snapshots.title', 'Snapshots Gallery')}
              <span className="text-xs font-normal text-muted bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {snapshots.length}
              </span>
            </h3>
            <p className="text-xs text-muted">
              {t('studio.snapshots.subtitle', 'Saved locally in IndexedDB from the Victory ✌️ gesture')}
            </p>
          </div>
        </div>

        {snapshots.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadAll}
              title={t('studio.snapshots.downloadAll', 'Download all')}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-1.5"
            >
              <FolderDown className="w-3.5 h-3.5" />
              <span>{t('studio.snapshots.downloadAll', 'Download All')}</span>
            </button>
            <button
              onClick={handleClearAll}
              title={t('studio.snapshots.clearAll', 'Clear all')}
              className="px-2.5 py-1 text-xs font-medium rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t('studio.snapshots.clear', 'Clear')}</span>
            </button>
          </div>
        )}
      </div>

      {isLoading && snapshots.length === 0 ? (
        <div className="py-8 text-center text-xs text-muted">
          {t('common.loading', 'Loading snapshots...')}
        </div>
      ) : snapshots.length === 0 ? (
        <div className="py-8 px-4 text-center border border-dashed border-border/80 rounded-xl bg-background/50 space-y-2">
          <ImageIcon className="w-7 h-7 mx-auto text-muted/60" />
          <p className="text-xs font-medium text-foreground">
            {t('studio.snapshots.emptyTitle', 'No snapshots captured yet')}
          </p>
          <p className="text-xs text-muted max-w-sm mx-auto">
            {t(
              'studio.snapshots.emptyHint',
              'Hold the Victory ✌️ gesture for 600ms to capture real high-res PNG snapshots with hand skeleton overlay.'
            )}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-72 overflow-y-auto pr-1">
          {snapshots.map((snap) => {
            const previewSrc = snap.dataUrl || (snap.blob ? URL.createObjectURL(snap.blob) : '');
            return (
              <div
                key={snap.id}
                className="group relative rounded-xl border border-border/60 overflow-hidden bg-background aspect-video flex flex-col justify-between"
              >
                <img
                  src={previewSrc}
                  alt={snap.filename}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end">
                  <div className="text-[10px] text-white truncate font-mono mb-1">
                    {snap.filename}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleDownload(snap)}
                      className="p-1 rounded bg-white/20 hover:bg-white/40 text-white transition-colors"
                      title={t('common.download', 'Download')}
                    >
                      <Download className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDelete(snap.id)}
                      className="p-1 rounded bg-rose-500/80 hover:bg-rose-600 text-white transition-colors"
                      title={t('common.delete', 'Delete')}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <span className="text-[9px] uppercase px-1 rounded bg-sky-500/80 text-white ml-auto">
                      {snap.mode}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
