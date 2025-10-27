import { useSafeHTML } from '@/hooks/useSafeHTML';

interface DocumentPreviewContentProps {
  html: string;
}

export const DocumentPreviewContent = ({ html }: DocumentPreviewContentProps) => {
  const safeHTML = useSafeHTML(html);
  
  return (
    <div
      className="max-h-96 overflow-y-auto bg-white document-preview-container"
      dangerouslySetInnerHTML={{ __html: safeHTML }}
    />
  );
};
