import Form from "./Form";
import useForm from "../../../lib/useForm";
import { useRouter } from "next/dist/client/router";
import { useMutation } from "@apollo/client";
import { useContext } from "react";

import { SIGNUP_MUTATION, SIGNIN_MUTATION } from "../../Mutations/User";
import { CURRENT_USER_QUERY } from "../../Queries/User";

import { UserContext } from "../../Global/Authorized";
import StudentMain from "./Student/Main";

import StyledAuth from "../../styles/StyledAuth";

export default function RoleSignup(query) {
  const { role, redirectType, redirectTo } = query;

  const user = useContext(UserContext);
  const router = useRouter();

  // save and edit the user information
  const { inputs, handleChange, handleMultipleUpdate, clearForm } = useForm({
    username: "",
    email: "",
    password: "",
    info: {},
  });

  const [signup, { data, loading, error }] = useMutation(SIGNUP_MUTATION);

  const [signin, { data: signinData, loading: signinLoading }] = useMutation(
    SIGNIN_MUTATION,
    {
      refetchQueries: [{ query: CURRENT_USER_QUERY }],
    }
  );

  async function handleSubmit({ e, classCode }) {
    e.preventDefault();
    // Normalize email to lowercase
    const normalizedEmail = inputs.email?.toLowerCase().trim();
    await signup({
      variables: {
        input: {
          ...inputs,
          email: normalizedEmail,
          permissions: { connect: { name: role?.toUpperCase() } },
          studentIn:
            role === "student" && classCode
              ? { connect: { code: classCode } }
              : null,
          mentorIn:
            role === "mentor" && classCode
              ? { connect: { code: classCode } }
              : null,
        },
      },
    });
    // log in user
    const login = await signin({
      variables: {
        email: normalizedEmail,
        password: inputs.password,
      },
    });
    if (
      !redirectType &&
      login?.data?.authenticateProfileWithPassword?.item?.id
    ) {
      router.push({
        pathname: "/dashboard",
      });
    }
    if (redirectType === "JoinStudyFlow" && redirectTo) {
      router.push({
        pathname: "/join/details",
        query: { id: redirectTo, guest: false },
      });
    }
  }

  if (role === "student" || role === "mentor") {
    return (
      <StyledAuth>
        <StudentMain
          user={user}
          query={query}
          role={role}
          profile={inputs}
          handleChange={handleChange}
          handleSubmit={handleSubmit}
          submitBtnName={"Create account"}
          loading={loading}
          error={error}
        />
      </StyledAuth>
    );
  }

  return (
    <StyledAuth>
      <h1>Sign up as a {role}</h1>
      <Form
        role={role}
        profile={inputs}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
        submitBtnName={"Create account"}
        loading={loading}
        error={error}
      />
    </StyledAuth>
  );
}
