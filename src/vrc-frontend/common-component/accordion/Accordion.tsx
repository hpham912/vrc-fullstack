import React from 'react';
import { ChevronDown } from 'lucide-react';
import { accordionStyles } from './Accordion.styles.ts';

export interface AccordionItem {
  id: string;
  // The header content (e.g. an icon + title + date). Rendered
  // inside the header button, before the chevron.
  header: React.ReactNode;
  // The collapsible content, shown only while this item is open.
  children: React.ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
  // The id of the currently open item, or null when all are closed.
  // Single-open: opening one closes the others. The parent owns
  // this state, so it can force an item open (e.g. when the admin
  // taps a pool verse to edit it).
  openId: string | null;
  onToggle: (id: string) => void;
  className?: string;
}

// Shared collapsible accordion — one section open at a time. Used by
// the member verse history (tap a verse to read it again) and by the
// admin Verses tab (manual add vs. monthly upload). The header is a
// button with aria-expanded; the body unmounts while closed.
export const Accordion: React.FC<AccordionProps> = ({ items, openId, onToggle, className = '' }) => {
  return (
    <div className={`${accordionStyles.container} ${className}`.trim()}>
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div key={item.id} className={accordionStyles.item}>
            <button
              type="button"
              onClick={() => onToggle(item.id)}
              aria-expanded={isOpen}
              className={accordionStyles.header}
            >
              <span className={accordionStyles.headerContent}>{item.header}</span>
              <ChevronDown
                className={`${accordionStyles.chevron} ${isOpen ? accordionStyles.chevronOpen : ''}`}
                aria-hidden="true"
              />
            </button>
            {isOpen && <div className={accordionStyles.body}>{item.children}</div>}
          </div>
        );
      })}
    </div>
  );
};
