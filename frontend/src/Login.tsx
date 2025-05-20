import React from 'react';
import { Box, Paper, Typography, Link } from '@mui/material';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

interface User {
  name: string;
  email: string;
  picture: string;
  sub: string;
}

interface LoginProps {
  onLogin: (user: User) => void;
}

const handleSignup = () => {
  window.open('https://accounts.google.com/signup', '_blank');
};

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
      <Paper elevation={3} sx={{ p: 5, borderRadius: 4, minWidth: 350, maxWidth: 380, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <img src="https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico" alt="Gmail" width={56} height={56} style={{ marginBottom: 8 }} />
        <Typography variant="h5" fontWeight={700} mb={1} color="#1a73e8">Gmail'e Giriş</Typography>
        <Typography variant="body2" color="text.secondary" mb={2} align="center">
          Gmail klonuna erişmek için Google hesabınızla giriş yapın.
        </Typography>
        <GoogleLogin
          onSuccess={credentialResponse => {
            if (credentialResponse.credential) {
              const decoded = jwtDecode<User>(credentialResponse.credential);
              onLogin(decoded);
            }
          }}
          onError={() => {
            alert('Google ile giriş başarısız oldu!');
          }}
          width="100%"
          text="signin_with"
          shape="rectangular"
          theme="filled_blue"
        />
        <Box sx={{ width: '100%', textAlign: 'center', mt: 2 }}>
          <Link
            component="button"
            onClick={handleSignup}
            underline="hover"
            sx={{ color: '#1a73e8', fontWeight: 500, fontSize: 14 }}
          >
            Hesabınız yok mu? Hesap oluşturun
          </Link>
        </Box>
      </Paper>
    </Box>
  );
};

export default Login; 
