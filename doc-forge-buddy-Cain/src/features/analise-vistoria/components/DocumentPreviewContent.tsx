import { useSafeHTML } from '@/hooks/useSafeHTML';

interface DocumentPreviewContentProps {
  html: string;
}

export const DocumentPreviewContent = ({ html }: DocumentPreviewContentProps) => {
  const safeHTML = useSafeHTML(html);
  
  return (
    <div
      className="w-full document-preview-container prose prose-sm max-w-none"
      dangerouslySetInnerHTML={{ __html: safeHTML }}
    />
  );
};
