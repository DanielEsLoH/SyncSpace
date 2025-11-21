'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { LoginModal } from '@/components/auth/LoginModal';
import { RegisterModal } from '@/components/auth/RegisterModal';

interface AuthModalContextType {
  openLoginModal: () => void;
  openRegisterModal: () => void;
  closeModals: () => void;
  switchToLogin: () => void;
  switchToRegister: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export function useAuthModal() {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error('useAuthModal must be used within AuthModalProvider');
  }
  return context;
}

interface AuthModalProviderProps {
  children: ReactNode;
}

/**
 * Auth Modal Provider
 *
 * Provides application-wide auth modal functionality that can be triggered
 * from anywhere in the app (e.g., landing page, navigation, route guards).
 *
 * Features:
 * - Login Modal
 * - Register Modal
 * - Ability to switch between modals
 */
export function AuthModalProvider({ children }: AuthModalProviderProps) {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const openLoginModal = () => {
    setIsRegisterOpen(false);
    setIsLoginOpen(true);
  };

  const openRegisterModal = () => {
    setIsLoginOpen(false);
    setIsRegisterOpen(true);
  };

  const closeModals = () => {
    setIsLoginOpen(false);
    setIsRegisterOpen(false);
  };

  const switchToLogin = () => {
    setIsRegisterOpen(false);
    setIsLoginOpen(true);
  };

  const switchToRegister = () => {
    setIsLoginOpen(false);
    setIsRegisterOpen(true);
  };

  return (
    <AuthModalContext.Provider
      value={{
        openLoginModal,
        openRegisterModal,
        closeModals,
        switchToLogin,
        switchToRegister,
      }}
    >
      {children}

      {/* Auth Modals */}
      <LoginModal
        open={isLoginOpen}
        onOpenChange={setIsLoginOpen}
        onSwitchToRegister={switchToRegister}
      />
      <RegisterModal
        open={isRegisterOpen}
        onOpenChange={setIsRegisterOpen}
        onSwitchToLogin={switchToLogin}
      />
    </AuthModalContext.Provider>
  );
}
