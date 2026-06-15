'use client';

import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';

export default function FinancePageSkeleton() {
  return (
    <Box sx={{ flex: 1, overflow: 'hidden', bgcolor: 'background.default', px: { xs: 2, sm: 3 }, py: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ width: 'min(100%, 320px)' }}>
          <Skeleton variant="text" width="68%" height={34} />
          <Skeleton variant="text" width="46%" height={20} />
        </Box>
        <Skeleton variant="rounded" width={92} height={36} sx={{ borderRadius: 2 }} />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2, mb: 2 }}>
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} variant="rounded" height={118} sx={{ borderRadius: 3 }} />
        ))}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2, mb: 2 }}>
        <Skeleton variant="rounded" height={260} sx={{ borderRadius: 3 }} />
        <Skeleton variant="rounded" height={260} sx={{ borderRadius: 3 }} />
      </Box>

      <Skeleton variant="rounded" height={220} sx={{ borderRadius: 3 }} />
    </Box>
  );
}
