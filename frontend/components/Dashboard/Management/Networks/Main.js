import { useQuery } from "@apollo/client";
import moment from "moment";
import Link from "next/link";

import { GET_ALL_NETWORKS } from "../../../Queries/ClassNetwork";

import EditNetwork from "./Edit";
import AddNetwork from "./Add";

export default function Networks({ query, user }) {
  const { data, loading, error } = useQuery(GET_ALL_NETWORKS);
  const networks = data?.classNetworks || [];

  const { id, action } = query;
  if (action) {
    if (action === "add") {
      return <AddNetwork />;
    }
    if (action === "edit" && id) {
      return <EditNetwork user={user} id={id} />;
    }
  }

  return (
    <div>
      <div className="navigationHeader">
        <Link
          href={{
            pathname: "/dashboard/management/networks",
            query: {
              action: "add",
            },
          }}
        >
          <button>Add class network</button>
        </Link>
      </div>

      <div className="classHeader">
        <div>Network name</div>
        <div>Creator</div>
        <div>Classes</div>
        <div>Date created</div>
      </div>

      {networks.map((network) => (
        <Link
          href={{
            pathname: "/dashboard/management/networks",
            query: {
              id: network?.id,
              action: "edit",
            },
          }}
          key={network.id}
        >
          <div className="classRow">
            <div>{network?.title}</div>
            <div>{network?.creator?.username}</div>
            <div className="classTitles">
              {network?.classes.map((c) => (
                <div>{c.title}</div>
              ))}
            </div>
            <div>{moment(network?.createdAt).format("MMMM D, YYYY")}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}
