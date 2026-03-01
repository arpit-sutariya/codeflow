/**
 * Create an OT operation from a text change.
 * @param {number} docLength - Length of document before change
 * @param {number} from - Start position of change
 * @param {number} oldEnd - End position of deleted content
 * @param {string} insertedText - Text inserted at `from`
 */
export function createDeltaFromChange(docLength, from, oldEnd, insertedText) {
  const ops = [];
  const deleteCount = oldEnd - from;

  if (from > 0) ops.push({ type: "retain", count: from });
  if (deleteCount > 0) ops.push({ type: "delete", count: deleteCount });
  if (insertedText.length > 0) ops.push({ type: "insert", text: insertedText });

  const remaining = docLength - oldEnd;
  if (remaining > 0) ops.push({ type: "retain", count: remaining });

  const targetLength = docLength - deleteCount + insertedText.length;
  return { ops, base_length: docLength, target_length: targetLength };
}
