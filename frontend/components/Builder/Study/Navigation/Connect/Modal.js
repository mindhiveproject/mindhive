import { useState } from "react";
import { Modal } from "semantic-ui-react";
import { Icon } from "semantic-ui-react";

import LinkClass from "./LinkClass";
import Collaborators from "../../../../Global/Collaborators";

export default function ConnectModal({
  study,
  user,
  handleChange,
  updateStudy,
}) {
  const [open, setOpen] = useState(false);

  const collaborators =
    (study && study?.collaborators?.map((c) => c?.id)) || [];

  return (
    <Modal
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
      open={open}
      trigger={<Icon size="large" name="dropdown" />}
    >
      <Modal.Content>
        <Modal.Description>
          <div className="connectModal">
            <h2>Select the class</h2>
            <LinkClass study={study} handleChange={handleChange} />
            <h2>Add collaborators</h2>
            <Collaborators
              collaborators={collaborators}
              handleChange={handleChange}
            />

            {user?.permissions.map((p) => p?.name).includes("ADMIN") && (
              <div className="collaboratorUsernamesForAdmin">
                <span>
                  <em>This information is visible only for ADMIN</em>
                </span>
                <h2>Study Author</h2>
                {study?.author?.username || "No Author"}
                <h2>Collaborators</h2>
                {study?.collaborators?.length === 0 && (
                  <span>No Collaborators</span>
                )}
                {study?.collaborators?.map((collaborator, num) => (
                  <span key={num} className="collaboratorUsername">
                    {collaborator?.username}
                  </span>
                ))}
              </div>
            )}
          </div>
        </Modal.Description>
      </Modal.Content>
      <Modal.Actions>
        <div className="modalButtons">
          <button
            className="secondaryBtn"
            onClick={() => setOpen(false)}
            disabled={false}
          >
            Close
          </button>

          <button
            className="primaryBtn"
            onClick={() => {
              updateStudy();
              setOpen(false);
            }}
            disabled={false}
          >
            Save & Close
          </button>
        </div>
      </Modal.Actions>
    </Modal>
  );
}

// class SharingModal extends Component {
//   render() {
//     const { study, onModalClose, user } = this.props;

//     return (
//       <Modal
//         open
//         closeOnDimmerClick={false}
//         size="small"
//         onClose={() => onModalClose()}
//         trigger={<Icon size="large" name="dropdown" />}
//       >
//         <Modal.Content>
//           <Modal.Description>
//             <div className="modal">
//               <h2>Select the class</h2>
//               <LinkClass
//                 study={study}
//                 handleSetState={this.props.updateStudyState}
//                 user={user}
//               />
//               <h2>Add collaborators</h2>
//               <Collaborators
//                 study={study}
//                 handleSetState={this.props.updateStudyState}
//               />

//               {user?.permissions.includes("ADMIN") && (
//                 <div className="collaboratorUsernamesForAdmin">
//                   <span>
//                     <em>This information is visible only for ADMIN</em>
//                   </span>
//                   <h2>Study Author</h2>
//                   {study?.author?.username || "No Author"}
//                   <h2>Collaborators</h2>
//                   {study?.collaborators?.length === 0 && (
//                     <span>No Collaborators</span>
//                   )}
//                   {study.collaborators.map((collaborator, num) => (
//                     <span key={num} className="collaboratorUsername">
//                       {collaborator}
//                     </span>
//                   ))}
//                 </div>
//               )}
//             </div>
//           </Modal.Description>
//         </Modal.Content>
//         <Modal.Actions>
//           <div className="buttons">
//             <button
//               className="secondary"
//               onClick={() => onModalClose()}
//               disabled={false}
//             >
//               Close without saving
//             </button>

//             <SaveStudy
//               className="primary"
//               study={this.props.study}
//               isAuthor={this.props.isAuthor}
//               adminMode={this.props.adminMode}
//               needToClone={this.props.needToClone}
//               newStudyFromScratch={this.props.newStudyFromScratch}
//               createNewStudy={this.props.createNewStudy}
//               updateMyStudy={this.props.updateMyStudy}
//               proposalId={this.props.proposalId}
//               buttonTitle="Save & close"
//               callback={() => onModalClose()}
//             >
//               <button className="primary">Save & close</button>
//             </SaveStudy>
//           </div>
//         </Modal.Actions>
//       </Modal>
//     );
//   }
// }

// export default SharingModal;
