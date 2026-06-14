import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

interface StatCardProps {
  icon: string;
  label: string;
  amount: string;
  delta: string;
  color: string;
}

export default function StatCard({ icon, label, amount, delta, color }: StatCardProps) {
  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 3.5,
        p: 2.5,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
        <Typography sx={{ fontSize: '1rem' }}>{icon}</Typography>
        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', fontWeight: 500 }}>{label}</Typography>
      </Box>
      <Typography sx={{ fontSize: '1.625rem', fontWeight: 700, color, letterSpacing: '-0.5px', mb: 0.75 }}>
        {amount}
      </Typography>
      <Typography sx={{ fontSize: '0.6875rem', color }}>
        {delta}
      </Typography>
    </Box>
  );
}
