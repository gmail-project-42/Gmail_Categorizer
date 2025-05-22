import React, { useState } from 'react';
import { Box, Dialog, TextField, Button, IconButton, Typography, Tooltip, Paper, Snackbar, Alert, CircularProgress } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MinimizeIcon from '@mui/icons-material/Minimize';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import LinkIcon from '@mui/icons-material/Link';
import InsertEmoticonIcon from '@mui/icons-material/InsertEmoticon';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import LockIcon from '@mui/icons-material/Lock';
import FormatColorTextIcon from '@mui/icons-material/FormatColorText';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';

interface User {
  name: string;
  email: string;
  picture: string;
  sub: string;
}

interface ComposeModalProps {
  open: boolean;
  onClose: () => void;
  user: User;
}

const ComposeModal: React.FC<ComposeModalProps> = ({ open, onClose, user }) => {
  const [fields, setFields] = useState({ to: '', subject: '', body: '' });
  const [sending, setSending] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  // Kullanıcı adı ve e-posta adresini formatlayarak gösteren fonksiyon
  const formatSenderInfo = () => {
    if (!user) return 'Kullanıcı <kullanici@gmail.com>';
    
    const displayName = user.name || user.email.split('@')[0];
    return `${displayName} <${user.email}>`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFields({ ...fields, [e.target.name]: e.target.value });
  };

  const handleSend = async () => {
    if (!fields.to || !fields.subject) {
      setSnackbarMessage('Alıcı ve konu alanları gereklidir');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    setSending(true);
    try {
      // Doğrudan query parametreleri ile gönder
      const queryParams = new URLSearchParams();
      queryParams.append('to', fields.to);
      queryParams.append('subject', fields.subject);
      queryParams.append('body', fields.body);
      
      // Gönderen bilgisini ekle
      if (user && user.email) {
        queryParams.append('from', user.email);
      }
      
      const response = await fetch(`https://backend-service-116708036805.europe-west1.run.app/mails/send_mail?${queryParams.toString()}`, {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.text();
        setSnackbarMessage(result || 'E-posta başarıyla gönderildi');
        setSnackbarSeverity('success');
        setFields({ to: '', subject: '', body: '' });
        onClose();
      } else {
        const errorData = await response.json();
        setSnackbarMessage(`Hata: ${errorData.detail || 'E-posta gönderilemedi'}`);
        setSnackbarSeverity('error');
      }
    } catch (error) {
      console.error('Mail sending error:', error);
      setSnackbarMessage('Sunucu bağlantı hatası');
      setSnackbarSeverity('error');
    } finally {
      setSnackbarOpen(true);
      setSending(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            m: 0,
            width: 720,
            maxWidth: '95vw',
            overflow: 'hidden',
            borderRadius: 5,
            boxShadow: '0 8px 40px 0 rgba(108,99,255,0.18)',
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(12px)',
            border: '1.5px solid #e3e6ff',
          }
        }}
        hideBackdrop
      >
        <Paper elevation={0} sx={{ borderRadius: 5, background: 'rgba(255,255,255,0.92)', p: 0, boxShadow: 'none' }}>
          {/* Title Bar */}
          <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.5, borderBottom: '1.5px solid #e3e6ff', background: 'linear-gradient(90deg, #e3e6ff 0%, #fbefff 100%)', borderTopLeftRadius: 20, borderTopRightRadius: 20, boxShadow: '0 2px 12px rgba(108,99,255,0.07)' }}>
            <Typography variant="subtitle1" sx={{ flex: 1, fontWeight: 600, fontSize: 18, color: '#6C63FF', letterSpacing: 0.5 }}>Yeni ileti</Typography>
            <IconButton size="small" sx={{ color: '#b3b3b3', mx: 0.5 }}><MinimizeIcon fontSize="small" /></IconButton>
            <IconButton size="small" sx={{ color: '#6C63FF', mx: 0.5 }}><OpenInFullIcon fontSize="small" /></IconButton>
            <IconButton size="small" onClick={onClose} sx={{ color: '#FF6584', mx: 0.5 }}><CloseIcon fontSize="small" /></IconButton>
          </Box>
          {/* Kimden Satırı */}
          <Box sx={{ display: 'flex', alignItems: 'center', px: 2, pt: 1, pb: 0.5 }}>
            <Typography variant="body2" sx={{ color: '#222', fontWeight: 500, mr: 1 }}>Kimden</Typography>
            <Typography variant="body2" sx={{ color: '#444', fontWeight: 400, mr: 1 }}>{formatSenderInfo()}</Typography>
            <ArrowDropDownIcon fontSize="small" sx={{ color: '#888' }} />
          </Box>
          {/* Kime/Cc/Bcc Satırı */}
          <Box sx={{ display: 'flex', alignItems: 'center', px: 2, pt: 1 }}>
            <TextField
              placeholder="Kime"
              name="to"
              value={fields.to}
              onChange={handleChange}
              variant="standard"
              fullWidth
              InputProps={{ disableUnderline: true, sx: { fontSize: 15, background: 'transparent' } }}
              sx={{ flex: 1 }}
            />
            <Button size="small" sx={{ minWidth: 0, color: '#1a73e8', textTransform: 'none', fontSize: 13, ml: 1 }}>Cc</Button>
            <Button size="small" sx={{ minWidth: 0, color: '#1a73e8', textTransform: 'none', fontSize: 13 }}>Bcc</Button>
          </Box>
          {/* Konu Satırı */}
          <Box sx={{ px: 2, pt: 1 }}>
            <TextField
              placeholder="Konu"
              name="subject"
              value={fields.subject}
              onChange={handleChange}
              variant="standard"
              fullWidth
              InputProps={{ disableUnderline: true, sx: { fontSize: 15, background: 'transparent' } }}
              sx={{ mb: 1 }}
            />
          </Box>
          {/* Mesaj Alanı */}
          <Box sx={{ px: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
            <TextField
              placeholder=""
              name="body"
              value={fields.body}
              onChange={handleChange}
              variant="standard"
              fullWidth
              multiline
              minRows={14}
              InputProps={{ disableUnderline: true, sx: { fontSize: 15, background: 'transparent' } }}
              sx={{ mb: 0, flex: 1, resize: 'none' }}
            />
          </Box>
          {/* Alt Bar */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            px: 2,
            py: 1.5,
            borderTop: '1.5px solid #e3e6ff',
            background: 'linear-gradient(90deg, #fbefff 0%, #e3e6ff 100%)',
            borderBottomLeftRadius: 20,
            borderBottomRightRadius: 20,
            boxShadow: '0 -2px 12px rgba(108,99,255,0.07)',
            backdropFilter: 'blur(8px)',
          }}>
            <Button
              variant="contained"
              sx={{
                background: 'linear-gradient(90deg, #6C63FF 0%, #FF6584 100%)',
                borderRadius: 8,
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                boxShadow: '0 2px 8px rgba(108,99,255,0.10)',
                mr: 1,
                color: '#fff',
                fontSize: 16,
                letterSpacing: 0.5,
                transition: 'background 0.2s',
                '&:hover': {
                  background: 'linear-gradient(90deg, #FF6584 0%, #6C63FF 100%)',
                }
              }}
              onClick={handleSend}
              disabled={sending}
            >
              {sending ? (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />
                  Gönderiliyor...
                </Box>
              ) : 'Gönder'}
            </Button>
            <Tooltip title="Daha fazla gönderim seçeneği">
              <IconButton size="small" sx={{ color: '#6C63FF', mx: 0.5, background: '#f3f0ff', borderRadius: 2 }}><ArrowDropDownIcon /></IconButton>
            </Tooltip>
            <Tooltip title="Biçimlendirme seçenekleri"><IconButton size="small" sx={{ color: '#FF6584', mx: 0.5, background: '#fff0f6', borderRadius: 2 }}><FormatColorTextIcon /></IconButton></Tooltip>
            <Tooltip title="Dosya ekle"><IconButton size="small" sx={{ color: '#FFD600', mx: 0.5, background: '#fffbe6', borderRadius: 2 }}><AttachFileIcon /></IconButton></Tooltip>
            <Tooltip title="Bağlantı ekle"><IconButton size="small" sx={{ color: '#1a73e8', mx: 0.5, background: '#e3f0ff', borderRadius: 2 }}><LinkIcon /></IconButton></Tooltip>
            <Tooltip title="Emoji ekle"><IconButton size="small" sx={{ color: '#43b581', mx: 0.5, background: '#eafff3', borderRadius: 2 }}><InsertEmoticonIcon /></IconButton></Tooltip>
            <Tooltip title="Resim ekle"><IconButton size="small" sx={{ color: '#6C63FF', mx: 0.5, background: '#f3f0ff', borderRadius: 2 }}><AddPhotoAlternateIcon /></IconButton></Tooltip>
            <Tooltip title="Gizli mod"><IconButton size="small" sx={{ color: '#444', mx: 0.5, background: '#f5f5f5', borderRadius: 2 }}><LockIcon /></IconButton></Tooltip>
            <Tooltip title="Daha fazla"><IconButton size="small" sx={{ color: '#b3b3b3', mx: 0.5, background: '#f5f5f5', borderRadius: 2 }}><MoreVertIcon /></IconButton></Tooltip>
            <Box sx={{ flex: 1 }} />
            <Tooltip title="Sil"><IconButton size="small" sx={{ color: '#FF6584', mx: 0.5, background: '#fff0f6', borderRadius: 2 }}><DeleteIcon /></IconButton></Tooltip>
          </Box>
        </Paper>
      </Dialog>

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
    </>
  );
};

export default ComposeModal; 