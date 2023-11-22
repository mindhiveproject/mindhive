import EnterCode from "./EnterCode";
import Select from "./Select";
import JoinClass from "./Join";
import Form from "../Form";

export default function StudentMain({
  user,
  query,
  role,
  profile,
  handleChange,
  handleSubmit,
  submitBtnName,
  loading,
  error,
}) {
  const { code, i, action } = query;

  if (action) {
    if (action === "select" && code) {
      return <Select role={role} classCode={code} invitationCode={i} />;
    }

    if (action === "signup" && code) {
      return (
        <div>
          <h1>Sign up as a {role}</h1>
          <Form
            role={role}
            profile={profile}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            submitBtnName={submitBtnName}
            loading={loading}
            error={error}
            classCode={code}
            invitationCode={i}
          />
        </div>
      );
    }
  }

  if (code) {
    return (
      <JoinClass user={user} role={role} classCode={code} invitationCode={i} />
    );
  }

  return <EnterCode role={role} />;
}
