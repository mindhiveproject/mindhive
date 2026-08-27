import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import DropdownSelect from "../../../DesignSystem/DropdownSelect";

const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 28px;
  border-radius: 16px;
  background: ${(p) => (p.$quiet ? "transparent" : "#ffffff")};
  box-shadow: ${(p) =>
    p.$quiet ? "none" : "0px 4px 24px rgba(0, 0, 0, 0.05)"};

  h2 {
    margin: 0;
    font: var(--MH-Type-Title-Large, 600 22px/28px "Inter", sans-serif);
    letter-spacing: 0;
    color: #171717;
  }
`;

const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  font: var(--MH-Type-Body-Small, 400 12px/16px "Inter", sans-serif);
  letter-spacing: 0;
  color: #5f6871;

  span.hint {
    color: #888;
    font: var(--MH-Type-Body-Small, 400 12px/16px "Inter", sans-serif);
    letter-spacing: 0;
  }
`;

const WarningCallout = styled.div`
  padding: 12px 16px;
  border-radius: 12px;
  background: #fef9ee;
  border: 1px solid #fcd34d;
  color: #92400e;
  font: var(--MH-Type-Body-Small, 400 12px/16px "Inter", sans-serif);
  letter-spacing: 0;
`;

export default function OpportunityClassNetworksField({
  availableNetworks = [],
  selectedNetworks = [],
  onChange,
  readOnly = false,
  quiet = false,
}) {
  const { t } = useTranslation("connect");

  return (
    <Card $quiet={quiet}>
      <h2>
        {t("opportunityEditor.classNetworksTitle", {}, {
          default: "Class networks",
        })}
      </h2>
      <Field>
        <span className="hint">
          {t("opportunityEditor.classNetworksHint", {}, {
            default:
              "Select one or more class networks you belong to. Teachers in those networks can review this opportunity.",
          })}
        </span>
        {availableNetworks.length === 0 ? (
          <WarningCallout>
            {t("opportunityEditor.classNetworksNoMembership", {}, {
              default: "You are not a member of any class networks yet.",
            })}
          </WarningCallout>
        ) : (
          <DropdownSelect
            multiple
            searchableMultiple
            disabled={readOnly}
            value={selectedNetworks}
            options={availableNetworks.map((network) => ({
              value: network.id,
              label: network.title,
            }))}
            onChange={(next) => onChange?.(next)}
            placeholder={t("opportunityEditor.offeredInNetworks", {}, {
              default: "Offered in class networks",
            })}
            ariaLabel={t("opportunityEditor.classNetworksTitle", {}, {
              default: "Class networks",
            })}
          />
        )}
        {!readOnly &&
          selectedNetworks.length === 0 &&
          availableNetworks.length > 0 && (
            <WarningCallout>
              {t("opportunityEditor.classNetworksEmptyWarning", {}, {
                default:
                  "Teachers will not see this opportunity in their review queue until you select at least one class network.",
              })}
            </WarningCallout>
          )}
      </Field>
    </Card>
  );
}
