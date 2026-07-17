import { GET_ALL_CLASSES } from "../../../Queries/Classes";
import { Dropdown } from "semantic-ui-react";
import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
import { StyledForm } from "../../../styles/StyledForm";

export default function NetworkForm({ inputs, handleChange }) {
  const { t } = useTranslation("connect");
  const { data } = useQuery(GET_ALL_CLASSES);
  const classes = data?.classes || [];
  const networkType =
    inputs?.settings?.type === "school_network"
      ? "school_network"
      : "feedback_network";
  const membershipMode =
    inputs?.settings?.membershipMode === "open" ? "open" : "approval";

  const options = classes.map((cl) => ({
    key: cl.id,
    text: cl.title,
    value: cl.id,
  }));

  const value = inputs?.classes?.map((cl) => cl?.id);

  const onChange = (event, data) => {
    handleChange({
      target: {
        name: "classes",
        value: data.value.map((id) => ({ id: id })),
      },
    });
  };

  const handleNetworkTypeChange = (event) => {
    const currentSettings =
      inputs?.settings && typeof inputs.settings === "object"
        ? inputs.settings
        : {};

    handleChange({
      target: {
        name: "settings",
        value: {
          ...currentSettings,
          type: event.target.value,
        },
      },
    });
  };

  const handleMembershipModeChange = (event) => {
    const currentSettings =
      inputs?.settings && typeof inputs.settings === "object"
        ? inputs.settings
        : {};

    handleChange({
      target: {
        name: "settings",
        value: {
          ...currentSettings,
          membershipMode: event.target.value,
        },
      },
    });
  };

  return (
    <StyledForm>
      <div>
        <label htmlFor="title">
          <p>Title</p>
          <input
            type="text"
            id="title"
            name="title"
            value={inputs.title}
            onChange={handleChange}
            required
          />
        </label>

        <label htmlFor="description">
          <p>Description</p>
          <input
            type="text"
            id="description"
            name="description"
            value={inputs.description}
            onChange={handleChange}
            required
          />
        </label>

        <label htmlFor="isPublic">
          <p>
            {t(
              "classNetworks.form.isPublicLabel",
              {},
              {
                default: "Public network",
              }
            )}
          </p>
          <input
            type="checkbox"
            id="isPublic"
            name="isPublic"
            checked={!!inputs.isPublic}
            onChange={handleChange}
          />
          <p>
            {t(
              "classNetworks.form.isPublicDescription",
              {},
              {
                default:
                  "Public networks can be explored in Connect and joined by class teachers.",
              }
            )}
          </p>
        </label>

        <label htmlFor="networkType">
          <p>
            {t(
              "classNetworks.form.typeLabel",
              {},
              {
                default: "Network type",
              }
            )}
          </p>
          <select
            id="networkType"
            name="networkType"
            value={networkType}
            onChange={handleNetworkTypeChange}
          >
            <option value="feedback_network">
              {t(
                "classNetworks.form.typeFeedbackLabel",
                {},
                {
                  default: "Feedback network",
                }
              )}
            </option>
            <option value="school_network">
              {t(
                "classNetworks.form.typeSchoolLabel",
                {},
                {
                  default: "Class network",
                }
              )}
            </option>
          </select>
          <p>
            {networkType === "school_network"
              ? t(
                  "classNetworks.form.typeSchoolDescription",
                  {},
                  {
                    default:
                      "Connect classes from the same high school or university to share project board templates, resources, and assignments.",
                  }
                )
              : t(
                  "classNetworks.form.typeFeedbackDescription",
                  {},
                  {
                    default:
                      "Temporarily link classes from any institution to find reviewers and opportunities.",
                  }
                )}
          </p>
        </label>

        <label htmlFor="membershipMode">
          <p>
            {t(
              "classNetworks.form.membershipModeLabel",
              {},
              {
                default: "Membership",
              }
            )}
          </p>
          <select
            id="membershipMode"
            name="membershipMode"
            value={membershipMode}
            onChange={handleMembershipModeChange}
          >
            <option value="approval">
              {t(
                "classNetworks.form.membershipModeApprovalLabel",
                {},
                {
                  default: "Approval required",
                }
              )}
            </option>
            <option value="open">
              {t(
                "classNetworks.form.membershipModeOpenLabel",
                {},
                {
                  default: "Open",
                }
              )}
            </option>
          </select>
          <p>
            {membershipMode === "open"
              ? t(
                  "classNetworks.form.membershipModeOpenDescription",
                  {},
                  {
                    default:
                      "Eligible profiles can join this public network immediately.",
                  }
                )
              : t(
                  "classNetworks.form.membershipModeApprovalDescription",
                  {},
                  {
                    default:
                      "Eligible profiles must be approved by a network admin before joining.",
                  }
                )}
          </p>
        </label>

        <label htmlFor="classes">
          <p>Classes</p>
          <div>
            <Dropdown
              placeholder="Type class name"
              fluid
              multiple
              search
              selection
              options={options}
              value={value}
              onChange={onChange}
            />
          </div>
        </label>
      </div>
    </StyledForm>
  );
}
