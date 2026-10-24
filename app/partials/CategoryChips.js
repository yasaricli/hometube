// Store
import useLibraryStore from "@/store/useLibraryStore";
import useUiStore from "@/store/useUiStore";

// Styles
import Styles from "../styles.module.scss";

const CategoryChips = () => {
  const categories = useLibraryStore((state) => state.categories);
  const { category, setCategory } = useUiStore();

  return (
    <div className={Styles.chips} role="tablist" aria-label="Categories">
      <button type="button" role="tab" aria-selected={!category} onClick={() => setCategory("")}>
        All
      </button>
      {categories.map((c) => (
        <button key={c.id} type="button" role="tab" aria-selected={category === c.id} onClick={() => setCategory(c.id)}>
          {c.name}
        </button>
      ))}
    </div>
  );
};

export default CategoryChips;
