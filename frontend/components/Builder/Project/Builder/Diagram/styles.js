import styled from "styled-components";

import { getTaskTypeColor } from "../../../../../lib/taskTypeColors";

export const StyledNode = styled.div`
  display: grid;
  width: 378px;
  height: 128px;
  background-color: white;
  box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.07);
  border-radius: 8px;

  border-top: 8px solid;
  border-top-color: ${(props) => getTaskTypeColor(props.taskType)};

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
    margin-left: 185px;
  }

  .my-in-port {
    width: 20px;
    height: 20px;
    margin-top: -10px;
    border-radius: 20px;
    background-color: #007c70;
    cursor: pointer;
    position: relative;
    z-index: 1;
    text-align: center;
  }

  .bottom-port {
    margin-right: -7px;
    bottom: 0;
    margin-top: 80px;
    margin-left: 185px;
  }

  .design-bottom-port {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(10px, 1fr));
    grid-gap: 10px;
    margin-right: -7px;
    bottom: 0;
    margin-top: 80px;
    /* margin-left: 170px; */
    width: 378px;
    justify-items: center;
  }

  .wrapper {
    display: grid;
    justify-items: center;
    width: 20px;
    position: relative;
    .label {
      color: #666666;
      font-family: Lato;
      font-size: 16px;
      font-style: normal;
      font-weight: 600;
      line-height: 18px;
      letter-spacing: 0.05em;
      text-align: center;
      position: absolute;
      bottom: 30px;
      width: auto;
      margin: 0 auto;
    }
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
    padding: 8px 14px;
    align-items: center;
    gap: 8px;
    background: linear-gradient(180deg, #ffca28 0%, #ffc107 100%);
    border-radius: 4px 4px 0 0;
  }

  .comment-header-text {
    color: #1a1a1a;
    font-size: 13px;
    font-style: normal;
    font-weight: 500;
    line-height: 150%;
    opacity: 0.85;
  }

  .comment-content {
    display: grid;
    color: #555555;
    font-size: 16px;
    font-weight: 400;
    line-height: 24px;
    letter-spacing: 0;
    text-align: left;
    height: 100%;

    textarea {
      padding: 12px 14px;
      min-height: 100px;
      font-size: 16px;
      line-height: 1.5;
      color: #333333;
      resize: none;
      border: none;
      outline: none;
      background: transparent;
      font-family: inherit;
    }
  }

  .post-it {
    font-size: 20px;
    position: absolute;
    width: 280px;
    margin: 16px;
    transform: rotate(0.6deg);
  }

  .post-it .inner {
    min-height: 100px;
    background: linear-gradient(180deg, #fff9c4 0%, #fff59d 100%);
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 8px 24px rgba(0, 0, 0, 0.06);
    overflow: hidden;
    z-index: 1000;
    position: relative;
  }
`;
