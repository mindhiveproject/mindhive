import Link from "next/link";

export default function ProfileType({}) {
  return (
    <>
      <p>
        Set up your MindHive profile by choosing an option below. Are you
        creating a personal profile for yourself, or setting up a page for your
        organization?
      </p>
      <div className="chooseProfileType">
        <h2>Choose your profile type</h2>

        <div className="profileChoicesArea">
          <div>
            <Link
              href={{
                pathname: `/dashboard/profile/create`,
                query: {
                  page: "about",
                  type: "organization",
                },
              }}
            >
              <div className="profileChoiceButton">
                <div>
                  <img src={`/assets/icons/profile/people.svg`} />
                </div>
                <div>Organization</div>
              </div>
            </Link>
            <p>
              This profile is best for when you are creating an account to
              represent a community organization or company.
            </p>
          </div>

          <div>
            <Link
              href={{
                pathname: `/dashboard/profile/edit`,
                query: {
                  page: "about",
                  type: "individual",
                },
              }}
            >
              <div className="profileChoiceButton">
                <div>
                  <img src={`/assets/icons/profile/user.svg`} />
                </div>
                <div>Individual</div>
              </div>
            </Link>
            <p>
              This profile is best for when you are creating an account for
              yourself.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
