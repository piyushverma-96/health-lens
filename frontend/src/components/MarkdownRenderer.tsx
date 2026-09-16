import React from "react";

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  if (!content) return null;

  // Split content by lines
  const lines = content.split("\n");
  const renderedElements: React.ReactNode[] = [];
  
  let currentList: React.ReactNode[] = [];
  
  const parseInlineStyles = (text: string): React.ReactNode[] => {
    // Split by ** to find bold text
    const parts = text.split(/\*\*([\s\S]*?)\*\*/g);
    return parts.map((part, idx) => {
      if (idx % 2 === 1) {
        return <strong key={idx} className="font-bold text-gray-900">{part}</strong>;
      }
      return part;
    });
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    // Check if it's a list item
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const itemText = trimmed.substring(2);
      currentList.push(
        <li key={`li-${index}`} className="list-disc pl-2 ml-4 mb-1.5 text-sm text-clinical-slate leading-relaxed">
          {parseInlineStyles(itemText)}
        </li>
      );
    } else {
      // If we were building a list, push it now
      if (currentList.length > 0) {
        renderedElements.push(
          <ul key={`ul-${index}`} className="my-3 space-y-1 list-inside">
            {currentList}
          </ul>
        );
        currentList = [];
      }

      if (trimmed === "") {
        return;
      }

      // Check headers
      if (trimmed.startsWith("### ")) {
        renderedElements.push(
          <h4 key={index} className="text-sm font-heading font-bold text-clinical-slate mt-5 mb-2 tracking-tight">
            {parseInlineStyles(trimmed.substring(4))}
          </h4>
        );
      } else if (trimmed.startsWith("## ")) {
        renderedElements.push(
          <h3 key={index} className="text-base font-heading font-bold text-gold-leaf mt-6 mb-3 tracking-tight border-b border-gold-border pb-1">
            {parseInlineStyles(trimmed.substring(3))}
          </h3>
        );
      } else if (trimmed.startsWith("# ")) {
        renderedElements.push(
          <h2 key={index} className="text-lg font-heading font-bold text-clinical-blue mt-8 mb-4 tracking-tight">
            {parseInlineStyles(trimmed.substring(2))}
          </h2>
        );
      } else {
        // Normal paragraph
        renderedElements.push(
          <p key={index} className="text-sm leading-relaxed text-clinical-slate mb-3.5">
            {parseInlineStyles(trimmed)}
          </p>
        );
      }
    }
  });

  // Flush remaining list
  if (currentList.length > 0) {
    renderedElements.push(
      <ul key="ul-final" className="my-3 space-y-1 list-inside">
        {currentList}
      </ul>
    );
  }

  return <div className="space-y-1 font-sans">{renderedElements}</div>;
};
