import { useContext } from "react";

import { UserContext } from "../Global/Authorized";

import Home from "./Home/Main";
import DiscoverMain from "./Discover/Main";
import ConnectMain from "./Connect/Main";
import DevelopMain from "./Develop/Main";
import ReviewMain from "./Review/Main";
import Journals from "./Journal/Main";
// import Chats from "./Chat/Main";
import TeacherClasses from "./TeacherClasses/Main";
import StudentClasses from "./StudentClasses/Main";
import Settings from "./Settings/Router";
import ConsentMain from "./Consent/Main";
import ProposalsMain from "./Proposals/Main";
import LessonsMain from "./Lessons/Main";
import TagsMain from "./Tags/Main";
import UpdatesMain from "./Updates/Main";
import UserPage from "./UserPage/Main";
import Assignments from "./Assignment/Main";

// admin area
import ManagementMain from "./Management/Main";
import Profile from "./Profile/Router";

export default function DashboardRouter({ query }) {
  const user = useContext(UserContext);
  const { area } = query;

  if (area === "discover") {
    return <DiscoverMain query={query} user={user} />;
  }

  if (area === "connect") {
    return <ConnectMain query={query} user={user} />;
  }

  if (area === "develop") {
    return <DevelopMain query={query} user={user} />;
  }

  if (area === "review") {
    return <ReviewMain query={query} user={user} />;
  }

  if (area === "journals") {
    return <Journals query={query} user={user} />;
  }

  // if (area === "chats") {
  //   return <Chats query={query} user={user} />;
  // }

  if (area === "settings") {
    return <Settings query={query} user={user} />;
  }

  if (area === "myclasses") {
    return <TeacherClasses query={query} user={user} />;
  }

  if (area === "classes") {
    return <StudentClasses query={query} user={user} />;
  }

  if (area === "assignments") {
    return <Assignments query={query} user={user} />;
  }

  if (area === "proposals") {
    return <ProposalsMain query={query} user={user} />;
  }

  if (area === "lessons") {
    return <LessonsMain query={query} user={user} />;
  }

  if (area === "irb") {
    return <ConsentMain query={query} user={user} />;
  }

  if (area === "management") {
    return <ManagementMain query={query} user={user} />;
  }

  if (area === "tags") {
    return <TagsMain query={query} user={user} />;
  }

  if (area === "updates") {
    return <UpdatesMain query={query} user={user} />;
  }

  if (area === "students") {
    return <UserPage query={query} user={user} />;
  }

  if (area === "mentors") {
    return <UserPage query={query} user={user} />;
  }

  if (area === "profile") {
    return <Profile query={query} user={user} />;
  }

  return <Home query={query} user={user} />;
}
