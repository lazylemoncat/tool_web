import Box from '@mui/material/Box';

export default function Skeleton() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {[0, 1, 2, 3].map((i) => (
        <Box
          key={i}
          sx={{
            p: 2.25,
            bgcolor: 'oklch(99% 0.002 275)',
            borderRadius: 3,
            display: 'flex',
            gap: 1.5,
            alignItems: 'center',
          }}
        >
          <Box
            sx={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              bgcolor: 'oklch(93% 0.01 275)',
              flexShrink: 0,
              animation: 'pulse 1.5s ease-in-out infinite',
              '@keyframes pulse': {
                '0%,100%': { opacity: 1 },
                '50%': { opacity: 0.4 },
              },
            }}
          />
          <Box sx={{ flex: 1 }}>
            <Box
              sx={{
                height: 12,
                borderRadius: '6px',
                bgcolor: 'oklch(93% 0.01 275)',
                mb: 1,
                animation: 'pulse 1.5s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%,100%': { opacity: 1 },
                  '50%': { opacity: 0.4 },
                },
              }}
            />
            <Box
              sx={{
                height: 12,
                borderRadius: '6px',
                bgcolor: 'oklch(93% 0.01 275)',
                width: '60%',
                animation: 'pulse 1.5s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%,100%': { opacity: 1 },
                  '50%': { opacity: 0.4 },
                },
              }}
            />
          </Box>
        </Box>
      ))}
    </Box>
  );
}
