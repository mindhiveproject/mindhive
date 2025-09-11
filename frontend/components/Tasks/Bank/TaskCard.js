import Link from "next/link";
import { useRouter } from "next/router";
import { StyledTaskCard } from "../../styles/StyledCard";
import ManageFavorite from "../../User/ManageFavorite";

export default function TaskCard({ user, task, url, id, name, domain }) {
  const router = useRouter();
  const { locale } = router;
  return (
    <Link
      href={{
        pathname: url,
        query: {
          [name]: task[id],
        },
      }}
    >
      <StyledTaskCard taskType={task?.taskType}>
        {task?.image && (
          <div className="taskImage">
            <img src={task?.image} alt={task?.i18nContent?.[locale]?.title || task?.title} />
          </div>
        )}
        <div className="cardInfo">
          <div className="title">
            <div>{task?.i18nContent?.[locale]?.title || task?.title}</div>

            <div className="rightSide">
              {user && <ManageFavorite user={user} id={task?.id} />}
              {/* {user && this.props.participateMode && (
              <ManageFavorites id={task?.id} isFavorite={isFavorite}>
                {isFavorite ? (
                  <Icon id="favoriteButton" name="favorite" color="yellow" />
                ) : (
                  <Icon id="favoriteButton" name="favorite" color="grey" />
                )}
              </ManageFavorites>
            )} */}
              {/* {task?.descriptionForParticipants && (
              <Popup
                content={ReactHtmlParser(task?.descriptionForParticipants)}
                size="huge"
                trigger={<Icon name="info circle" size="large" />}
              />
            )} */}
            </div>
          </div>
          {domain === "discover" && (
            <div className="subtitle">{task?.i18nContent?.[locale]?.settings?.addInfo || task?.settings?.addInfo}</div>
          )}
          {/* 
        {this.props.participateMode && (
          <Link
            href={{
              pathname: "/task/preview",
              query: { id: task?.id, r: this.props.redirect },
            }}
          >
            <a>Preview</a>
          </Link>
        )} */}

          {/* <div className="studyLink">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gridGap: "10px",
            }}
          >
            {this.props.overviewMode && (
              <ContainerOnlyForAdmin>
                <PublishTaskToggle id={task?.id} isPublic={task?.public} />
              </ContainerOnlyForAdmin>
            )}
          </div>
        </div> */}

          {/* {this.props.overviewMode && task?.submitForPublishing && (
          <div>
            <p>
              The {task?.taskType.toLowerCase()} was submitted for publishing
            </p>
          </div>
        )} */}
        </div>
      </StyledTaskCard>
    </Link>
  );
}
