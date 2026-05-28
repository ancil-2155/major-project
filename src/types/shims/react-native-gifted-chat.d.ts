import * as React from 'react';

export interface User {
  _id: string | number;
  name?: string;
  avatar?: string;
}

export interface IMessage {
  _id: string | number;
  text: string;
  createdAt: Date | number;
  user: User;
  image?: string;
  video?: string;
  audio?: string;
  system?: boolean;
  sent?: boolean;
  received?: boolean;
  pending?: boolean;
  quickReplies?: unknown;
  [key: string]: unknown;
}

export const GiftedChat: React.ComponentType<any>;
export const Bubble: React.ComponentType<any>;
export const Actions: React.ComponentType<any>;
export const Send: React.ComponentType<any>;
