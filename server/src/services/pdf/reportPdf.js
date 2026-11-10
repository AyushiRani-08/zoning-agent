const PDFDocument = require('pdfkit');

/**
 * Maps verdict strings to display labels and color styling.
 */
function getVerdictStyle(verdict) {
  switch (verdict) {
    case 'feasible':
      return {
        label: 'PERMITTED & FEASIBLE',
        badgeBg: '#dcfce7', // green-100
        badgeBorder: '#16a34a', // green-600
        textColor: '#15803d', // green-700
        subtext: 'The proposed use and footprint fully satisfy statutory zoning bylaws and setbacks.',
      };
    case 'conditionally_feasible':
      return {
        label: 'CONDITIONALLY FEASIBLE',
        badgeBg: '#fef3c7', // amber-100
        badgeBorder: '#d97706', // amber-600
        textColor: '#b45309', // amber-700
        subtext: 'Permitted subject to special municipal clearances, LPA approvals, or conditional compliance.',
      };
    case 'not_feasible':
      return {
        label: 'NOT FEASIBLE / PROHIBITED',
        badgeBg: '#fee2e2', // red-100
        badgeBorder: '#dc2626', // red-600
        textColor: '#b91c1c', // red-700
        subtext: 'Use is prohibited in this zone, or site dimensions cannot accommodate minimum setbacks.',
      };
    default:
      return {
        label: 'CANNOT ASSESS',
        badgeBg: '#f3f4f6', // gray-100
        badgeBorder: '#6b7280', // gray-500
        textColor: '#374151', // gray-700
        subtext: 'Plot is outside mapped coverage or necessary zoning parameters are unavailable.',
      };
  }
}

/**
 * Draws an auto-scaled vector schematic of the plot and buildable footprint.
 */
function drawSitePlan(doc, boxX, boxY, boxW, boxH, plot, buildableFootprint, frontEdgeIndex) {
  // Draw background frame
  doc.save();
  doc.roundedRect(boxX, boxY, boxW, boxH, 6).fillAndStroke('#f8fafc', '#cbd5e1');

  // Title
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#475569')
     .text('SITE PLAN & SETBACKS (AUTO-PROJECTED)', boxX + 10, boxY + 8, { width: boxW - 40 });

  // North arrow symbol
  const naX = boxX + boxW - 20;
  const naY = boxY + 14;
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#1e293b').text('N', naX - 3, naY - 8);
  doc.strokeColor('#1e293b').lineWidth(1.2)
     .moveTo(naX, naY).lineTo(naX, naY + 10).stroke()
     .moveTo(naX, naY).lineTo(naX - 3, naY + 4).stroke()
     .moveTo(naX, naY).lineTo(naX + 3, naY + 4).stroke();

  const ring = plot && plot.coordinates && plot.coordinates[0];
  if (!ring || ring.length < 3) {
    doc.restore();
    return;
  }

  const lats = ring.map(p => p[1]);
  const lngs = ring.map(p => p[0]);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);

  const midLat = (minLat + maxLat) / 2;
  const latRad = (midLat * Math.PI) / 180;
  const cosLat = Math.cos(latRad);

  const dLng = Math.max((maxLng - minLng) * cosLat, 0.000001);
  const dLat = Math.max(maxLat - minLat, 0.000001);

  const padding = 18;
  const availW = boxW - padding * 2;
  const availH = boxH - padding * 2 - 20;

  const scale = Math.min(availW / dLng, availH / dLat);
  const actualW = dLng * scale;
  const actualH = dLat * scale;

  const offsetX = boxX + padding + (availW - actualW) / 2;
  const offsetY = boxY + 22 + (availH - actualH) / 2;

  function project([lng, lat]) {
    const px = offsetX + (lng - minLng) * cosLat * scale;
    const py = offsetY + (maxLat - lat) * scale;
    return [px, py];
  }

  // 1. Plot boundary polygon
  const plotPoints = ring.map(project);
  doc.polygon(...plotPoints).lineWidth(1.5).fillAndStroke('#eff6ff', '#2563eb');

  // 2. Front edge highlight
  if (typeof frontEdgeIndex === 'number' && frontEdgeIndex >= 0 && frontEdgeIndex < ring.length - 1) {
    const p1 = project(ring[frontEdgeIndex]);
    const p2 = project(ring[frontEdgeIndex + 1]);
    doc.strokeColor('#ea580c').lineWidth(3.5).moveTo(p1[0], p1[1]).lineTo(p2[0], p2[1]).stroke();
  }

  // 3. Buildable footprint polygon (if available)
  const fpRing = buildableFootprint && buildableFootprint.coordinates && buildableFootprint.coordinates[0];
  if (fpRing && fpRing.length >= 3) {
    const fpPoints = fpRing.map(project);
    doc.polygon(...fpPoints).lineWidth(1.2).fillAndStroke('#dcfce7', '#16a34a');
  }

  // 4. Legend at the bottom of the card
  const legY = boxY + boxH - 13;
  doc.font('Helvetica').fontSize(6.5);

  // Legend: Plot
  doc.rect(boxX + 8, legY, 7, 5).fillAndStroke('#eff6ff', '#2563eb');
  doc.fillColor('#334155').text('Plot', boxX + 18, legY - 1);

  // Legend: Buildable
  doc.rect(boxX + 68, legY, 7, 5).fillAndStroke('#dcfce7', '#16a34a');
  doc.fillColor('#334155').text('Buildable', boxX + 78, legY - 1);

  // Legend: Frontage
  doc.strokeColor('#ea580c').lineWidth(2).moveTo(boxX + 145, legY + 2.5).lineTo(boxX + 155, legY + 2.5).stroke();
  doc.fillColor('#334155').text('Front Edge', boxX + 159, legY - 1);

  doc.restore();
}

