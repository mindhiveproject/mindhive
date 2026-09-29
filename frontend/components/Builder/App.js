import { useEffect } from "react";
import { useRouter } from "next/router";
import StyledProject from "../styles/StyledProject";
import { StyledBuilderArea } from "../styles/StyledBuilder";
import TabRouter from "./TabRouter";
import { defaultBuilderTab, getBuilderMode } from "./shared/identity";

export default function BuilderApp({ query, user }) {
  const router = useRouter();
  const { area } = query;
  const mode = getBuilderMode(area);
  const tab = query?.tab || defaultBuilderTab(area);

  useEffect(() => {
    if (query?.tab !== "proposal") return;
    const { tab: _legacyTab, ...rest } = query;
    router.replace({
      pathname: `/builder/${area}`,
      query: {
        ...rest,
        tab: "board",
      },
    });
  }, [query, area, router]);

  const Frame = mode === "project" ? StyledProject : StyledBuilderArea;

  return (
    <Frame>
      <TabRouter query={query} user={user} tab={tab} />
    </Frame>
  );
}
