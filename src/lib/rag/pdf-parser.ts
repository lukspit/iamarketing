// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse");

export interface ParsedPage {
  pageNumber: number;
  text: string;
}

export interface ParsedDocument {
  title: string;
  pages: ParsedPage[];
  totalPages: number;
}

export async function parsePdf(
  buffer: Buffer,
  fileName: string
): Promise<ParsedDocument> {
  const pages: ParsedPage[] = [];

  await pdfParse(buffer, {
    pagerender: async (pageData: any) => {
      const textContent = await pageData.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      pages.push({
        pageNumber: pages.length + 1,
        text: pageText,
      });

      return pageText;
    },
  });

  const title = fileName.replace(/\.pdf$/i, "");

  return {
    title,
    pages: pages.filter((p) => p.text.length > 0),
    totalPages: pages.length,
  };
}
