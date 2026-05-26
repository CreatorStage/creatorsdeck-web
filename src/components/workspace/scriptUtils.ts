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
    if (outerHTML.includes("rgba(255, 0, 0,") || textContent.includes("GANCHO")) {
      type = "hook";
    } else if (outerHTML.includes("rgba(62, 166, 255,") || textContent.includes("CONTEÚDO")) {
      type = "dev";
    } else if (outerHTML.includes("rgba(255, 152, 0,") || textContent.includes("CONCLUSÃO")) {
      type = "final";
    } else if (outerHTML.includes("rgba(43, 166, 64,") || textContent.includes("CTA")) {
      type = "cta";
    }
    
    parsedBlocks.push({
      id: `block-${i}-${Math.random().toString(36).substr(2, 5)}`,
      type,
      html: outerHTML
    });
  }
  
  return parsedBlocks;
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
