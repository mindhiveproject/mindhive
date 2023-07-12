import styled from "styled-components";

const StyledManagement = styled.div`
  display: grid;
  .classHeader  {
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
