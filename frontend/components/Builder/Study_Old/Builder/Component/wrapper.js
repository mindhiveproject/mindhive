/* eslint-disable react/display-name */
import React from "react";
import ComponentModal from "./index";

const ComponentWrapper = React.memo((props) => <ComponentModal {...props} />);

export default ComponentWrapper;