/**
 * Generates a PDF stream for a feasibility assessment.
 *
 * @param {Object} report - Feasibility study report or result object
 * @param {Object} [user] - Optional user profile (name, email)
 * @param {WritableStream} outputStream - Output stream (e.g., Express res)
 * @returns {Promise<void>}
 */
function generateFeasibilityPdf(report, user, outputStream) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
      info: {
        Title: `Zoning Feasibility Report - ${report._id || 'Assessment'}`,
        Author: 'Municipal Zoning Feasibility Agent',
        Subject: 'Statutory Zoning and Building Feasibility Study',
      },
    });

    outputStream.on('finish', resolve);
    outputStream.on('error', reject);
    doc.on('error', reject);

    doc.pipe(outputStream);

    const pageWidth = doc.page.width - 80; // 595.28 - 80 = 515.28
    const startX = 40;
    let y = 40;

    // --- 1. HEADER ---
    doc.save();
    doc.rect(startX, y, pageWidth, 55).fill('#0f172a'); // Dark slate header banner

    doc.font('Helvetica-Bold').fontSize(14).fillColor('#ffffff')
       .text('MUNICIPAL ZONING FEASIBILITY REPORT', startX + 14, y + 12);
    doc.font('Helvetica').fontSize(9).fillColor('#94a3b8')
       .text('Statutory Land Use, Setbacks & Development Envelope Assessment', startX + 14, y + 32);

    const dateStr = report.createdAt
      ? new Date(report.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
      : new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });

    const refId = report._id ? String(report._id).slice(-8).toUpperCase() : 'PREVIEW';
    doc.font('Helvetica').fontSize(8).fillColor('#cbd5e1')
       .text(`REF: #${refId}`, startX + pageWidth - 140, y + 14, { width: 126, align: 'right' });
    doc.text(`Date: ${dateStr}`, startX + pageWidth - 140, y + 30, { width: 126, align: 'right' });
    doc.restore();

    y += 65;

    // --- 2. VERDICT BANNER ---
    const verdictStyle = getVerdictStyle(report.verdict);
    doc.save();
    doc.roundedRect(startX, y, pageWidth, 42, 5).fillAndStroke(verdictStyle.badgeBg, verdictStyle.badgeBorder);
    doc.font('Helvetica-Bold').fontSize(13).fillColor(verdictStyle.textColor)
       .text(verdictStyle.label, startX + 14, y + 10);
    doc.font('Helvetica').fontSize(8.5).fillColor('#374151')
       .text(verdictStyle.subtext, startX + 14, y + 26);
    doc.restore();

    y += 50;

    // --- 3. TWO-COLUMN: STUDY DETAILS & VECTOR SITE PLAN ---
    const colWidth = (pageWidth - 12) / 2; // ~251 pt each

    // Left Box: Metadata Details
    doc.save();
    doc.roundedRect(startX, y, colWidth, 125, 5).fillAndStroke('#f8fafc', '#e2e8f0');
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#1e293b')
       .text('ASSESSMENT PARAMETERS', startX + 10, y + 8);

    const details = [
      ['Intended Use:', (report.intendedUse || 'N/A').toUpperCase()],
      ['Zone Assigned:', `${report.zoneCode || 'IND-1'} (${report.zoneName || 'Industrial Belt'})`],
      ['Frontage Edge:', report.frontEdgeIndex !== null && report.frontEdgeIndex !== undefined ? `Edge #${report.frontEdgeIndex}` : 'Uniform (Fallback)'],
      ['Applicant / User:', user && user.name ? `${user.name} (${user.email})` : 'Registered Client'],
      ['Bylaw Source:', report.rulesSource || 'TNCDBR 2019 (Rule 36)'],
    ];

    let rowY = y + 25;
    for (const [k, v] of details) {
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#64748b').text(k, startX + 10, rowY, { width: 85 });
      doc.font('Helvetica').fontSize(8).fillColor('#0f172a').text(v, startX + 98, rowY, { width: colWidth - 105 });
      rowY += 19;
    }
    doc.restore();

    // Right Box: Vector Site Plan Schematic
    drawSitePlan(doc, startX + colWidth + 12, y, colWidth, 125, report.plot, report.buildableFootprint, report.frontEdgeIndex);

    y += 135;

    // --- 4. QUANTITATIVE METRICS TABLE ---
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#0f172a').text('DEVELOPMENT CONTROL ENVELOPE', startX, y);
    y += 16;

    // Table Header
    doc.save();
    doc.rect(startX, y, pageWidth, 20).fill('#e2e8f0');
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#334155');
    doc.text('METRIC / PARAMETER', startX + 10, y + 6);
    doc.text('STATUTORY LIMIT / MULTIPLIER', startX + 210, y + 6);
    doc.text('COMPUTED FEASIBLE VALUE', startX + 370, y + 6, { align: 'right', width: pageWidth - 380 });
    doc.restore();

    y += 20;

    const plotArea = report.plotAreaSqM ? `${Math.round(report.plotAreaSqM).toLocaleString()} m² (${Math.round(report.plotAreaSqM * 10.7639).toLocaleString()} sq.ft)` : 'N/A';
    const maxFootprint = report.maxFootprintSqM ? `${Math.round(report.maxFootprintSqM).toLocaleString()} m²` : 'N/A';
    const buildableFootprint = report.buildableFootprintSqM ? `${Math.round(report.buildableFootprintSqM).toLocaleString()} m² (${Math.round((report.buildableFootprintSqM / (report.plotAreaSqM || 1)) * 100)}% coverage)` : '0 m²';
    const maxFloorArea = report.maxFloorAreaSqM ? `${Math.round(report.maxFloorAreaSqM).toLocaleString()} m²` : 'N/A';
    const floors = report.estimatedFloors ? `${report.estimatedFloors} Floors` : 'N/A';

    const metrics = [
      ['Total Site / Plot Area', 'Survey Area', plotArea],
      ['Ground Coverage Cap', 'Max 75% under Rule 36', maxFootprint],
      ['Clear Buildable Footprint', 'Post-Setbacks Boundary', buildableFootprint],
      ['Max Gross Floor Area (FSI/FAR)', 'FAR 1.50 Multiplier', maxFloorArea],
      ['Estimated Achievable Structure', 'FAR / Buildable Footprint', floors],
    ];

    metrics.forEach(([label, rule, val], idx) => {
      const bg = idx % 2 === 0 ? '#f8fafc' : '#ffffff';
      doc.save();
      doc.rect(startX, y, pageWidth, 19).fill(bg);
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#1e293b').text(label, startX + 10, y + 5);
      doc.font('Helvetica').fontSize(8).fillColor('#64748b').text(rule, startX + 210, y + 5);
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#0f172a').text(val, startX + 370, y + 5, { align: 'right', width: pageWidth - 380 });
      doc.restore();
      y += 19;
    });

    y += 12;

    // --- 5. PER-EDGE SETBACK BREAKDOWN (IF AVAILABLE) ---
    if (Array.isArray(report.edgeBreakdown) && report.edgeBreakdown.length > 0) {
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#0f172a').text('PER-EDGE SETBACK ANALYSIS', startX, y);
      y += 15;

      doc.save();
      doc.rect(startX, y, pageWidth, 18).fill('#e2e8f0');
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#334155');
      doc.text('EDGE #', startX + 10, y + 5);
      doc.text('CLASSIFICATION', startX + 70, y + 5);
      doc.text('SETBACK REQUIRED', startX + 210, y + 5);
      doc.text('EDGE LENGTH', startX + 370, y + 5, { align: 'right', width: pageWidth - 380 });
      doc.restore();

      y += 18;

      report.edgeBreakdown.forEach((e, idx) => {
        const bg = idx % 2 === 0 ? '#f8fafc' : '#ffffff';
        const edgeType = String(e.type || e.classification || 'side').toUpperCase();
        const isFront = edgeType === 'FRONT';
        const lengthStr = typeof e.lengthM === 'number' && e.lengthM > 0 ? `${Math.round(e.lengthM)} m` : '-';

        doc.save();
        doc.rect(startX, y, pageWidth, 17).fill(bg);
        doc.font('Helvetica-Bold').fontSize(8).fillColor(isFront ? '#ea580c' : '#1e293b')
           .text(`Edge #${e.edgeIndex}`, startX + 10, y + 4);
        doc.font('Helvetica').fontSize(8).fillColor('#0f172a')
           .text(edgeType, startX + 70, y + 4);
        doc.font('Helvetica-Bold').fontSize(8).fillColor('#1e293b')
           .text(`${e.setbackM} meters`, startX + 210, y + 4);
        doc.font('Helvetica').fontSize(8).fillColor('#64748b')
           .text(lengthStr, startX + 370, y + 4, { align: 'right', width: pageWidth - 380 });
        doc.restore();
        y += 17;
      });

      y += 12;
    }

    // --- 6. STATUTORY FINDINGS & REASONS ---
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#0f172a').text('STATUTORY FINDINGS & DETERMINATIONS', startX, y);
    y += 15;

    const reasons = Array.isArray(report.reasons) && report.reasons.length > 0
      ? report.reasons
      : ['Assessment conducted in compliance with municipal zoning and planning parameters.'];

    reasons.forEach(r => {
      doc.save();
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#2563eb').text('•', startX + 10, y);
      doc.font('Helvetica').fontSize(8).fillColor('#334155').text(r, startX + 22, y, { width: pageWidth - 35 });
      doc.restore();
      y += 14;
    });

    y += 10;

    // --- 7. LEGAL PROVENANCE & DISCLAIMER FOOTER ---
    const disclaimerY = Math.max(y, 750); // Pin near bottom of A4
    doc.save();
    doc.roundedRect(startX, disclaimerY, pageWidth, 45, 4).fillAndStroke('#f1f5f9', '#cbd5e1');
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#475569')
       .text('LEGAL PROVENANCE & STATUTORY DISCLAIMER', startX + 10, disclaimerY + 6);
    doc.font('Helvetica').fontSize(6.8).fillColor('#64748b')
       .text(
         'Calculated in accordance with Tamil Nadu Combined Development and Building Rules, 2019 (TNCDBR-2019), Rule 36 (Industrial Zone Regulations). This report is an automated pre-feasibility screening tool and does not constitute a sanctioned municipal planning permit or land title clearance. Final development permission is subject to verification, site inspection, and clearance by the relevant Local Planning Authority (LPA) and Municipal Corporation.',
         startX + 10,
         disclaimerY + 17,
         { width: pageWidth - 20, lineGap: 1 }
       );
    doc.restore();

    doc.end();
  });
}

module.exports = { generateFeasibilityPdf, getVerdictStyle };
