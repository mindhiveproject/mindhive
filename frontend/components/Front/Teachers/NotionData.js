import { useEffect, useState } from "react";
import Link from "next/link";

import Tools from "./Tools";
import Program from "./Program";

import { StyledTeachersInfo } from "../../styles/StyledDocument";
export default function NotionData({ pageId }) {

  const [notionData, setNotionData] = useState(null); // State to store the Notion data
  const [loading, setLoading] = useState(true); // State to track loading
  const [error, setError] = useState(null); // State to track errors

  useEffect(() => {
    // Function to fetch data from the Notion endpoint
    const fetchNotionData = async () => {
      try {
        setLoading(true); // Start loading
        const response = await fetch(`/api/notion?pageId=${pageId}`);
        
        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }
        const data = await response.json();
        console.log(data); // Debug log ////////////////////////////////////////////////////////////////////////////////////////////////
        setNotionData(data); // Store the fetched data in state

      } catch (err) {
        setError(err.message); // Store the error message in state

      } finally {
        setLoading(false); // Stop loading
      }
    };

    if (pageId) {
      fetchNotionData(); // Fetch data if pageId is provided
    }
  }, [pageId]); // Dependency array: re-run effect if pageId changes

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  const parseNotionData = (dataArray) => {
    const result = {};
  
    dataArray.forEach((page) => {
      const props = page.properties;
      if (!props || !props.fieldName) return;
  
      const fieldName = props.fieldName.title?.[0]?.plain_text;
      if (!fieldName) return;
  
      const type = props.type?.select?.name;
      let content = null;
  
      switch (type) {
        case 'text':
          if (props.contentText?.rich_text?.length > 0) {
            content = props.contentText.rich_text.map((rt, idx) => {
              const { annotations, plain_text } = rt;
              let element = <span key={idx}>{plain_text}</span>;
  
              if (annotations.bold) {
                element = <strong key={idx}>{element}</strong>;
              }
              if (annotations.italic) {
                element = <em key={idx}>{element}</em>;
              }
              if (annotations.underline) {
                element = <u key={idx}>{element}</u>;
              }
              if (annotations.strikethrough) {
                element = <s key={idx}>{element}</s>;
              }
              if (annotations.code) {
                element = <code key={idx}>{element}</code>;
              }
  
              return element;
            });
          }
          break;
  
        case 'url':
          if (props.contentURL?.url) {
            content = props.contentURL.url;
          }
          break;
  
        case 'media':
          if (props.contentMedia?.files?.length > 0) {
            content = props.contentMedia.files[0].name; // Or .url if you want the actual media
          }
          break;
  
        default:
          console.warn(`Unknown type "${type}" for field "${fieldName}"`);
          break;
      }
  
      if (content) {
        result[fieldName] = content;
      }
    });
  
    return result;
  };
  
  

  const notionContent = notionData ? parseNotionData(notionData) : {};
  console.log(notionContent); // Debug log ////////////////////////////////////////////////////////////////////////////////////////////////
  console.log(notionContent.caseStudyImage); // Debug log ////////////////////////////////////////////////////////////////////////////////////////////////
  console.log(notionContent.headerCurriculum); // Debug log ////////////////////////////////////////////////////////////////////////////////////////////////

  return (
    <StyledTeachersInfo>
      <div className="white">
        <h1 className="centered">
          {notionContent.mainHeader || "Fallback Header"}
        </h1>
        <p className="centered">
          {notionContent.mainDescription || "Fallback Header"}
        </p>
        <div className="centered">
          <a
            target="_blank"
            href={notionContent.interestLink || "https://docs.google.com/forms/d/e/1FAIpQLSfeaomKF-CrgKPAWF--Dy-IQpxjX1ginylqRJQ11SSnRjXKmQ/viewform?usp=sf_link"}
          >
            <button>{notionContent.interestButton || "Interested? Fill out our contact form"}</button>
          </a>
        </div>
        <p className="centered">
          {notionContent.emailAlt}{" "}
          <a href={`mailto:${notionContent.emailMH}`}>{notionContent.emailMH}</a>
        </p>
      </div>

      <div className="greyOuter">
        <div className="greyInner doubled">
          <div>
            <h2>{notionContent.sec1header || "Student-driven citizen science"}</h2>
            <p>{notionContent.sec1paragraph1}</p>
            <p>{notionContent.sec1paragraph2}</p>
            <p>{notionContent.sec1paragraph3}</p>
          </div>
          <div className="videoWrapper">
            <iframe
              width="560"
              height="315"
              src={`${notionContent.videoPresentation}` || "https://drive.google.com/file/d/1sBAGxA6hGWUonxyNFmaPcyoiRuJxVC7j/preview"}
              title="Google Drive video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      </div>

      <div className="white">
        <h2 className="centered">{notionContent.tripicHeader}</h2>
        <div className="cards">
          <div className="card sky">
            <div className="cardHeader">
              <h4>{notionContent.pic1TopRow}</h4>
            </div>
            <div className="innerCard stretchedBlockForTwo">
              <div>
                <h5>{notionContent.pic1Header}</h5>
                <p>{notionContent.pic1Body}</p>
              </div>
              <div>
                <Link href={`${notionContent.pic1Link}`}>
                  <button className="secondary">{notionContent.pic1ButtonText}</button>
                </Link>
              </div>
            </div>
          </div>

          <div className="card pine">
            <div className="cardHeader">
              <h4>{notionContent.pic2TopRow}</h4>
            </div>
            <div className="innerCard stretchedBlockForTwo">
              <div>
                <h5>{notionContent.pic2Header}</h5>
                <p>{notionContent.pic2Body}</p>
              </div>
              <div>
              <Link href={`${notionContent.pic2Link}`}>
                  <button className="secondary">{notionContent.pic2ButtonText}</button>
                </Link>
              </div>
            </div>
          </div>

          <div className="card yellow">
            <div className="cardHeader">
              <h4>{notionContent.pic3TopRow}</h4>
            </div>
            <div className="innerCard stretchedBlockForTwo">
              <div>
                <h5>{notionContent.pic3Header}</h5>
                <p>{notionContent.pic3Body}</p>
              </div>
              <div>
                <a
                  target="_blank"
                  href={`${notionContent.pic3Link}`}
                >
                  <button className="secondary">{notionContent.pic3ButtonText}</button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* //////////////////////// TOOLS //////////////////////// */}
      {false && (
        <div className="white" id="tools">
          <h2 className="centered">{notionContent.headerCurriculum}</h2>
          <Tools notionContent={notionContent} />
        </div>
      )}

      {/* //////////////////////// CURRICULUM //////////////////////// */}
      <div className="white" id="curriculum">
        <h2 className="centered">{notionContent.headerCurriculum}</h2>
        <p className="centered">{notionContent.curriculumIntroduction}</p>
        <Program notionContent={notionContent} />
      </div>

      <div className="greyOuter">
        <div className="greyInner doubled">
          <div>
            <img src="/assets/teachers/grace-church-school.png" />
            {/* <img src={`${notionContent.caseStudyImage}`} />  */}
          </div>
          <div className="stretchedBlockForTwo">
            <div>
              <h3>{notionContent.caseStudyHeader}</h3>
              <h2>{notionContent.caseStudyTitle}</h2>
              <p>{notionContent.caseStudyDescription}</p>
            </div>
            <div>
              <a
                target="_blank"
                href={`${notionContent.caseStudyLink}`}
              >
                <button className="secondary">{notionContent.caseStudyButton}</button>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="white centered">
        <h2>{notionContent.interestSectionHeader}</h2>
        <div>
          <a
            target="_blank"
            href={`${notionContent.interestLink}`}
          >
            <button>{notionContent.getInTouch}</button>
          </a>
        </div>

        <p className="centered">
          {notionContent.emailAlt}{" "}
          <a href={`mailto:${notionContent.emailMH}`}>{notionContent.emailMH}</a>
        </p>
      </div>
    </StyledTeachersInfo>
  );
}