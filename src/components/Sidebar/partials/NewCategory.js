import { useState } from "react";

// Components
import Icon from "@/components/Icon";

// Utils
import { getSocket } from "@/utils/socket";

// Styles
import Styles from "../styles.module.scss";

// "New category" turns into a name field; Enter creates it, Escape or leaving the field cancels.
const NewCategory = () => {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");

  const close = () => {
    setEditing(false);
    setName("");
  };

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) return close();
    getSocket().emit("category:add", name, (res) => {
      if (res.error) return;
      close();
    });
  };

  if (!editing) {
    return (
      <button type="button" className={Styles.item} onClick={() => setEditing(true)}>
        <Icon name="plus" size={22} />
        <span>New category</span>
      </button>
    );
  }
  return (
    <form className={Styles.newCategory} onSubmit={submit}>
      <input
        autoFocus
        maxLength={40}
        placeholder="Category name"
        aria-label="Category name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={close}
        onKeyDown={(e) => e.key === "Escape" && close()}
      />
    </form>
  );
};

export default NewCategory;
