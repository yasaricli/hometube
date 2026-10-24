import { useState } from "react";
import { useRouter } from "next/navigation";

// Components
import Icon from "@/components/Icon";

// Utils
import { getSocket } from "@/utils/socket";

// Styles
import Styles from "../styles.module.scss";

// The first click arms it for three seconds, the second deletes the video and its files.
const DeleteButton = ({ id }) => {
  const router = useRouter();
  const [armed, setArmed] = useState(false);

  const click = () => {
    if (!armed) {
      setArmed(true);
      setTimeout(() => setArmed(false), 3000);
      return;
    }
    getSocket().emit("video:remove", id, () => router.push("/"));
  };

  return (
    <button type="button" className={`btn ${Styles.delete}`} data-armed={armed} onClick={click}>
      <Icon name="trash" size={20} /> {armed ? "Click again to delete" : "Delete"}
    </button>
  );
};

export default DeleteButton;
