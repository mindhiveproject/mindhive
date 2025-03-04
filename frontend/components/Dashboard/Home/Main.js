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

        <div className="idInfo">
          Permissions
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
                Do you need support?<br></br>
                <a href="https://mindhive.notion.site/153d80abf4c48093b13cc8d50807c7b8?pvs=105" target="_blank">
                  <button>Fill Support Ticket</button>
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
                Need a new block?<br></br>
                <a href="https://mindhive.notion.site/18bd80abf4c480749952e3c0498fab29?pvs=105" target="_blank">
                <button>Fill a Request Form</button>
                </a>
              </div>
            )}
          </div>
        </div>
        
      </div>

      <Links />

      {user?.permissions?.map((p) => p?.name).includes("ADMIN") && (
        <LanguageSwitcher />
      )}
    </StyledHome>
  );
}
