import moment from "moment";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { AgGridReact } from "ag-grid-react";

const LinkButton = styled.a`
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  font-family: Lato, sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  letter-spacing: 0.05em;
  text-align: center;
  border-radius: 100px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  background: #ffffff;
  color: #5d5763;
  border: 1.5px solid #5d5763;

  &:hover {
    background: #f5f5f5;
    border-color: #b3b3b3;
    color: #666666;
  }

  &:active {
    background: #e0f2f1;
    border-color: #4db6ac;
    color: #4db6ac;
  }
`;

export default function Studies({ myclass }) {
  const { t } = useTranslation("classes");

  const studies = myclass?.studies || [];

  const getCollaborators = (study) => {
    const names = [
      study?.author?.username,
      ...(study?.collaborators || []).map((c) => c?.username),
    ].filter(Boolean);
    return names.join(", ");
  };

  const StudyPageRenderer = (params) => {
    const study = params?.data;
    if (!study?.slug) return null;
    return (
      <LinkButton
        href={`/studies/${study.slug}`}
        target="_blank"
        rel="noreferrer"
      >
        {t("studies.studyPage")}
      </LinkButton>
    );
  };

  const StudyBuilderRenderer = (params) => {
    const study = params?.data;
    if (!study?.id) return null;
    return (
      <LinkButton
        href={`/builder/studies/?selector=${study.id}`}
        target="_blank"
        rel="noreferrer"
      >
        {t("studies.studyBuilder")}
      </LinkButton>
    );
  };

  const columnDefs = [
    {
      field: "title",
      headerName: t("studies.studyTitle"),
      filter: "agTextColumnFilter",
      sortable: true,
      flex: 2,
      minWidth: 180,
      wrapText: true,
      autoHeight: true,
      cellStyle: {
        whiteSpace: "normal",
        lineHeight: "1.5",
        display: "flex",
        alignItems: "center",
        wordBreak: "break-word",
      },
    },
    {
      field: "collaborators",
      headerName: t("studies.collaborators"),
      valueGetter: (params) => getCollaborators(params?.data),
      filter: "agTextColumnFilter",
      sortable: true,
      flex: 1,
      minWidth: 160,
      wrapText: true,
      autoHeight: true,
      cellStyle: {
        whiteSpace: "normal",
        lineHeight: "1.5",
        display: "flex",
        alignItems: "center",
        wordBreak: "break-word",
      },
    },
    {
      field: "participants",
      headerName: t("studies.participants"),
      valueGetter: (params) => params?.data?.participants?.length ?? 0,
      filter: "agNumberColumnFilter",
      sortable: true,
      flex: 0,
      minWidth: 120,
      maxWidth: 140,
    },
    {
      field: "createdAt",
      headerName: t("studies.dateCreated"),
      valueGetter: (params) => params?.data?.createdAt || null,
      valueFormatter: (params) =>
        params.value ? moment(params.value).format("MMMM D, YYYY") : "",
      filter: "agDateColumnFilter",
      sortable: true,
      flex: 1,
      minWidth: 150,
    },
    {
      field: "studyPage",
      headerName: t("studies.studyPage"),
      cellRenderer: StudyPageRenderer,
      suppressFilter: true,
      sortable: false,
      flex: 0,
      minWidth: 130,
      maxWidth: 150,
      cellStyle: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      },
    },
    {
      field: "studyBuilder",
      headerName: t("studies.studyBuilder"),
      cellRenderer: StudyBuilderRenderer,
      suppressFilter: true,
      sortable: false,
      flex: 0,
      minWidth: 140,
      maxWidth: 160,
      cellStyle: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      },
    },
  ];

  return (
    <div className="classTabPage studies">
      <section className="classTabSection">
        <div className="classTabSectionHeader">
          <h3>{t("navigation.studies", {}, { default: "Studies" })}</h3>
          <p>
            {t(
              "studies.listDescription",
              { count: studies.length },
              {
                default:
                  "{{count}} studies created by students in this class.",
              }
            )}
          </p>
        </div>
        {studies.length === 0 ? (
          <div className="classTabEmpty">
            <div>{t("studies.noStudiesYet")}</div>
          </div>
        ) : (
          <div className="classTabTable ag-theme-quartz">
            <AgGridReact
              rowData={studies}
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
