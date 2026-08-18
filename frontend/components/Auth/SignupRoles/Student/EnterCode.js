import { useState } from "react";
import Link from "next/link";
import { SignupForm } from "../../../styles/StyledForm";
import useTranslation from "next-translate/useTranslation";
import Button from "../../../DesignSystem/Button";

export default function EnterCode({ role }) {
  const { t } = useTranslation("common");
  const [classCode, setClassCode] = useState("");
  const [invitationCode, setInvitationCode] = useState("");

  const query =
    role === "mentor"
      ? { code: classCode, i: invitationCode }
      : { code: classCode };

  return (
    <SignupForm>
      <div className="enterCodeScreen">
        <h1>Enter your class code</h1>
        <div>
          <label htmlFor="classCode">
            <input
              type="text"
              id="classCode"
              name="classCode"
              placeholder="e.g. test-class"
              onChange={({ target }) => setClassCode(target?.value)}
              value={classCode}
            />
            <div className="helpMessage">
              This code is provided by your teacher and is how you will join
              your class.
            </div>
          </label>
        </div>

        {role === "mentor" && (
          <>
            <h1>Enter your invitation code</h1>
            <div>
              <label htmlFor="invitationCode">
                <input
                  type="text"
                  id="invitationCode"
                  name="invitationCode"
                  onChange={({ target }) => setInvitationCode(target?.value)}
                  value={invitationCode}
                />
              </label>
            </div>
          </>
        )}

        <Link
          href={{
            pathname: `/signup/${role}`,
            query: query,
          }}
        >
          <Button variant="filled" style={{ width: "100%" }}>
            {t("auth.next", {}, { default: "Next" })}
          </Button>
        </Link>
      </div>
    </SignupForm>
  );
}
