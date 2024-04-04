export default function Menu({ page, setPage }) {
  return (
    <div className="buttons">
      <div className="icon" onClick={() => setPage("database")}>
        <img
          src={`/assets/icons/visualize/${
            page === "database" ? "database_selected" : "database"
          }.svg`}
        />
      </div>
      <div className="icon" onClick={() => setPage("browse")}>
        <img
          src={`/assets/icons/visualize/${
            page === "browse" ? "folder_open_selected" : "folder_open"
          }.svg`}
        />
      </div>
    </div>
  );
}
