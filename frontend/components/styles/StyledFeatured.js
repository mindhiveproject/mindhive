import styled from "styled-components";

export const StyledFeaturedStudies = styled.div`
  display: grid;
  grid-gap: 2rem;

  .featuredCarousel {
    display: grid;
    grid-gap: 1rem;
  }

  .featuredContainer {
    display: grid;
    width: 100%;
  }

  .featuredControls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;

    /* IconButton sizes every icon <img> to 24px; the arrow reads better small. */
    .DesignSystem-IconButton-Icon img {
      width: 12px;
      height: 12px;
    }
  }

  .featuredPosition {
    min-width: 48px;
    text-align: center;
    font: var(--MH-Type-Label-Base);
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
    font-variant-numeric: tabular-nums;
  }

  .featuredCard {
    width: 100%;
  }

  .featuredCardBody {
    display: grid;
    grid-template-columns: 1fr 1fr;
    flex: 1 1 auto;
    width: 100%;

    .cardInfo {
      display: grid;
      grid-template-rows: 1fr auto;
      align-content: baseline;
      grid-gap: 2rem;
      padding: 2rem;

      .cardMain {
        display: grid;
        grid-gap: 2rem;
        align-content: baseline;
        .studyFeatured {
          display: grid;
          font: var(--MH-Type-Label-Small);
          letter-spacing: 0;
          color: #666666;
          text-transform: uppercase;
        }
      }

      .studyLink {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
      }
    }

    /* The neutral panel bleeds to the card edge and clips to the card's 12px
       radius (minus the 1px border) on the right-hand corners. The image is
       never cropped: it scales to fit, capped at 320px tall, and sits centred
       on the panel. The panel keeps that height on every slide so the
       carousel doesn't jump as you page through it. */
    .studyImage {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 320px;
      overflow: hidden;
      background: var(--MH-Theme-Neutrals-Lighter, #f3f3f3);
      border-radius: 0 11px 11px 0;
      > div {
        display: flex;
        justify-content: center;
        width: 100%;
      }
      img {
        display: block;
        width: 100%;
        height: auto;
        max-height: 420px;
        object-fit: contain;
      }
    }

    @media (max-width: 900px) {
      grid-template-columns: 1fr;

      .studyImage {
        order: -1;
        min-height: 0;
        height: 220px;
        border-radius: 11px 11px 0 0;
        img {
          max-height: 220px;
        }
      }
    }

    a {
      cursor: pointer;
      font-style: normal;
      font: var(--MH-Type-Title-Base);
      letter-spacing: 0;
      text-align: left;
      color: #007c70;
    }

    p {
      font-style: normal;
      font: var(--MH-Type-Body-Base);
      letter-spacing: 0;
      text-align: left;
    }

    h1 {
      font-style: normal;
      font: var(--MH-Type-Heading-Base);
      letter-spacing: 0;
      text-align: left;
      color: #1a1a1a;
    }

    h2 {
      font-style: normal;
      font: var(--MH-Type-Heading-Small);
      letter-spacing: 0;
      color: #1a1a1a;
    }
  }
`;
