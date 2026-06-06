import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

interface SubTransactionProps {
  note: string;
  amount: number;
  isLast: boolean;
}

export default function SubTransaction({ note, amount, isLast }: SubTransactionProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        py: 1.25,
        px: 2.25,
        pl: 8.25,
        borderBottom: isLast ? 'none' : '1px solid',
        borderColor: '#F0EFF4',
        fontSize: '0.75rem',
        color: '#4B5563',
      }}
    >
      <Typography sx={{ mr: 0.75, color: '#D1D5DB', fontSize: '0.75rem' }}>
        {isLast ? '└' : '├'}
      </Typography>
      <Typography sx={{ flex: 1, fontSize: '0.75rem', color: '#4B5563' }}>{note}</Typography>
      <Typography sx={{ fontWeight: 700, color: '#EF4444', textAlign: 'right', minWidth: 80, fontSize: '0.75rem' }}>
        -¥{amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </Typography>
    </Box>
  );
}
