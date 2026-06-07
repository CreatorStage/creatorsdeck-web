export interface ScriptBlock {
  id: string;
  type: "paragraph" | "hook" | "dev" | "final" | "cta";
  html: string;
}

export const parseHtmlToBlocks = (html: string): ScriptBlock[] => {
  if (!html) {
    return [{ id: "block-init", type: "paragraph", html: "<p><br></p>" }];
  }
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const children = doc.body.children;
  
  if (children.length === 0) {
    return [{ id: `block-${Math.random().toString(36).substr(2, 5)}`, type: "paragraph", html: `<p>${html}</p>` }];
  }
  
  const parsedBlocks: ScriptBlock[] = [];
  
  for (let i = 0; i < children.length; i++) {
    const el = children[i];
    const outerHTML = el.outerHTML;
    const textContent = el.textContent || "";
    
    let type: "paragraph" | "hook" | "dev" | "final" | "cta" = "paragraph";
    
    // Check for explicit badge text or specific background colors used in VideoIdeaWorkspace.tsx
    if (outerHTML.includes("rgba(220, 38, 38") || outerHTML.includes("rgba(255, 0, 0") || textContent.includes("GANCHO")) {
      type = "hook";
    } else if (outerHTML.includes("rgba(37, 99, 235") || outerHTML.includes("rgba(62, 166, 255") || textContent.includes("CONTEÚDO")) {
      type = "dev";
    } else if (outerHTML.includes("rgba(217, 119, 6") || outerHTML.includes("rgba(255, 152, 0") || textContent.includes("CONCLUSÃO")) {
      type = "final";
    } else if (outerHTML.includes("rgba(5, 150, 105") || outerHTML.includes("rgba(43, 166, 64") || textContent.includes("CTA")) {
      type = "cta";
    }
    
    // If the previous block is of the same type, merge this HTML into it instead of creating a new block.
    // This prevents blocks from shattering when returning from continuous mode.
    if (parsedBlocks.length > 0 && parsedBlocks[parsedBlocks.length - 1].type === type) {
      parsedBlocks[parsedBlocks.length - 1].html += outerHTML;
    } else {
      parsedBlocks.push({
        id: `block-${i}-${Math.random().toString(36).substr(2, 5)}`,
        type,
        html: outerHTML
      });
    }
  }
  
  return parsedBlocks;
};

export const blocksToMarkdown = (blocks: ScriptBlock[]): string => {
  return blocks.map(block => {
    const temp = document.createElement("div");
    temp.innerHTML = block.html;
    
    const badge = temp.querySelector("span");
    if (badge && badge.textContent && ["GANCHO", "CONTEÚDO", "CONCLUSÃO", "CTA"].includes(badge.textContent.toUpperCase())) {
      badge.remove();
    }
    
    let text = temp.innerText || temp.textContent || "";
    text = text.trim();
    
    switch (block.type) {
      case "hook": return `[GANCHO]\n${text}`;
      case "dev": return `[CONTEÚDO]\n${text}`;
      case "final": return `[CONCLUSÃO]\n${text}`;
      case "cta": return `[CTA]\n${text}`;
      default: return text;
    }
  }).join("\n\n");
};

