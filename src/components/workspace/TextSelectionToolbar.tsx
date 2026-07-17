import React, { useEffect, useState } from 'react';

interface Position {
  top: number;
  left: number;
}

const TextSelectionToolbar: React.FC = () => {
  const [show, setShow] = useState(false);
  const [position, setPosition] = useState<Position>({ top: 0, left: 0 });
  
  const handleSelectionChange = () => {
    const selection = window.getSelection();
    
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      setShow(false);
      return;
    }
    
    // Check if selection is inside a contenteditable element
    const anchorNode = selection.anchorNode;
    const element = anchorNode?.nodeType === Node.ELEMENT_NODE 
      ? (anchorNode as HTMLElement) 
      : anchorNode?.parentElement;
      
    const isEditable = element && element.closest('[contenteditable="true"]');
    
    if (!isEditable) {
      setShow(false);
      return;
    }
    
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    // If the selection is not visible (e.g. width/height is 0), don't show
    if (rect.width === 0 || rect.height === 0) {
      setShow(false);
      return;
    }
    
    setPosition({
      top: rect.top - 45, // Position slightly above the selected text
      left: rect.left + (rect.width / 2) // Center horizontally over selection
    });
    
    setShow(true);
  };

  useEffect(() => {
    // Escutando a mudança de seleção no documento todo
    document.addEventListener('selectionchange', handleSelectionChange);
    
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  const handleFormat = (e: React.MouseEvent, command: string) => {
    // Previne que o botão roube o foco, mantendo a seleção do texto ativa
    e.preventDefault(); 
    document.execCommand(command, false, undefined);
  };

  if (!show) return null;

  return (
    <div 
      className="fixed z-[9999] flex items-center gap-1 bg-[#282828] border border-[#3f3f3f] rounded shadow-[0_4px_16px_rgba(0,0,0,0.3)] px-1.5 py-1 pointer-events-auto transform transition-all duration-150 ease-out"
      style={{ 
        top: `${position.top}px`, 
        left: `${position.left}px`,
        transform: 'translate(-50%, 0)', // Centering
      }}
    >
      <button 
        onMouseDown={(e) => handleFormat(e, 'bold')}
        className="p-1 hover:bg-[#3f3f3f] text-[#e0e0e0] hover:text-white rounded transition-colors flex items-center justify-center cursor-pointer"
        title="Negrito (Ctrl+B)"
      >
        <span className="material-icons text-[18px]">format_bold</span>
      </button>
      
      <button 
        onMouseDown={(e) => handleFormat(e, 'italic')}
        className="p-1 hover:bg-[#3f3f3f] text-[#e0e0e0] hover:text-white rounded transition-colors flex items-center justify-center cursor-pointer"
        title="Itálico (Ctrl+I)"
      >
        <span className="material-icons text-[18px]">format_italic</span>
      </button>
      
      <button 
        onMouseDown={(e) => handleFormat(e, 'underline')}
        className="p-1 hover:bg-[#3f3f3f] text-[#e0e0e0] hover:text-white rounded transition-colors flex items-center justify-center cursor-pointer"
        title="Sublinhado (Ctrl+U)"
      >
        <span className="material-icons text-[18px]">format_underlined</span>
      </button>

      <div className="w-[1px] h-4 bg-[#4a4a4a] mx-1" />
      
      <button 
        onMouseDown={(e) => handleFormat(e, 'strikeThrough')}
        className="p-1 hover:bg-[#3f3f3f] text-[#e0e0e0] hover:text-white rounded transition-colors flex items-center justify-center cursor-pointer"
        title="Tachado"
      >
        <span className="material-icons text-[18px]">format_strikethrough</span>
      </button>

      <div className="w-[1px] h-4 bg-[#4a4a4a] mx-1" />
      
      <button 
        onMouseDown={(e) => handleFormat(e, 'removeFormat')}
        className="p-1 hover:bg-[#3f3f3f] text-[#e0e0e0] hover:text-white rounded transition-colors flex items-center justify-center cursor-pointer"
        title="Limpar Formatação"
      >
        <span className="material-icons text-[18px]">format_clear</span>
      </button>
    </div>
  );
};

export default TextSelectionToolbar;
