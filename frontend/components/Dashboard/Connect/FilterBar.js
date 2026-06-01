import styled from "styled-components";

const FilterBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: stretch;
  padding: 4px 0;

  /* My own search input. Targeted as input + class so it doesn't collide
     with Semantic UI's "search" class on searchable dropdowns. */
  > input.search {
    flex: 1 1 240px;
    height: 42px;
    box-sizing: border-box;
    padding: 0 18px;
    border: 1px solid #d3dae0;
    border-radius: 12px;
    background: #ffffff;
    font-family: "Inter", sans-serif;
    font-size: 14px;
    color: #171717;
    outline: none;
    transition: border-color 0.15s ease;

    &::placeholder {
      color: #979797;
    }
    &:hover {
      border-color: #b7c0c7;
    }
    &:focus {
      border-color: #336f8a;
    }
  }

  /* Normalize Semantic UI Dropdown to match the search input.
     The && bumps specificity over Semantic UI's defaults. */
  && .ui.selection.dropdown {
    position: relative;
    flex: 0 0 auto;
    min-width: 180px;
    height: 42px;
    box-sizing: border-box;
    padding: 0 40px 0 18px;
    border: 1px solid #d3dae0;
    border-radius: 12px;
    background: #ffffff;
    font-family: "Inter", sans-serif;
    font-size: 14px;
    color: #171717;
    line-height: 1.2;
    display: inline-flex;
    align-items: center;
    box-shadow: none;
    transition: border-color 0.15s ease;
    min-height: 42px;

    &:hover {
      border-color: #b7c0c7;
    }

    &.active,
    &.visible,
    &.active.visible,
    &.active:hover {
      border-color: #336f8a;
      box-shadow: none;
      /* Keep the pill shape even when the menu is open. */
      border-radius: 12px;
    }

    /* The visible label area */
    > .text {
      font-size: 14px;
      color: #171717;
      line-height: 1.2;
      margin: 0;
      padding: 0;
      max-width: calc(100% - 16px);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    > .default.text {
      color: #979797;
    }

    /* All trailing icons (chevron + clear ×) — covered by one rule so both
       Semantic UI variants land in the same spot. */
    > i.icon,
    > i.dropdown.icon,
    > i.clear.icon,
    > i.remove.icon {
      position: absolute;
      top: 50%;
      right: 14px;
      left: auto;
      transform: translateY(-50%);
      width: auto;
      height: auto;
      margin: 0;
      padding: 0;
      line-height: 1;
      font-size: 14px;
      color: #5f6871;
      opacity: 0.75;
      cursor: pointer;
      transition: opacity 0.15s ease, color 0.15s ease;
    }
    > i.icon:hover {
      opacity: 1;
      color: #171717;
    }

    /* Semantic UI's internal search input (only when search prop is on).
       It must overlay the trigger with absolute positioning so the
       dropdown doesn't grow horizontally when the user starts typing. */
    > input.search {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      padding: 0 40px 0 18px;
      border: none;
      background: transparent;
      box-shadow: none;
      font-family: "Inter", sans-serif;
      font-size: 14px;
      line-height: 1.2;
      color: #171717;
      outline: none;
      border-radius: 12px;
      flex: none;
    }

    /* The popout menu */
    > .menu {
      margin-top: 6px;
      border-radius: 16px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
      border: 1px solid #d3dae0;
      overflow: hidden;
      width: 100%;
      min-width: 100%;

      > .item {
        font-family: "Inter", sans-serif;
        font-size: 14px;
        padding: 10px 14px !important;
        border-top: none;
      }
    }
  }
`;

export default FilterBar;
