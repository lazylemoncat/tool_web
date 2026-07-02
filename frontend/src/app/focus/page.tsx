'use client';

import { useCallback, useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import ContentHeader from '@/components/layout/ContentHeader';
import FocusSidebar, { type FocusTab } from '@/components/focus/FocusSidebar';
import FocusTimer from '@/components/focus/FocusTimer';
import FocusOverview from '@/components/focus/FocusOverview';
import FocusRecords from '@/components/focus/FocusRecords';
import FocusFolders from '@/components/focus/FocusFolders';
import FocusTags from '@/components/focus/FocusTags';
import {
  createFocusFolder,
  createFocusTag,
  getFocusSummary,
  listFocusFolders,
  listFocusTags,
} from '@/lib/api/focus';
import type {
  FocusFolderOut,
  FocusRange,
  FocusSummaryResponse,
  FocusTag,
} from '@/lib/focusTypes';

const TAB_LABELS: Record<FocusTab, string> = {
  timer: '计时',
  overview: '数据总览',
  records: '记录',
  folders: '文件夹',
  tags: '标签',
};

export default function FocusPage() {
  const [activeTab, setActiveTab] = useState<FocusTab>('timer');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [folders, setFolders] = useState<FocusFolderOut[]>([]);
  const [tags, setTags] = useState<FocusTag[]>([]);
  const [summary, setSummary] = useState<FocusSummaryResponse | null>(null);
  const [summaryRange, setSummaryRange] = useState<FocusRange>('7d');
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [snackbar, setSnackbar] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);

  const fetchMeta = useCallback(async () => {
    setLoadingMeta(true);
    setError(null);
    try {
      const [folderData, tagData] = await Promise.all([
        listFocusFolders(),
        listFocusTags(),
      ]);
      setFolders(folderData);
      setTags(tagData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载专注模块基础数据失败');
    } finally {
      setLoadingMeta(false);
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      setSummary(await getFocusSummary(summaryRange));
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载专注统计失败');
    } finally {
      setLoadingSummary(false);
    }
  }, [summaryRange]);

  useEffect(() => {
    // Focus metadata is loaded from the backend after the client page mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchMeta();
  }, [fetchMeta]);

  useEffect(() => {
    // Focus summary is loaded from the backend when the selected range changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchSummary();
  }, [fetchSummary, refreshKey]);

  const handleSessionChanged = useCallback((message?: string) => {
    setRefreshKey((value) => value + 1);
    if (message) setSnackbar({ message, severity: 'success' });
  }, []);

  const handleCreateTag = useCallback(async (name: string): Promise<FocusTag> => {
    const tag = await createFocusTag({ name });
    setTags((previous) => {
      const merged = previous.some((item) => item.id === tag.id) ? previous : [...previous, tag];
      return [...merged].sort((left, right) => left.name.localeCompare(right.name, 'zh-Hans-CN'));
    });
    setSnackbar({ message: '标签已保存', severity: 'success' });
    return tag;
  }, []);

  const handleCreateFolder = useCallback(async (name: string): Promise<FocusFolderOut> => {
    const folder = await createFocusFolder({ name });
    setFolders((previous) => {
      const merged = previous.some((item) => item.id === folder.id) ? previous : [...previous, folder];
      return [...merged].sort((left, right) => left.sort_order - right.sort_order || left.id - right.id);
    });
    setSnackbar({ message: '文件夹已保存', severity: 'success' });
    return folder;
  }, []);

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      <FocusSidebar
        activeTab={activeTab}
        open={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        onTabChange={setActiveTab}
      />

      <Box component="main" sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <ContentHeader
          title={TAB_LABELS[activeTab]}
          subtitle="番茄钟, 记录, 复盘"
          showMenu
          onMenuClick={() => setMobileSidebarOpen(true)}
        />

        {error && (
          <Alert severity="error" sx={{ borderRadius: 0 }}>
            {error}
          </Alert>
        )}

        {loadingMeta ? (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {activeTab === 'timer' && (
              <FocusTimer
                folders={folders}
                tags={tags}
                onSessionSaved={(message) => handleSessionChanged(message)}
                onCreateTag={handleCreateTag}
              />
            )}
            {activeTab === 'overview' && (
              <FocusOverview
                range={summaryRange}
                summary={summary}
                loading={loadingSummary}
                onRangeChange={setSummaryRange}
                onRefresh={fetchSummary}
              />
            )}
            {activeTab === 'records' && (
              <FocusRecords
                folders={folders}
                tags={tags}
                refreshKey={refreshKey}
                onChanged={() => handleSessionChanged('记录已更新')}
                onCreateTag={handleCreateTag}
              />
            )}
            {activeTab === 'folders' && (
              <FocusFolders
                folders={folders}
                onCreateFolder={handleCreateFolder}
              />
            )}
            {activeTab === 'tags' && (
              <FocusTags
                tags={tags}
                onCreateTag={handleCreateTag}
              />
            )}
          </>
        )}
      </Box>

      <Snackbar
        open={!!snackbar}
        autoHideDuration={3000}
        onClose={() => setSnackbar(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {snackbar ? (
          <Alert severity={snackbar.severity} onClose={() => setSnackbar(null)} sx={{ borderRadius: 2 }}>
            {snackbar.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
}
