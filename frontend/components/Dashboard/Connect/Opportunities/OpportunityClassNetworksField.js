import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";
import { Dropdown } from "semantic-ui-react";

const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 28px;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0px 4px 24px rgba(0, 0, 0, 0.05);

  h2 {
    margin: 0;
    font-family: "Lato", sans-serif;
    font-size: 18px;
    color: #171717;
  }
`;

const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-family: "Lato", sans-serif;
  font-size: 14px;
  color: #5f6871;

  span.hint {
    color: #888;
    font-size: 12px;
  }
`;

const WarningCallout = styled.div`
  padding: 12px 16px;
  border-radius: 12px;
  background: #fef9ee;
  border: 1px solid #fcd34d;
  color: #92400e;
  font-size: 13px;
  line-height: 1.5;
`;

export default function OpportunityClassNetworksField({
  availableNetworks = [],
  selectedNetworks = [],
  onChange,
  readOnly = false,
}) {
  const { t } = useTranslation("connect");

  return (
    <Card>
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
          <Dropdown
            placeholder={t("opportunityEditor.offeredInNetworks", {}, {
              default: "Offered in class networks",
            })}
            fluid
            multiple
            selection
            search
            disabled={readOnly}
            options={availableNetworks.map((network) => ({
              key: network.id,
              text: network.title,
              value: network.id,
            }))}
            value={selectedNetworks}
            onChange={(_, { value }) => onChange?.(value)}
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
