import styled from "styled-components";

export const StyledDiscover = styled.div`
  display: grid;

  .repositoryNotice {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-top: 20px;
    padding: 16px 20px;
    border-radius: 12px;
    background: var(--MH-Theme-Primary-Lighter, #f4f8f7);
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }

  .repositoryNoticeText {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .repositoryNoticeActions {
    display: flex;
    gap: 12px;
  }

  .filterHeader {
    display: grid;
    grid-gap: 20px;
    grid-template-columns: 1fr auto;
    margin: 20px 0px;
  }

  .tasks {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    grid-gap: 10px;
  }
`;
