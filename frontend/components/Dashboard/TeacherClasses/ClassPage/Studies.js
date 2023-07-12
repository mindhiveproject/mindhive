import { useRouter } from "next/router";
import moment from "moment";

export default function Studies({ myclass, user }) {
  const router = useRouter();

  const studies = myclass?.studies || [];

  if (studies.length === 0) {
    return (
      <div className="empty">
        <div>The students haven’t created any studies yet.</div>
      </div>
    );
  }

  return (
    <div className="studies">
      <div className="studiesHeader">
        <div>
          <span>Study title </span>
          <span
            style={{ cursor: "pointer" }}
            onClick={() => randomizeStudiesOrder(false)}
          >
            ↓
          </span>
        </div>
        <div>Collaborator(s)</div>
        <div>Participants</div>
        <div>Date created</div>
        <div></div>
        <div></div>
      </div>
      {studies.map((study) => {
        const authors = [
          study?.author?.username,
          study?.collaborators?.map((c) => c.username),
        ].join(", ");
        return (
          <div key={study?.id} className="studiesRow">
            <div>{study?.title}</div>
            <div>{authors}</div>
            <div>{study?.participants?.length}</div>
            <div>{moment(study?.createdAt).format("MMMM D, YYYY")}</div>
            <div>
              <a
                target="_blank"
                href={`/studies/${study.slug}`}
                rel="noreferrer"
              >
                Study page
              </a>
            </div>
            <div>
              <a
                target="_blank"
                href={`/builder/studies/?selector=${study.id}`}
                rel="noreferrer"
              >
                Study builder
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}
