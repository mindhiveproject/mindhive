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

        <div>
          {t("permissions")}
          {user?.permissions.map((permission, num) => (
            <div key={num} className="code">
              {permission?.name}
            </div>
          ))}
        </div>
        
      </div>

      <Links />
    </StyledHome>
  );
}
