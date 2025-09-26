const NotesWidget = ({ component, isActive, onSelect }) => {
  const { id, settings } = component;
  const notes =
    settings?.text || "No notes entered yet. Right-click to add notes.";

  const handleRightClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect(id);
  };

  return (
    <div onContextMenu={handleRightClick}>
      <button>Right click here</button>
      <div>
        <p>{notes}</p>
      </div>
    </div>
  );
};

export default NotesWidget;
