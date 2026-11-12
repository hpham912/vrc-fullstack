import React from 'react';
import { badgeStyles } from './Badge.styles.ts';

export type BadgeTone = 'amber' | 'emerald' | 'violet' | 'stone' | 'rose' | 'red' | 'blue';

export interface BadgeProps {
  tone?: BadgeTone;
  children: React.ReactNode;
}

// Shared Badge: one small pill label for every short tag in the app.
// The Video tab uses it for both the category badge (sermon /
// singing / reel / other / custom) and the platform badge (YouTube /
// Facebook) on each video card, so the labels can never drift apart
// into hand-built one-offs again.
export const Badge: React.FC<BadgeProps> = ({ tone = 'stone', children }) => {
  return <span className={`${badgeStyles.badge} ${badgeStyles[tone]}`}>{children}</span>;
};
