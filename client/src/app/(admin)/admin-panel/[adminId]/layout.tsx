"use client";
import { PageLoading } from "@/utils/Loading";
import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { useData } from "@/context/Context";
import { useRouter } from "next/navigation";

export default function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ adminId: string }>;
}) {
  const { userData } = useData();
  const router = useRouter();
  const [adminId, setAdminId] = useState<string | null>(null);
  const [isOpenSidebar, setIsOpenSidebar] = useState(() => {
    if (typeof window !== "undefined" && window.innerWidth <= 1024) {
      return true;
    }
    return false;
  });

  useEffect(() => {
    params.then((res) => {
      setAdminId(res.adminId);
    });
  }, [params]);

  useEffect(() => {
    if (!userData || userData.role !== "Admin") {
      router.push("/admin-login");
    }
  }, [userData, router]);

  if (!adminId) {
    return <PageLoading />;
  }

  return (
    <div className="min-h-[100vh]  bg-black flex">
      <Sidebar
        id={adminId}
        isOpenSidebar={isOpenSidebar}
        setIsOpenSidebar={setIsOpenSidebar}
      />
      <div className=" w-full  ">
        <TopBar
          isOpenSidebar={isOpenSidebar}
          setIsOpenSidebar={setIsOpenSidebar}
        />
        <div
          className={` ${
            isOpenSidebar ? "ml-[0px]" : "xl:ml-[300px]"
          } mt-[70px]  xl:px-10 px-3 md:px-5 pt-6 pb-[2rem] transition-all duration-300 ease-in-out `}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
