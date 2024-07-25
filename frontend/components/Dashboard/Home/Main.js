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
          <h1>Welcome{username && `, ${username}`}!</h1>
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
        <div className="createProfileArea">
          <div></div>
          <div>
            <h2>Create your MindHive profile</h2>
            <p>
              To better connect with the MindHive community, please create your
              profile
            </p>

            <Link
              href={{
                pathname: `/dashboard/profile/create`,
                query: {
                  page: "type",
                },
              }}
            >
              <button>Create Profile</button>
            </Link>
          </div>
        </div>
      )}

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

      <MyUpdates user={user} />
      <Links />

      {user?.permissions?.map((p) => p?.name).includes("ADMIN") && (
        <LanguageSwitcher />
      )}
    </StyledHome>
  );
}
