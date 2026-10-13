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
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin: 20px 0px;
  }

  .typeFilters {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .searchAndActions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
  }

  .taskSearch {
    width: 280px;
    max-width: 100%;
  }

  /* Same responsive rule as the study bank: 3 columns at desktop width,
     fewer as the page narrows, one column on phones. */
  .tasks {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    grid-gap: 10px;
    @media (max-width: 500px) {
      grid-template-columns: 1fr;
    }
  }
`;
