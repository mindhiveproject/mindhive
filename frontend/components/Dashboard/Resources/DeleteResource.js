import { useMutation } from "@apollo/client";

import { DELETE_RESOURCE } from "../../Mutations/Resource";

export default function DeleteResource({
  children,
  resourceId,
  refetchQueries,
}) {
  const [deleteResource, { loading }] = useMutation(DELETE_RESOURCE, {
    variables: {
      id: resourceId,
    },
    refetchQueries: [...refetchQueries],
  });

  return (
    <div
      style={{ cursor: "pointer" }}
      onClick={() => {
        if (confirm("Are you sure you want to delete this resource?")) {
          deleteResource().catch((err) => {
            alert(err.message);
          });
        }
      }}
    >
      {children}
    </div>
  );
}