export const markdownToBlocks = (markdown: string): ScriptBlock[] => {
  if (!markdown) return [];
  
  // Force a double newline before any recognized tag so they are always split properly
  let processedMarkdown = markdown.replace(/\[(GANCHO|HOOK|CONTEÚDO|DEV|CONCLUSÃO|FINAL|CTA)\]/gi, "\n\n[$1]");
  
  const parts = processedMarkdown.split(/\n\n+/);
  return parts.map((part, i) => {
    part = part.trim();
    if (!part) return null;
    
    let type: ScriptBlock["type"] = "paragraph";
    let text = part;
    
    const lines = part.split("\n");
    const firstLine = lines[0].trim().toUpperCase();
    
    if (firstLine.startsWith("[GANCHO]") || firstLine.startsWith("[HOOK]")) {
      type = "hook";
      text = part.replace(/^\[(GANCHO|HOOK)\]/i, "").trim();
    } else if (firstLine.startsWith("[CONTEÚDO]") || firstLine.startsWith("[DEV]")) {
      type = "dev";
      text = part.replace(/^\[(CONTEÚDO|DEV)\]/i, "").trim();
    } else if (firstLine.startsWith("[CONCLUSÃO]") || firstLine.startsWith("[FINAL]")) {
      type = "final";
      text = part.replace(/^\[(CONCLUSÃO|FINAL)\]/i, "").trim();
    } else if (firstLine.startsWith("[CTA]")) {
      type = "cta";
      text = part.replace(/^\[CTA\]/i, "").trim();
    }
    
    const htmlText = text.split("\n").map(line => line).join("<br/>");
    
    let html = "";
    if (type === "paragraph") {
      html = `<p style="color: #f1f1f1;">${htmlText}</p>`;
    } else if (type === "hook") {
      html = `<div style="background-color: rgba(220, 38, 38, 0.22); border-left: 4px solid #ef4444; padding: 12px 16px; margin: 12px 0; border-radius: 4px; font-family: 'Montserrat', sans-serif; color: #fef2f2;">
                <span contenteditable="false" style="background-color: #dc2626; color: white; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; margin-right: 8px; display: inline-block; letter-spacing: 0.05em; user-select: none;">GANCHO</span>
                ${htmlText}
              </div>`;
    } else if (type === "dev") {
      html = `<div style="background-color: rgba(37, 99, 235, 0.22); border-left: 4px solid #60a5fa; padding: 12px 16px; margin: 12px 0; border-radius: 4px; font-family: 'Montserrat', sans-serif; color: #eff6ff;">
                <span contenteditable="false" style="background-color: #2563eb; color: white; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; margin-right: 8px; display: inline-block; letter-spacing: 0.05em; user-select: none;">CONTEÚDO</span>
                ${htmlText}
              </div>`;
    } else if (type === "final") {
      html = `<div style="background-color: rgba(217, 119, 6, 0.22); border-left: 4px solid #fbbf24; padding: 12px 16px; margin: 12px 0; border-radius: 4px; font-family: 'Montserrat', sans-serif; color: #fffbeb;">
                <span contenteditable="false" style="background-color: #d97706; color: white; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; margin-right: 8px; display: inline-block; letter-spacing: 0.05em; user-select: none;">CONCLUSÃO</span>
                ${htmlText}
              </div>`;
    } else if (type === "cta") {
      html = `<div style="background-color: rgba(5, 150, 105, 0.22); border-left: 4px solid #34d399; padding: 12px 16px; margin: 12px 0; border-radius: 4px; font-family: 'Montserrat', sans-serif; color: #ecfdf5;">
                <span contenteditable="false" style="background-color: #059669; color: white; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; margin-right: 8px; display: inline-block; letter-spacing: 0.05em; user-select: none;">CTA</span>
                ${htmlText}
              </div>`;
    }
    
    return {
      id: `block-${i}-${Math.random().toString(36).substr(2, 5)}`,
      type,
      html
    };
  }).filter(Boolean) as ScriptBlock[];
};

export const joinBlocksToHtml = (blocks: ScriptBlock[]): string => {
  return blocks.map((b) => b.html).join("");
};

export const getYouTubeEmbedUrl = (url: string): string => {
  if (!url || !url.startsWith("http")) return url;
  try {
    const u = new URL(url);
    const host = u.hostname.replace("www.", "");
    
    if (host === "youtube.com" || host === "youtu.be" || host === "m.youtube.com") {
      let videoId = u.searchParams.get("v");
      
      if (!videoId && host === "youtu.be") {
        videoId = u.pathname.substring(1);
      } else if (!videoId && u.pathname.startsWith("/shorts/")) {
        videoId = u.pathname.split("/")[2];
      } else if (!videoId && u.pathname.startsWith("/live/")) {
        videoId = u.pathname.split("/")[2];
      } else if (!videoId && u.pathname.startsWith("/v/")) {
        videoId = u.pathname.split("/")[2];
      } else if (u.pathname.startsWith("/embed/")) {
        return url; // Already an embed URL
      }
      
      if (videoId) {
        const cleanId = videoId.split("?")[0].split("&")[0];
        return `https://www.youtube.com/embed/${cleanId}`;
      }
    }
  } catch {}
  return url;
};
