"use client";

import React, { useEffect } from "react";
import { useData } from "@/context/Context";
import { useRouter } from "next/navigation";
import { PageLoading } from "@/utils/Loading";

const Page = () => {
  const { userData } = useData();
  const router = useRouter();

  useEffect(() => {
    if (userData?.role === "Admin" && userData?._id) {
      router.replace(`/admin-panel/${userData._id}/widthraw-requests`);
    } else {
      router.replace("/admin-login");
    }
  }, [userData, router]);

  return <PageLoading />;
};

export default Page;