import Container from "react-bootstrap/Container";
import Navbar from "react-bootstrap/Navbar";
import styles from "../styles/Home.module.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { motion } from "framer-motion";

function Navibar() {
  return (
    <Navbar expand="lg" bg="dark" variant="dark">
      <Container>
        <motion.div whileHover={{ scale: 1.3 }} className={styles.nav}>
          <Navbar.Brand href="/">Stikman</Navbar.Brand>
        </motion.div>

        {/* Should be link to discord SERVER */}
        <Navbar.Brand target="_blank" href="https://discord.com/">
          <motion.div
            animate={{
              rotate: [360, 0, 0, 360],
            }}
            transition={{ repeat: Infinity, duration: 3 }}
          >
            <img
              src="/discord.svg"
              width="30"
              height="30"
              className={styles.navIcon}
              alt="Discord logo"
            />
          </motion.div>
        </Navbar.Brand>

        {/* Link to Twitter PAGE */}
        <Navbar.Brand target="_blank" href="https://twitter.com/">
          <motion.div
            animate={{
              rotate: [360, 0, 0, 360],
            }}
            transition={{ repeat: Infinity, duration: 3 }}
          >
            <img
              src="/twitter.svg"
              width="30"
              height="30"
              className={styles.navIcon}
              alt="Twitter logo"
            />
          </motion.div>
        </Navbar.Brand>

        {/* Link to Instagram PAGE */}
        <Navbar.Brand target="_blank" href="https://www.instagram.com/">
          <motion.div
            animate={{
              rotate: [360, 0, 0, 360],
            }}
            transition={{ repeat: Infinity, duration: 3 }}
          >
            <img
              src="/instagram.svg"
              width="30"
              height="30"
              className={styles.navIcon}
              alt="Instagram logo"
            />
          </motion.div>
        </Navbar.Brand>
      </Container>
    </Navbar>
  );
}

export default Navibar;
