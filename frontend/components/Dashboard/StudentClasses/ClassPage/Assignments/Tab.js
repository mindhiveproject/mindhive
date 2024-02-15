import absoluteUrl from "next-absolute-url";
import { Icon, Popup } from "semantic-ui-react";
import moment from "moment";
import Link from "next/link";

export default function AssignmentTab({ assignment, myclass, user, query }) {
  const { origin } = absoluteUrl();

  const copyLink = () => {
    const copyLink = `${origin}/dashboard/assignments/${assignment?.code}`;
    const temp = document.createElement("input");
    document.body.append(temp);
    temp.value = copyLink;
    temp.select();
    document.execCommand("copy");
    temp.remove();
    alert("The link is copied");
  };

  return (
    <div className="tab">
      <div className="header">
        <div className="firstLine">
          <div>
            <div className="title">
              <h2>{assignment?.title}</h2>
            </div>
            <em>{moment(assignment?.createdAt).format("MMM D, YYYY")}</em>
          </div>

          <div className="title"></div>
        </div>

        <div className="headerInfo">
          <>
            <div className="buttons">
              <Link
                href={{
                  pathname: `/dashboard/assignments/${assignment?.code}`,
                }}
              >
                <button className="secondary">Open</button>
              </Link>

              <button className="secondary" onClick={() => copyLink()}>
                Copy link
              </button>
            </div>
          </>
        </div>
      </div>
    </div>
  );
}
