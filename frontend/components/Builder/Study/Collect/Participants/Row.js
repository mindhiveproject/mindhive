import Link from "next/link";

export default function Row({ studyId, participant }) {
  return (
    <div className="tableRow">
      <Link
        href={{
          pathname: `/builder/studies`,
          query: {
            selector: studyId,
            tab: `collect`,
            id: participant?.publicId,
            type: participant?.type?.toLowerCase(),
          },
        }}
      >
        <p>
          <a>{participant?.publicId}</a>
        </p>
      </Link>

      <p>{participant?.publicReadableId}</p>
      <p>
        {
          participant?.datasets?.filter((dataset) => dataset?.isCompleted)
            .length
        }
      </p>

      <p>{participant?.type}</p>
    </div>
  );
}
