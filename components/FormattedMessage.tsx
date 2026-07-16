'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Copy, Terminal, AlertCircle } from 'lucide-react';

interface FormattedMessageProps {
  content: string;
}

export default function FormattedMessage({ content }: FormattedMessageProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (!content) return null;

  // Render a special notice block if the AI agent states it hasn't learned the information yet
  const isMissingInfoWarning = content.toLowerCase().includes("haven't learned") || content.toLowerCase().includes("no he aprendido");

  // Custom inline markdown elements renderer
  const renderInlineText = (text: string) => {
    // Basic bold **text** parsing
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={idx} className="font-semibold text-cyan-300">
            {part.slice(2, -2)}
          </strong>
        );
      }
      
      // Inline code `code` parsing
      const codeParts = part.split(/`([^`]+)`/g);
      if (codeParts.length > 1) {
        return codeParts.map((subPart, subIdx) => {
          if (subIdx % 2 === 1) {
            return (
              <code key={subIdx} className="bg-slate-900 text-pink-400 font-mono text-xs px-1 py-0.5 rounded border border-slate-800">
                {subPart}
              </code>
            );
          }
          return subPart;
        });
      }

      return part;
    });
  };

  // Split content by paragraphs and code blocks
  const blocks = content.split(/(\`\`\`[\s\S]*?\`\`\`)/g);

  return (
    <div className="space-y-3.5 text-slate-300 leading-relaxed text-sm">
      {isMissingInfoWarning && (
        <motion.div 
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-200 p-3 rounded-lg text-xs leading-relaxed"
        >
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-300">Límite Cognitivo Alcanzado</p>
            <p className="opacity-90">Esta consulta solicitó información fuera del Cerebro de Negocios sintetizado actual. ¡Agrega nuevos puntos de datos en el panel izquierdo para expandir la comprensión del agente!</p>
          </div>
        </motion.div>
      )}

      {blocks.map((block, idx) => {
        // Code blocks: ```javascript code ```
        if (block.startsWith('```') && block.endsWith('```')) {
          const lines = block.split('\n');
          const firstLine = lines[0].replace('```', '').trim();
          const language = firstLine || 'terminal';
          const codeLines = lines.slice(1, -1).join('\n');

          return (
            <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-800 bg-slate-900/90 font-mono text-xs my-3">
              {/* Header */}
              <div className="flex items-center justify-between bg-slate-950 px-3.5 py-1.5 border-b border-slate-800 text-[10px] text-slate-400 tracking-wider">
                <div className="flex items-center gap-1.5">
                  <Terminal className="w-3 h-3 text-cyan-400" />
                  <span>{language.toUpperCase()}</span>
                </div>
                <button
                  onClick={() => handleCopy(codeLines)}
                  className="hover:text-slate-200 flex items-center gap-1 transition-colors duration-150"
                >
                  {copiedCode === codeLines ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">COPIADO</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>COPIAR</span>
                    </>
                  )}
                </button>
              </div>
              {/* Content */}
              <pre className="p-3.5 overflow-x-auto text-slate-300">
                <code>{codeLines}</code>
              </pre>
            </div>
          );
        }

        // Standard text block (split by newlines to check for bullet items, headings, etc.)
        const lines = block.split('\n');
        return (
          <div key={idx} className="space-y-2">
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();
              if (!trimmed) return null;

              // Headings: # Header, ## Header, ### Header
              if (trimmed.startsWith('### ')) {
                return (
                  <h4 key={lIdx} className="text-sm font-display font-bold text-slate-100 pt-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    {renderInlineText(trimmed.replace('### ', ''))}
                  </h4>
                );
              }
              if (trimmed.startsWith('## ')) {
                return (
                  <h3 key={lIdx} className="text-base font-display font-bold text-slate-50 pt-3 border-b border-slate-800/60 pb-1 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    {renderInlineText(trimmed.replace('## ', ''))}
                  </h3>
                );
              }
              if (trimmed.startsWith('# ')) {
                return (
                  <h2 key={lIdx} className="text-lg font-display font-bold text-white pt-4 tracking-tight">
                    {renderInlineText(trimmed.replace('# ', ''))}
                  </h2>
                );
              }

              // Bullet points: - item, * item
              if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                return (
                  <div key={lIdx} className="flex items-start gap-2 pl-2">
                    <span className="text-cyan-400 select-none mt-1.5 font-bold text-[10px]">•</span>
                    <span className="text-slate-300">{renderInlineText(trimmed.slice(2))}</span>
                  </div>
                );
              }

              // Standard paragraph line
              return (
                <p key={lIdx} className="leading-relaxed">
                  {renderInlineText(trimmed)}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
