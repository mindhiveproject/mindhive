import InterestSelector from "../InterestSelector/Main";

export default function Interests({ query, user }) {
  return (
    <div className="interests">
      <div className="interestsHeader">
        <div className="h40">What interests you the most?</div>
        <div className="p15">
          We'd love to learn more about your interests! Please select from the
          list below to let other MindHive members know what you like. This will
          help us match you with students and peers who share your passions.
        </div>
      </div>

      <InterestSelector user={user} />
    </div>
  );
}
