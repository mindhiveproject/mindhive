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
            id: participant?.id,
          },
        }}
      >
        <p>{participant?.publicReadableId}</p>
      </Link>

      <p>{participant?.datasets?.length}</p>

      <p>{participant?.type}</p>
    </div>
  );
}