"use client";

import { convertToShowsData } from "@/utils/generateDjsSchedule";
import axios from "axios";
import { StaticImageData } from "next/image";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
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
  showsData: IShowsData;
  getDetails: (id: string) => IDetailsData | undefined;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

interface FormProviderProps {
  children: ReactNode;
}

export interface IShowsData {
  [key: string]: {
    id: number;
    showImg: StaticImageData;
    artistImg: StaticImageData;
    time: string;
    showName: string;
    artistName: string;
  }[];
}



export interface IDetailsData {
    showName: string;
    artistName: string;
    role: string;
    description: string;
    artistImg: StaticImageData;
    schedule: {
      day: string;
      startTime: string;
      endTime: string;
    }[];
};

export interface IDetails {
  [key: string]: IDetailsData;
}

export const FormProvider: React.FC<FormProviderProps> = ({ children }) => {
  const [userData, setUserData] = useState<UserData>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("userData");
      return stored ? JSON.parse(stored) : {};
    }
    return {};
  });


  const [showsData, setSowsData] = useState<IShowsData>({
    Sunday: [],
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: []
  });

  const [details,setDetails] = useState<IDetails>({});



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

  const getAllDjs = async () => {
    const res = await axios.get("https://backend.hgdjlive.com/api/v1/all-djs");
    const data = res.data;
    const {showsData, details} = convertToShowsData(data);
    setSowsData(showsData);
    setDetails(details);
  }

  useEffect(() => {
    getAllDjs();
  }, []);

  const getDetails = useCallback((id: string) => {
    return details[id];
  },[details])

  return (
    <FormContext.Provider value={{ userData, setUserData, logout,showsData,getDetails }}>
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
