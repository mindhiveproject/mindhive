import { useMutation } from "@apollo/client";
import uniqid from "uniqid";
import { Dropdown } from "semantic-ui-react";
import Link from "next/link";

import { EDIT_CLASS } from "../../../Mutations/Classes";
import { REMOVE_MENTOR_FROM_CLASS } from "../../../Mutations/Classes";
import { GET_CLASS } from "../../../Queries/Classes";
// import { GET_TEACHER_CLASSES } from "../../../Queries/Classes";

export default function ClassMentors({ myclass, user }) {
  const [updateClass, { loading }] = useMutation(EDIT_CLASS, {
    variables: {
      id: myclass?.id,
    },
    refetchQueries: [{ query: GET_CLASS, variables: { code: myclass?.code } }],
  });

  const [removeFromClass, { loading: removeLoading }] = useMutation(
    REMOVE_MENTOR_FROM_CLASS,
    {
      variables: {
        classId: myclass?.id,
      },
      refetchQueries: [
        // { query: GET_TEACHER_CLASSES, variables: { id: user?.id } },
        { query: GET_CLASS, variables: { code: myclass?.code } },
      ],
    }
  );

  const mentors = myclass?.mentors || [];
  const mentorInvitationCode = myclass?.settings?.mentorInvitationCode;

  const copyLink = (mentorInvitationCode) => {
    const copyLink = `https://mindhive.science/signup/mentor/${myclass.code}/${mentorInvitationCode}`;
    const temp = document.createElement("input");
    document.body.append(temp);
    temp.value = copyLink;
    temp.select();
    document.execCommand("copy");
    temp.remove();
    alert("The link is copied");
  };

  return (
    <div className="mentors">
      <div className="mentorsPageHeader">
        {mentorInvitationCode && (
          <div>
            <p>
              Share the link below with mentors to invite them to join your
              class
            </p>
            <div className="copyArea">
              <div className="link">
                https://mindhive.science/signup/mentor/
                {myclass.code}/{mentorInvitationCode}
              </div>
              <div
                className="copyButton"
                onClick={() => copyLink(mentorInvitationCode)}
              >
                Copy
              </div>
            </div>
          </div>
        )}

        <div>
          {mentorInvitationCode ? (
            <div className="infoText">
              ⚠️ Creating a new link will invalidate the current one
            </div>
          ) : (
            <div className="infoText">
              👋 Create a new invitation link for mentors to join your class
            </div>
          )}
          <button
            className="copyButton"
            onClick={async () => {
              await updateClass({
                variables: {
                  settings: {
                    ...myclass?.settings,
                    mentorInvitationCode: uniqid.time(),
                  },
                },
              });
            }}
          >
            {loading ? "Creating ..." : "Create link"}
          </button>
        </div>
      </div>

      <div className="listHeader">
        <div></div>
        <div>Mentor/Username</div>
        <div>Email address</div>
      </div>

      {mentors.map((mentor, i) => {
        return (
          <div key={i} className="listWrapper">
            <Dropdown className="dropdownMenu" simple>
              <Dropdown.Menu>
                <Dropdown.Item
                  className="dropdownItem"
                  name="remove"
                  onClick={() => {
                    if (
                      confirm(
                        "Are you sure you want to remove this mentor from the class?"
                      )
                    ) {
                      removeFromClass({
                        variables: { mentorId: mentor?.id },
                      }).catch((err) => {
                        alert(err.message);
                      });
                    }
                  }}
                >
                  Remove from this class
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
            <Link
              href={{
                pathname: `/dashboard/mentors/${mentor?.publicId}`,
              }}
            >
              <div className="listRow" style={{ cursor: "pointer" }}>
                <div>{mentor?.username}</div>
                <div>{mentor?.email}</div>
              </div>
            </Link>
          </div>
        );
      })}
    </div>
  );
}
