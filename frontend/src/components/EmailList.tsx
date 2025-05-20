import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Checkbox, 
  IconButton, 
  Tooltip, 
  Typography,
  Menu,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress,
  Button
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import DeleteIcon from '@mui/icons-material/Delete';
import ArchiveIcon from '@mui/icons-material/Archive';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import EmailRow from './EmailRow';

interface Email {
  id: string;
  sender: string;
  subject: string;
  date: string;
  read: boolean;
  predicted_class: string;
  content?: string;
  [key: string]: any;
}

interface EmailListProps {
  selectedCategory: string;
  searchQuery?: string;
}

// Tarih formatla fonksiyonu - Gmail benzeri format
const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  
  const emailDate = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  
  // Geçerli bir tarih değilse
  if (isNaN(emailDate.getTime())) return dateStr;
  
  // Tarih bugünse, saati göster (13:45 gibi)
  if (emailDate.toDateString() === today.toDateString()) {
    return emailDate.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  }
  
  // Tarih dünse, "Dün" göster
  if (emailDate.toDateString() === yesterday.toDateString()) {
    return 'Dün';
  }
  
  // Son 7 gün içerisindeyse, gün adını göster (Pazartesi, Salı...)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(today.getDate() - 7);
  if (emailDate >= oneWeekAgo) {
    return emailDate.toLocaleDateString('tr-TR', { weekday: 'long' });
  }
  
  // Bu yıl içerisindeyse, gün ve ay göster (15 Oca gibi)
  if (emailDate.getFullYear() === today.getFullYear()) {
    return emailDate.toLocaleDateString('tr-TR', { 
      day: 'numeric', 
      month: 'short'
    });
  }
  
  // Diğer durumlarda tam tarih göster (15 Oca 2023 gibi)
  return emailDate.toLocaleDateString('tr-TR', { 
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

const EmailList: React.FC<EmailListProps> = ({ selectedCategory, searchQuery = '' }) => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [allSelected, setAllSelected] = useState(false);
  const [moreMenuAnchor, setMoreMenuAnchor] = useState<null | HTMLElement>(null);
  const [page, setPage] = useState(1);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const itemsPerPage = 50;

  // Backend'den mail verilerini çek
  const fetchMails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `http://localhost:8000/mails/${selectedCategory}`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Mailler alınırken bir hata oluştu');
      }
      
      const data = await response.json();
      
      // API response'u dönüştür
      const formattedEmails = data.mails.map((mail: any) => ({
        id: mail.id || mail._id || String(Math.random()),
        sender: mail.sender || 'Bilinmeyen Gönderici',
        subject: mail.subject || mail.snippet || 'Konu yok',
        date: mail.date || 'Tarih yok',
        read: false,
        predicted_class: mail.predicted_class || selectedCategory,
        content: mail.content || mail.body || ''
      }));
      
      setEmails(formattedEmails);
    } catch (error) {
      console.error('Mail fetch error:', error);
      setError(error instanceof Error ? error.message : 'Mailler alınamadı');
      setSnackbarMessage('Mailler alınamadı: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMails();
    setSelected([]);
    setAllSelected(false);
    // eslint-disable-next-line
  }, [selectedCategory]);

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const emailIds = filteredEmails.map(email => email.id);
      setSelected(emailIds);
      setAllSelected(true);
    } else {
      setSelected([]);
      setAllSelected(false);
    }
  };

  const handleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const handleMoreMenu = (event: React.MouseEvent<HTMLElement>) => {
    setMoreMenuAnchor(event.currentTarget);
  };

  const handleCloseMoreMenu = () => {
    setMoreMenuAnchor(null);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Önce güncel mailleri getir
      await fetchMails();
      
      // Sonra yeni mailleri veritabanına ekle
      const importResponse = await fetch('http://localhost:8000/mails/insert_mails_into_database', {
        method: 'POST',
      });
      
      if (importResponse.ok) {
        const importResult = await importResponse.text();
        setSnackbarMessage(importResult);
        // Veritabanı güncellendi, tekrar mail listesini al
        await fetchMails();
      } else {
        const errorData = await importResponse.json();
        setSnackbarMessage(`Yeni mailler alınamadı: ${errorData.detail || 'Bilinmeyen hata'}`);
      }
    } catch (error) {
      setSnackbarMessage('Mail yenileme sırasında hata oluştu');
    } finally {
      setIsRefreshing(false);
      setSnackbarOpen(true);
    }
  };

  const handleNextPage = () => {
    if (page * itemsPerPage < filteredEmails.length) {
      setPage(prev => prev + 1);
      showSnackbar('Sonraki sayfa gösteriliyor');
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(prev => prev - 1);
      showSnackbar('Önceki sayfa gösteriliyor');
    }
  };

  const handleMarkAsRead = () => {
    if (selected.length === 0) return;
    
    setEmails(prevEmails => 
      prevEmails.map(email => 
        selected.includes(email.id) 
          ? { ...email, read: true } 
          : email
      )
    );
    
    showSnackbar(`${selected.length} e-posta okundu olarak işaretlendi`);
    setSelected([]);
    setAllSelected(false);
    handleCloseMoreMenu();
  };

  const handleDelete = async () => {
    if (selected.length === 0) return;
    try {
      const response = await fetch('http://localhost:8000/mails/delete-selected', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mail_ids: selected }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Silme işlemi başarısız');
      }
      
      const result = await response.json();
      
      // Silinen ID listesini al (delete_count > 0 ise işlem başarılı)
      if (result.deleted_count > 0) {
        // UI'dan kaldır
        setEmails(prevEmails => 
          prevEmails.filter(email => !selected.includes(email.id))
        );
        
        setSnackbarMessage(result.message);
        setSelected([]);
        setAllSelected(false);
        
        // 3 saniye sonra listeyi tamamen yenile (sayfa atlama sorunlarını önlemek için)
        setTimeout(() => {
          fetchMails();
        }, 3000);
      } else {
        setSnackbarMessage(`Silme işlemi başarısız: ${result.message}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      setSnackbarMessage('Silme işlemi sırasında hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
    } finally {
      setSnackbarOpen(true);
    }
  };

  const handleArchive = async () => {
    if (selected.length === 0) return;
    
    try {
      // Mailleri arşivle (silmek yerine)
      const response = await fetch('http://localhost:8000/mails/archive-selected', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mail_ids: selected }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Arşivleme işlemi başarısız');
      }
      
      const result = await response.json();
      
      // Arşivlenen ID listesini al (archive_count > 0 ise işlem başarılı)
      if (result.archived_count > 0) {
        // UI'dan kaldır
        setEmails(prevEmails => 
          prevEmails.filter(email => !selected.includes(email.id))
        );
        
        showSnackbar(`${result.archived_count} e-posta başarıyla arşivlendi`);
        setSelected([]);
        setAllSelected(false);
        
        // 3 saniye sonra listeyi tamamen yenile (sayfa atlama sorunlarını önlemek için)
        setTimeout(() => {
          fetchMails();
        }, 3000);
      } else {
        setSnackbarMessage(`Arşivleme işlemi başarısız: ${result.message}`);
      }
    } catch (error) {
      console.error('Archive error:', error);
      setSnackbarMessage('Arşivleme işlemi sırasında hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
      setSnackbarOpen(true);
    }
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  // Arama ve kategori filtresi
  const filteredEmails = emails
    .filter(email => {
      // Arama filtresi
      const matchesSearch = !searchQuery || 
        email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (email.content && email.content.toLowerCase().includes(searchQuery.toLowerCase()));
        
      // Her durumda arama kriterine göre filtrele
      return matchesSearch;
    })
    // Tarih azalan sırayla sırala (en yeni e-postalar önce)
    .sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });

  // Pagination için geçerli sayfadaki mailleri hesapla
  const startIndex = (page - 1) * itemsPerPage;
  const displayedEmails = filteredEmails.slice(startIndex, startIndex + itemsPerPage);
  
  // Yükleme durumu, hata veya boş liste gösterimi
  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '200px',
          flexDirection: 'column'
        }}>
          <CircularProgress />
          <Typography variant="body2" sx={{ mt: 2 }}>E-postalar yükleniyor...</Typography>
        </Box>
      );
    }
    
    if (error) {
      return (
        <Box sx={{ 
          p: 3, 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          height: '200px',
          flexDirection: 'column'
        }}>
          <Typography variant="body1" color="error">
            {error}
          </Typography>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={fetchMails}
            sx={{ mt: 2 }}
          >
            Tekrar Dene
          </Button>
        </Box>
      );
    }
    
    if (filteredEmails.length === 0) {
      return (
        <Box sx={{ 
          p: 3, 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          height: '200px',
          flexDirection: 'column'
        }}>
          <Typography variant="body1" color="textSecondary">
            {searchQuery 
              ? `"${searchQuery}" için sonuç bulunamadı.` 
              : `Bu kategoride e-posta bulunamadı.`}
          </Typography>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={handleRefresh}
            sx={{ mt: 2 }}
            disabled={isRefreshing}
          >
            {isRefreshing ? 'Yenileniyor...' : 'Yenile'}
          </Button>
        </Box>
      );
    }
    
    return displayedEmails.map((email) => (
      <EmailRow
        key={email.id}
        id={email.id}
        sender={email.sender}
        subject={email.subject}
        time={formatDate(email.date)}
        read={email.read}
        selected={selected.includes(email.id)}
        onSelect={() => handleSelect(email.id)}
        onMarkAsRead={() => handleMarkEmailAsRead(email.id)}
        content={email.content || email.body || ''}
      />
    ));
  };

  // E-postayı okundu olarak işaretle
  const handleMarkEmailAsRead = (emailId: string) => {
    setEmails(prevEmails => 
      prevEmails.map(email => 
        email.id === emailId 
          ? { ...email, read: true } 
          : email
      )
    );
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#f8f9fa' }}>
      {/* Araç Çubuğu */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px' }}>
        {/* Sol taraf - Seçim ve işlemler */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Checkbox
            checked={allSelected && filteredEmails.length > 0}
            onChange={handleSelectAll}
            indeterminate={selected.length > 0 && selected.length < filteredEmails.length}
            color="default"
            size="small"
            sx={{ p: 0.5 }}
          />
          
          <Tooltip title="Son e-postaları getir ve ekle (son 7 günün postalarını kontrol eder)">
            <span>
              <IconButton 
                onClick={handleRefresh} 
                disabled={isRefreshing}
                size="small"
              >
                {isRefreshing ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <RefreshIcon fontSize="small" />
                )}
              </IconButton>
            </span>
          </Tooltip>
          
          {selected.length > 0 ? (
            <>
              <Tooltip title="Arşivle">
                <IconButton size="small" onClick={handleArchive}>
                  <ArchiveIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Sil">
                <IconButton size="small" onClick={handleDelete}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Okundu olarak işaretle">
                <IconButton size="small" onClick={handleMarkAsRead}>
                  <MarkEmailReadIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          ) : null}
          
          <Tooltip title="Diğer">
            <IconButton size="small" onClick={handleMoreMenu}>
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Menu
            anchorEl={moreMenuAnchor}
            open={Boolean(moreMenuAnchor)}
            onClose={handleCloseMoreMenu}
          >
            <MenuItem onClick={handleMarkAsRead} disabled={selected.length === 0}>
              Okundu olarak işaretle
            </MenuItem>
            <MenuItem onClick={handleDelete} disabled={selected.length === 0}>
              Çöp kutusuna taşı
            </MenuItem>
          </Menu>
        </Box>
        
        {/* Sağ taraf - Sayfalama */}
        <Box sx={{ display: 'flex', ml: 'auto', alignItems: 'center' }}>
          <Typography variant="caption" sx={{ color: '#5f6368', mr: 1 }}>
            {filteredEmails.length > 0 
              ? `${(page-1) * itemsPerPage + 1}-${Math.min(page * itemsPerPage, filteredEmails.length)} / ${filteredEmails.length}`
              : '0-0 / 0'
            }
          </Typography>
          
          <Tooltip title="Önceki">
            <span>
              <IconButton 
                size="small" 
                disabled={page === 1}
                onClick={handlePrevPage}
              >
                <KeyboardArrowLeftIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          
          <Tooltip title="Sonraki">
            <span>
              <IconButton 
                size="small" 
                disabled={page * itemsPerPage >= filteredEmails.length}
                onClick={handleNextPage}
              >
                <KeyboardArrowRightIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>
      
      {/* E-posta Kategorisi Başlığı */}
      <Box sx={{ 
        padding: '12px 16px', 
        borderBottom: '1px solid #f1f3f4',
        backgroundColor: '#fff'
      }}>
        <Typography variant="subtitle1" sx={{ 
          color: '#202124', 
          fontWeight: 500,
          fontSize: '16px' 
        }}>
          {selectedCategory === 'all' ? 'Gelen Kutusu' : 
           selectedCategory === 'important' ? 'Önemli' :
           selectedCategory === 'business' ? 'İş' :
           selectedCategory === 'personal' ? 'Kişisel' :
           selectedCategory === 'social' ? 'Sosyal' :
           selectedCategory === 'updates' ? 'Güncellemeler' :
           selectedCategory === 'promotions' ? 'Promosyonlar' :
           selectedCategory === 'forums' ? 'Forumlar' : 
           selectedCategory}
        </Typography>
      </Box>
      
      {/* E-posta Listesi */}
      <Box sx={{ 
        flexGrow: 1, 
        overflow: 'auto',
        backgroundColor: 'white' 
      }}>
        {renderContent()}
      </Box>
      
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="info">
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EmailList; 