import { components, type MenuProps } from "react-select";
import { motion, AnimatePresence } from "framer-motion";

export const AnimatedMenu = (props: MenuProps<any, false>) => (
  <AnimatePresence>
    {props.selectProps.menuIsOpen && (
      <components.Menu {...props}>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          {props.children}
        </motion.div>
      </components.Menu>
    )}
  </AnimatePresence>
);
