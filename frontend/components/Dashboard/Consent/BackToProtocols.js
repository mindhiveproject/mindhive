import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";

import IconButton from "../../DesignSystem/IconButton";
import { ChevronLeftIcon } from "../../DesignSystem/Icons";

// "<" before a page title: back to the list of consent protocols
export default function BackToProtocols() {
  const router = useRouter();
  const { t } = useTranslation("dashboard");
  const label = t(
    "consentAdmin.backToProtocols",
    {},
    {
      default: "Back to my protocols",
    }
  );
  return (
    <IconButton
      variant="text"
      icon={<ChevronLeftIcon />}
      ariaLabel={label}
      title={label}
      onClick={() => router.push("/dashboard/irb")}
    />
  );
}
