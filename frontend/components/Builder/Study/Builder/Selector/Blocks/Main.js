import { useQuery } from "@apollo/client";

import PublicBlocks from "./Public";
import PrivateBlocks from "./Private";

export default function Blocks({
  engine,
  user,
  createdBy,
  search,
  componentType,
  addFunctions,
}) {
  if (createdBy === "anyone") {
    return (
      <PublicBlocks
        engine={engine}
        user={user}
        search={search}
        componentType={componentType}
        addFunctions={addFunctions}
      />
    );
  }

  if (createdBy === "me") {
    return (
      <PrivateBlocks
        engine={engine}
        user={user}
        search={search}
        componentType={componentType}
        addFunctions={addFunctions}
      />
    );
  }
}
