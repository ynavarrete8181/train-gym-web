const PAGE = { width: 841.89, height: 595.28 };
const MARGIN_X = 44;
const TOP = 34;
const FOOTER_Y = 20;
const TABLE_BOTTOM = 38;

function latinPdfText(value) {
  const map = {
    '€': 128, '‚': 130, 'ƒ': 131, '„': 132, '…': 133, '†': 134, '‡': 135,
    'ˆ': 136, '‰': 137, 'Š': 138, '‹': 139, 'Œ': 140, 'Ž': 142,
    '‘': 145, '’': 146, '“': 147, '”': 148, '•': 149, '–': 150, '—': 151,
    '˜': 152, '™': 153, 'š': 154, '›': 155, 'œ': 156, 'ž': 158, 'Ÿ': 159,
  };

  let out = '';
  for (const ch of String(value ?? '')) {
    const code = map[ch] ?? ch.codePointAt(0);
    const byte = code <= 255 ? code : 63;

    if (byte === 40 || byte === 41 || byte === 92) {
      out += '\\' + String.fromCharCode(byte);
    } else if (byte < 32 || byte > 126) {
      out += '\\' + byte.toString(8).padStart(3, '0');
    } else {
      out += String.fromCharCode(byte);
    }
  }
  return out;
}

function bytes(text) {
  return new TextEncoder().encode(text);
}

function concatBytes(chunks) {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  chunks.forEach((chunk) => {
    output.set(chunk, offset);
    offset += chunk.length;
  });
  return output;
}

function jpegDimensions(buffer) {
  const data = new Uint8Array(buffer);
  let offset = 2;

  while (offset < data.length) {
    if (data[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = data[offset + 1];
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      return {
        height: (data[offset + 5] << 8) + data[offset + 6],
        width: (data[offset + 7] << 8) + data[offset + 8],
      };
    }

    if (marker === 0xd8 || marker === 0xd9) {
      offset += 2;
      continue;
    }

    const length = (data[offset + 2] << 8) + data[offset + 3];
    offset += 2 + length;
  }

  return { width: 1, height: 1 };
}

function approxWidth(text, size, bold = false) {
  return String(text ?? '').length * size * (bold ? 0.55 : 0.5);
}

function textCommand(text, x, y, size = 8, bold = false, align = 'left') {
  const value = String(text ?? '');
  let px = x;

  if (align === 'center') px -= approxWidth(value, size, bold) / 2;
  if (align === 'right') px -= approxWidth(value, size, bold);

  return 'BT /' + (bold ? 'F2' : 'F1') + ' ' + size + ' Tf ' + px.toFixed(2) + ' ' + y.toFixed(2) + ' Td (' + latinPdfText(value) + ') Tj ET\n';
}

function lineCommand(x1, y1, x2, y2, gray = 0.8, width = 0.5) {
  return gray + ' G ' + width + ' w ' + x1.toFixed(2) + ' ' + y1.toFixed(2) + ' m ' + x2.toFixed(2) + ' ' + y2.toFixed(2) + ' l S\n';
}

function rectCommand(x, y, w, h, fill = null, border = 0.85) {
  let command = '';
  if (fill !== null) command += fill + ' g ';
  command += border + ' G ' + x.toFixed(2) + ' ' + y.toFixed(2) + ' ' + w.toFixed(2) + ' ' + h.toFixed(2) + ' re ' + (fill !== null ? 'B' : 'S') + '\n';
  return command;
}

function wrapText(text, width, size) {
  const value = String(text ?? '');
  const maxChars = Math.max(4, Math.floor(width / (size * 0.5)));
  if (value.length <= maxChars) return [value];

  const words = value.split(/\s+/);
  const lines = [];
  let current = '';

  words.forEach((word) => {
    const candidate = current ? current + ' ' + word : word;
    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word.length > maxChars ? word.slice(0, maxChars - 1) + '…' : word;
    }
  });

  if (current) lines.push(current);
  return lines.slice(0, 2);
}

function columnWidths(columns, rows, availableWidth) {
  const weights = columns.map((column) => {
    const samples = [column.label].concat(rows.slice(0, 30).map((row) => {
      const value = typeof column.value === 'function' ? column.value(row) : row?.[column.value];
      return String(value ?? '');
    }));

    const longest = Math.max.apply(null, samples.map((value) => value.length).concat([6]));
    return Math.min(Math.max(longest, 7), 26);
  });

  const total = weights.reduce((a, b) => a + b, 0);
  return weights.map((weight) => (weight / total) * availableWidth);
}

