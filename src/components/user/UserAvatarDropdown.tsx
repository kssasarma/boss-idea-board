
import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, Settings, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import UserProfileModal from './UserProfileModal';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface UserAvatarDropdownProps {
  user: SupabaseUser;
  onSignOut: () => void;
}

const UserAvatarDropdown: React.FC<UserAvatarDropdownProps> = ({
  user,
  onSignOut
}) => {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [fullName, setFullName] = useState('');

  const fetchUserName = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();

      setFullName(profile?.full_name || '');
    } catch (error) {
      console.error('Error fetching user name:', error);
    }
  };

  useEffect(() => {
    fetchUserName();
  }, [user.id]);

  const getInitials = () => {
    if (fullName) {
      return fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }
    return user.email?.substring(0, 2).toUpperCase() || 'U';
  };

  const getDisplayName = () => {
    return fullName || user.email || 'User';
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar className="h-10 w-10 cursor-pointer border-2 border-blue-200 hover:border-blue-400 transition-colors">
            <AvatarImage src={user.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-blue-100 text-blue-800 font-medium">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 bg-white border border-gray-200 shadow-lg" align="end">
          <div className="px-3 py-2 border-b">
            <p className="font-medium text-gray-900">{getDisplayName()}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
          <DropdownMenuItem 
            onClick={() => setShowProfileModal(true)}
            className="cursor-pointer hover:bg-gray-50"
          >
            <Settings className="mr-2 h-4 w-4" />
            Edit Profile
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={onSignOut}
            className="cursor-pointer hover:bg-gray-50 text-red-600"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <UserProfileModal
        user={user}
        open={showProfileModal}
        onOpenChange={setShowProfileModal}
      />
    </>
  );
};

export default UserAvatarDropdown;
