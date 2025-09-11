import { useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
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
  const { t } = useTranslation("classes");

  return (
    <div
      style={{ cursor: "pointer" }}
      onClick={() => {
        if (confirm(t("boardManagement.deleteResource"))) {
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
