import styled from "styled-components";

export const StyledNode = styled.div`
  :active {
    border-bottom: 1px solid green;
    border-left: 1px solid green;
    border-right: 1px solid green;
    .up-port {
      border: 0px solid white;
      width: 0px;
      height: 0px;
    }
  }

  display: grid;
  width: 378px;
  height: 128px;
  background-color: white;
  box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.07);
  border-radius: 8px;

  border-top: 8px solid;
  border-top-color: ${(props) =>
    props.taskType === "TASK"
      ? "#64c9e2"
      : props.taskType === "SURVEY"
      ? "#28619e"
      : props.taskType === "BLOCK"
      ? "#ffc7c3"
      : "#007c70"};

  .node-header-container {
    display: grid;
    grid-template-columns: 1fr auto;
    padding: 0px 20px 0px 20px;
    align-items: center;
    height: 58px;
    border-radius: 8px;
    border-bottom: 1px solid #efefef;
  }

  .node-header-text {
    color: #1a1a1a;
    font-size: 16px;
    font-style: normal;
    font-weight: 500;
    line-height: 150%;
  }

  .node-header-icons {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    grid-gap: 2px;
    align-items: end;
  }

  .port-container {
    position: absolute;
    top: 50px;
  }

  .up-port {
    top: 0;
    margin-left: 0px;
    border-radius: 6px;
  }

  .my-in-port {
    width: 380px;
    height: 20px;
    border-radius: 10px;
    cursor: pointer;
    position: relative;
    cursor: pointer;
    text-align: center;
    color: grey;
    opacity: 1;
  }

  .bottom-port {
    margin-right: -7px;
    bottom: 0;
    margin-top: 80px;
    margin-left: 170px;
  }

  .my-out-port {
    width: 20px;
    height: 20px;
    margin-top: -10px;
    border-radius: 20px;
    background-color: #007c70;
    cursor: pointer;
    position: relative;
    z-index: 1;
    cursor: pointer;
    text-align: center;
  }

  .node-content {
    display: grid;
    padding: 0px 20px 0px 20px;
    color: #666666;
    font-size: 16px;
    font-weight: 400;
    line-height: 24px;
    letter-spacing: 0em;
    text-align: left;
  }

  .icon {
    cursor: pointer;
  }

  .anchoredArea {
    /* background: brown; */
  }
`;

export const StyledDigram = styled.div`
  .App {
    font-family: sans-serif;
    text-align: center;
  }

  svg {
    overflow: visible;
  }
`;

export const StyledComment = styled.div`
  .comment-header-container {
    display: grid;
    grid-template-columns: 1fr auto;
    padding: 10px 20px 10px 20px;
    align-items: center;
    height: 100%;
    background-color: #ffc107;
  }

  .comment-header-text {
    color: #1a1a1a;
    font-size: 16px;
    font-style: normal;
    font-weight: 500;
    line-height: 150%;
  }

  .comment-content {
    display: grid;
    color: #666666;
    font-size: 16px;
    font-weight: 400;
    line-height: 24px;
    letter-spacing: 0em;
    text-align: left;
    height: 100%;

    textarea {
      padding: 10px 20px 10px 20px;
      min-height: 100px;
      font-size: 18px;
      resize: none;
      border: solid 0px #fff799;
      outline: none;
      background-color: #fff799;
    }
  }

  .post-it {
    font-size: 20px;
    position: absolute;
    width: 300px;
    margin: 20px;
    -webkit-transform: rotate(1deg);
    -moz-transform: rotate(1deg);
    -ms-transform: rotate(1deg);
    -o-transform: rotate(1deg);
    transform: rotate(1deg);
  }

  .post-it:before,
  .post-it:after {
    content: " ";
    position: absolute;
    z-index: 100;
  }

  .post-it:before {
    background: rgba(0, 0, 0, 0.3);
    bottom: 2px;
    left: 4px;
    max-height: 60px;
    max-width: 180px;
    height: 70%;
    width: 90%;

    -webkit-box-shadow: 0 0 7px 2px rgba(0, 0, 0, 0.3);
    -moz-box-shadow: 0 0 7px 2px rgba(0, 0, 0, 0.3);
    -ms-box-shadow: 0 0 7px 2px rgba(0, 0, 0, 0.3);
    -o-box-shadow: 0 0 7px 2px rgba(0, 0, 0, 0.3);
    box-shadow: 0 0 7px 2px rgba(0, 0, 0, 0.3);

    -webkit-transform: skew(-8deg, -2deg) rotate(-1deg) translate3d(0, 0, 0);
    -moz-transform: skew(-8deg, -2deg) rotate(-1deg) translate3d(0, 0, 0);
    -ms-transform: skew(-8deg, -2deg) rotate(-1deg) translate3d(0, 0, 0);
    -o-transform: skew(-8deg, -2deg) rotate(-1deg) translate3d(0, 0, 0);
    transform: skew(-8deg, -2deg) rotate(-1deg) translate3d(0, 0, 0);
  }

  .post-it:after {
    background: rgba(0, 0, 0, 0.1);
    height: 30%;
    max-height: 30px;
    max-width: 60px;
    right: 1px;
    top: 0px;
    width: 30%;

    -webkit-box-shadow: 0 0 7px 1px rgba(0, 0, 0, 0.2);
    -moz-box-shadow: 0 0 7px 1px rgba(0, 0, 0, 0.2);
    -ms-box-shadow: 0 0 7px 1px rgba(0, 0, 0, 0.2);
    -o-box-shadow: 0 0 7px 1px rgba(0, 0, 0, 0.2);
    box-shadow: 0 0 7px 1px rgba(0, 0, 0, 0.2);

    -webkit-transform: skew(-10deg, -5deg) rotate(-1deg) translate3d(0, 0, 0);
    -moz-transform: skew(-10deg, -5deg) rotate(-1deg) translate3d(0, 0, 0);
    -ms-transform: skew(-10deg, -5deg) rotate(-1deg) translate3d(0, 0, 0);
    -o-transform: skew(-10deg, -5deg) rotate(-1deg) translate3d(0, 0, 0);
    transform: skew(-10deg, -5deg) rotate(-1deg) translate3d(0, 0, 0);
  }

  .post-it .inner {
    min-height: 100px;
    background: #fff799;
    z-index: 1000;
    position: relative;
    -webkit-transform: rotate(-1deg);
    -moz-transform: rotate(-1deg);
    -ms-transform: rotate(-1deg);
    -o-transform: rotate(-1deg);
    transform: rotate(-1deg);
  }
`;
