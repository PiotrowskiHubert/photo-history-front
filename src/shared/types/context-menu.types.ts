export interface ContextMenuItem {
  label: string;
  /** Font Awesome icon name, e.g. 'image' */
  icon: string;
  action: () => void;
  danger?: boolean;
  /** If true, render a separator line before this item */
  separator?: boolean;
}

