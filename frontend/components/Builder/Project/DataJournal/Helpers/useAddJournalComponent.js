import { useCallback } from "react";
import { useMutation } from "@apollo/client";

import { CREATE_DATA_COMPONENT } from "../../../../Mutations/DataComponent";
import { useDataJournal } from "../Context/DataJournalContext";

/**
 * Creates a viz section on the current workspace, shifts the layout, and
 * opens the new widget in the left-rail editor.
 */
export default function useAddJournalComponent() {
  const {
    workspace,
    updateWorkspace,
    selectedJournal,
    journalDatasources,
    setActiveComponent,
    setLeftPanelMode,
    setSidebarVisible,
    getCanvaExportCanvas,
  } = useDataJournal();

  const [createComponent] = useMutation(CREATE_DATA_COMPONENT);

  return useCallback(
    async ({ title, type, content }) => {
      const layout = Array.isArray(workspace?.layout) ? workspace.layout : [];
      const components = workspace?.vizSections || [];
      const firstDsId =
        journalDatasources?.[0]?.id || selectedJournal?.datasources?.[0]?.id;
      const contentWithDs =
        firstDsId && content && typeof content === "object"
          ? { ...content, datasourceId: content.datasourceId || firstDsId }
          : content;

      const res = await createComponent({
        variables: {
          input: {
            title,
            type,
            content: contentWithDs,
            vizChapter: {
              connect: {
                id: workspace?.id,
              },
            },
          },
        },
      });
      const newComponent = res?.data?.createVizSection;
      if (!newComponent) return false;

      const newLayoutItem = {
        i: newComponent.id,
        x: 0,
        y: 0,
        w: 4,
        h: 10,
        minW: 2,
        minH: 5,
        maxW: 12,
        maxH: 20,
      };
      const shiftBy = newLayoutItem.h;
      const shiftedLayout = layout.map((item) => ({
        ...item,
        y: (Number.isFinite(item?.y) ? item.y : 0) + shiftBy,
      }));

      updateWorkspace({
        vizSections: [...components, newComponent],
        layout: [newLayoutItem, ...shiftedLayout],
      });
      setActiveComponent(newComponent);
      setLeftPanelMode("editor");
      setSidebarVisible(true);

      window.requestAnimationFrame(() => {
        const canvasEl = getCanvaExportCanvas()?.canvasElement;
        if (!canvasEl) return;
        if (typeof canvasEl.scrollTo === "function") {
          canvasEl.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }
        canvasEl.scrollTop = 0;
      });

      return true;
    },
    [
      createComponent,
      selectedJournal,
      journalDatasources,
      workspace?.id,
      workspace?.layout,
      workspace?.vizSections,
      updateWorkspace,
      setActiveComponent,
      setLeftPanelMode,
      setSidebarVisible,
      getCanvaExportCanvas,
    ],
  );
}
