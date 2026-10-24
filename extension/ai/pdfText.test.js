// pdfText.js 的抽字契約測試：載入真正的 vendor pdf.js（順序：worker → lib → pdfText）
// worker 檔會設定全域 pdfjsWorker，pdf.min.js 初始化時直接拿它當 fake worker（不 spawn Worker、不抓檔案）
require('./vendor/pdf.worker.min.js');
require('./vendor/pdf.min.js');
const assert = require('node:assert/strict');
const PdfText = require('./pdfText.js');

async function test(name, fn) {
  try {
    await fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

// 手刻最小合法 PDF（未壓縮、Type1 內建字型），不依賴外部檔案或工具
// pages：每頁一段文字，逐頁 BT ... Tj ET
function buildPdf(pages) {
  const texts = Array.isArray(pages) ? pages : [pages];
  const n = texts.length;
  // 物件編號：1 catalog、2 pages、3 font、之後每頁各 2 個（page、content）
  const pageNum = (i) => 4 + i * 2;
  const contentNum = (i) => 5 + i * 2;
  const objs = [];
  objs[1] = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  objs[2] = `2 0 obj\n<< /Type /Pages /Kids [${texts.map((_, i) => `${pageNum(i)} 0 R`).join(' ')}] /Count ${n} >>\nendobj\n`;
  objs[3] = '3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n';
  texts.forEach((t, i) => {
    objs[pageNum(i)] = `${pageNum(i)} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] `
      + `/Resources << /Font << /F1 3 0 R >> >> /Contents ${contentNum(i)} 0 R >>\nendobj\n`;
    const stream = `BT /F1 12 Tf 10 100 Td (${t}) Tj ET`;
    objs[contentNum(i)] = `${contentNum(i)} 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`;
  });
  const last = 3 + n * 2;
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (let i = 1; i <= last; i++) {
    offsets[i] = Buffer.byteLength(pdf, 'latin1');
    pdf += objs[i];
  }
  const xrefStart = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${last + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= last; i++) pdf += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
  pdf += `trailer\n<< /Size ${last + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return new Uint8Array(Buffer.from(pdf, 'latin1'));
}

(async () => {
  await test('extractText: 單頁 PDF 抽得出已知字串', async () => {
    const text = await PdfText.extractText(buildPdf('Hello Due Extraction Test'));
    assert.ok(text.includes('Hello Due Extraction Test'), text);
  });

  await test('extractText: 多頁 PDF 每頁文字都抽得到', async () => {
    const text = await PdfText.extractText(buildPdf(['Grading Policy Homework 30', 'Midterm 30 Final 40']));
    assert.ok(text.includes('Grading Policy Homework 30'), text);
    assert.ok(text.includes('Midterm 30 Final 40'), text);
    assert.ok(text.includes('\n'), '頁與頁之間要換行'); // 兩頁串接
  });

  await test('extractText: 非 PDF bytes → 回空字串，不丟例外', async () => {
    assert.equal(await PdfText.extractText(new Uint8Array([1, 2, 3, 4, 5])), '');
    assert.equal(await PdfText.extractText(new Uint8Array(Buffer.from('just some plain text, not a pdf'))), '');
  });

  await test('extractText: 空／無效輸入 → 回空字串', async () => {
    assert.equal(await PdfText.extractText(new Uint8Array(0)), '');
    assert.equal(await PdfText.extractText(null), '');
  });

  console.log('ALL pdfText TESTS PASSED');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
