"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";

import Button from "../../DesignSystem/Button";
import Card, { CardSection } from "../../DesignSystem/Card";
import Chip from "../../DesignSystem/Chip";
import DropdownMenu from "../../DesignSystem/DropdownMenu";
import Input from "../../DesignSystem/Input";
import { AddIcon, MoreVertIcon } from "../../DesignSystem/Icons";

import { MY_VISUALS } from "../../Queries/YQVisual";
import { CREATE_VISUAL, DELETE_VISUAL } from "../../Mutations/YQVisual";

const HEADER_STYLE = {
  display: "flex",
  alignItems: "center",
  gap: 16,
  flexWrap: "wrap",
  marginBottom: 16,
};

const TITLE_STYLE = {
  margin: 0,
  flex: "1 1 auto",
  font: "var(--MH-Type-Title-Large)",
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
};

const GRID_STYLE = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
  gap: 16,
};

const COVER_STYLE = {
  height: 140,
  flexShrink: 0,
  background: "var(--MH-Theme-Neutrals-Black, #171717)",
  backgroundSize: "cover",
  backgroundPosition: "center",
};

const CARD_TITLE_STYLE = {
  margin: 0,
  font: "var(--MH-Type-Title-Base)",
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const CARD_BODY_STYLE = {
  margin: 0,
  font: "var(--MH-Type-Body-Small)",
  color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};

const EMPTY_STYLE = {
  padding: "48px 24px",
  textAlign: "center",
  font: "var(--MH-Type-Body-Base)",
  color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)",
};

const PRIVACY_LABELS = {
  private: "Only me",
  friends: "People I follow",
  unlisted: "Anyone with the link",
  public: "Everyone",
};

/**
 * The visuals bank at `/dashboard/develop/visuals`.
 *
 * Scoped to visuals the signed-in user has a hand in — authored, invited to
 * edit, or invited to view. The Visual list's own access filter already hides
 * everything else, but asking for the narrower set keeps the bank from filling
 * up with every public visual on the platform.
 */
export default function VisualsBank({ user }) {
  const { t } = useTranslation("visuals");
  const router = useRouter();
  const [search, setSearch] = useState("");

  const { data, loading, refetch } = useQuery(MY_VISUALS, {
    variables: {
      where: {
        OR: [
          { author: { id: { equals: user?.id } } },
          { collaborators: { some: { id: { equals: user?.id } } } },
          { viewers: { some: { id: { equals: user?.id } } } },
        ],
      },
    },
    skip: !user?.id,
    fetchPolicy: "cache-and-network",
  });

  const [createVisual, { loading: creating }] = useMutation(CREATE_VISUAL);
  const [deleteVisual] = useMutation(DELETE_VISUAL);

  const visuals = (data?.visuals || []).filter((visual) =>
    search.trim()
      ? visual.title?.toLowerCase().includes(search.trim().toLowerCase())
      : true
  );

  async function onCreate() {
    const result = await createVisual({
      variables: {
        data: {
          title: t("untitledVisual", "Untitled Visual"),
          author: { connect: { id: user.id } },
          privacy: "private",
          participationMode: "sandbox",
          // The legacy array default would be read as a set of YQ-era
          // parameters; a new visual declares its own in code instead.
          parameters: { schemaVersion: 3, bindings: {} },
        },
      },
    });
    const id = result.data?.createVisual?.id;
    if (id) router.push(`/builder/visuals/${id}`);
  }

  async function onDelete(visual) {
    if (
      !window.confirm(
        t("confirmDeleteNamed", "Delete “{{title}}” permanently?").replace(
          "{{title}}",
          visual.title
        )
      )
    )
      return;
    await deleteVisual({ variables: { id: visual.id } });
    refetch();
  }

  return (
    <div className="Visuals-Bank">
      <div style={HEADER_STYLE}>
        <h1 style={TITLE_STYLE}>{t("myVisuals", "My Visuals")}</h1>
        <div style={{ width: 280 }}>
          <Input
            placeholder={t("searchVisuals", "Search visuals")}
            value={search}
            onChange={setSearch}
          />
        </div>
        <Button
          variant="filled"
          leadingIcon={<AddIcon />}
          disabled={creating || !user?.id}
          onClick={onCreate}
        >
          {t("newVisual", "New Visual")}
        </Button>
      </div>

      {loading && !data ? (
        <p style={EMPTY_STYLE}>{t("loading", "Loading…")}</p>
      ) : visuals.length === 0 ? (
        <p style={EMPTY_STYLE}>
          {t(
            "noVisuals",
            "No visuals yet. Create one to start writing a p5 sketch driven by live data."
          )}
        </p>
      ) : (
        <div style={GRID_STYLE}>
          {visuals.map((visual) => {
            const isOwner = visual.author?.id === user?.id;
            return (
              <Card
                key={visual.id}
                onClick={() => router.push(`/builder/visuals/${visual.id}`)}
              >
                <div
                  style={{
                    ...COVER_STYLE,
                    backgroundImage: visual.cover?.url
                      ? `url(${visual.cover.url})`
                      : undefined,
                  }}
                />
                <CardSection style={{ gap: 8 }}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <p style={{ ...CARD_TITLE_STYLE, flex: "1 1 auto" }}>
                      {visual.title}
                    </p>
                    {isOwner ? (
                      <span onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu
                          trigger={<MoreVertIcon />}
                          ariaLabel={t("visualActions", "Visual actions")}
                          items={[
                            {
                              key: "delete",
                              label: t("delete", "Delete"),
                              danger: true,
                              onClick: () => onDelete(visual),
                            },
                          ]}
                        />
                      </span>
                    ) : null}
                  </div>
                  {visual.description ? (
                    <p style={CARD_BODY_STYLE}>{visual.description}</p>
                  ) : null}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Chip
                      variant="static"
                      tone="neutral"
                      label={t(
                        visual.privacy,
                        PRIVACY_LABELS[visual.privacy] || visual.privacy
                      )}
                    />
                    {isOwner ? null : (
                      <Chip
                        variant="static"
                        tone="neutral"
                        label={
                          visual.collaborators?.some((c) => c.id === user?.id)
                            ? t("editor", "Editor")
                            : t("viewer", "Viewer")
                        }
                      />
                    )}
                  </div>
                </CardSection>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
