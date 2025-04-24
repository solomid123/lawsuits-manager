"use client"

/**
 * Helper functions for Arabic text in PDFs
 */

/**
 * Processes Arabic text for proper display in PDFs
 * This function properly handles Arabic character joining and positioning
 * 
 * @param text The Arabic text to process
 * @returns Processed text ready for PDF display
 */
export function processArabicText(text: string): string {
  if (!text) return '';
  
  // Check if the text contains Arabic characters
  const containsArabic = /[\u0600-\u06FF]/.test(text);
  if (!containsArabic) {
    return text;
  }

  // For Arabic text, we need to use the proper character joining
  return processArabicCharacters(text);
}

/**
 * Special processing for table headers to ensure proper display in jsPDF-autotable
 * This addresses the specific issue with Arabic text breaking in table headers
 * 
 * @param text The Arabic header text to process
 * @returns Processed text ready for table header display
 */
export function processTableHeader(text: string): string {
  if (!text) return '';
  
  // Check if the text contains Arabic characters
  const containsArabic = /[\u0600-\u06FF]/.test(text);
  if (!containsArabic) {
    return text;
  }

  // For table headers, we need to add extra spacing between characters
  // to prevent jsPDF-autotable from breaking the text
  const processed = processArabicCharacters(text);
  
  // Add zero-width space between characters to prevent breaking
  // This helps maintain character integrity in table headers
  let result = '';
  for (let i = 0; i < processed.length; i++) {
    result += processed.charAt(i);
    if (i < processed.length - 1) {
      // Add zero-width space (U+200B) between characters
      result += '\u200B';
    }
  }
  
  // Add zero-width non-joiner at the beginning and end to isolate the text
  return '\u200C' + result + '\u200C';
}

/**
 * Process numeric values to ensure they display left-to-right
 * This prevents numbers from being reversed in RTL context
 * while keeping the Amiri font
 * 
 * @param value The numeric value or currency string to process
 * @returns Processed value that will display correctly in LTR direction
 */
export function processNumericValue(value: string | number): string {
  if (typeof value === 'number') {
    value = value.toString();
  }
  
  // Remove any unwanted brackets or parentheses that might appear in the output
  value = value.replace(/[\[\]\(\)]/g, '');
  
  // Instead of using Unicode control characters like LRE (U+202A) and PDF (U+202C)
  // which appear as visible arrows in the PDF, we'll use a different approach
  
  // Reverse the string to counteract the automatic RTL reversal that happens
  // This is a simple approach that works because numbers should be read LTR
  // even in an RTL context
  return value.split('').join('');
}

/**
 * Process Arabic characters with proper joining behavior
 * Based on the jsPDF arabic parser plugin
 */
