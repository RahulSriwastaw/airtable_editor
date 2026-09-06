import { QuestionRecord } from '../types';
import { StudioImageItem } from '../components/QuestionEditor/studio/studioTypes';
import { api } from '../services/api';

/**
 * Extracts all valid images from a set of questions (active table / test set)
 * including direct `image_url` fields and embedded `<img src="...">` inside rich text fields.
 */
export function extractSetImages(
  records: QuestionRecord[],
  tableName: string,
  userName: string,
  onRecordUpdated?: (recordId: string, updatedFields: Record<string, any>) => void
): StudioImageItem[] {
  const list: StudioImageItem[] = [];
  const seenUrls = new Set<string>();

  // Ensure records are ordered by question number if available
  const sortedRecords = [...records].sort((a, b) => {
    const qA = typeof a.fields.question_r === 'number' ? a.fields.question_r : 0;
    const qB = typeof b.fields.question_r === 'number' ? b.fields.question_r : 0;
    return qA - qB;
  });

  const htmlFields: { key: keyof QuestionRecord['fields']; label: string }[] = [
    { key: 'question_hi', label: 'Question (HI)' },
    { key: 'question_en', label: 'Question (EN)' },
    { key: 'solution_hi', label: 'Solution (HI)' },
    { key: 'solution_en', label: 'Solution (EN)' },
    { key: 'option1_hi', label: 'Option A (HI)' },
    { key: 'option2_hi', label: 'Option B (HI)' },
    { key: 'option3_hi', label: 'Option C (HI)' },
    { key: 'option4_hi', label: 'Option D (HI)' },
    { key: 'option5_hi', label: 'Option E (HI)' },
    { key: 'option1_en', label: 'Option A (EN)' },
    { key: 'option2_en', label: 'Option B (EN)' },
    { key: 'option3_en', label: 'Option C (EN)' },
    { key: 'option4_en', label: 'Option D (EN)' },
    { key: 'option5_en', label: 'Option E (EN)' }
  ];

  sortedRecords.forEach((r) => {
    const qNum = r.fields.question_r ?? '?';

    // 1. Main Question Diagram
    if (r.fields.image_url && typeof r.fields.image_url === 'string' && r.fields.image_url.trim()) {
      const url = r.fields.image_url.trim();
      list.push({
        id: `${r.id}-image_url`,
        recordId: r.id,
        questionNumber: qNum,
        field: 'image_url',
        url,
        title: `Q#${qNum} Diagram`,
        subtitle: `Question ${qNum} Main Diagram`,
        onSave: async (newUrl: string) => {
          const updatedFields: Record<string, any> = { image_url: newUrl };
          
          // Also replace this URL in any HTML fields where it might appear
          htmlFields.forEach(hf => {
            const content = String(r.fields[hf.key] || '');
            if (content.includes(url)) {
              updatedFields[hf.key] = content.replaceAll(url, newUrl);
            }
          });

          await api.updateQuestion(tableName, r.id, updatedFields, userName);
          if (onRecordUpdated) {
            onRecordUpdated(r.id, updatedFields);
          }
        }
      });
      seenUrls.add(`${r.id}-${url}`);
    }

    // 2. Explanation / Solution Image URL (if stored in field)
    if (r.fields.explanation_image_url && typeof r.fields.explanation_image_url === 'string' && r.fields.explanation_image_url.trim()) {
      const url = r.fields.explanation_image_url.trim();
      if (!seenUrls.has(`${r.id}-${url}`)) {
        list.push({
          id: `${r.id}-explanation_image_url`,
          recordId: r.id,
          questionNumber: qNum,
          field: 'explanation_image_url',
          url,
          title: `Q#${qNum} Solution Diagram`,
          subtitle: `Question ${qNum} Explanation`,
          onSave: async (newUrl: string) => {
            const updatedFields: Record<string, any> = { explanation_image_url: newUrl };
            
            // Also replace this URL in any HTML fields where it might appear
            htmlFields.forEach(hf => {
              const content = String(r.fields[hf.key] || '');
              if (content.includes(url)) {
                updatedFields[hf.key] = content.replaceAll(url, newUrl);
              }
            });

            await api.updateQuestion(tableName, r.id, updatedFields, userName);
            if (onRecordUpdated) {
              onRecordUpdated(r.id, updatedFields);
            }
          }
        });
        seenUrls.add(`${r.id}-${url}`);
      }
    }

    // 3. Scan HTML fields for inline <img> tags
    htmlFields.forEach(({ key, label }) => {
      const content = r.fields[key];
      if (typeof content === 'string' && content.includes('<img')) {
        const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
        let match;
        let imgIdx = 1;
        while ((match = imgRegex.exec(content)) !== null) {
          const src = match[1];
          if (src && !seenUrls.has(`${r.id}-${src}`)) {
            const currentOldSrc = src;
            list.push({
              id: `${r.id}-${key}-${imgIdx}`,
              recordId: r.id,
              questionNumber: qNum,
              field: key as string,
              url: src,
              title: `Q#${qNum} ${label} Img ${imgIdx > 1 ? `#${imgIdx}` : ''}`,
              subtitle: `Question ${qNum} • ${label}`,
              onSave: async (newUrl: string) => {
                const updatedFields: Record<string, any> = {};
                
                // Update standard attachment fields if they match this inline image URL
                if (r.fields.image_url === currentOldSrc) updatedFields.image_url = newUrl;
                if (r.fields.explanation_image_url === currentOldSrc) updatedFields.explanation_image_url = newUrl;

                // Update all HTML fields where this image might appear
                htmlFields.forEach(hf => {
                  const content = String(r.fields[hf.key] || '');
                  if (content.includes(currentOldSrc)) {
                    updatedFields[hf.key] = content.replaceAll(currentOldSrc, newUrl);
                  }
                });

                if (Object.keys(updatedFields).length > 0) {
                  await api.updateQuestion(tableName, r.id, updatedFields, userName);
                  if (onRecordUpdated) {
                    onRecordUpdated(r.id, updatedFields);
                  }
                }
              }
            });
            seenUrls.add(`${r.id}-${src}`);
            imgIdx++;
          }
        }
      }
    });
  });

  return list;
}
