export interface ExternalBookResult {
  id: string;
  title: string;
  author: string;
  coverUrl: string | null;
  downloadUrl: string | null;
  readUrl: string | null;
  source: 'OpenLibrary' | 'Gutendex' | 'GoogleBooks';
  subject: string;
}

export const searchExternalBooks = async (query: string): Promise<ExternalBookResult[]> => {
  if (!query || query.trim().length < 3) return [];
  
  const results: ExternalBookResult[] = [];
  const q = encodeURIComponent(query.trim());

  // 1. Gutendex (Project Gutenberg)
  try {
    const gutenbergRes = await fetch(`https://gutendex.com/books/?search=${q}`);
    if (gutenbergRes.ok) {
      const data = await gutenbergRes.json();
      const books = data.results.slice(0, 10).map((b: any) => {
        // Find best download link (epub or html)
        const htmlLink = b.formats['text/html'] || b.formats['text/html; charset=utf-8'];
        const epubLink = b.formats['application/epub+zip'];
        
        return {
          id: `gutendex_${b.id}`,
          title: b.title,
          author: b.authors && b.authors.length > 0 ? b.authors[0].name : 'Unknown Author',
          coverUrl: b.formats['image/jpeg'] || null,
          downloadUrl: epubLink || null,
          readUrl: htmlLink || null,
          source: 'Gutendex',
          subject: b.subjects && b.subjects.length > 0 ? b.subjects[0] : 'Literature',
        } as ExternalBookResult;
      });
      results.push(...books);
    }
  } catch (error) {
    console.warn('Gutendex search failed', error);
  }

  // 2. Open Library
  try {
    const olRes = await fetch(`https://openlibrary.org/search.json?q=${q}&limit=10`);
    if (olRes.ok) {
      const data = await olRes.json();
      const books = data.docs.map((b: any) => {
        const coverUrl = b.cover_i ? `https://covers.openlibrary.org/b/id/${b.cover_i}-M.jpg` : null;
        return {
          id: `openlibrary_${b.key}`,
          title: b.title,
          author: b.author_name ? b.author_name[0] : 'Unknown Author',
          coverUrl,
          downloadUrl: null, // OpenLibrary usually requires borrowing via their reader
          readUrl: `https://openlibrary.org${b.key}`,
          source: 'OpenLibrary',
          subject: b.subject && b.subject.length > 0 ? b.subject[0] : 'General',
        } as ExternalBookResult;
      });
      results.push(...books);
    }
  } catch (error) {
    console.warn('OpenLibrary search failed', error);
  }

  return results;
};
