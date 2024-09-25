import Link from "next/link";
import useTranslation from "next-translate/useTranslation";
import { Divider } from "semantic-ui-react";

export default function Main({ query, user }) {
  const { t } = useTranslation("account");

  return (
    <>
      <h1>Settings</h1>

      <h3>You can update your MindHive account and privacy settings here</h3>

      <div className="quickLinks">
        <div className="p24">Quick Links</div>
        <div className="links">
          <Link
            href={{
              pathname: `/dashboard/settings/email`,
            }}
          >
            <div className="link">
              <div>
                <img src={`/assets/icons/profile/email.svg`} alt="email" />
              </div>
              <div className="content">
                <div className="p18">Email</div>
                <div>{user?.email}</div>
              </div>
              <div>
                <img src={`/assets/icons/profile/arrow.svg`} alt="arrow" />
              </div>
            </div>
          </Link>

          <Divider />

          <Link
            href={{
              pathname: `/dashboard/settings/username`,
            }}
          >
            <div className="link">
              <div>
                <img
                  src={`/assets/icons/profile/username.svg`}
                  alt="username"
                />
              </div>
              <div className="content">
                <div className="p18">Username</div>
                <div>{user?.username}</div>
              </div>
              <div>
                <img src={`/assets/icons/profile/arrow.svg`} alt="arrow" />
              </div>
            </div>
          </Link>

          <Divider />

          <Link
            href={{
              pathname: `/dashboard/settings/languages`,
            }}
          >
            <div className="link">
              <div>
                <img
                  src={`/assets/icons/profile/languages.svg`}
                  alt="languages"
                />
              </div>
              <div className="content">
                <div className="p18">Languages</div>
                <div>Set your language preferences</div>
              </div>
              <div>
                <img src={`/assets/icons/profile/arrow.svg`} alt="arrow" />
              </div>
            </div>
          </Link>

          <Divider />

          <Link
            href={{
              pathname: `/dashboard/settings/consent`,
            }}
          >
            <div className="link">
              <div>
                <img src={`/assets/icons/profile/consent.svg`} alt="consent" />
              </div>
              <div className="content">
                <div className="p18">Data and Consent Settings</div>
                <div>Manage the usage of personal information</div>
              </div>
              <div>
                <img src={`/assets/icons/profile/arrow.svg`} alt="arrow" />
              </div>
            </div>
          </Link>
        </div>
      </div>
    </>
  );
}
