import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

interface ContentHeaderProps {
  title: string;
  subtitle?: string;
  onMenuClick?: () => void;
  showMenu?: boolean;
}

export default function ContentHeader({
  title,
  subtitle,
  onMenuClick,
  showMenu = false,
}: ContentHeaderProps) {
  return (
    <Box
      component="header"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        height: 56,
        px: 3,
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        flexShrink: 0,
      }}
    >
      {showMenu && (
        <IconButton
          onClick={onMenuClick}
          size="small"
          aria-label="打开侧边栏"
          sx={{
            display: { xs: 'flex', md: 'none' },
            color: 'text.secondary',
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </IconButton>
      )}
      <Typography variant="h2" component="h1" sx={{ fontSize: '1.125rem' }}>
        {title}
        {subtitle && (
          <Box component="span" sx={{ fontWeight: 500, fontSize: '0.875rem', color: 'text.secondary', ml: 0.5 }}>
            {subtitle}
          </Box>
        )}
      </Typography>
    </Box>
  );
}
