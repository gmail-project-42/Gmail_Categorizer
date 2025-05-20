import React, { useState } from 'react';
import { 
  Box, 
  Checkbox, 
  Typography,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  Paper,
  IconButton,
  Avatar,
  Tooltip,
  Divider
} from '@mui/material';
import AttachmentIcon from '@mui/icons-material/Attachment';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArchiveIcon from '@mui/icons-material/Archive';
import DeleteIcon from '@mui/icons-material/Delete';
import MarkEmailUnreadIcon from '@mui/icons-material/MarkEmailUnread';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LabelIcon from '@mui/icons-material/Label';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ReplyIcon from '@mui/icons-material/Reply';
import ForwardIcon from '@mui/icons-material/Forward';
import StarBorderIcon from '@mui/icons-material/StarBorder';

interface EmailRowProps {
  id: string;
  sender: string;
  subject: string;
  time: string;
  read: boolean;
  attachment?: string;
  selected: boolean;
  onSelect: () => void;
  onMarkAsRead: () => void;
  content?: string;
  originalSubject?: string;
}

const EmailRow: React.FC<EmailRowProps> = ({ 
  id, 
  sender, 
  subject, 
  time, 
  read, 
  attachment, 
  selected,
  onSelect,
  onMarkAsRead,
  content,
  originalSubject
}) => {
  const [openDialog, setOpenDialog] = useState(false);
  
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
  };
  
  const handleRowClick = () => {
    if (!read) {
      onMarkAsRead();
    }
    setOpenDialog(true);
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // Gönderici adını ve e-posta adresini ayırmak için helper fonksiyon
  const parseSender = (senderString: string) => {
    const match = senderString.match(/(.*)\s<(.*)>/);
    if (match) {
      return {
        name: match[1].trim(),
        email: match[2].trim()
      };
    }

    // Eğer <> formatında değilse
    return {
      name: senderString,
      email: ''
    };
  };

  const senderInfo = parseSender(sender);

  return (
    <>
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          padding: '0 16px', 
          borderBottom: '1px solid #f1f3f4',
          height: '50px',
          cursor: 'pointer',
          backgroundColor: selected
            ? 'rgba(108,99,255,0.10)'
            : !read
              ? 'linear-gradient(90deg, #e3e6ff 60%, #f5f6fa 100%)'
              : 'rgba(255,255,255,0.85)',
          borderRadius: '12px',
          margin: '6px 0',
          boxShadow: selected
            ? '0 4px 16px rgba(108,99,255,0.10)'
            : '0 1px 4px rgba(108,99,255,0.04)',
          transition: 'all 0.18s cubic-bezier(.4,2,.6,1)',
          '&:hover': {
            background: 'linear-gradient(90deg, #e3e6ff 80%, #fbefff 100%)',
            boxShadow: '0 8px 32px rgba(108,99,255,0.13)',
            transform: 'scale(1.012)',
            zIndex: 2
          }
        }}
        onClick={handleRowClick}
      >
        <Checkbox 
          size="medium"
          color="primary"
          sx={{
            p: 0.7,
            borderRadius: '8px',
            border: selected ? '2px solid #6C63FF' : '2px solid #bdbdbd',
            boxShadow: selected ? '0 2px 8px rgba(108,99,255,0.15)' : '0 1px 3px rgba(0,0,0,0.07)',
            backgroundColor: selected ? '#e3e6ff' : 'white',
            transition: 'all 0.15s',
            '&:hover': {
              backgroundColor: '#f0f4ff',
              borderColor: '#6C63FF',
            }
          }}
          checked={selected} 
          onClick={handleCheckboxClick}
        />
        
        <Box 
          sx={{ 
            display: 'flex', 
            overflow: 'hidden',
            flexGrow: 1,
            ml: 1
          }}
        >
          <Typography 
            sx={{ 
              minWidth: '150px',
              maxWidth: '150px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontWeight: read ? 'normal' : 'bold',
              fontSize: '14px',
              color: read ? '#5f6368' : '#202124'
            }}
          >
            {sender}
          </Typography>
          
          <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden', alignItems: 'center', mr: 1 }}>
            <Typography 
              sx={{ 
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: '14px',
                lineHeight: '1.4',
                letterSpacing: '0.01em',
                fontWeight: read ? 'normal' : 'bold',
                color: read ? '#5f6368' : '#202124',
                maxWidth: 'calc(100% - 10px)',
                '&:hover': {
                  color: read ? '#202124' : '#1a73e8'
                }
              }}
            >
              {originalSubject || subject}
            </Typography>
            
            {attachment && (
              <Box sx={{ display: 'flex', alignItems: 'center', ml: 1, flexShrink: 0 }}>
                <AttachmentIcon fontSize="small" sx={{ color: '#5f6368', fontSize: '16px' }} />
                <Chip 
                  label={attachment} 
                  size="small" 
                  sx={{ 
                    height: '20px', 
                    fontSize: '12px',
                    backgroundColor: '#eaf1fb',
                    color: '#5f6368',
                    ml: 0.5
                  }} 
                />
              </Box>
            )}
          </Box>
        </Box>
        
        <Typography 
          sx={{
            fontSize: '13px',
            fontWeight: 600,
            color: '#2463eb',
            background: read
              ? 'rgba(108,99,255,0.10)'
              : 'rgba(108,99,255,0.18)',
            borderRadius: '10px',
            px: 2,
            py: 0.5,
            ml: 2,
            minWidth: '70px',
            textAlign: 'center',
            flexShrink: 0,
            whiteSpace: 'nowrap',
            boxShadow: '0 1px 8px rgba(60,99,255,0.10)',
            border: '1.5px solid #6C63FF',
            transition: 'background 0.18s, color 0.18s',
            backdropFilter: 'blur(2px)',
          }}
        >
          {time}
        </Typography>
      </Box>
      
      {/* E-posta İçeriği Diyaloğu - Gmail benzeri görünüm */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        fullWidth 
        maxWidth="md"
        sx={{
          '& .MuiDialog-paper': {
            height: '80vh',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        {/* Üst çubuk */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          p: 1, 
          borderBottom: '1px solid #f1f3f4',
          backgroundColor: '#fff',
        }}>
          <IconButton onClick={handleCloseDialog} size="small">
            <ArrowBackIcon />
          </IconButton>
          
          <Box sx={{ display: 'flex', ml: 1, gap: 1 }}>
            <Tooltip title="Arşivle">
              <IconButton size="small">
                <ArchiveIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Sil">
              <IconButton size="small">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Okunmadı olarak işaretle">
              <IconButton size="small">
                <MarkEmailUnreadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Ertele">
              <IconButton size="small">
                <AccessTimeIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Etiketle">
              <IconButton size="small">
                <LabelIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Diğer">
              <IconButton size="small">
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        {/* Konu başlığı */}
        <Box sx={{ p: 2, pb: 0 }}>
          <Typography variant="h6" component="div">
            {originalSubject || subject}
          </Typography>
        </Box>
        
        {/* E-posta içeriği */}
        <DialogContent sx={{ p: 0, overflow: 'auto', flexGrow: 1 }}>
          {/* E-posta üst bilgisi */}
          <Box sx={{ p: 2, display: 'flex', alignItems: 'flex-start' }}>
            <Avatar 
              sx={{ 
                width: 40, 
                height: 40, 
                bgcolor: '#1a73e8',
                fontSize: '16px',
                fontWeight: 'bold',
                mr: 2
              }}
            >
              {senderInfo.name[0]?.toUpperCase() || 'G'}
            </Avatar>
            
            <Box sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '14px' }}>
                    {senderInfo.name}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {senderInfo.email ? `<${senderInfo.email}>` : ''}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="caption" color="textSecondary">
                    {time}
                  </Typography>
                  <Tooltip title="Yıldız ekle">
                    <IconButton size="small">
                      <StarBorderIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Yanıtla">
                    <IconButton size="small">
                      <ReplyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Diğer">
                    <IconButton size="small">
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              
              <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>
                Alıcı: ben
              </Typography>
            </Box>
          </Box>

          <Divider />
          
          {/* E-posta içeriği */}
          <Box sx={{ p: 2, pl: 8 }}>
            <Typography variant="body1" sx={{ 
              whiteSpace: 'pre-line',
              fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
              fontSize: '14px',
              lineHeight: 1.6
            }}>
              {content ? content : `Merhaba,
              
              ${originalSubject && originalSubject.includes("Etik Kurul") ? `
              Bu e-posta, Etik Kurul başvurunuzla ilgili bilgilendirme amacıyla gönderilmiştir.
              
              Başvurunuz alınmış olup, 10 iş günü içerisinde değerlendirilecektir. Değerlendirme sürecinde ek bilgi ya da belge talep edilebilir.
              
              Herhangi bir sorunuz olması durumunda lütfen iletişime geçmekten çekinmeyin.
              
              Saygılarımla,
              Cem BAYDOĞAN` : 
              `              
              Bu örnek bir e-posta içeriğidir.
              
              Gmail arayüzü klonumuzu test etmek için oluşturulmuştur.
              
              Saygılarımla,
              ${senderInfo.name}`}`}
            </Typography>
          
            {/* Ekler */}
          {attachment && (
              <Box sx={{ 
                mt: 3, 
                p: 1, 
                border: '1px solid #dadce0', 
                borderRadius: 1, 
                width: 'fit-content',
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#f8f9fa'
              }}>
                <AttachmentIcon fontSize="small" sx={{ mr: 1, color: '#5f6368' }} />
                <Typography variant="body2" sx={{ color: '#1a73e8' }}>
                  {attachment}
                </Typography>
            </Box>
          )}
          </Box>
        </DialogContent>
        
        {/* Alt çubuk */}
        <Box sx={{ 
          display: 'flex', 
          padding: '12px',
          borderTop: '1px solid #f1f3f4',
          justifyContent: 'flex-start',
          gap: 1
        }}>
          <Tooltip title="Yanıtla">
            <IconButton size="small" sx={{ 
              border: '1px solid #dadce0',
              borderRadius: '4px',
              p: '6px',
              backgroundColor: '#f8f9fa',
              '&:hover': { backgroundColor: '#f1f3f4' }
            }}>
              <ReplyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="İlet">
            <IconButton size="small" sx={{ 
              border: '1px solid #dadce0',
              borderRadius: '4px',
              p: '6px',
              backgroundColor: '#f8f9fa',
              '&:hover': { backgroundColor: '#f1f3f4' }
            }}>
              <ForwardIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Dialog>
    </>
  );
};

export default EmailRow; 