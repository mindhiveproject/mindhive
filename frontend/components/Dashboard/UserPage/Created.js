import { Icon } from "semantic-ui-react";
import moment from "moment";

export default function Created({ query, user, profile }) {
  const studies = [
    ...profile?.researcherIn.map((study) => ({
      ...study,
      role: "Author",
    })),
    ...profile?.collaboratorInStudy.map((study) => ({
      ...study,
      role: "Collaborator",
    })),
  ];

  if (studies.length === 0) {
    return (
      <div className="empty">
        <div>The student hasn’t created any studies yet.</div>
      </div>
    );
  }

  return (
    <div>
      <div className="headerCreatedStudies">
        <div>Study title</div>
        <div>Role</div>
        <div>Date created</div>
        <div>Date updated</div>
      </div>

      {studies.map((study, id) => (
        <div className="rowCreatedStudies" key={id}>
          <div className="title">
            {study?.title}
            <a
              href={`https://mindhive.science/studies/${study.slug}`}
              target="_blank"
              rel="noreferrer"
            >
              <Icon name="external alternate" />
            </a>
          </div>
          <div>{study?.role}</div>
          <div>{moment(study.createdAt).format("MMMM D, YYYY, h:mma")}</div>
          <div>{moment(study.updatedAt).format("MMMM D, YYYY, h:mma")}</div>
        </div>
      ))}
    </div>
  );
}
