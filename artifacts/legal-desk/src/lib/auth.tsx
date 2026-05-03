import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, useGetMe, useLogin, useLogout, LoginBody } from "@workspace/api-client-react";
import { useLocation } from "wouter";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: LoginBody) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [, setLocation] = useLocation();

  const { data, isLoading, error } = useGetMe({
    query: {
      retry: false,
      queryKey: ["get-me"],
    },
  });

  useEffect(() => {
    if (data) {
      setUser(data);
    } else if (error) {
      setUser(null);
    }
  }, [data, error]);

  const loginMutation = useLogin();
  const logoutMutation = useLogout();

  const login = async (loginData: LoginBody) => {
    const response = await loginMutation.mutateAsync({ data: loginData });
    setUser(response.user);
    setLocation("/");
  };

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    setUser(null);
    setLocation("/login");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
