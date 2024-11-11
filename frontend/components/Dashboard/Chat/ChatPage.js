import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import { GET_CHAT } from "../../Queries/Chat";
import EditTitle from "./Chatroom/EditTitle";
import NewMessage from "./Chatroom/NewMessage";
import Message from "./Chatroom/Message";

import { Image, Popup } from "semantic-ui-react";

export default function ClassPage({ code, user, query, studyid }) {
  const { data, loading, error } = useQuery(GET_CHAT, {
    variables: { id: code },
  });

  const chat = data?.talk || {};
  const messages = chat?.words || [];

  // chat members
  const classMembers =
    chat?.classes
      ?.map((theClass) => {
        return [theClass?.creator, ...theClass?.mentors, ...theClass?.students];
      })
      .flat() || [];
  const studyMembers =
    chat?.studies
      ?.map((study) => {
        return [study?.author, ...study?.collaborators];
      })
      .flat() || [];
  const directMembers = chat?.members || [];

  const allMembers = [...classMembers, ...studyMembers, ...directMembers].map(
    (member) => member?.id
  );
  const allMembersIds = [...new Set(allMembers)];
  const membersIds = allMembersIds.filter((id) => id !== user?.id);

  return (
    <>
      <EditTitle chat={chat} />

      {chat?.members?.length > 0 && (
        <div className="members">
          <span className="title">Members</span>
          <div>
            {chat?.members.map((member, num) => (
              <Popup
                content={member?.username}
                key={num}
                trigger={
                  member?.image?.image?.publicUrlTransformed ? (
                    <Image
                      src={member?.image?.image?.publicUrlTransformed}
                      avatar
                    />
                  ) : (
                    <Image src="/assets/icons/builder/page.svg" avatar />
                  )
                }
                size="huge"
              />
            ))}
          </div>
        </div>
      )}

      <div className="chatRoom">
        <NewMessage
          chat={chat}
          btnName="Add posting"
          membersIds={membersIds}
          isMain
          studyid={studyid}
        />

        <div>
          {[...messages]
            .filter((message) => message?.isMain)
            .sort(
              (a, b) =>
                new Date(a?.createdAt).getTime() -
                new Date(b?.createdAt).getTime()
            )
            .map((message) => (
              <Message
                key={message?.id}
                user={user}
                message={message}
                chat={chat}
                membersIds={membersIds}
              />
            ))}
        </div>
      </div>
    </>
  );
}

// {chat?.classes?.length > 0 && (
//   <div>
//     <span className="title">Classes</span>
//     {chat?.classes?.map((theClass, num) => {
//       const membersSet = [
//         theClass.creator.username,
//         ...theClass.mentors.map((c) => c.username),
//         ...theClass.students.map((c) => c.username),
//       ];
//       const members = [...new Set(membersSet)];
//       return (
//         <div key={num}>
//           <span className="item" key={num}>
//             {theClass?.title}
//           </span>
//           {/* <Avatar members={members} /> */}
//         </div>
//       );
//     })}
//   </div>
// )}

// {chat?.studies?.length > 0 && (
//   <div>
//     <span className="title">Studies</span>
//     {chat?.studies?.map((study, num) => {
//       const membersSet = [
//         study.author.username,
//         ...study.collaborators.map((c) => c.username),
//       ];
//       const members = [...new Set(membersSet)];
//       return (
//         <div key={num}>
//           <span className="item" key={num}>
//             {study?.title}
//           </span>
//           {/* <Avatar members={members} /> */}
//         </div>
//       );
//     })}
//   </div>
// )}
