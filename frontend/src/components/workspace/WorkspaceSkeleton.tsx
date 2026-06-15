'use client';

import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';

export default function WorkspaceSkeleton() {
  return (
    <Box sx={{ minHeight: 'calc(100dvh - 64px)', bgcolor: 'background.default', pt: 4 }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, sm: 3 }, mb: 3 }}>
        <Skeleton variant="text" width="min(48%, 280px)" height={36} />
        <Skeleton variant="text" width="min(64%, 420px)" height={22} />
      </Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: 2,
          px: { xs: 2, sm: 3 },
          pb: 4,
          maxWidth: 1200,
          mx: 'auto',
        }}
      >
        <Skeleton variant="rounded" height={210} sx={{ borderRadius: 3, gridColumn: { xs: 'span 1', sm: 'span 2' } }} />
        <Skeleton variant="rounded" height={210} sx={{ borderRadius: 3 }} />
        <Skeleton variant="rounded" height={210} sx={{ borderRadius: 3 }} />
        <Skeleton variant="rounded" height={180} sx={{ borderRadius: 3 }} />
        <Skeleton variant="rounded" height={180} sx={{ borderRadius: 3, gridColumn: { xs: 'span 1', sm: 'span 2' } }} />
      </Box>
    </Box>
  );
}
