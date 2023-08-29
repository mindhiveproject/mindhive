import ProposalRow from "./Row";

export default function ProposalList({ proposals }) {
  return (
    <div>
      <div className="navigationHeader"></div>

      <div className="reviewHeader">
        <div>Study</div>
        <div>Proposal</div>
        <div>Class</div>
        <div className="centered">Submitted</div>
        <div className="centered">Reviews</div>
        <div>Actions</div>
      </div>

      {proposals.map((proposal) => (
        <ProposalRow
          key={proposal.id}
          proposal={proposal}
          showProposalTitle
          showClass
          showStatus
        />
      ))}
    </div>
  );
}
