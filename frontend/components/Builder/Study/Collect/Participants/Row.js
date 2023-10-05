import Link from "next/link";

export default function Row({ studyId, participant }) {
  return <div className="tableRow">
    <p>{participant?.publicReadableId}</p>
    
    <Link
      href={{
        pathname: `/builder/studies`,
        query: {
          selector: studyId,
          tab: `collect`,
          id: participant?.id
        }
      }}
    >
      <p>Open</p>
    </Link>
  </div>;
}
