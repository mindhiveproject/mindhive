import { useState } from "react";
import useTranslation from "next-translate/useTranslation";

import { Dropdown } from "semantic-ui-react";

import { PROPOSAL_QUERY } from "../../../../Queries/Proposal";
import { useQuery } from "@apollo/client";

export default function ProposalSelector({ study, handleChange, proposalId }) {
  const { t } = useTranslation("builder");
  const [cardId, setCardId] = useState(
    study?.descriptionInProposalCard?.id || null
  );

  // write query
  const { data, loading, error } = useQuery(PROPOSAL_QUERY, {
    variables: { id: proposalId },
  });

  const proposal = data?.proposalBoard || { sections: [] };
  const { sections } = proposal;
  const orderedSections = [...sections].sort((a, b) => a.position - b.position);

  const titleOptions = orderedSections
    .map((section) =>
      // order cards inside each section
      [...section.cards].sort((a, b) => a.position - b.position)
    )
    .flat()
    .map((card) => ({
      key: card.id,
      text: card.title,
      value: card.id,
    }));

  const onSelect = (data) => {
    setCardId(data.value);
    handleChange({
      target: {
        name: "descriptionInProposalCardId",
        value: data?.value,
      },
    });
    // this.props.updateStudyState("descriptionInProposalCardId", data.value);
  };

  return (
    <div className="selector">
      <p>{t("proposalSelector.selectCard", "Select card")}</p>
      <Dropdown
        placeholder={t("proposalSelector.linkToProposal", "Link to proposal")}
        fluid
        selection
        options={titleOptions}
        onChange={(event, data) => onSelect(data)}
        value={cardId}
      />
    </div>
  );
}

// class ProposalCardSelector extends Component {
//   state = {
//     cardId: this.props?.descriptionInProposalCard?.id || null,
//   };

//   render() {
//     return (
//       <Query
//         query={GET_CARD_TITLES_OF_PROPOSAL_QUERY_BY_ID}
//         variables={{ id: this.props.proposalId }}
//       >
//         {(proposalPayload) => {
//           const proposalPayloadError = proposalPayload.error;
//           const proposalPayloadLoading = proposalPayload.loading;
//           const proposalPayloadData =
//             proposalPayload.data && proposalPayload.data.proposalBoard;
//           if (proposalPayloadError)
//             return <Error error={proposalPayloadError} />;
//           if (proposalPayloadLoading) return <p>Loading</p>;
//           if (!proposalPayloadData)
//             return (
//               <div>
//                 <p>No proposal found</p>
//               </div>
//             );

//           // get the titles of all cards in the proposal

//           return (
//             <div className="selector">
//               <p>Select card</p>
//               <Dropdown
//                 placeholder="Link to proposal"
//                 fluid
//                 selection
//                 options={titleOptions}
//                 onChange={(event, data) => this.onSelect(data)}
//                 value={this.state.cardId}
//               />
//             </div>
//           );
//         }}
//       </Query>
//     );
//   }
// }
