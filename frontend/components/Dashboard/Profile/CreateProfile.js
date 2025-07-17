import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";

export default function CreateProfile() {
  const router = useRouter();
  const { t } = useTranslation('connect');

  return (
    <>
        <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontSize: 32 }}>
            {t('underConstruction')}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontSize: 32 }}>
            <button 
                style={{display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
                onClick={() => router.push("/dashboard")}>
                {t('returnDashboard')}
                
            </button>
        </div>
    </>
  );
} 