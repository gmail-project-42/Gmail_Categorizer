import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import EmailList from './components/EmailList';
import { Box, ThemeProvider, createTheme, useMediaQuery, IconButton, InputBase, Paper, Snackbar, Alert } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import ComposeModal from './components/ComposeModal';
import Login from './Login';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import TrashEmailList from './components/TrashEmailList';
import MagicCursor from './components/MagicCursor';

interface User {
  name: string;
  email: string;
  picture: string;
  sub: string;
}

const theme = createTheme({
  palette: {
    primary: {
      main: '#0b57d0',
    },
    secondary: {
      main: '#ea4335',
    },
    info: {
      main: '#1a73e8',
    }
  },
});

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [composeOpen, setComposeOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width:768px)');
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openMenu = Boolean(anchorEl);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info'>('info');
  const [isConnecting, setIsConnecting] = useState(false);

  // Mobil görünümde varsayılan olarak sidebar'ı kapalı tut
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [isMobile]);
  
  // Gmail bağlantısı ve veritabanı yükleme işlemi
  const connectToGmail = useCallback(async () => {
    if (!user || isConnecting) return;
    
    setIsConnecting(true);
    try {
      // 1. Gmail bağlantısı
      const response = await fetch('http://localhost:8000/mails/connect_mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_email: user?.email }),
      });
      
      if (response.ok) {
        setSnackbarMessage('Gmail hesabınıza başarıyla bağlandınız. E-postalar alınıyor...');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        
        // 2. Mailleri MongoDB'ye aktar
        try {
          const importResponse = await fetch('http://localhost:8000/mails/insert_mails_into_database', {
            method: 'POST',
          });
          
          if (importResponse.ok) {
            const importResult = await importResponse.text();
            setSnackbarMessage(`${importResult} Son 7 günün e-postaları kontrol edildi.`);
            setSnackbarSeverity('success');
          } else {
            const errorData = await importResponse.json();
            setSnackbarMessage(`E-posta aktarım hatası: ${errorData.detail || 'Bilinmeyen hata'}. Lütfen sayfayı yenileyip tekrar deneyin.`);
            setSnackbarSeverity('error');
          }
        } catch (importError) {
          setSnackbarMessage('E-posta aktarımı sırasında bağlantı hatası. Lütfen internet bağlantınızı kontrol edin ve sayfayı yenileyin.');
          setSnackbarSeverity('error');
        } finally {
          setSnackbarOpen(true);
        }
      } else {
        const errorData = await response.json();
        setSnackbarMessage(`Gmail bağlantı hatası: ${errorData.detail || 'Bağlantı kurulamadı'}. Lütfen tekrar giriş yapın.`);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } catch (error) {
      setSnackbarMessage('Sunucu bağlantı hatası. Backend servisinin çalıştığından emin olun.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsConnecting(false);
    }
  }, [user, isConnecting]);
  
  // Kullanıcı girişi yaptığında Gmail bağlantısını kur
  useEffect(() => {
    if (user) {
      connectToGmail();
    }
  }, [user, connectToGmail]);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };
  
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };
  
  const sidebarWidth = 256;
  const collapsedSidebarWidth = 70;

  const handleLogin = async (user: User) => {
    setUser(user);
    localStorage.setItem('user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setSnackbarMessage('Başarıyla çıkış yaptınız');
    setSnackbarSeverity('info');
    setSnackbarOpen(true);
  };

  const handleAvatarClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  // Kategoriye göre uygun e-posta listesini göster
  const renderEmailList = () => {
    if (selectedCategory === "trash") {
      return <TrashEmailList searchQuery={searchQuery} />;
    } else {
      return <EmailList selectedCategory={selectedCategory} searchQuery={searchQuery} />;
    }
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <ThemeProvider theme={theme}>
      <div className="app">
        <MagicCursor />
        {/* Header with Menu, Logo and Search Bar */}
        <Box sx={{ 
          height: '64px', 
          display: 'flex', 
          alignItems: 'center', 
          padding: '0 16px',
          borderBottom: '1px solid #f1f3f4',
          backgroundColor: 'white',
          gap: 2,
          position: 'relative',
        }}>
          {/* Sol: Menü ve Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={toggleSidebar}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <img 
              src="https://ssl.gstatic.com/ui/v1/icons/mail/rfr/logo_gmail_lockup_default_1x_r5.png" 
              alt="Gmail" 
              height="40px"
            />
          </Box>
          {/* Orta: Arama Çubuğu */}
          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Paper
              component="form"
              sx={{
                p: '2px 10px',
                display: 'flex',
                alignItems: 'center',
                width: 340,
                maxWidth: '100%',
                background: 'linear-gradient(90deg, #e3e6ff 0%, #fbefff 100%)',
                borderRadius: '24px',
                boxShadow: '0 4px 18px rgba(108,99,255,0.10)',
                border: '1.2px solid #e3e6ff',
                transition: 'box-shadow 0.18s, background 0.18s',
                '&:hover': {
                  boxShadow: '0 8px 24px rgba(108,99,255,0.14)',
                  background: 'linear-gradient(90deg, #fbefff 0%, #e3e6ff 100%)',
                },
                '&:focus-within': {
                  boxShadow: '0 12px 32px rgba(108,99,255,0.18)',
                  background: 'linear-gradient(90deg, #e3e6ff 0%, #fbefff 100%)',
                },
              }}
            >
              <IconButton sx={{ p: '8px', color: '#6C63FF', fontSize: 22 }} aria-label="search">
                <SearchIcon fontSize="inherit" />
              </IconButton>
              <InputBase
                sx={{ ml: 1, flex: 1, fontSize: 16, color: '#222', fontWeight: 500, letterSpacing: 0.1, background: 'transparent' }}
                placeholder="Mail ara"
                value={searchQuery}
                onChange={handleSearch}
                inputProps={{ 'aria-label': 'mail ara' }}
              />
            </Paper>
          </Box>
          {/* Sağ: Avatar ve Menü */}
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
            <IconButton onClick={handleAvatarClick} sx={{ ml: 2 }}>
              <Avatar 
                src={user.picture}
                alt={user.name}
                sx={{ width: 40, height: 40, fontWeight: 700 }}
              >
                {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
              </Avatar>
            </IconButton>
            <Menu anchorEl={anchorEl} open={openMenu} onClose={handleMenuClose}>
              <MenuItem disabled>{user.name || user.email}</MenuItem>
              <MenuItem onClick={() => { handleLogout(); handleMenuClose(); }}>Çıkış Yap</MenuItem>
            </Menu>
          </Box>
        </Box>
        
        <Box className="app__body" sx={{ position: 'relative', height: 'calc(100vh - 64px)' }}>
          {/* Kenar Menüsü */}
          <Box 
            sx={{ 
              width: sidebarOpen ? `${sidebarWidth}px` : '0px',
              minWidth: sidebarOpen ? `${sidebarWidth}px` : '0px',
              maxWidth: sidebarOpen ? `${sidebarWidth}px` : '0px',
              position: 'absolute',
              zIndex: 100,
              height: '100%',
              transition: 'width 0.3s ease, min-width 0.3s ease, max-width 0.3s ease',
              boxShadow: isMobile && sidebarOpen ? '0 0 10px rgba(0, 0, 0, 0.2)' : 'none',
              backgroundColor: sidebarOpen ? 'white' : 'transparent',
              display: sidebarOpen ? 'flex' : 'none',
              flexDirection: 'column',
              pt: 2,
              px: sidebarOpen ? 2 : 0
            }}
          >
            <Sidebar 
              isCollapsed={!sidebarOpen} 
              onCategoryChange={handleCategoryChange}
              onComposeClick={() => setComposeOpen(true)}
            />
          </Box>
          
          {/* E-posta Listesi */}
          <Box 
            sx={{ 
              flex: 1,
              position: 'absolute',
              left: sidebarOpen ? `${sidebarWidth}px` : '0px',
              right: 0,
              bottom: 0,
              top: 0,
              transition: 'left 0.3s ease',
              overflow: 'hidden'
            }}
          >
            {renderEmailList()}
          </Box>
        </Box>
        <ComposeModal open={composeOpen} onClose={() => setComposeOpen(false)} user={user} />
        
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </div>
    </ThemeProvider>
  );
}

export default App;
