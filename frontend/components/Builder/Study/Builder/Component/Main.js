/* eslint-disable react/display-name */
import React from "react";
import Wrapper from "./Wrapper";

const ComponentWrapper = React.memo((props) => <Wrapper {...props} />);

export default ComponentWrapper;
