import { useState, useRef, useEffect } from "react";
import { useMutation } from "@apollo/client";
import uniqid from "uniqid";
import Link from "next/link";
import absoluteUrl from "next-absolute-url";
import useTranslation from "next-translate/useTranslation";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { AgGridReact } from "ag-grid-react";

import { EDIT_CLASS, REMOVE_MENTOR_FROM_CLASS } from "../../../Mutations/Classes";
import { GET_CLASS } from "../../../Queries/Classes";
import DropdownMenu from "../../../DesignSystem/DropdownMenu";
import Button from "../../../DesignSystem/Button";
import CopyButton from "../../../DesignSystem/CopyButton";

export default function ClassMentors({ myclass, user }) {
  const { t } = useTranslation("classes");
  const { origin } = absoluteUrl();

  const [updateClass, { loading }] = useMutation(EDIT_CLASS, {
    variables: {
      id: myclass?.id,
    },
    refetchQueries: [{ query: GET_CLASS, variables: { code: myclass?.code } }],
  });

  const [removeFromClass] = useMutation(REMOVE_MENTOR_FROM_CLASS, {
    variables: {
      classId: myclass?.id,
    },
    refetchQueries: [
      { query: GET_CLASS, variables: { code: myclass?.code } },
    ],
  });

  const mentors = myclass?.mentors || [];
  const mentorInvitationCode = myclass?.settings?.mentorInvitationCode;
  const [linkCreated, setLinkCreated] = useState(false);
  const linkCreatedTimeoutRef = useRef(null);

  useEffect(
    () => () => {
      if (linkCreatedTimeoutRef.current) {
        clearTimeout(linkCreatedTimeoutRef.current);
      }
    },
    []
  );

  const mentorSignupLink = mentorInvitationCode
    ? `${origin}/signup/mentor?code=${myclass.code}&i=${mentorInvitationCode}`
    : "";

  const UsernameRenderer = (params) => {
    const mentor = params?.data;
    if (!mentor) return null;
    return (
      <Link
        href={{ pathname: `/dashboard/mentors/${mentor?.publicId}` }}
        style={{ color: "inherit", textDecoration: "none", fontWeight: 500 }}
      >
        {mentor?.username}
      </Link>
    );
  };

  const ActionsRenderer = (params) => {
    const mentor = params?.data;
    if (!mentor) return null;
    return (
      <DropdownMenu
        triggerLabel={t("assignment.more", {}, { default: "More" })}
        items={[
          {
            key: "remove",
            label: t("mentors.removeFromClass"),
            danger: true,
            onClick: () => {
              if (confirm(t("mentors.removeMentorConfirm"))) {
                removeFromClass({
                  variables: { mentorId: mentor?.id },
                }).catch((err) => {
                  alert(err.message);
                });
              }
            },
          },
        ]}
      />
    );
  };

  const columnDefs = [
    {
      field: "username",
      headerName: t("mentors.mentorUsername"),
      cellRenderer: UsernameRenderer,
      filter: "agTextColumnFilter",
      sortable: true,
      flex: 1,
      minWidth: 160,
    },
    {
      field: "email",
      headerName: t("mentors.emailAddress"),
      filter: "agTextColumnFilter",
      sortable: true,
      flex: 1,
      minWidth: 200,
    },
    {
      field: "actions",
      headerName: t("assignment.actions", {}, { default: "Actions" }),
      cellRenderer: ActionsRenderer,
      suppressFilter: true,
      sortable: false,
      width: 150,
      pinned: "right",
      cellStyle: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "visible",
      },
    },
  ];

  return (
    <div className="classTabPage mentors">
      <section className="classTabSection">
        <div className="classTabSectionHeader">
          <h3>{t("navigation.mentors", {}, { default: "Mentors" })}</h3>
          <p>{t("mentors.shareLinkWithMentors")}</p>
        </div>
        <div className="classTabInformationBlock">
          {mentorInvitationCode ? (
            <div className="block">
              <div className="classTabInviteBlock">
                <p className="classTabInviteLabel">
                  {t("mentors.shareLinkWithMentors")}
                </p>
                <div className="classTabCopyArea">
                  <div className="classTabInviteLink">
                    {origin}/signup/mentor?code={myclass.code}&i=
                    {mentorInvitationCode}
                  </div>
                  <CopyButton variant="outline" value={mentorSignupLink}>
                    {t("mentors.copy")}
                  </CopyButton>
                </div>
              </div>
            </div>
          ) : null}
          <div className="block">
            <div className="classTabCopyArea">
              <p className="classTabInfoText">
                {mentorInvitationCode
                  ? t("mentors.newLinkWillInvalidate")
                  : t("mentors.createNewInvitationLink")}
              </p>
              <Button
                variant="outline"
                disabled={loading || linkCreated}
                onClick={async () => {
                  await updateClass({
                    variables: {
                      settings: {
                        ...myclass?.settings,
                        mentorInvitationCode: uniqid.time(),
                      },
                    },
                  });
                  setLinkCreated(true);
                  if (linkCreatedTimeoutRef.current) {
                    clearTimeout(linkCreatedTimeoutRef.current);
                  }
                  linkCreatedTimeoutRef.current = setTimeout(
                    () => setLinkCreated(false),
                    2000
                  );
                }}
              >
                {loading
                  ? t("mentors.creating")
                  : linkCreated
                    ? t("mentors.newLinkCreated", {}, {
                        default: "New link created",
                      })
                    : t("mentors.createNewLink", {}, {
                        default: "Create a new link",
                      })}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="classTabSection">
        <div className="classTabSectionHeader">
          <h3>
            {t("mentors.roster", {}, { default: "Mentor roster" })}
          </h3>
          <p>
            {t(
              "mentors.rosterDescription",
              { count: mentors.length },
              {
                default: "{{count}} mentors associated with this class.",
              }
            )}
          </p>
        </div>
        {mentors.length === 0 ? (
          <div className="classTabEmpty">
            <div>
              {t("mentors.noMentorsYet", {}, {
                default:
                  "No mentors have joined this class yet. Create an invitation link above.",
              })}
            </div>
          </div>
        ) : (
          <div className="classTabTable ag-theme-quartz">
            <AgGridReact
              rowData={mentors}
              columnDefs={columnDefs}
              getRowId={(params) => params.data?.id}
              pagination
              paginationPageSize={20}
              paginationPageSizeSelector={[10, 20, 50, 100]}
              autoSizeStrategy={{ type: "fitGridWidth", defaultMinWidth: 100 }}
              defaultColDef={{ resizable: true, sortable: true, filter: true }}
            />
          </div>
        )}
      </section>
    </div>
  );
}
