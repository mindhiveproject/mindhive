import StyledHome from "../../styles/StyledHome";
import Profile from "../Profile/Main";
// import FavoritePeople from "../Connect/Connections/FavoritePeople";
import FavoriteTasks from "../../Tasks/Bank/FavoriteTasks";
import SponsorOnboarding from "./SponsorOnboarding";
import NetworkPendingInvites from "./NetworkPendingInvites";
import NetworkAppointmentRequests from "./NetworkAppointmentRequests";

export default function Home({ query, user }) {
  return (
    <StyledHome>
      <Profile />
      <SponsorOnboarding />
      <NetworkPendingInvites user={user} />
      <NetworkAppointmentRequests />
      {/* <FavoritePeople user={user} /> */}
      {/* Updates now live in the menu bar's notifications flyout. */}
      <FavoriteTasks user={user} />
    </StyledHome>
  );
}
