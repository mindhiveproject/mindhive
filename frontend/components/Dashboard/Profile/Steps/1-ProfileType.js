import Link from "next/link";

export default function ProfileType({}) {
  return (
    <div>
      <h1>Choose your profile type</h1>

      <Link
        href={{
          pathname: `/dashboard/profile/create`,
          query: {
            page: "about",
            type: "organization",
          },
        }}
      >
        <button>Organization</button>
      </Link>

      <Link
        href={{
          pathname: `/dashboard/profile/create`,
          query: {
            page: "about",
            type: "individual",
          },
        }}
      >
        <button>Individual</button>
      </Link>
    </div>
  );
}
