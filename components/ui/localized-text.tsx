import { ReactNode } from 'react';

type LocalizedTextProps = {
  hu: ReactNode;
  en: ReactNode;
  className?: string;
};

export function LocalizedText({ hu, en, className }: LocalizedTextProps) {
  return (
    <>
      <span data-lang="hu" className={className}>
        {hu}
      </span>
      <span data-lang="en" className={className}>
        {en}
      </span>
    </>
  );
}
