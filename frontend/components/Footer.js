import React from "react";
import styles from "../styles/Home.module.css";

const Footer = () => (
  <div className={styles.footer}>
    <p> &copy; {new Date().getFullYear()} Stikman. All rights reserved.</p>
  </div>
);

export default Footer;
