"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface UserData {
  _id?: string;
  email?: string;
  token?: string;
  role?: string;
  name?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  description?: string;
  profileImg?: string;
  [key: string]: unknown;
}

interface FormContextType {
  userData: UserData;
  setUserData: React.Dispatch<React.SetStateAction<UserData>>;
  logout: () => void;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

interface FormProviderProps {
  children: ReactNode;
}

export const FormProvider: React.FC<FormProviderProps> = ({ children }) => {
  const [userData, setUserData] = useState<UserData>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("userData");
      return stored ? JSON.parse(stored) : {};
    }
    return {};
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("userData", JSON.stringify(userData));
    }
  }, [userData]);

  // const logout = () => {

  //   if (typeof window !== 'undefined') {
  //     const socket = (window as any).socket;
  //     if (socket && userData?.id) {
  //       socket.emit('logoutUser', userData.id);
  //     }
  //     setUserData({});
  //     localStorage.removeItem('userData');
  //   }
  // };

  const logout = () => {
    if (typeof window !== "undefined") {
      setUserData({});
      localStorage.removeItem("userData");
      // toast.success("Logout Successfully!!",{
      //   style: {
      //     background: "green",
      //     border : "none",
      //     color : "white"
      //   },
      // })
      // router.push("/login")
    }
  };

  return (
    <FormContext.Provider value={{ userData, setUserData, logout }}>
      {children}
    </FormContext.Provider>
  );
};

export const useData = (): FormContextType => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error("useData must be used within a FormProvider");
  }
  return context;
};