function slug(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function fileName(title, filters = {}) {
  const from = filters.desde || filters.vence_desde || '';
  const to = filters.hasta || filters.vence_hasta || '';
  const format = (value) => value ? value.split('-').reverse().join('-') : '';

  if (from && to) {
    return 'revive-' + slug(title) + '-' + format(from) + '-a-' + format(to) + '.pdf';
  }

  return 'revive-' + slug(title) + '.pdf';
}

export async function generarPdfReporte({
  titulo,
  filtros,
  columnas,
  filas,
  usuario,
  generadoEl,
  periodo,
  sedes,
  logoUrl,
  filtrosAdicionales = [],
  filaTotal = null,
}) {
  const logoResponse = await fetch(logoUrl);
  if (!logoResponse.ok) throw new Error('No se pudo cargar el logo de Revive.');

  const logoBuffer = await logoResponse.arrayBuffer();
  const logoBytes = new Uint8Array(logoBuffer);
  const logoSize = jpegDimensions(logoBuffer);

  const pageWidth = PAGE.width;
  const pageHeight = PAGE.height;
  const availableWidth = pageWidth - (MARGIN_X * 2);
  const widths = columnWidths(columnas, filas, availableWidth);
  const bodyFont = columnas.length >= 14 ? 5.3 : columnas.length >= 10 ? 6 : 7;
  const headerFont = columnas.length >= 14 ? 5.2 : columnas.length >= 10 ? 5.8 : 6.5;
  const padding = 3;
  const tableHeaderHeight = 20;

  const pages = [];
  let page = { commands: '' };
  let y = pageHeight - TOP;

  const drawDocumentHeader = () => {
    let command = '';
    const logoW = 48;
    const rawLogoH = logoW * (logoSize.height / logoSize.width);
    const logoH = Math.min(rawLogoH, 36);
    const logoY = pageHeight - TOP - logoH;

    command += 'q ' + logoW.toFixed(2) + ' 0 0 ' + logoH.toFixed(2) + ' ' + MARGIN_X.toFixed(2) + ' ' + logoY.toFixed(2) + ' cm /Im1 Do Q\n';

    const centerX = pageWidth / 2;
    command += textCommand('Centro de Entrenamiento Físico Revive', centerX, pageHeight - TOP + 2, 10.5, true, 'center');
    command += textCommand('Reporte de ' + titulo, centerX, pageHeight - TOP - 14, 14, true, 'center');

    const meta = 'Generado por: ' + (usuario?.name || 'Usuario') + '   ·   Rol: ' + (usuario?.rol_nombre || 'Sin rol') + '   ·   Período: ' + periodo + '   ·   Sedes: ' + sedes;
    command += textCommand(meta, centerX, pageHeight - TOP - 28, 6.5, false, 'center');

    command += '0.96 0.77 0 rg ' + MARGIN_X.toFixed(2) + ' ' + (pageHeight - TOP - 38).toFixed(2) + ' ' + availableWidth.toFixed(2) + ' 2 re f\n';

    let tableY = pageHeight - TOP - 48;
    if (filtrosAdicionales.length) {
      const filterText = filtrosAdicionales.map(([key, value]) => key + ': ' + value).join('   ·   ');
      command += textCommand(filterText, MARGIN_X, tableY, 6.3, false, 'left');
      tableY -= 11;
    }

    return { command, tableY: tableY - 3 };
  };

  const drawTableHeader = (topY) => {
    let command = '';
    let x = MARGIN_X;

    columnas.forEach((column, index) => {
      const w = widths[index];
      command += '0.18 g 0.18 G ' + x.toFixed(2) + ' ' + (topY - tableHeaderHeight).toFixed(2) + ' ' + w.toFixed(2) + ' ' + tableHeaderHeight.toFixed(2) + ' re B\n';

      const align = column.align === 'left' ? 'left' : 'center';
      const tx = align === 'left' ? x + padding : x + (w / 2);
      command += '1 g ' + textCommand(column.label, tx, topY - 13, headerFont, true, align) + '0 g ';
      x += w;
    });

    return { command, nextY: topY - tableHeaderHeight };
  };

  const startPage = () => {
    page = { commands: '' };
    const header = drawDocumentHeader();
    page.commands += header.command;
    const tableHeader = drawTableHeader(header.tableY);
    page.commands += tableHeader.command;
    y = tableHeader.nextY;
  };

  startPage();

  filas.forEach((row, rowIndex) => {
    const values = columnas.map((column) => (
      typeof column.value === 'function' ? column.value(row) : row?.[column.value]
    ));

    const wrapped = values.map((value, index) => wrapText(value, widths[index] - (padding * 2), bodyFont));
    const maxLines = Math.max.apply(null, wrapped.map((lines) => lines.length).concat([1]));
    const rowHeight = Math.max(17, 8 + (maxLines * (bodyFont + 2)));

    if (y - rowHeight < TABLE_BOTTOM) {
      pages.push(page);
      startPage();
    }

    let x = MARGIN_X;
    const fill = rowIndex % 2 === 1 ? 0.97 : 1;

    columnas.forEach((column, index) => {
      const w = widths[index];
      page.commands += rectCommand(x, y - rowHeight, w, rowHeight, fill, 0.86);
      page.commands += '0 g 0 G ';

      const align = column.align === 'left' ? 'left' : 'center';
      wrapped[index].forEach((text, lineIndex) => {
        const tx = align === 'left' ? x + padding : x + (w / 2);
        const ty = y - 10 - (lineIndex * (bodyFont + 2));
        page.commands += textCommand(text, tx, ty, bodyFont, false, align);
      });

      x += w;
    });

    y -= rowHeight;
  });

  if (!filas.length) {
    page.commands += '0 g 0 G ';
    page.commands += textCommand('Sin registros para los filtros seleccionados.', pageWidth / 2, y - 24, 9, false, 'center');
  }

  if (filaTotal && filas.length) {
    const totalHeight = 19;

    if (y - totalHeight < TABLE_BOTTOM) {
      pages.push(page);
      startPage();
    }

    let x = MARGIN_X;
    page.commands += '0.94 g 0 G ';

    columnas.forEach((column, index) => {
      const w = widths[index];
      page.commands += rectCommand(x, y - totalHeight, w, totalHeight, 0.94, 0.65);
      page.commands += '0 g 0 G ';

      const value = typeof filaTotal[index] === 'function'
        ? filaTotal[index](filas)
        : (filaTotal[index] ?? '');

      const align = column.align === 'left' ? 'left' : 'center';
      const tx = align === 'left' ? x + padding : x + (w / 2);
      page.commands += textCommand(value, tx, y - 12, bodyFont, true, align);
      x += w;
    });

    y -= totalHeight;
  }

  pages.push(page);

  pages.forEach((currentPage, index) => {
    const number = index + 1;
    const total = pages.length;
    currentPage.commands += lineCommand(MARGIN_X, 29, pageWidth - MARGIN_X, 29, 0.8, 0.4);
    currentPage.commands += textCommand('Revive · Sistema de Gestión', MARGIN_X, FOOTER_Y, 6.5, false, 'left');
    currentPage.commands += textCommand('Generado: ' + generadoEl, pageWidth / 2, FOOTER_Y, 6.5, false, 'center');
    currentPage.commands += textCommand('Página ' + number + '-' + total, pageWidth - MARGIN_X, FOOTER_Y, 6.5, false, 'right');
  });

  const objects = [];
  const addObject = (content) => {
    objects.push(content);
    return objects.length;
  };

  const regularFontId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  const boldFontId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');

  const imageId = addObject({
    binary: true,
    header: '<< /Type /XObject /Subtype /Image /Width ' + logoSize.width + ' /Height ' + logoSize.height + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + logoBytes.length + ' >>\nstream\n',
    data: logoBytes,
    footer: '\nendstream',
  });

  const pagesId = objects.length + 1;
  objects.push(null);

  const pageIds = [];
  pages.forEach((currentPage) => {
    const contentBytes = bytes(currentPage.commands);
    const contentId = addObject({
      binary: true,
      header: '<< /Length ' + contentBytes.length + ' >>\nstream\n',
      data: contentBytes,
      footer: '\nendstream',
    });

    const pageId = addObject('<< /Type /Page /Parent ' + pagesId + ' 0 R /MediaBox [0 0 ' + pageWidth + ' ' + pageHeight + '] /Resources << /Font << /F1 ' + regularFontId + ' 0 R /F2 ' + boldFontId + ' 0 R >> /XObject << /Im1 ' + imageId + ' 0 R >> >> /Contents ' + contentId + ' 0 R >>');
    pageIds.push(pageId);
  });

  objects[pagesId - 1] = '<< /Type /Pages /Kids [' + pageIds.map((id) => id + ' 0 R').join(' ') + '] /Count ' + pageIds.length + ' >>';

  const catalogId = addObject('<< /Type /Catalog /Pages ' + pagesId + ' 0 R /PageLayout /OneColumn >>');
  const infoId = addObject('<< /Title (' + latinPdfText('Revive · ' + titulo) + ') /Author (' + latinPdfText(usuario?.name || 'Revive') + ') /Creator (Revive Sistema de Gestión) /Producer (Revive) >>');

  const chunks = [bytes('%PDF-1.4\n%REVIVE\n')];
  const offsets = [0];
  let position = chunks[0].length;

  objects.forEach((object, index) => {
    offsets[index + 1] = position;
    const objectStart = bytes(String(index + 1) + ' 0 obj\n');
    chunks.push(objectStart);
    position += objectStart.length;

    if (object?.binary) {
      const headerBytes = bytes(object.header);
      const footerBytes = bytes(object.footer);
      chunks.push(headerBytes, object.data, footerBytes);
      position += headerBytes.length + object.data.length + footerBytes.length;
    } else {
      const bodyBytes = bytes(String(object));
      chunks.push(bodyBytes);
      position += bodyBytes.length;
    }

    const objectEnd = bytes('\nendobj\n');
    chunks.push(objectEnd);
    position += objectEnd.length;
  });

  const xrefPosition = position;
  let xref = 'xref\n0 ' + (objects.length + 1) + '\n0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i += 1) {
    xref += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
  }

  xref += 'trailer\n<< /Size ' + (objects.length + 1) + ' /Root ' + catalogId + ' 0 R /Info ' + infoId + ' 0 R >>\nstartxref\n' + xrefPosition + '\n%%EOF';
  chunks.push(bytes(xref));

  return {
    bytes: concatBytes(chunks),
    nombre: fileName(titulo, filtros),
  };
}
