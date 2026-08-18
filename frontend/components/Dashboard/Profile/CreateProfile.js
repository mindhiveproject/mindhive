import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";
import Button from "../../DesignSystem/Button";

export default function CreateProfile() {
  const router = useRouter();
  const { t } = useTranslation('connect');

  return (
    <>
        <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontSize: 32 }}>
            {t('underConstruction')}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontSize: 32 }}>
            <Button
              variant="filled"
              type="button"
              onClick={() => router.push("/dashboard")}
            >
              {t("returnDashboard")}
            </Button>
        </div>
    </>
  );
} 