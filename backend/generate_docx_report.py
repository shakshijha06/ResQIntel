import os
import re
import zipfile
import html
from datetime import datetime

def escape_xml(text):
    return html.escape(text)

def create_docx_from_markdown(md_path, docx_path):
    with open(md_path, "r", encoding="utf-8") as f:
        md_text = f.read()

    lines = md_text.splitlines()

    # XML Body parts
    body_elements = []

    def make_p(run_texts, style=None, align=None):
        p_props = []
        if style:
            p_props.append(f'<w:pStyle w:val="{style}"/>')
        if align:
            p_props.append(f'<w:jc w:val="{align}"/>')
        p_props_xml = f"<w:pPr>{''.join(p_props)}</w:pPr>" if p_props else ""

        runs_xml = []
        for text, is_bold, is_italic, is_code in run_texts:
            r_props = []
            if is_bold:
                r_props.append("<w:b/>")
            if is_italic:
                r_props.append("<w:i/>")
            if is_code:
                r_props.append('<w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/><w:color w:val="2563EB"/>')
            r_props_xml = f"<w:rPr>{''.join(r_props)}</w:rPr>" if r_props else ""
            escaped = escape_xml(text)
            runs_xml.append(f'<w:r>{r_props_xml}<w:t xml:space="preserve">{escaped}</w:t></w:r>')

        return f"<w:p>{p_props_xml}{''.join(runs_xml)}</w:p>"

    def parse_inline(line):
        tokens = []
        # pattern for bold, italic, code
        # simplified tokenizer for bold **text**, code `text`, italic *text*
        pos = 0
        pattern = re.compile(r'(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)')
        matches = list(pattern.finditer(line))
        if not matches:
            return [(line, False, False, False)]

        last_end = 0
        for m in matches:
            start, end = m.span()
            if start > last_end:
                tokens.append((line[last_end:start], False, False, False))
            match_str = m.group(0)
            if match_str.startswith("**") and match_str.endswith("**"):
                tokens.append((match_str[2:-2], True, False, False))
            elif match_str.startswith("`") and match_str.endswith("`"):
                tokens.append((match_str[1:-1], False, False, True))
            elif match_str.startswith("*") and match_str.endswith("*"):
                tokens.append((match_str[1:-1], False, True, False))
            last_end = end
        if last_end < len(line):
            tokens.append((line[last_end:], False, False, False))
        return tokens

    in_code_block = False
    code_block_lines = []
    in_table = False
    table_rows = []

    def flush_table():
        nonlocal table_rows, body_elements
        if not table_rows:
            return
        tbl_xml = [
            '<w:tbl>',
            '<w:tblPr>',
            '<w:tblW w:w="0" w:type="auto"/>',
            '<w:tblBorders>',
            '<w:top w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>',
            '<w:left w:val="none"/>',
            '<w:bottom w:val="single" w:sz="6" w:space="0" w:color="94A3B8"/>',
            '<w:right w:val="none"/>',
            '<w:insideH w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>',
            '<w:insideV w:val="none"/>',
            '</w:tblBorders>',
            '<w:tblCellMar><w:top w:w="120" w:type="dxa"/><w:bottom w:w="120" w:type="dxa"/><w:left w:w="160" w:type="dxa"/><w:right w:w="160" w:type="dxa"/></w:tblCellMar>',
            '</w:tblPr>'
        ]

        is_header = True
        for row in table_rows:
            tbl_xml.append('<w:tr>')
            for cell_text in row:
                shd = '<w:shd w:val="clear" w:color="auto" w:fill="F1F5F9"/>' if is_header else ''
                tbl_xml.append(f'<w:tc><w:tcPr>{shd}<w:tcMar><w:top w:w="120" w:type="dxa"/><w:bottom w:w="120" w:type="dxa"/></w:tcMar></w:tcPr>')
                parsed_runs = parse_inline(cell_text.strip())
                if is_header:
                    parsed_runs = [(t, True, it, c) for t, b, it, c in parsed_runs]
                tbl_xml.append(make_p(parsed_runs, style="TableBody"))
                tbl_xml.append('</w:tc>')
            tbl_xml.append('</w:tr>')
            is_header = False

        tbl_xml.append('</w:tbl>')
        body_elements.append(''.join(tbl_xml))
        table_rows = []

    for line in lines:
        stripped = line.strip()

        # Handle code blocks
        if stripped.startswith("```"):
            if in_code_block:
                in_code_block = False
                # emit code block paragraphs
                for c_line in code_block_lines:
                    p = make_p([(c_line, False, False, True)], style="CodeBlock")
                    body_elements.append(p)
                code_block_lines = []
            else:
                if in_table:
                    flush_table()
                    in_table = False
                in_code_block = True
            continue

        if in_code_block:
            code_block_lines.append(line)
            continue

        # Handle tables
        if stripped.startswith("|") and stripped.endswith("|"):
            cells = [c for c in stripped.split("|")[1:-1]]
            # check if it's separator row | :--- | :--- |
            if all(re.match(r'^[\s\:\-]+$', c) for c in cells):
                continue
            table_rows.append(cells)
            in_table = True
            continue
        else:
            if in_table:
                flush_table()
                in_table = False

        if not stripped:
            body_elements.append('<w:p/>')
            continue

        # Horizontal rule / page break
        if stripped == "---":
            body_elements.append('<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="CBD5E1"/></w:pBdr></w:pPr></w:p>')
            continue

        # Headings
        if stripped.startswith("# "):
            title_text = stripped[2:].strip()
            body_elements.append(make_p([(title_text, True, False, False)], style="Heading1"))
            continue
        elif stripped.startswith("## "):
            title_text = stripped[3:].strip()
            body_elements.append(make_p([(title_text, True, False, False)], style="Heading2"))
            continue
        elif stripped.startswith("### "):
            title_text = stripped[4:].strip()
            body_elements.append(make_p([(title_text, True, False, False)], style="Heading3"))
            continue
        elif stripped.startswith("#### "):
            title_text = stripped[5:].strip()
            body_elements.append(make_p([(title_text, True, False, False)], style="Heading4"))
            continue

        # Unordered list
        if stripped.startswith("- ") or stripped.startswith("* "):
            content = stripped[2:].strip()
            tokens = parse_inline(content)
            body_elements.append(make_p([("•   ", True, False, False)] + tokens, style="ListBullet"))
            continue

        # Numbered list
        m_num = re.match(r'^(\d+)\.\s+(.*)', stripped)
        if m_num:
            num = m_num.group(1)
            content = m_num.group(2)
            tokens = parse_inline(content)
            body_elements.append(make_p([(f"{num}.  ", True, False, False)] + tokens, style="ListNumber"))
            continue

        # Normal paragraph
        tokens = parse_inline(stripped)
        body_elements.append(make_p(tokens, style="Normal"))

    if in_table:
        flush_table()

    # Assemble document.xml
    body_content = "".join(body_elements)
    document_xml = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    {body_content}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>'''

    # styles.xml
    styles_xml = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>
        <w:sz w:val="24"/>
        <w:szCs w:val="24"/>
        <w:color w:val="1E293B"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:line="276" w:lineRule="auto" w:after="160"/>
      </w:pPr>
    </w:pPrDefault>
  </w:docDefaults>

  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
  </w:style>

  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:pPr>
      <w:spacing w:before="360" w:after="180"/>
      <w:jc w:val="center"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>
      <w:b/>
      <w:sz w:val="32"/>
      <w:color w:val="0F172A"/>
    </w:rPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:pPr>
      <w:spacing w:before="280" w:after="140"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>
      <w:b/>
      <w:sz w:val="28"/>
      <w:color w:val="1E3A8A"/>
    </w:rPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="Heading3">
    <w:name w:val="heading 3"/>
    <w:pPr>
      <w:spacing w:before="200" w:after="100"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>
      <w:b/>
      <w:sz w:val="24"/>
      <w:color w:val="2563EB"/>
    </w:rPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="Heading4">
    <w:name w:val="heading 4"/>
    <w:pPr>
      <w:spacing w:before="140" w:after="80"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>
      <w:b/>
      <w:i/>
      <w:sz w:val="22"/>
      <w:color w:val="475569"/>
    </w:rPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="ListBullet">
    <w:name w:val="List Bullet"/>
    <w:pPr>
      <w:ind w:left="360" w:hanging="240"/>
      <w:spacing w:after="80"/>
    </w:pPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="ListNumber">
    <w:name w:val="List Number"/>
    <w:pPr>
      <w:ind w:left="360" w:hanging="240"/>
      <w:spacing w:after="80"/>
    </w:pPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="CodeBlock">
    <w:name w:val="Code Block"/>
    <w:pPr>
      <w:shd w:val="clear" w:color="auto" w:fill="F8FAFC"/>
      <w:spacing w:line="220" w:lineRule="auto" w:after="40"/>
      <w:ind w:left="240" w:right="240"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/>
      <w:sz w:val="20"/>
      <w:color w:val="0F172A"/>
    </w:rPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="TableBody">
    <w:name w:val="Table Body"/>
    <w:pPr>
      <w:spacing w:line="220" w:after="40"/>
    </w:pPr>
    <w:rPr>
      <w:sz w:val="20"/>
    </w:rPr>
  </w:style>
</w:styles>'''

    # [Content_Types].xml
    content_types_xml = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>'''

    # _rels/.rels
    root_rels_xml = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>'''

    # word/_rels/document.xml.rels
    doc_rels_xml = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>'''

    # docProps/core.xml
    now_iso = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    core_props_xml = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
                   xmlns:dc="http://purl.org/dc/elements/1.1/"
                   xmlns:dcterms="http://purl.org/dc/terms/"
                   xmlns:dcmitype="http://purl.org/dc/dcmitype/"
                   xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>ResQIntel Project Report</dc:title>
  <dc:subject>B.Tech Computer Science and Engineering Major Project Report</dc:subject>
  <dc:creator>UEM Kolkata B.Tech CSE Project Team</dc:creator>
  <cp:keywords>Civic Reporting; Smart Cities; TomTom Maps; FastAPI; React 19</cp:keywords>
  <dc:description>Academic Project Report for ResQIntel Civic Issue Reporting and Incident Management Platform</dc:description>
  <dcterms:created xsi:type="dcterms:W3CDTF">{now_iso}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">{now_iso}</dcterms:modified>
</cp:coreProperties>'''

    # docProps/app.xml
    app_props_xml = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">
  <Application>Microsoft Word</Application>
  <DocSecurity>0</DocSecurity>
  <ScaleCrop>false</ScaleCrop>
  <HeadingPairs><vt:vector size="2" baseType="variant" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><vt:variant><vt:lpstr>Title</vt:lpstr></vt:variant><vt:variant><vt:i4>1</vt:i4></vt:variant></vt:vector></HeadingPairs>
  <TitlesOfParts><vt:vector size="1" baseType="lpstr" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><vt:lpstr>ResQIntel Academic Project Report</vt:lpstr></vt:vector></TitlesOfParts>
  <Company>University of Engineering &amp; Management (UEM), Kolkata</Company>
</Properties>'''

    with zipfile.ZipFile(docx_path, "w", zipfile.ZIP_DEFLATED) as docx:
        docx.writestr("[Content_Types].xml", content_types_xml)
        docx.writestr("_rels/.rels", root_rels_xml)
        docx.writestr("word/_rels/document.xml.rels", doc_rels_xml)
        docx.writestr("word/document.xml", document_xml)
        docx.writestr("word/styles.xml", styles_xml)
        docx.writestr("docProps/core.xml", core_props_xml)
        docx.writestr("docProps/app.xml", app_props_xml)

    print(f"Successfully generated DOCX report at: {docx_path}")

if __name__ == "__main__":
    md_file = os.path.join(os.path.dirname(__file__), "..", "PROJECT_REPORT.md")
    docx_file = os.path.join(os.path.dirname(__file__), "..", "PROJECT_REPORT.docx")
    create_docx_from_markdown(md_file, docx_file)
