"use client";

import { useId, useRef, useState } from "react";

// Components
import Icon from "@/components/Icon";

// Store
import useLibraryStore from "@/store/useLibraryStore";

// Utils
import { getSocket } from "@/utils/socket";

// Styles
import Styles from "@/styles/dialog.module.scss";

// A trigger button plus the dialog that saves a YouTube video or Short, or every Short of a channel, to the library.
const AddVideoDialog = ({ label = "Add video / Shorts", primary }) => {
  const dialog = useRef();
  const titleId = useId();
  const categories = useLibraryStore((state) => state.categories);
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const open = () => {
    setUrl("");
    setCategory("");
    setError("");
    dialog.current.showModal();
  };

  const close = () => dialog.current.close();

  const submit = (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    getSocket().emit("video:add", { url, category }, (res) => {
      setBusy(false);
      if (res.error) return setError(res.error);
      close();
    });
  };

  return (
    <>
      <button type="button" className={primary ? "btnBrand" : "btn"} onClick={open}>
        <Icon name="plus" size={20} /> {label}
      </button>

      <dialog ref={dialog} className={Styles.dialog} aria-labelledby={titleId} onClick={(e) => e.target === dialog.current && close()}>
        <form className={Styles.sheet} onSubmit={submit}>
          <header className={Styles.head}>
            <h2 id={titleId}>Add a video or Shorts</h2>
            <button type="button" className={Styles.close} onClick={close} aria-label="Close">
              <Icon name="close" size={20} />
            </button>
          </header>

          <label className={Styles.field}>
            <span>YouTube link</span>
            <input
              type="text"
              inputMode="url"
              required
              autoFocus
              placeholder="Video, Short or youtube.com/@channel/shorts link"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </label>

          {!!categories.length && (
            <label className={Styles.field}>
              <span>Category</span>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">None</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <p className={error ? Styles.error : Styles.hint}>
            {error ||
              "A video shows up on the home page and a Short in Shorts once it's downloaded. A channel's Shorts link (youtube.com/@name/shorts) saves all of its Shorts."}
          </p>

          <footer className={Styles.foot}>
            <button type="button" className="btn" onClick={close}>
              Cancel
            </button>
            <button className="btnBrand" disabled={busy}>
              {busy ? "Fetching…" : "Fetch"}
            </button>
          </footer>
        </form>
      </dialog>
    </>
  );
};

export default AddVideoDialog;
