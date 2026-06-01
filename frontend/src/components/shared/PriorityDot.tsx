import Box from '@mui/material/Box';

const COLORS: Record<number, string> = {
  1: 'oklch(55% 0.18 25)',
  2: 'oklch(65% 0.16 75)',
  3: 'oklch(82% 0.01 275)',
};

interface PriorityDotProps {
  priority: number;
  size?: number;
}

export default function PriorityDot({ priority, size = 10 }: PriorityDotProps) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: COLORS[priority] || COLORS[3],
        flexShrink: 0,
      }}
    />
  );
}
