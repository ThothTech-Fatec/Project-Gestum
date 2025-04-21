import React, { useState, useEffect } from 'react';
import { Avatar } from '@mui/material';
import axios from 'axios';

interface UserAvatarProps {
  email: string;
  size?: number;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ email, size = 32 }) => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchAvatar = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/profileimage/${email}`);
        if (response.data.avatar) {
          setAvatarUrl(`data:image/jpeg;base64,${response.data.avatar}`);
        }
      } catch (error) {
        console.error('Erro ao buscar avatar:', error);
      }
    };

    fetchAvatar();
  }, [email]);

  return (
    <Avatar 
      src={avatarUrl || undefined} 
      alt={email}
      sx={{ width: size, height: size }}
    >
      {!avatarUrl && email[0].toUpperCase()}
    </Avatar>
  );
};

export default UserAvatar;