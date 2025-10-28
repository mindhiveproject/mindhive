import { useState, useEffect } from "react";
import { Modal, Button, Icon } from "semantic-ui-react";
import { useMutation, useQuery } from "@apollo/client";
import StyledModal from "../styles/StyledModal";
import useTranslation from "next-translate/useTranslation";
import TipTapEditor from "./Main";
import { GET_AN_ASSIGNMENT } from "../Queries/Assignment";
import { CREATE_ASSIGNMENT } from "../Mutations/Assignment";
import ClassSelector from "../Dashboard/TeacherClasses/ClassPage/Assignments/ClassSelector";
import Settings from "../Dashboard/TeacherClasses/ClassPage/Assignments/Main";

export default function AssignmentCopyModal({ open, onClose, assignment, user, onCopied }) {
    const { t } = useTranslation("classes");
    const [editedAssignment, setEditedAssignment] = useState({
        title: "",
        content: "",
        placeholder: "",
    });
    const [hasChanges, setHasChanges] = useState(false);
    const [selectedClasses, setSelectedClasses] = useState([]);

    const assignmentId = assignment?.id;

    const { data, loading, error } = useQuery(GET_AN_ASSIGNMENT, {
        variables: { id: assignmentId },
        fetchPolicy: "network-only",
        skip: !assignmentId,
    });

    const [createAssignment, { loading: createLoading }] = useMutation(CREATE_ASSIGNMENT, {
        onCompleted: () => {
        alert(t("assignment.copySuccess", "Copied Successfully! Go to the 'My Assignments' tab to see this new copy"));
        onCopied?.();
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
        setHasChanges(false);
        }
    }, [data]);

    const handleFieldChange = (field, value) => {
        setEditedAssignment(prev => ({ ...prev, [field]: value }));
        setHasChanges(true);
    };

    const handleSaveCopy = async () => {
        try {
        await createAssignment({
            variables: {
                input: {
                    title: editedAssignment.title,
                    content: editedAssignment.content,
                    placeholder: editedAssignment.placeholder,
                    // parent: { connect: { id: assignmentId } },
                    // owner: { connect: { id: user?.id } }, 
                    public: false,
                    templateSource: { connect: { id: assignmentId } },
                    classes: { connect: selectedClasses.map(c => ({ id: c.id })) }, // or adapt depending on your API
                },
            },
        });
        } catch (err) {
        alert(err.message);
        }
    };

    const handleClassChange = (e) => {
        // e.target.name === "classes"
        // e.target.value === [{ id: 'classId1' }, { id: 'classId2' }, ...]
        setSelectedClasses(e.target.value);
      };
      

    if (!assignmentId) return null;
    if (loading) return <p>Loading assignment…</p>;
    if (error) return <p>Error loading assignment</p>;

    return (
        <Modal
        closeIcon
        open={open}
        onClose={onClose}
        size="large"
        style={{ borderRadius: "12px" }}
        >
        <Modal.Header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>{t("assignment.makeYourCopy", "Make changes and save this assignment as your own")}</span>
            <Button
            icon
            onClick={onClose}
            style={{ background: "transparent", color: "#666" }}
            >
            <Icon name="close" />
            </Button>
        </Modal.Header>

        <Modal.Content scrolling>
            <StyledModal>
            <ClassSelector 
                user={user}
                inputs={{ classes: selectedClasses }}
                handleChange={handleClassChange}
            />
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
                loading={createLoading}
                disabled={createLoading || selectedClasses.length === 0}
                onClick={handleSaveCopy}
                style={selectedClasses.length === 0
                        ? {
                            borderRadius: "100px",
                            border:  "1px solid #171717",
                            background: "#EFEFEF",
                            color: "#171717",
                            fontSize: "16px",}
                        : {
                            borderRadius: "100px",
                            border:  "1px solid #336F8A",
                            background: "#336F8A",
                            color: "white",
                            fontSize: "16px",}
                        }
                >
                {selectedClasses.length === 0 ? (
                    t("assignment.chooseClassFirst", "You must associate this assignment to a class before saving it")
                ) : (
                    hasChanges 
                        ? t("assignment.saveAndMakeOwn", "Save changes & make your own") 
                        : t("assignment.saveAsOwn", "Save as your own")                    
                )}

            </Button>

        </Modal.Actions>
        </Modal>
    );
}
  