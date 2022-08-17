import React from "react";
import Navibar from "./Navibar";
import Footer from "./Footer";

const Layout = ({ children }) => {
  return (
    <div>
      <Navibar />
      {children}
      <Footer />
    </div>
  );
};

export default Layout;
