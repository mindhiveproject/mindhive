import Link from "next/link";
import { StyledForm, SignupButton } from "../styles/StyledForm";

export default function Sign() {
  return (
    <StyledForm>
      <h1>Which role best describes you?</h1>

      <div className="signupOptions">
        <Link href="/signup/participant">
          <SignupButton>
            <div>
              <img
                src="/assets/signup/participant.png"
                alt="icon"
                height="20"
              />
            </div>
            <div>Study participant</div>
          </SignupButton>
        </Link>

        <Link href="/signup/student">
          <SignupButton>
            <div>
              <img src="/assets/signup/student.png" alt="icon" height="20" />
            </div>
            <div>Student</div>
          </SignupButton>
        </Link>

        <Link href="/signup/scientist">
          <SignupButton>
            <div>
              <img src="/assets/signup/scientist.png" alt="icon" height="20" />
            </div>
            <div>Scientist</div>
          </SignupButton>
        </Link>

        <Link href="/signup/teacher">
          <SignupButton>
            <div>
              <img src="/assets/signup/teacher.png" alt="icon" height="20" />
            </div>
            <div>Teacher</div>
          </SignupButton>
        </Link>
      </div>

      <span>
        Already have an account?{` `}
        <Link href="/login">Login here</Link>
      </span>
    </StyledForm>
  );
}
