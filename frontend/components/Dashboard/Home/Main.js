import Links from "./Links";
import MyUpdates from "../../Account/Updates/Main";
import IdentIcon from "../../Account/IdentIcon";
import Link from "next/link";
import StyledHome from "../../styles/StyledHome";
import LanguageSwitcher from "./LanuageSwitcher";

export default function Home({ query, user }) {
  const { username, publicId, publicReadableId } = user;

  return (
    <StyledHome>
      <div className="titleIcon">
        <div>
          <div className="h36">Welcome{username && `, ${username}`}!</div>
          <div className="p20">
            You can edit your Profile, schedule time with mentors, stay
            up-to-date with the latest MH notifications here
          </div>
        </div>

        <div>
          {user?.avatar ? (
            <img src={user?.avatar} alt={user?.name} />
          ) : (
            <div>
              <IdentIcon size="120" value={user?.name} />
            </div>
          )}
        </div>
      </div>

      {user?.permissions?.map((p) => p?.name).includes("ADMIN") && (
        <div className="createProfileAreaWrapper">
          <Link
            href={{
              pathname: `/dashboard/profile/create`,
              query: {
                page: "type",
              },
            }}
          >
            <div className="createProfileArea">
              <div>
                <div className="h32">Create your MindHive profile</div>
                <div className="p18">
                  Ready to join the MindHive community? Create your profile now
                  by clicking here.
                </div>
              </div>
            </div>
          </Link>
        </div>
      )}

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
