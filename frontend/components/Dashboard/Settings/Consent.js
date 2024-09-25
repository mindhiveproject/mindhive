import Link from "next/link";
import { Divider } from "semantic-ui-react";

import Permissions from "./Consent/Permissions";
import Documents from "./Consent/Documents";
import Activity from "./Consent/Activity";

export default function Consent({ query, user }) {
  const { section } = query;

  if (section === "permissions") {
    return <Permissions query={query} user={user} />;
  }

  if (section === "documents") {
    return <Documents query={query} user={user} />;
  }

  if (section === "activity") {
    return <Activity query={query} user={user} />;
  }

  return (
    <>
      <h1>Data and Consent</h1>

      <h3>
        MindHive would like to use the following data in order to create better
        experiences for our users and to continue contributing to meaningful
        research
      </h3>

      <Divider />

      <div className="quickLinks">
        <div className="links">
          <Link
            href={{
              pathname: `/dashboard/settings/consent`,
              query: {
                section: "permissions",
              },
            }}
          >
            <div className="link">
              <div>
                <img
                  src={`/assets/icons/profile/consent.svg`}
                  alt="permissions"
                />
              </div>
              <div className="content">
                <div className="p18">Data Permissions</div>
                <div>
                  Review and edit your data permissions and view your acitivty
                </div>
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
              query: {
                section: "documents",
              },
            }}
          >
            <div className="link">
              <div>
                <img
                  src={`/assets/icons/profile/documents.svg`}
                  alt="documents"
                />
              </div>
              <div className="content">
                <div className="p18">Consent Documents</div>
                <div>
                  Review and submit documents to support research at MindHive
                </div>
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
              query: {
                section: "activity",
              },
            }}
          >
            <div className="link">
              <div>
                <img
                  src={`/assets/icons/profile/activity.svg`}
                  alt="activity"
                />
              </div>
              <div className="content">
                <div className="p18">My Activity</div>
                <div>View studies and tasks you have participated in</div>
              </div>
              <div>
                <img src={`/assets/icons/profile/arrow.svg`} alt="arrow" />
              </div>
            </div>
          </Link>

          <Divider />
        </div>
      </div>

      <div className="buttons">
        <div></div>
        <div className="consentButtonBack">
          <Link
            href={{
              pathname: `/dashboard/settings`,
            }}
          >
            <button className="back">Back to Settings</button>
          </Link>
        </div>
      </div>
    </>
  );
}
