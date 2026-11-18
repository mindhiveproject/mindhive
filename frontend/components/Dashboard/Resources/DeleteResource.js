import { useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
import { DELETE_RESOURCE } from "../../Mutations/Resource";

export default function DeleteResource({
  children,
  resourceId,
  refetchQueries,
  confirmMessage,
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
      style={{ cursor: "pointer", display: "inline-flex" }}
      onClick={() => {
        if (confirm(confirmMessage || t("boardManagement.deleteResource"))) {
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
