import Links from "./Links";
import MyUpdates from "../../Account/Updates/Main";

import StyledHome from "../../styles/StyledHome";
import LanguageSwitcher from "./LanuageSwitcher";
import Profile from "../Profile/Main";
import FavoritePeople from "../Connect/Connections/FavoritePeople";
import FavoriteTasks from "../../Tasks/Bank/FavoriteTasks";

export default function Home({ query, user }) {
  const { publicId, publicReadableId } = user;

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
                Participant ID <div className="code">{publicId}</div>
              </div>
            )}
          </div>

          <div>
            {publicReadableId && (
              <div>
                Public readable ID{" "}
                <div className="code">{publicReadableId}</div>
              </div>
            )}
          </div>
        </div>

        <div>
          Permissions
          {user?.permissions.map((permission, num) => (
            <div key={num} className="code">
              {permission?.name}
            </div>
          ))}
        </div>
      </div>

      <Links />

      {user?.permissions?.map((p) => p?.name).includes("ADMIN") && (
        <LanguageSwitcher />
      )}
    </StyledHome>
  );
}
