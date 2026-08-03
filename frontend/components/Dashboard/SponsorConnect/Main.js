import OpportunitiesMain from "./Opportunities/Main";

export default function SponsorConnectMain({ query, user }) {
  const { selector } = query;

  if (!selector || selector === "opportunities") {
    return <OpportunitiesMain query={query} user={user} />;
  }

  return <OpportunitiesMain query={query} user={user} />;
}
