import Link from "next/link";

import GoogleSignup from "../GoogleSignup";
import TermsConditions from "../TermsConditions";

export default function Select({ code }) {
  return (
    <>
      <h1>How would you like to join MindHive?</h1>
      <div className="studentSignupOptions">
        <Link
          href={{
            pathname: `/signup/student`,
            query: {
              code: code,
              action: "signup",
            },
          }}
        >
          <div>
            <img src="/assets/signup/email.png" alt="icon" height="20" />
          </div>
          <div>Sign up with email/username</div>
        </Link>
        <GoogleSignup role="student" classCode={code} />
        <TermsConditions btnName={`"Sign up with Google"`} />
      </div>
    </>
  );
}
