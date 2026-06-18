"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HomeScreen } from "@/components/home/HomeScreen";

export function HomeClient() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const onboarded = localStorage.getItem("echo-onboarded");
    if (!onboarded) {
      router.replace("/onboarding");
    } else {
      setChecked(true);
    }
  }, [router]);

  if (!checked) return null;
  return <HomeScreen />;
}
