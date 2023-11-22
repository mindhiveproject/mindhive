import Link from "next/link";

import GoogleSignup from "../GoogleSignup";
import TermsConditions from "../TermsConditions";
import {
  SignupForm,
  StyledForm,
  SignupButton,
} from "../../../styles/StyledForm";

export default function Select({ role, classCode, invitationCode }) {
  const query =
    role === "mentor"
      ? { action: "signup", code: classCode, i: invitationCode }
      : { action: "signup", code: classCode };

  return (
    <SignupForm>
      <h1>How would you like to join MindHive?</h1>
      <StyledForm>
        <div className="studentSignupOptions">
          <Link
            href={{
              pathname: `/signup/${role}`,
              query: query,
            }}
          >
            <SignupButton>
              <div>
                <img src="/assets/signup/email.png" alt="icon" height="20" />
              </div>
              <div>Sign up with email/username</div>
            </SignupButton>
          </Link>
          <GoogleSignup role={role} classCode={classCode} />
          <TermsConditions btnName={`"Sign up with Google"`} />
        </div>
      </StyledForm>
    </SignupForm>
  );
}
