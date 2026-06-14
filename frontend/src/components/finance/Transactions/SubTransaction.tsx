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
        borderColor: 'divider',
        fontSize: '0.75rem',
        color: 'text.secondary',
      }}
    >
      <Typography sx={{ mr: 0.75, color: 'text.disabled', fontSize: '0.75rem' }}>
        {isLast ? '└' : '├'}
      </Typography>
      <Typography sx={{ flex: 1, fontSize: '0.75rem', color: 'text.secondary' }}>{note}</Typography>
      <Typography sx={{ fontWeight: 700, color: 'error.main', textAlign: 'right', minWidth: 80, fontSize: '0.75rem' }}>
        -¥{amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </Typography>
    </Box>
  );
}
