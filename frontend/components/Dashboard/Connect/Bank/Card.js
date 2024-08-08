import Link from "next/link";

export default function ProfileCard({ user, profile }) {
  return (
    <div className="card">
      <div className="avatar">
        {profile?.image?.image?.publicUrlTransformed ? (
          <img
            src={profile?.image?.image?.publicUrlTransformed}
            alt={profile?.name}
          />
        ) : (
          <div>{/* <IdentIcon size="120" value={user?.name} /> */}</div>
        )}
      </div>

      <div className="name">
        {profile?.firstName} {profile?.lastName}
      </div>
      <div className="location">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
        >
          <path
            d="M6.00708 0.999512C3.24558 0.999512 1.00708 3.23801 1.00708 5.99951C1.00708 8.76101 3.24558 10.9995 6.00708 10.9995C8.76858 10.9995 11.0071 8.76101 11.0071 5.99951C11.0071 3.23801 8.76858 0.999512 6.00708 0.999512ZM7.85108 3.53052C8.24158 3.40052 8.60608 3.76502 8.47608 4.15552L7.47608 7.15552C7.42608 7.30502 7.31258 7.41851 7.16308 7.46851C6.78808 7.59351 4.53858 8.34301 4.16308 8.46851C3.77258 8.59851 3.40808 8.23401 3.53808 7.84351L4.53808 4.84351C4.58808 4.69401 4.70158 4.58052 4.85108 4.53052L7.85108 3.53052ZM6.00708 5.49951C5.73108 5.49951 5.50708 5.72351 5.50708 5.99951C5.50708 6.27551 5.73108 6.49951 6.00708 6.49951C6.28308 6.49951 6.50708 6.27551 6.50708 5.99951C6.50708 5.72351 6.28308 5.49951 6.00708 5.49951Z"
            fill="#3B3B3B"
          />
        </svg>
        {profile?.location}
      </div>

      <div>
        {profile?.interests.map((interest) => (
          <span className="interest">{interest?.title}</span>
        ))}
      </div>

      <div className="bio">{profile?.bioInformal}</div>

      <div>
        <Link
          href={{
            pathname: `/dashboard/connect/with`,
            query: {
              id: profile?.publicId,
            },
          }}
        >
          <button>See more</button>
        </Link>
      </div>
    </div>
  );
}
