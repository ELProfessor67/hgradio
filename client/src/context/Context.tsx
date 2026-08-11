"use client";

import { convertToShowsData, getCurrentOrNextDJ } from "@/utils/generateDjsSchedule";
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
  currentDJ: any;
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

  const [currentDJ,setCurrentDJ] = useState<any>(null);

  const [details,setDetails] = useState<IDetails>({});



  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("userData", JSON.stringify(userData));
    }
  }, [userData]);

  // Keep sellerApprovalStatus (and other profile fields) in sync with the DB.
  // Admin approval only updates MongoDB — without this refresh, localStorage
  // stays "pending" until the seller re-logs in.
  const refreshUserFromServer = useCallback(async () => {
    const userId = userData?._id;
    if (!userId || typeof window === "undefined") return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/auth/me/${userId}`
      );
      const data = await res.json();
      if (!res.ok || !data?.user?._id) return;

      setUserData((prev) => {
        if (!prev?._id) return prev;
        return {
          ...data.user,
          token: prev.token,
        };
      });
    } catch {
      // ignore network errors — keep existing session
    }
  }, [userData?._id]);

  useEffect(() => {
    if (!userData?._id) return;

    refreshUserFromServer();

    const onFocus = () => refreshUserFromServer();
    const onVisibility = () => {
      if (document.visibilityState === "visible") refreshUserFromServer();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    // While seller is pending approval, poll so approval shows without re-login.
    const isPendingSeller =
      userData.accountType === "seller" &&
      userData.sellerApprovalStatus === "pending";

    let pollId: ReturnType<typeof setInterval> | undefined;
    if (isPendingSeller) {
      pollId = setInterval(refreshUserFromServer, 15000);
    }

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      if (pollId) clearInterval(pollId);
    };
  }, [
    userData?._id,
    userData.accountType,
    userData.sellerApprovalStatus,
    refreshUserFromServer,
  ]);

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
    const currentDJ = getCurrentOrNextDJ(data.teams);
    setCurrentDJ(currentDJ);
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
    <FormContext.Provider value={{ userData, setUserData, logout,showsData,getDetails,currentDJ }}>
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
