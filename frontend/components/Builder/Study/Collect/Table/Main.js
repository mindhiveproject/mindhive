import Header from "./Header";
import UserRowWrapper from "./UserRowWrapper";
import GuestRowWrapper from "./GuestRowWrapper";
import { useState, useEffect } from "react";

import { Icon } from "semantic-ui-react";

import ParticipantsPagination from "./Pagination";

export default function ParticipantsTable({ study, components }) {
  // page setup
  const perPage = 20;
  const [page, setPage] = useState(1);

  // participants
  const [participants, setParticipants] = useState([]);
  const count = participants.length;

  // consents
  const consents = study?.consent || [];

  const orderParticipantsBy = ({ participants, orderBy, direction }) => {
    let orderedParticipants = [...participants];
    const director = direction === "fromLowToHigh" ? 1 : -1;
    if (orderBy === "started") {
      orderedParticipants = [...participants].sort((a, b) => {
        const timeA =
          (a?.studiesInfo?.[study?.id]?.info?.path.length &&
            a?.studiesInfo?.[study?.id]?.info?.path[0]?.timestampFinished) ||
          a?.publicReadableId;
        const timeB =
          (b?.studiesInfo?.[study?.id]?.info?.path.length &&
            b?.studiesInfo?.[study?.id]?.info?.path[0]?.timestampFinished) ||
          b?.publicReadableId;
        return timeA > timeB ? director : -director;
      });
    }
    if (
      orderBy === "publicId" ||
      orderBy === "publicReadableId" ||
      orderBy === "type"
    ) {
      orderedParticipants = [...participants].sort((a, b) => {
        return a[orderBy] > b[orderBy] ? director : -director;
      });
    }
    if (orderBy === "completed") {
      orderedParticipants = [...participants].sort((a, b) => {
        const lengthA = a?.studiesInfo?.[study?.id]?.info?.path.length || 0;
        const lengthB = b?.studiesInfo?.[study?.id]?.info?.path.length || 0;
        return lengthA > lengthB ? director : -director;
      });
    }
    if (orderBy === "condition") {
      orderedParticipants = [...participants].sort((a, b) => {
        const conditionA =
          (a?.studiesInfo?.[study?.id]?.info?.path.length &&
            a?.studiesInfo?.[study?.id]?.info?.path
              .filter((stage) => stage?.conditionLabel)
              .map((stage) => stage?.conditionLabel)
              .join("")) ||
          a?.publicReadableId;
        const conditionB =
          (b?.studiesInfo?.[study?.id]?.info?.path.length &&
            b?.studiesInfo?.[study?.id]?.info?.path
              .filter((stage) => stage?.conditionLabel)
              .map((stage) => stage?.conditionLabel)
              .join("")) ||
          b?.publicReadableId;
        return conditionA > conditionB ? director : -director;
      });
    }
    return orderedParticipants;
  };

  const setNewOrder = ({ orderBy, direction }) => {
    setParticipants(orderParticipantsBy({ participants, orderBy, direction }));
  };

  // get participants and order them by the time moment when they joined the study
  useEffect(() => {
    async function getParticipants() {
      // get both users and guests as participants
      const { participants } = study;
      const { guests } = study;
      const allParticipants = [...participants, ...guests];
      setParticipants(
        orderParticipantsBy({
          participants: allParticipants,
          orderBy: "started",
        })
      );
    }
    getParticipants();
  }, [study]);

  const participantsOnPage = participants.slice(
    page * perPage - perPage,
    page * perPage
  );

  return (
    <div className="collectBoard">
      <Header
        study={study}
        slug={study.slug}
        participants={participants}
        components={components}
      />
      <div className="participants">
        <div className="participantsBoard">
          {count > 0 && (
            <ParticipantsPagination
              page={page}
              perPage={perPage}
              count={count}
              setPage={setPage}
            />
          )}

          <div className="tableHeader">
            <div>
              <Icon
                name="arrow down"
                size="small"
                color="teal"
                className="clickable"
                onClick={() =>
                  setNewOrder({
                    orderBy: "publicId",
                    direction: "fromLowToHigh",
                  })
                }
              />
              Participant ID
              <Icon
                name="arrow up"
                size="small"
                color="teal"
                className="clickable"
                onClick={() =>
                  setNewOrder({
                    orderBy: "publicId",
                    direction: "fromHighToLow",
                  })
                }
              />
            </div>
            <div>
              <Icon
                name="arrow down"
                size="small"
                color="teal"
                className="clickable"
                onClick={() =>
                  setNewOrder({
                    orderBy: "publicReadableId",
                    direction: "fromLowToHigh",
                  })
                }
              />
              Public readable ID
              <Icon
                name="arrow up"
                size="small"
                color="teal"
                className="clickable"
                onClick={() =>
                  setNewOrder({
                    orderBy: "publicReadableId",
                    direction: "fromHighToLow",
                  })
                }
              />
            </div>
            <div>
              <Icon
                name="arrow down"
                size="small"
                color="teal"
                className="clickable"
                onClick={() =>
                  setNewOrder({
                    orderBy: "started",
                    direction: "fromLowToHigh",
                  })
                }
              />
              Started
              <Icon
                name="arrow up"
                size="small"
                color="teal"
                className="clickable"
                onClick={() =>
                  setNewOrder({
                    orderBy: "started",
                    direction: "fromHighToLow",
                  })
                }
              />
            </div>
            <div>
              <Icon
                name="arrow down"
                size="small"
                color="teal"
                className="clickable"
                onClick={() =>
                  setNewOrder({
                    orderBy: "completed",
                    direction: "fromLowToHigh",
                  })
                }
              />
              Number of completed tasks
              <Icon
                name="arrow up"
                size="small"
                color="teal"
                className="clickable"
                onClick={() =>
                  setNewOrder({
                    orderBy: "completed",
                    direction: "fromHighToLow",
                  })
                }
              />
            </div>
            <div>
              <Icon
                name="arrow down"
                size="small"
                color="teal"
                className="clickable"
                onClick={() =>
                  setNewOrder({
                    orderBy: "condition",
                    direction: "fromLowToHigh",
                  })
                }
              />
              Condition
              <Icon
                name="arrow up"
                size="small"
                color="teal"
                className="clickable"
                onClick={() =>
                  setNewOrder({
                    orderBy: "condition",
                    direction: "fromHighToLow",
                  })
                }
              />
            </div>
            <div>IRB consent decision</div>
            <div>
              <Icon
                name="arrow down"
                size="small"
                color="teal"
                className="clickable"
                onClick={() =>
                  setNewOrder({
                    orderBy: "type",
                    direction: "fromLowToHigh",
                  })
                }
              />
              Account
              <Icon
                name="arrow up"
                size="small"
                color="teal"
                className="clickable"
                onClick={() =>
                  setNewOrder({
                    orderBy: "type",
                    direction: "fromHighToLow",
                  })
                }
              />
            </div>
            <div>Include all data in analysis</div>
          </div>

          <div>
            {participantsOnPage.map((participant, num) => {
              if (participant?.type === "GUEST") {
                return (
                  <GuestRowWrapper
                    key={num}
                    num={num}
                    studyId={study?.id}
                    participant={participant}
                    consents={consents}
                  />
                );
              } else {
                return (
                  <UserRowWrapper
                    key={num}
                    num={num}
                    studyId={study?.id}
                    participant={participant}
                    consents={consents}
                  />
                );
              }
            })}
          </div>

          {count > 5 && (
            <ParticipantsPagination
              page={page}
              perPage={perPage}
              count={count}
              setPage={setPage}
            />
          )}
        </div>
      </div>
    </div>
  );
}
