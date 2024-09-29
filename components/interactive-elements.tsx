"use client";

import { HTMLAttributes, InputHTMLAttributes, PropsWithChildren } from "react";

export const InteractiveInput = ({
  ...props
}: PropsWithChildren<InputHTMLAttributes<HTMLInputElement>>) => {
  return <input {...props} />;
};

export const InteractiveDiv = ({
  children,
  ...rest
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) => {
  return <div {...rest}>{children}</div>;
};
