import React, { useState } from 'react';
import { styled } from '@mui/material/styles';
import { 
  Box, 
  List, 
  ListItemIcon, 
  ListItemText,
  ListItemButton,
  Collapse,
  Tooltip,
  Button,
  Typography
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CreateIcon from '@mui/icons-material/Create';
// Kategori ikonları
import AllInboxIcon from '@mui/icons-material/AllInbox';
import WarningIcon from '@mui/icons-material/Warning';
import CampaignIcon from '@mui/icons-material/Campaign';
import InfoIcon from '@mui/icons-material/Info';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ReceiptIcon from '@mui/icons-material/Receipt';
import DeleteIcon from '@mui/icons-material/Delete';

const SidebarOption = styled(ListItemButton)<{ isCollapsed?: boolean }>(({ theme, isCollapsed }) => ({
  display: 'flex',
  alignItems: 'center',
  height: '40px', // Yükseklik artırıldı
  padding: isCollapsed ? '0 12px' : '0 12px 0 26px',
  borderStartEndRadius: '18px',
  borderEndEndRadius: '18px',
  justifyContent: isCollapsed ? 'center' : 'flex-start',
  marginTop: '8px',
  marginBottom: '8px',
  "&.Mui-selected": {
    backgroundColor: '#d3e3fd',
    fontWeight: 'bold',
    "& .MuiListItemIcon-root": {
      color: theme.palette.primary.main
    },
    "& .MuiListItemText-primary": {
      fontWeight: 'bold',
      color: theme.palette.primary.main
    }
  },
  "&:hover": {
    backgroundColor: '#eaebef',
  }
}));

// Özel ListItemText bileşeni - büyük yazı için
const EnhancedListItemText = styled(ListItemText)(({ theme }) => ({
  '& .MuiListItemText-primary': {
    fontSize: '0.95rem', // Kategori yazı boyutu
    fontWeight: 500,
  }
}));

// Kategori başlık bileşeni
const CategoryHeader = styled(Box)(({ theme }) => ({
  padding: '8px 8px 8px 24px',
  marginTop: '16px',
  marginBottom: '8px',
  color: theme.palette.text.secondary,
  fontWeight: 500,
  fontSize: '0.85rem',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}));

// Kategoriler
const categories = [
  { id: 0, label: "Tüm e-postalar", icon: <AllInboxIcon fontSize="small" />, value: "all" },
  { id: 1, label: "Şüpheli içerik barındıran", icon: <WarningIcon fontSize="small" />, value: "Şüpheli veya Güvenlik İçerikli" },
  { id: 2, label: "Pazarlama/Reklam", icon: <CampaignIcon fontSize="small" />, value: "Pazarlama ve Reklam (Tanıtımlar)" },
  { id: 3, label: "Bilgilendirme", icon: <InfoIcon fontSize="small" />, value: "Diğer" },
  { id: 4, label: "Kişisel iletişim", icon: <PersonIcon fontSize="small" />, value: "Sosyal" },
  { id: 5, label: "İş/profesyonel iletişim", icon: <BusinessIcon fontSize="small" />, value: "İş ve Profesyonel İletişim" },
  { id: 6, label: "Abonelik bildirimleri", icon: <NotificationsIcon fontSize="small" />, value: "Abonelik Bildirimleri" },
  { id: 7, label: "Fatura finansal bildirimler", icon: <ReceiptIcon fontSize="small" />, value: "Fatura ve Finansal Bildirimler" }
];

interface SidebarProps {
  isCollapsed?: boolean;
  onCategoryChange?: (category: string) => void;
  onComposeClick?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed = false, onCategoryChange, onComposeClick }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [moreOpen, setMoreOpen] = useState(true); // Başlangıçta açık olacak
  const [selectedSpecialCategory, setSelectedSpecialCategory] = useState<string | null>(null);

  const handleListItemClick = (index: number) => {
    setSelectedIndex(index);
    setSelectedSpecialCategory(null);
    // Kategori değişikliğini parent bileşene bildir
    if (onCategoryChange) {
      onCategoryChange(categories[index].value);
    }
  };

  const handleSpecialCategoryClick = (category: string) => {
    setSelectedIndex(-1); // Ana kategorileri seçilmemiş olarak işaretle
    setSelectedSpecialCategory(category);
    // Kategori değişikliğini parent bileşene bildir
    if (onCategoryChange) {
      onCategoryChange(category);
    }
  };

  const toggleMore = () => {
    setMoreOpen(!moreOpen);
  };

  return (
    <Box className="sidebar" sx={{ 
      backgroundColor: 'white', 
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid #f1f3f4',
      height: '100%',
      overflowY: 'auto',
      overflowX: 'hidden',
      transition: 'width 0.3s ease',
      pt: 2,
      px: 2
    }}>
      <Button
        className="compose-btn"
        variant="contained"
        startIcon={<CreateIcon />}
        onClick={onComposeClick}
        sx={{
          backgroundColor: '#c2e7ff',
          color: '#001d35',
          borderRadius: '24px',
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '1.1rem',
          boxShadow: '0 1px 3px 0 rgba(60,64,67,0.302)',
          px: 3,
          py: 1.5,
          mb: 3, // Biraz daha boşluk
          width: '100%',
          justifyContent: 'flex-start',
          '&:hover': {
            backgroundColor: '#b3d1ff',
            boxShadow: '0 1px 3px 0 rgba(60,64,67,0.302)',
          }
        }}
      >
        Oluştur
      </Button>
      
      {!isCollapsed && (
        <CategoryHeader>
          <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>
            Kategoriler
          </Typography>
        </CategoryHeader>
      )}
      
      <List disablePadding sx={{ pt: 1, pb: 1 }}>
        {categories.map((category) => (
          <Tooltip 
            key={category.id} 
            title={isCollapsed ? category.label : ""} 
            placement="right"
          >
            <SidebarOption 
              selected={selectedIndex === category.id && selectedSpecialCategory === null}
              onClick={() => handleListItemClick(category.id)}
              isCollapsed={isCollapsed}
            >
              <ListItemIcon sx={{ minWidth: isCollapsed ? '0' : '20px', marginRight: isCollapsed ? '0' : '18px' }}>
                {category.icon}
              </ListItemIcon>
              {!isCollapsed && (
                <EnhancedListItemText primary={category.label} />
              )}
            </SidebarOption>
          </Tooltip>
        ))}
      </List>
    </Box>
  );
};

export default Sidebar; 