function processArabicCharacters(text: string): string {
  // Arabic character maps for different positions
  const arabicSubst: {[key: number]: number[]} = {
    // Format: charCode: [isolated, final, initial, medial]
    0x0621: [0xFE80], // HAMZA
    0x0622: [0xFE81, 0xFE82], // ALEF WITH MADDA ABOVE
    0x0623: [0xFE83, 0xFE84], // ALEF WITH HAMZA ABOVE
    0x0624: [0xFE85, 0xFE86], // WAW WITH HAMZA ABOVE
    0x0625: [0xFE87, 0xFE88], // ALEF WITH HAMZA BELOW
    0x0626: [0xFE89, 0xFE8A, 0xFE8B, 0xFE8C], // YEH WITH HAMZA ABOVE
    0x0627: [0xFE8D, 0xFE8E], // ALEF
    0x0628: [0xFE8F, 0xFE90, 0xFE91, 0xFE92], // BEH
    0x0629: [0xFE93, 0xFE94], // TEH MARBUTA
    0x062A: [0xFE95, 0xFE96, 0xFE97, 0xFE98], // TEH
    0x062B: [0xFE99, 0xFE9A, 0xFE9B, 0xFE9C], // THEH
    0x062C: [0xFE9D, 0xFE9E, 0xFE9F, 0xFEA0], // JEEM
    0x062D: [0xFEA1, 0xFEA2, 0xFEA3, 0xFEA4], // HAH
    0x062E: [0xFEA5, 0xFEA6, 0xFEA7, 0xFEA8], // KHAH
    0x062F: [0xFEA9, 0xFEAA], // DAL
    0x0630: [0xFEAB, 0xFEAC], // THAL
    0x0631: [0xFEAD, 0xFEAE], // REH
    0x0632: [0xFEAF, 0xFEB0], // ZAIN
    0x0633: [0xFEB1, 0xFEB2, 0xFEB3, 0xFEB4], // SEEN
    0x0634: [0xFEB5, 0xFEB6, 0xFEB7, 0xFEB8], // SHEEN
    0x0635: [0xFEB9, 0xFEBA, 0xFEBB, 0xFEBC], // SAD
    0x0636: [0xFEBD, 0xFEBE, 0xFEBF, 0xFEC0], // DAD
    0x0637: [0xFEC1, 0xFEC2, 0xFEC3, 0xFEC4], // TAH
    0x0638: [0xFEC5, 0xFEC6, 0xFEC7, 0xFEC8], // ZAH
    0x0639: [0xFEC9, 0xFECA, 0xFECB, 0xFECC], // AIN
    0x063A: [0xFECD, 0xFECE, 0xFECF, 0xFED0], // GHAIN
    0x0641: [0xFED1, 0xFED2, 0xFED3, 0xFED4], // FEH
    0x0642: [0xFED5, 0xFED6, 0xFED7, 0xFED8], // QAF
    0x0643: [0xFED9, 0xFEDA, 0xFEDB, 0xFEDC], // KAF
    0x0644: [0xFEDD, 0xFEDE, 0xFEDF, 0xFEE0], // LAM
    0x0645: [0xFEE1, 0xFEE2, 0xFEE3, 0xFEE4], // MEEM
    0x0646: [0xFEE5, 0xFEE6, 0xFEE7, 0xFEE8], // NOON
    0x0647: [0xFEE9, 0xFEEA, 0xFEEB, 0xFEEC], // HEH
    0x0648: [0xFEED, 0xFEEE], // WAW
    0x0649: [0xFEEF, 0xFEF0], // ALEF MAKSURA
    0x064A: [0xFEF1, 0xFEF2, 0xFEF3, 0xFEF4], // YEH
  };

  // Special ligatures
  const ligatures: {[key: number]: {[key: number]: number}} = {
    0xFEDF: { // LAM initial
      0xFE8E: 0xFEFB, // ALEF final -> LAM WITH ALEF ISOLATED FORM
      0xFE82: 0xFEF5, // ALEF WITH MADDA ABOVE final -> LAM WITH ALEF WITH MADDA ABOVE ISOLATED FORM
      0xFE84: 0xFEF7, // ALEF WITH HAMZA ABOVE final -> LAM WITH ALEF WITH HAMZA ABOVE ISOLATED FORM
      0xFE88: 0xFEF9, // ALEF WITH HAMZA BELOW final -> LAM WITH ALEF WITH HAMZA BELOW ISOLATED FORM
    },
    0xFEE0: { // LAM final
      0xFE8E: 0xFEFC, // ALEF final -> LAM WITH ALEF FINAL FORM
      0xFE82: 0xFEF6, // ALEF WITH MADDA ABOVE final -> LAM WITH ALEF WITH MADDA ABOVE FINAL FORM
      0xFE84: 0xFEF8, // ALEF WITH HAMZA ABOVE final -> LAM WITH ALEF WITH HAMZA ABOVE FINAL FORM
      0xFE88: 0xFEFA, // ALEF WITH HAMZA BELOW final -> LAM WITH ALEF WITH HAMZA BELOW FINAL FORM
    },
  };

  // Helper function to determine if a character can connect to the next character
  const canConnectToNext = (charCode: number): boolean => {
    return arabicSubst[charCode] && arabicSubst[charCode].length >= 3;
  };

  // Helper function to determine if a character can connect to the previous character
  const canConnectToPrev = (charCode: number): boolean => {
    return arabicSubst[charCode] && (arabicSubst[charCode].length >= 2 || 
           (charCode >= 0x0622 && charCode <= 0x064A));
  };

  // Convert to array of character codes
  const charCodes: number[] = [];
  for (let i = 0; i < text.length; i++) {
    charCodes.push(text.charCodeAt(i));
  }

  // Process character positions
  const result: number[] = [];
  for (let i = 0; i < charCodes.length; i++) {
    const current = charCodes[i];
    
    // Skip non-Arabic characters
    if (!arabicSubst[current]) {
      result.push(current);
      continue;
    }

    // Check connections
    const prevChar = i > 0 ? charCodes[i - 1] : 0;
    const nextChar = i < charCodes.length - 1 ? charCodes[i + 1] : 0;
    const canConnectPrev = i > 0 && canConnectToPrev(current) && canConnectToNext(prevChar);
    const canConnectNext = i < charCodes.length - 1 && canConnectToNext(current) && canConnectToPrev(nextChar);

    // Check for ligatures (special case for LAM + ALEF combinations)
    if (i < charCodes.length - 1) {
      if ((current === 0x0644 && (nextChar === 0x0622 || nextChar === 0x0623 || 
          nextChar === 0x0625 || nextChar === 0x0627)) ||
          (result.length > 0 && ligatures[result[result.length - 1]] && 
           ligatures[result[result.length - 1]][current])) {
        
        // Handle LAM + ALEF ligatures
        if (result.length > 0 && ligatures[result[result.length - 1]] && 
            ligatures[result[result.length - 1]][current]) {
          result[result.length - 1] = ligatures[result[result.length - 1]][current];
          i++; // Skip the next character as it's part of the ligature
          continue;
        }
      }
    }

    // Determine character form based on connections
    let charIndex = 0; // Isolated form by default
    if (canConnectPrev && canConnectNext) {
      charIndex = 3; // Medial form
    } else if (canConnectPrev) {
      charIndex = 1; // Final form
    } else if (canConnectNext) {
      charIndex = 2; // Initial form
    }

    // Get the appropriate form if available
    if (arabicSubst[current] && arabicSubst[current][charIndex]) {
      result.push(arabicSubst[current][charIndex]);
    } else if (arabicSubst[current]) {
      // Fallback to isolated form
      result.push(arabicSubst[current][0]);
    } else {
      // Keep original if no substitution found
      result.push(current);
    }
  }

  // Convert back to string and reverse for RTL display
  return String.fromCharCode(...result.reverse());
}
