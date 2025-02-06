import InterestSelector from "../InterestSelector/Main";

export default function Interests({ query, user }) {
  return (
    <div className="interests">
      <div className="interestsHeader">
        <div className="h40">Where can you help?</div>
        <div className="p15">
          What topics would you like to support students with? Select some
          topics and areas of interest from the list below to let other
          community members know where you’re excited to contribute. This will
          help us connect you with students and peers who share your passions.
        </div>
      </div>

      <InterestSelector user={user} />
    </div>
  );
}
