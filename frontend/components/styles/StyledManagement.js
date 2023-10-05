import styled from "styled-components";

const StyledManagement = styled.div`
  display: grid;
  .header {
    display: grid;
    margin: 10px 0px;
  }
  .navigationHeader {
    display: grid;
    justify-content: end;
  }
  .tableOuterRow {
    display: grid;
    grid-gap: 10px;
    grid-template-columns: 1fr auto;
    align-items: center;
  }
  .classHeader {
    display: grid;
    margin: 5px;
    padding: 10px;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    cursor: pointer;
    font-weight: bold;
  }
  .classRow {
    display: grid;
    margin: 5px;
    padding: 10px;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    background: white;
  }
`;

export default StyledManagement;
