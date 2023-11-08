import { useQuery } from "@apollo/client";
import { useContext } from "react";
import Head from "next/head";
import useTranslation from "next-translate/useTranslation";
import { Card, Flag, Icon, Menu } from "semantic-ui-react";

import { StyledUserPage } from "../styles/StyledUser";

import { PUBLIC_USER_QUERY } from "../Queries/User";

import { UserContext } from "../Global/Authorized";
import { languageOptions } from "./LanguageSelector";

export default function PublicUserPage({ id }) {
  const me = useContext(UserContext);

  const { t } = useTranslation("account");

  const { data, loading, error } = useQuery(PUBLIC_USER_QUERY, {
    variables: { id },
  });
  const user = data?.profile || {};

  const language = languageOptions?.filter(
    (l) => l.value === user?.language
  )[0];

  console.log({ language });

  const isFollowedByMe = user?.followedBy?.map((p) => p.id).includes(me?.id);
  const isMe = user?.id === me?.id;

  console.log({ user });

  return (
    <StyledUserPage>
      <Head>
        <title> MindHive | {user?.username}</title>
      </Head>
      <div className="profile">
        <div className="profileContainer">
          <div className="firstLine">
            <div>
              {user?.image?.image?.publicUrlTransformed ? (
                <img
                  src={user?.image?.image?.publicUrlTransformed}
                  alt={user?.username}
                />
              ) : (
                <div></div>
              )}
            </div>
            <div>
              <div>
                {user?.location && <Icon name="map pin" />}
                {user?.location} <Flag name={language?.flag} />
              </div>
              <div className="snsLinks">
                {["facebook", "twitter", "instagram"].map((item) => {
                  if (user[item]) {
                    return (
                      <div className="snsLink" key={item}>
                        <a target="_blank" href={user[item]} rel="noreferrer">
                          <img
                            src={`/static/icons/sns/${item}.svg`}
                            height="30"
                          />
                        </a>
                      </div>
                    );
                  }
                })}
                {user?.publicMail && (
                  <div className="snsLink">
                    <a
                      href={`mailto:${user?.publicMail}?subject=PrettySpecial`}
                    >
                      <img src="/static/icons/sns/publicMail.svg" height="30" />
                    </a>
                  </div>
                )}
              </div>
              {user?.website && (
                <div className="publicLink">
                  <a target="_blank" href={user?.website} rel="noreferrer">
                    {user?.website}
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="secondLine">
            <div className="username">
              <h1>{user?.username}</h1>
            </div>
            <div />
          </div>

          <div className="thirdLine">
            <div>{user?.followedBy?.length} Followed by</div>
            <div>{user?.usersFollowed?.length} Following</div>
            {/* <div>
              {user?.artworksLiked?.length} {t("overview.liked")}
            </div>
            <div>
              {user?.artworksCreated?.length} {t("overview.created")}
            </div>
            <div>
              {user?.collectionsOwned?.length} {t("overview.collections")}
            </div> */}
          </div>

          {/* {!isMe && (
            <div className="fourthLine">
              <FollowUser
                me={me}
                id={user?.id}
                userId={me?.id}
                isFollowedByMe={isFollowedByMe}
                person={person}
              />

              <MessageModal
                me={me}
                other={user}
                buttonTitle={t("overview.contactArtist", {
                  person: user?.name,
                })}
                innerTitle={t("overview.contactArtist", { person: user?.name })}
              />

              <SendProposalForm me={me} other={user} />
            </div>
          )} */}
        </div>

        <div className="bioContainer">
          <div>{user?.bio}</div>
        </div>
      </div>

      <div className="display">
        {/* <Display user={user} defaultPage="creations" person={person} /> */}
      </div>
    </StyledUserPage>
  );
}
