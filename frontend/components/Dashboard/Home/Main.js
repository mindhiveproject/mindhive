import Links from "./Links";
import MyUpdates from "../../Account/Updates/Main";

import StyledHome from "../../styles/StyledHome";
import LanguageSwitcher from "./LanuageSwitcher";
import Profile from "../Profile/Main";

export default function Home({ query, user }) {
  const { publicId, publicReadableId } = user;

  return (
    <StyledHome>
      <Profile />

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
