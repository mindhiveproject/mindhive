import Link from "next/link";

import Background from "./Blocks/Background";
import BasicInformation from "./Blocks/Basic";
import IntroductionVideo from "./Blocks/Introduction";
import Preferences from "./Blocks/Preferences";

export default function About({ query, user }) {
  return (
    <>
      <div className="aboutMe">
        <BasicInformation query={query} user={user} />
        <Background query={query} user={user} />
        <IntroductionVideo query={query} user={user} />
        <Preferences query={query} user={user} />

        <div className="navButtons">
          <Link
            href={{
              pathname: `/dashboard/profile/edit`,
              query: {
                page: "type",
              },
            }}
          >
            <button className="secondary">Previous</button>
          </Link>

          <Link
            href={{
              pathname: `/dashboard/profile/edit`,
              query: {
                page: "interests",
              },
            }}
          >
            <button className="primary">Next</button>
          </Link>
        </div>
      </div>
    </>
  );
}
