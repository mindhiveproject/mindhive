import { useState, useEffect } from "react";
import { Modal, Button, Icon } from "semantic-ui-react";
import { useMutation, useQuery } from "@apollo/client";
import StyledModal from "../styles/StyledModal";
import useTranslation from "next-translate/useTranslation";
import TipTapEditor from "./Main";
import { GET_AN_ASSIGNMENT } from "../Queries/Assignment";
import { EDIT_ASSIGNMENT } from "../Mutations/Assignment";
import ClassSelector from "../Dashboard/TeacherClasses/ClassPage/Assignments/ClassSelector";

export default function AssignmentEditModal({ open, onClose, assignmentId, user, onSaved }) {
    const { t } = useTranslation("classes");
    const [editedAssignment, setEditedAssignment] = useState({
        title: "",
        content: "",
        placeholder: "",
    });
    const [hasChanges, setHasChanges] = useState(false);
    const [selectedClasses, setSelectedClasses] = useState([]);

    const { data, loading, error } = useQuery(GET_AN_ASSIGNMENT, {
        variables: { id: assignmentId },
        fetchPolicy: "network-only",
        skip: !assignmentId,
    });

    const [editAssignment, { loading: editLoading }] = useMutation(EDIT_ASSIGNMENT, {
        onCompleted: () => {
            alert(t("assignment.editSuccess", "Assignment updated successfully!"));
            onSaved?.();
            onClose();
        },
    });

    useEffect(() => {
        if (data?.assignments?.[0]) {
            const a = data.assignments[0];
            setEditedAssignment({
                title: a.title || "",
                content: a.content || "",
                placeholder: a.placeholder || "",
            });
            setSelectedClasses(a.classes || []);
            setHasChanges(false);
        }
    }, [data]);

    const handleFieldChange = (field, value) => {
        setEditedAssignment(prev => ({ ...prev, [field]: value }));
        setHasChanges(true);
    };

    const handleSaveEdit = async () => {
        try {
            await editAssignment({
                variables: {
                    id: assignmentId,
                    input: {
                        title: editedAssignment.title,
                        content: editedAssignment.content,
                        placeholder: editedAssignment.placeholder,
                        classes: { connect: selectedClasses.map(c => ({ id: c.id })) },
                    },
                },
            });
        } catch (err) {
            alert(err.message);
        }
    };

    const handleClassChange = (e) => {
        setSelectedClasses(e.target.value);
    };

    if (!assignmentId) return null;
    if (loading) return <p>Loading assignment…</p>;
    if (error) return <p>Error loading assignment</p>;

    return (
        <Modal
            // closeIcon
            open={open}
            onClose={onClose}
            size="large"
            style={{ borderRadius: "12px" }}
        >
            <Modal.Header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>{t("assignment.editAssignment", "Edit Assignment")}</span>
                {/* <Button
                    icon
                    onClick={onClose}
                    style={{ background: "transparent", color: "#666" }}
                >
                    <Icon name="close" />
                </Button> */}
            </Modal.Header>

            <Modal.Content scrolling>
                <StyledModal>
                    {/* <ClassSelector 
                        user={user}
                        inputs={{ classes: selectedClasses }}
                        handleChange={handleClassChange}
                    /> */}
                    <label htmlFor="title">
                        <p>{t("assignment.title")}</p>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={editedAssignment.title}
                            onChange={(e) => handleFieldChange("title", e.target.value)}
                            required
                        />
                    </label>

                    <p><br />{t("assignment.instructions", "Instructions for your students:")}</p>
                    <TipTapEditor
                        content={editedAssignment.content}
                        placeholder={t("assignment.instructionsPlaceholder", "Enter instructions...")}
                        onUpdate={(newContent) => handleFieldChange("content", newContent)}
                    />

                    <p><br />{t("assignment.placeholderInstructions", "Placeholder for your students:")}</p>
                    <TipTapEditor
                        content={editedAssignment.placeholder}
                        placeholder={t("assignment.placeholderPlaceholder", "Enter placeholder...")}
                        onUpdate={(newContent) => handleFieldChange("placeholder", newContent)}
                    />
                </StyledModal>
            </Modal.Content>

            <Modal.Actions
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "1.5rem",
                    borderTop: "1px solid #e0e0e0",
                    background: "#fafafa",
                }}
            >
                <Button
                    style={{
                        borderRadius: "100px",
                        border: "1px solid #336F8A",
                        background: "white",
                        color: "#336F8A",
                        fontSize: "16px",
                    }}
                    onClick={onClose}
                >
                    {t("board.expendedCard.close", "Close")}
                </Button>

                <Button
                    loading={editLoading}
                    disabled={editLoading}
                    onClick={handleSaveEdit}
                    style={{
                            borderRadius: "100px",
                            border: "1px solid #336F8A",
                            background: "#336F8A",
                            color: "white",
                            fontSize: "16px",
                        }}
                >
                    {hasChanges 
                        ? t("assignment.saveChanges", "Save Changes") 
                        : t("assignment.save", "Save")}
                </Button>
            </Modal.Actions>
        </Modal>
    );
}