import Links from "./Links";
import MyUpdates from "../../Account/Updates/Main";
import useTranslation from "next-translate/useTranslation";

import StyledHome from "../../styles/StyledHome";
import Profile from "../Profile/Main";
import FavoritePeople from "../Connect/Connections/FavoritePeople";
import FavoriteTasks from "../../Tasks/Bank/FavoriteTasks";

export default function Home({ query, user }) {
  const { publicId, publicReadableId } = user;
  const { t } = useTranslation("home");

  return (
    <StyledHome>
      <Profile />

      <FavoritePeople user={user} />

      <FavoriteTasks user={user} />

      <MyUpdates user={user} />

      <div className="header">
        <div className="idInfo">
          <div>
            {publicId && (
              <div>
                {t("participantID")} <div className="code">{publicId}</div>
              </div>
            )}
          </div>

          <div>
            {publicReadableId && (
              <div>
                {t("publicReadableID")}{" "}
                <div className="code">{publicReadableId}</div>
              </div>
            )}
          </div>
        </div>

        <div className="idInfo">
          {t("permissions")}
          {user?.permissions.map((permission, num) => (
            <div key={num} className="code">
              {permission?.name}
            </div>
          ))}
          <div>
            {(user?.permissions?.map((p) => p?.name).includes("MENTOR") ||
              user?.permissions?.map((p) => p?.name).includes("ADMIN") ||
              user?.permissions?.map((p) => p?.name).includes("SCIENTIST") ||
              user?.permissions?.map((p) => p?.name).includes("TEACHER")) && (
              <div>
                {t("needSupport")}<br></br>
                <a href="https://mindhive.notion.site/153d80abf4c48093b13cc8d50807c7b8?pvs=105" target="_blank">
                  <button>{t("fillSupportTicket")}</button>
                </a>
              </div>
            )}
          </div>
          <div>
            {(user?.permissions?.map((p) => p?.name).includes("MENTOR") ||
              user?.permissions?.map((p) => p?.name).includes("ADMIN") ||
              user?.permissions?.map((p) => p?.name).includes("SCIENTIST") ||
              user?.permissions?.map((p) => p?.name).includes("TEACHER")) && (
              <div>
                {t("needNewBlock")}<br></br>
                <a href="https://mindhive.notion.site/18bd80abf4c480749952e3c0498fab29?pvs=105" target="_blank">
                <button>{t("fillRequestForm")}</button>
                </a>
              </div>
            )}
          </div>
        </div>
        
      </div>

      <Links />
    </StyledHome>
  );
}
