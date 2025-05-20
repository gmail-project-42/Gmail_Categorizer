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
  CircularProgress
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';
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

interface TrashEmailListProps {
  searchQuery?: string;
}

const TrashEmailList: React.FC<TrashEmailListProps> = ({ searchQuery = '' }) => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [allSelected, setAllSelected] = useState(false);
  const [moreMenuAnchor, setMoreMenuAnchor] = useState<null | HTMLElement>(null);
  const [page, setPage] = useState(1);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const itemsPerPage = 50;

  // Backend'den çöp kutusundaki mailleri çek
  const fetchTrashMails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/mails/trash');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Çöp kutusundaki mailler alınırken bir hata oluştu');
      }
      
      const data = await response.json();
      
      // API response'u dönüştür
      const formattedEmails = data.mails.map((mail: any) => ({
        id: mail.id || mail._id || String(Math.random()),
        sender: mail.sender || 'Bilinmeyen Gönderici',
        subject: mail.subject || mail.snippet || 'Konu yok',
        date: mail.date || 'Tarih yok',
        read: false,
        predicted_class: mail.predicted_class || 'Diğer',
        content: mail.content || mail.body || ''
      }));
      
      setEmails(formattedEmails);
    } catch (error) {
      console.error('Trash mail fetch error:', error);
      setError(error instanceof Error ? error.message : 'Çöp kutusundaki mailler alınamadı');
      setSnackbarMessage('Çöp kutusundaki mailler alınamadı: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrashMails();
    setSelected([]);
    setAllSelected(false);
  }, []);

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
    await fetchTrashMails();
    showSnackbar('Çöp kutusu yenilendi');
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

  const handlePermanentDelete = async () => {
    if (selected.length === 0) return;
    try {
      const response = await fetch('http://localhost:8000/mails/permanently-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mail_ids: selected }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Kalıcı silme işlemi başarısız');
      }
      
      const result = await response.json();
      
      // Silinen ID listesini al (delete_count > 0 ise işlem başarılı)
      if (result.deleted_count > 0) {
        // UI'dan kaldır
        setEmails(prevEmails => 
          prevEmails.filter(email => !selected.includes(email.id))
        );
        
        setSnackbarMessage(result.message);
        setSnackbarOpen(true);
        setSelected([]);
        setAllSelected(false);
        
        // 3 saniye sonra listeyi tamamen yenile (sayfa atlama sorunlarını önlemek için)
        setTimeout(() => {
          fetchTrashMails();
        }, 3000);
      } else {
        setSnackbarMessage(`Kalıcı silme işlemi başarısız: ${result.message}`);
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Permanent delete error:', error);
      setSnackbarMessage('Kalıcı silme işlemi sırasında hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
      setSnackbarOpen(true);
    }
  };

  const handleRestore = async () => {
    if (selected.length === 0) return;
    try {
      const response = await fetch('http://localhost:8000/mails/restore-from-trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mail_ids: selected }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Geri yükleme işlemi başarısız');
      }
      
      const result = await response.json();
      
      // Geri yüklenen ID listesini al (deleted_count > 0 ise işlem başarılı - API'de restore count deleted_count olarak geliyor)
      if (result.deleted_count > 0) {
        // UI'dan kaldır (geri yüklenen mailleri çöp kutusundan çıkar)
        setEmails(prevEmails => 
          prevEmails.filter(email => !selected.includes(email.id))
        );
        
        setSnackbarMessage(result.message);
        setSnackbarOpen(true);
        setSelected([]);
        setAllSelected(false);
        
        // 3 saniye sonra listeyi tamamen yenile (sayfa atlama sorunlarını önlemek için)
        setTimeout(() => {
          fetchTrashMails();
        }, 3000);
      } else {
        setSnackbarMessage(`Geri yükleme işlemi başarısız: ${result.message}`);
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Restore error:', error);
      setSnackbarMessage('Geri yükleme işlemi sırasında hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
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

  // Arama sorgusuna göre e-postaları filtrele
  const filteredEmails = emails.filter(email => {
    const matchesSearch = searchQuery === '' || 
      (email.subject && email.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (email.sender && email.sender.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (email.content && email.content.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  // Sayfalandırma için emailleri parçala
  const paginatedEmails = filteredEmails.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const startRange = (page - 1) * itemsPerPage + 1;
  const endRange = Math.min(page * itemsPerPage, filteredEmails.length);

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
    <Box sx={{ 
      flex: 1, 
      backgroundColor: 'white',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'hidden',
      width: '100%',
      height: '100%'
    }}>
      {/* Email List Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        padding: '8px 16px', 
        borderBottom: '1px solid #f1f3f4'
      }}>
        <Checkbox 
          size="small" 
          color="default" 
          checked={allSelected}
          onChange={handleSelectAll}
          indeterminate={selected.length > 0 && selected.length < filteredEmails.length}
        />
        
        <Box sx={{ display: 'flex', ml: 1 }}>
          {selected.length > 0 ? (
            <>
              <Tooltip title="Geri Yükle">
                <IconButton size="small" onClick={handleRestore}>
                  <RestoreFromTrashIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Kalıcı Olarak Sil">
                <IconButton size="small" onClick={handlePermanentDelete}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Okundu olarak işaretle">
                <IconButton size="small" onClick={handleMarkAsRead}>
                  <MarkEmailReadIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <>
              <Tooltip title="Yenile">
                <IconButton 
                  size="small"
                  onClick={handleRefresh}
                  sx={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
          <Tooltip title="Diğer">
            <IconButton size="small" onClick={handleMoreMenu}>
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Box sx={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" color="textSecondary" sx={{ mr: 2 }}>
            {filteredEmails.length > 0 ? `${filteredEmails.length} satırdan ${startRange}-${Math.min(endRange, filteredEmails.length)} arası` : '0 e-posta'}
          </Typography>
          <Tooltip title="Daha yeni">
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
          <Tooltip title="Daha eski">
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

      {/* Menu */}
      <Menu
        id="more-menu"
        anchorEl={moreMenuAnchor}
        open={Boolean(moreMenuAnchor)}
        onClose={handleCloseMoreMenu}
      >
        <MenuItem onClick={handleMarkAsRead}>Okundu olarak işaretle</MenuItem>
        <MenuItem onClick={handleRestore}>Geri yükle</MenuItem>
        <MenuItem onClick={handlePermanentDelete}>Kalıcı olarak sil</MenuItem>
      </Menu>

      {/* Email List */}
      <Box sx={{ overflowY: 'auto', flex: 1 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress size={40} color="primary" />
          </Box>
        ) : error ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 3 }}>
            <Typography color="error">{error}</Typography>
          </Box>
        ) : paginatedEmails.length > 0 ? (
          paginatedEmails.map((email) => (
            <EmailRow
              key={email.id}
              id={email.id}
              sender={email.sender}
              subject={email.subject}
              time={email.date}
              read={email.read}
              selected={selected.includes(email.id)}
              onSelect={() => handleSelect(email.id)}
              onMarkAsRead={() => handleMarkEmailAsRead(email.id)}
              content={email.content}
            />
          ))
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography color="textSecondary">Çöp kutusunda e-posta bulunmuyor</Typography>
          </Box>
        )}
      </Box>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="info" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* CSS for animations */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </Box>
  );
};

export default TrashEmailList; 