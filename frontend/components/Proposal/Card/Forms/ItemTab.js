import { useState, useMemo } from "react";
import useTranslation from "next-translate/useTranslation";
import { Button, Icon } from "semantic-ui-react";
import { stripHtml, TYPO } from "./utils";
import LinkedItemCard from "./LinkedItemCard";
import LinkedItemsSearchFilters from "./LinkedItemsSearchFilters";

export default function ItemTab({
  user,
  items,
  selected,
  connect,
  disconnect,
  myItems,
  proposal,
  type,
  isPublic,
  loading,
  openAssignmentModal,
  openViewAssignmentModal,
  openEditAssignmentModal,
  openCopyModal,
  myAssignments,
  openResourceModal,
}) {
  const { t } = useTranslation("classes");
  
  const styledPrimaryIconButton = {
    display: "inline-flex",
    height: "38px",
    width: "38px",
    padding: "8px",
    justifyContent: "center",
    alignItems: "center",
    gap: "8px",
    flexShrink: "0",
    borderRadius: "100px",
    border: "1px solid #336F8A",
    background: "#336F8A",
  };

  const styledPrimaryButton = {
    height: "30px",
    padding: "8px 16px 8px 16px",
    justifyContent: "center",
    gap: "8px",
    flexShrink: 0,
    width: "100%",
    display: "inline-flex",
    alignItems: "center",
    margin: "1rem 0",
    background: "#336F8A",
    color: "white",
    borderRadius: "100px",
    ...TYPO.bodyMedium,
    cursor: "pointer",
    transition: "background 0.3s ease",
    border: "none", // Add to reset default browser styles
  };

  const styledSecondaryButtonBlue = {
    height: "30px",
    padding: "8px 16px 8px 16px",
    justifyContent: "center",
    gap: "8px",
    flexShrink: 0,
    width: "100%",
    display: "inline-flex",
    alignItems: "center",
    margin: "1rem 0",
    background: "white",
    color: "#3D85B0",
    borderRadius: "100px",
    ...TYPO.bodyMedium,
    cursor: "pointer",
    transition: "background 0.3s ease",
    border: "1.5px solid #3D85B0",
  };
  
  const styledAccentButtonPurple = {
    height: "30px",
    padding: "8px 16px 8px 8px",
    justifyContent: "center",
    gap: "8px",
    flexShrink: 0,
    width: "100%",
    display: "inline-flex",
    alignItems: "center",
    margin: "1rem 0",
    background: "white",
    color: "#7D70AD",
    borderRadius: "100px",
    ...TYPO.bodyMedium,
    cursor: "pointer",
    transition: "background 0.3s ease",
    border: "1.5px solid #7D70AD",
  };
  
  if (loading) return <div>{t("common.loading", "Loading...")}</div>;

  // --- Search State ---
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPublishedFilter, setSelectedPublishedFilter] = useState(null);
  const [selectedClassIds, setSelectedClassIds] = useState([]);

  // --- Filter Function ---
  const filterItems = (itemsList, query) => {
    if (!query.trim()) return itemsList;
    const lowerQuery = query.toLowerCase();
    return itemsList.filter(item => {
      const title = stripHtml(item?.title || "").toLowerCase();
      return title.includes(lowerQuery);
    });
  };

  // --- Accordions UI State (moved outside conditional to fix hooks rule) ---
  const [openAccordion, setOpenAccordion] = useState({
    resources: true,
    assignments: false,
  });

  const toggleAccordion = (key) => {
    setOpenAccordion((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Unique classes from items (assignment tab only) - must run unconditionally for hooks rules
  const uniqueClasses = useMemo(() => {
    if (type !== "assignment" || !items || !Array.isArray(items)) return [];
    const m = new Map();
    items.forEach((i) => {
      (i?.classes || []).forEach((c) => {
        if (c?.id && !m.has(c.id)) m.set(c.id, { id: c.id, title: c.title || "Untitled Class" });
      });
    });
    return Array.from(m.values());
  }, [type, items]);

  if (type === "public") {
    // For public type, render two sections: resources and assignments (in accordions)
    const resources = items?.resources || [];
    const assignments = items?.assignments || [];

    // helper function to render items list (reuse existing item render logic)
    const renderItems = (itemsList, currentType) => {
      const displayItems = itemsList.map((item) => {
        // if (currentType === "resource" && isPublic) {
        //   const custom = myItems.find((p) => p.parent?.id === item.id);
        //   return custom || item;
        // }
        return item;
      });

      return displayItems.map((item) => {
        const isSelected = selected.some((s) => s.id === item.id);
        return (
          <LinkedItemCard
            key={item.id}
            item={item}
            type={currentType}
            inPublicTab={true}
            tabIsPublic={true}
            isSelected={isSelected}
            connect={connect}
            disconnect={disconnect}
            openCopyModal={openCopyModal}
            openResourceModal={openResourceModal}
            myAssignments={myAssignments}
            proposal={proposal}
            user={user}
            t={t}
          />
        );
      });
    };

    // Styles for accordion components
    const accordionHeaderStyle = {
      display: "flex",
      alignItems: "center",
      width: "100%",
      cursor: "pointer",
      background: "none",
      border: "none",
      outline: "none",
      padding: "0",
      marginBottom: "24px",
    };

    const accordionTitleStyle = {
      ...TYPO.titleL,
      fontWeight: 500,
      margin: "0 0.5rem 0 0",
      color: "#3D3669"
    };

    const accordionChevronStyle = (open) => ({
      transition: "transform 0.2s",
      transform: open ? "rotate(90deg)" : "rotate(0deg)",
      fontSize: "0.5em",
      marginRight: "1em",
      color: "#336F8A"
    });

    // Filter resources and assignments based on search query
    const filteredResources = filterItems(resources, searchQuery);
    const filteredAssignments = filterItems(assignments, searchQuery);

    return (
      <div style={{ padding: "24px", background: "#f9fafb", maxWidth: 1100, margin: "0 auto" }}>
        <LinkedItemsSearchFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          type="public"
          t={t}
        />
        {/* Resources Accordion */}
        <div style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "24px",
          gap: "16px"
        }}>
          <div style={{ flex: "0 1 25%", maxWidth: "25%" }}>
            <Button
              onClick={() => {
                const url = `/dashboard/resources/`;
                window.open(url, "_blank", "noopener,noreferrer");
              }}
              style={{
                ...styledPrimaryButton,
                width: "100%",
                whiteSpace: "nowrap",
                background: "#7D70AD"
              }}
            >
              {t("boardManagement.openResourcesCenter", "Open Resources Center")}
            </Button>
          </div>
          <div style={{ flex: 1 }}>
            <span style={TYPO.body}>
              {t("boardManagement.descGoToResourcesCenter", "This page allows you to link resources to your project board cards - to manage resources, go to the resources center.)")}
            </span>
          </div>
        </div>
        <section>
          <button
            type="button"
            onClick={() => toggleAccordion("resources")}
            style={accordionHeaderStyle}
            aria-expanded={openAccordion.resources}
            aria-controls="public-resources-accordion"
          >
            <span style={accordionChevronStyle(openAccordion.resources)}>
              ▶
            </span>
            <span style={accordionTitleStyle}>
              {t("board.expendedCard.resourcesSectionTitle", "Public Resources")}
            </span>
          </button>
          <div
            id="public-resources-accordion"
            style={{
              display: openAccordion.resources ? "block" : "none",
              marginBottom: "28px"
            }}
          >
            {filteredResources.length > 0 ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                  gap: "24px",
                }}
              >
                {renderItems(filteredResources, "resource")}
              </div>
            ) : (
              <p>
                {searchQuery
                  ? t("board.expendedCard.noSearchResults", "No resources found matching your search.")
                  : t("noResources", "No public resources.")}
              </p>
            )}
          </div>
        </section>

        {/* Assignments Accordion */}
        <section>
          <button
            type="button"
            onClick={() => toggleAccordion("assignments")}
            style={accordionHeaderStyle}
            aria-expanded={openAccordion.assignments}
            aria-controls="public-assignments-accordion"
          >
            <span style={accordionChevronStyle(openAccordion.assignments)}>
              ▶
            </span>
            <span style={accordionTitleStyle}>
              {t("board.expendedCard.assignmentsSectionTitle", "Assignments")}
            </span>
          </button>
          <div
            id="public-assignments-accordion"
            style={{
              display: openAccordion.assignments ? "block" : "none"
            }}
          >
            {filteredAssignments.length > 0 ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                  gap: "24px",
                }}
              >
                {renderItems(filteredAssignments, "assignment")}
              </div>
            ) : (
              <p>
                {searchQuery
                  ? t("board.expendedCard.noSearchResults", "No assignments found matching your search.")
                  : t("noAssignments", "No assignments available.")}
              </p>
            )}
          </div>
        </section>
      </div>
    );
  }

  // original behavior for other types
  const displayItems = items.map((item) => {
    if (type === "resource" && isPublic) {
      const custom = myItems.find((p) => p.parent?.id === item.id);
      return custom || item;
    }
    return item;
  });

  // When type === "assignment", apply published and class filters before search
  let preSearchItems = displayItems;
  if (type === "assignment") {
    if (selectedPublishedFilter !== null) {
      preSearchItems = preSearchItems.filter((item) => item?.public === selectedPublishedFilter);
    }
    if (selectedClassIds.length > 0) {
      preSearchItems = preSearchItems.filter((item) =>
        (item?.classes || []).some((c) => selectedClassIds.includes(c.id))
      );
    }
  }
  const filteredDisplayItems = filterItems(preSearchItems, searchQuery);

  const handlePublishedFilterToggle = (value) => {
    setSelectedPublishedFilter((prev) => (prev === value ? null : value));
  };
  const handleClassFilterToggle = (classId) => {
    setSelectedClassIds((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    );
  };

  return (
    <div style={{ padding: "24px", background: "#f9fafb" }}>
      <LinkedItemsSearchFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        type={type}
        uniqueClasses={uniqueClasses}
        selectedPublishedFilter={selectedPublishedFilter}
        selectedClassIds={selectedClassIds}
        onPublishedFilterToggle={handlePublishedFilterToggle}
        onClassFilterToggle={handleClassFilterToggle}
        t={t}
      />
      {filteredDisplayItems.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "24px",
          }}
        >
          {filteredDisplayItems.map((item) => {
            const isSelected = selected.some((s) => s.id === item.id);
            return (
              <LinkedItemCard
                key={item.id}
                item={item}
                type={type}
                inPublicTab={false}
                tabIsPublic={isPublic}
                isSelected={isSelected}
                connect={connect}
                disconnect={disconnect}
                openAssignmentModal={openAssignmentModal}
                openCopyModal={openCopyModal}
                openResourceModal={openResourceModal}
                myAssignments={myAssignments}
                proposal={proposal}
                user={user}
                t={t}
              />
            );
          })}
        </div>
      ) : (
        <div style={{ padding: "24px", textAlign: "center" }}>
          <p>
            {searchQuery
              ? t("board.expendedCard.noSearchResults", "No items found matching your search.")
              : t("board.expendedCard.noItems", "No items available.")}
          </p>
        </div>
      )}
    </div>
  );
}
