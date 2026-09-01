"""
Modular, Multi-Signal PDF Content Extraction Engine
Extracts structured headings, body text, fields, and tables from arbitrary multi-page PDFs
using layout geometry, statistical font distributions, horizontal row-merging, and repeated region detection.
"""

import sys
import os
import json
import argparse
import re
from collections import Counter
from typing import List, Dict, Any, Optional, Tuple

try:
    import pymupdf as fitz
except ImportError:
    try:
        import fitz
    except ImportError:
        raise ImportError("PyMuPDF is required. Please install it with 'pip install pymupdf'")


TABLE_KEYWORDS = {
    "schedule item", "schedule item status", "public access", "item no.",
    "form name", "form number", "form type", "action specific data", "readability score",
    "previous version", "attached document(s)", "creation date",
    "bypassed - item:", "bypass reason:", "attachment(s):", "item status:",
    "status date:", "satisfied - item:", "supporting document (revised)", "form (revised)",
    "date processed", "transaction #", "eft total", "total amount", "payment type",
    "status requests"
}

MAJOR_H1_HEADERS = [
    "Table of Contents",
    "User Usage Agreement",
    "Form Attachments",
    "Supporting Document Attachments",
    "Correspondence Attachments",
    "Correspondence Summary",
    "Filing at a Glance",
    "General Information",
    "Company and Contact",
    "Filing Fees",
    "Rate Information",
    "Disposition Report",
    "Disposition",
    "Objection Letter",
    "Response Letter",
    "Amendment Letter",
    "Note To Reviewer",
    "Note To Filer",
    "Form Schedule",
    "Supporting Document Schedules",
    "Superseded Schedule Items"
]

KNOWN_H2_SUBSECTIONS = [
    "Filing Description",
    "Post Submission Update Details",
    "Introduction",
    "Conclusion",
    "Comments",
    "Changed Items",
    "Response 1",
    "Response 2",
    "Response 3",
    "Response 4",
    "Response 5",
    "Objection 1",
    "Objection 2",
    "Objection 3",
    "Objection 4",
    "Objection 5"
]


# ================= 1. DOCUMENT-LEVEL REPEATED REGION DETECTOR =================

def detect_repeated_regions(doc: fitz.Document) -> set:
    header_footer_counts = Counter()
    total_pages = len(doc)

    for page in doc:
        for b in page.get_text("dict")["blocks"]:
            if "lines" in b:
                for line in b["lines"]:
                    txt = " ".join([s["text"].strip() for s in line["spans"] if s["text"].strip()]).strip()
                    if not txt:
                        continue
                    y0 = line["bbox"][1]
                    y1 = line["bbox"][3]
                    if y0 < 85 or y1 > 720 or (len(b["lines"]) == 1 and line["spans"][0]["size"] <= 8.5):
                        normalized = re.sub(r"\d+", "N", txt.lower())
                        header_footer_counts[normalized] += 1
                        header_footer_counts[txt.lower()] += 1

    threshold = max(2, int(total_pages * 0.15)) if total_pages > 4 else 2
    repeated_signatures = set()
    for sig, count in header_footer_counts.items():
        if count >= threshold:
            repeated_signatures.add(sig)

    return repeated_signatures


def is_watermark_or_running_line(text: str, font_size: float, bbox: List[float], repeated_signatures: set) -> bool:
    clean = text.strip()
    if not clean:
        return True
    if font_size >= 12.0:
        return False
    for h in MAJOR_H1_HEADERS:
        if clean.lower() == h.lower() or clean.lower().startswith(h.lower()):
            return False

    if font_size <= 8.0:
        return True

    clean_low = clean.lower()
    norm_low = re.sub(r"\d+", "N", clean_low)
    
    if clean_low in repeated_signatures or norm_low in repeated_signatures:
        return True

    y0 = bbox[1]
    y1 = bbox[3]
    if (y0 < 75 or y1 > 745) and font_size <= 9.5:
        return True

    return False


# ================= 2. BASELINE FONT STATISTICS =================

def compute_font_statistics(doc: fitz.Document) -> Dict[str, float]:
    sizes = []
    for page in doc[:20]:
        for b in page.get_text("dict")["blocks"]:
            if "lines" in b:
                for l in b["lines"]:
                    for s in l["spans"]:
                        t = s["text"].strip()
                        if len(t) >= 4 and not (s["flags"] & 16):
                            sizes.append(round(s["size"], 1))
    
    if not sizes:
        return {"body_size": 10.0, "h1_min": 13.5, "h2_min": 11.0}
    
    body_size = Counter(sizes).most_common(1)[0][0]
    return {
        "body_size": body_size,
        "h1_min": round(body_size * 1.30, 1),
        "h2_min": round(body_size * 1.08, 1)
    }


# ================= 3. BLOCK EXTRACTION & HORIZONTAL ROW MERGE =================

def extract_merged_block_lines(block: Dict[str, Any], rotation: int = 0) -> Tuple[List[str], float, bool]:
    rows = {}
    max_size = 0.0
    is_bold = False

    for l in block["lines"]:
        for s in l["spans"]:
            txt = s["text"].strip()
            if not txt:
                continue
            if s["size"] > max_size:
                max_size = s["size"]
            if (s["flags"] & 16) or "bold" in s.get("font", "").lower():
                is_bold = True

            if rotation in [90, 270]:
                y = round(s["bbox"][0], 1)
                x = s["bbox"][1]
            else:
                y = round(s["bbox"][1], 1)
                x = s["bbox"][0]

            matched_y = None
            for existing_y in rows:
                if abs(existing_y - y) <= 3.2:
                    matched_y = existing_y
                    break
            if matched_y is None:
                rows[y] = [(x, txt)]
            else:
                rows[matched_y].append((x, txt))

    merged_lines = []
    for y, items in sorted(rows.items()):
        if rotation == 90:
            items = sorted(items, key=lambda it: -it[0])
        else:
            items = sorted(items, key=lambda it: it[0])
        
        # Check if row contains two distinct side-by-side columns (left < 280, right >= 280)
        if rotation == 0:
            left_items = [it for it in items if it[0] < 280]
            right_items = [it for it in items if it[0] >= 280]
            if left_items and right_items:
                left_str = " ".join([it[1] for it in left_items]).strip()
                right_str = " ".join([it[1] for it in right_items]).strip()
                if not left_str.lower().startswith("http") and not right_str.lower().startswith("http") and not any(h in left_str.lower() for h in ["page", "pipeline", "tracking #"]):
                    if left_str:
                        merged_lines.append(left_str)
                    if right_str:
                        merged_lines.append(right_str)
                    continue

            if len(items) == 2:
                left_x, left_txt = items[0]
                right_x, right_txt = items[1]
                if (right_x - left_x) >= 40 and not left_txt.endswith(":") and len(left_txt) <= 28 and not right_txt.startswith(":") and not any(k in left_txt.lower() for k in ["page", "tracking", "pipeline", "dear"]):
                    merged_lines.append(f"{left_txt}: {right_txt}")
                    continue

        row_str = " ".join([item[1] for item in items]).strip()
        if row_str:
            merged_lines.append(row_str)

    return merged_lines, max_size, is_bold


def is_table_grid_cell(text: str, is_landscape: bool) -> bool:
    t = text.strip().lower()
    if t in TABLE_KEYWORDS or any(t.startswith(k) for k in ["company amount", "eft total", "transaction #", "date processed"]):
        return True
    if t.startswith("$") and re.match(r"^\$\d+(\.\d{2})?$", t):
        return True
    if is_landscape and (any(t.startswith(k) for k in ["bypassed", "satisfied", "item", "form", "score", "schedule", "attached"]) or re.match(r"^\d{2}/\d{2}/\d{4}", t)):
        return True
    return False


def is_valid_field_key(k: str, v: str) -> bool:
    k_clean = k.strip()
    v_clean = v.strip()
    if not k_clean or len(k_clean) > 28:
        return False
    # Timestamp guard (e.g. 10:48 AM)
    if re.search(r"\b\d{1,2}:\d{2}\b", k_clean) or re.search(r"^\d{1,2}:\d{2}\s*(?:AM|PM)?$", v_clean):
        return False
    # Narrative words guard (check word boundaries!)
    if re.search(r"\b(?:re|sincerely|dear|mca|failure|supreme\s+court)\b", k_clean.lower()):
        return False
    # Subheading guard
    if k_clean.lower() in ["introduction", "conclusion", "comments", "changed items", "response 1", "response 2"]:
        return False
    return True

def parse_field_pair(line_str: str) -> Tuple[Optional[str], Optional[str]]:
    l_str = line_str.strip()
    if not l_str or l_str.startswith("http"):
        return None, None

    KNOWN_LABELS = [
        "Created By", "Last Edited By", "Submitted On", "Submitted Date", "Subject",
        "Comments", "Company", "Product Name", "State", "TOI", "Sub-TOI", "Filing Type",
        "Date Submitted", "SERFF Tr Num", "SERFF Status", "State Tr Num", "State Status",
        "Co Tr Num", "Author(s)", "Reviewer(s)", "Disposition Date", "Disposition Status",
        "Effective Date", "Project Name", "Project Number", "Requested Filing Mode",
        "Submission Type", "Group Market Type", "Filing Status Changed", "State Status Changed",
        "CoCode", "Group Code", "Group Name", "FEIN Number", "State of Domicile", "Company Type",
        "State ID Number", "Fee Required", "Fee Amount", "Retaliatory", "Fee Explanation",
        "Per Company", "Objection Letter Status", "Objection Letter Date", "Respond By Date",
        "Response Letter Status", "Response Letter Date", "Status of Filing in Domicile",
        "Date Approved in Domicile", "Domicile Status Comments", "Market Type", "Group Market Size",
        "Overall Rate Impact", "Deemer Date", "Submitted By"
    ]

    for label in KNOWN_LABELS:
        pattern = rf"^{re.escape(label)}[:\?]\s*(.*)$"
        m = re.match(pattern, l_str, re.IGNORECASE)
        if m:
            return label, m.group(1).strip()

    if ":" in l_str and not l_str.startswith("1."):
        parts = l_str.split(":", 1)
        k, v = parts[0].strip(), parts[1].strip()
        if not re.search(r"\b\d{1,2}:\d{2}\b", k) and is_valid_field_key(k, v):
            return k, v

    if "?" in l_str:
        m = re.match(r"^([A-Za-z\s]+)\?\s*(.+)$", l_str)
        if m:
            k, v = m.group(1).strip() + "?", m.group(2).strip()
            if is_valid_field_key(k, v):
                return k, v

    return None, None


def is_financial_or_table_line(text: str) -> bool:
    t = text.strip()
    if not t:
        return False
    # Currency values or payment keywords
    if any(k in t for k in ["$", "EFT Total", "Total Amount", "Transaction #", "Payment Type", "Company Amount", "Date Processed"]):
        return True
    # Timestamps with dates
    if re.search(r"^\d{2}/\d{2}/\d{4}\s+\d{1,2}:\d{2}", t):
        return True
    return False


def classify_block(
    first_line: str,
    full_text: str,
    max_size: float,
    is_bold: bool,
    line_count: int,
    bbox: List[float],
    font_stats: Dict[str, float],
    repeated_signatures: set,
    is_landscape_schedule: bool,
    is_inside_table: bool = False
) -> Tuple[str, Optional[str], int]:
    clean_line = first_line.strip()
    if not clean_line:
        return "empty", None, 0

    if is_watermark_or_running_line(full_text, max_size, bbox, repeated_signatures):
        return "running_header_footer", None, 0

    # Table containment guard
    if is_inside_table or is_financial_or_table_line(clean_line) or is_table_grid_cell(clean_line, is_landscape_schedule):
        return "table_data", None, 0

    if is_landscape_schedule and max_size < 13.5:
        return "table_data", None, 0

    # Key-Value Field Check (e.g. Key: Value or Question? Value)
    fk, fv = parse_field_pair(clean_line)
    if fk is not None:
        return "field", None, 0

    # Multi-Signal Dynamic Heading Scoring
    ratio = max_size / font_stats["body_size"] if font_stats["body_size"] > 0 else 1.0
    score = 0.0

    if ratio >= 1.35:
        score += 0.55
    elif ratio >= 1.20:
        score += 0.35
    elif ratio >= 1.05:
        score += 0.15

    if is_bold:
        score += 0.25

    if line_count <= 2:
        score += 0.15
    if len(clean_line) <= 40:
        score += 0.10

    # Weak fallback hints (only boost if not already rejected)
    for h in MAJOR_H1_HEADERS:
        if clean_line.lower() == h.lower() or (clean_line.lower().startswith(h.lower()) and len(clean_line) <= len(h) + 6):
            score += 0.20
            break

    for h in KNOWN_H2_SUBSECTIONS:
        if clean_line.rstrip(":").strip().lower() == h.lower():
            score += 0.15
            break

    # Negative signals that disqualify headings
    if clean_line.endswith((".", ",", ";", "?")):
        score -= 0.40
    if clean_line.endswith(":"):
        score -= 0.30
    if any(c in clean_line for c in ["$", "%", "@"]):
        score -= 0.50
    if re.search(r"\b\d{1,2}:\d{2}\b", clean_line):
        score -= 0.50

    heading_candidate = " ".join([l.strip() for l in full_text.splitlines() if l.strip()]) if line_count <= 2 and len(" ".join(full_text.splitlines())) <= 50 else clean_line

    if (score >= 0.70 or ratio >= 1.35) and len(heading_candidate) <= 50:
        return "heading", heading_candidate, 1
    elif score >= 0.50 or (is_bold and ratio >= 1.05 and len(heading_candidate) <= 45 and line_count <= 2):
        return "heading", heading_candidate, 2

    return "body", None, 0


def classify_section_category(heading_text: str) -> str:
    ht = heading_text.lower()
    if any(k in ht for k in ["company", "contact", "fee"]):
        return "Company & Contact"
    if any(k in ht for k in ["glance", "general", "overview", "table of contents", "summary", "usage"]):
        return "Overview & General"
    if any(k in ht for k in ["rate", "actuarial", "pricing", "premium", "factor"]):
        return "Rates & Actuarial"
    if any(k in ht for k in ["contract", "endorsement", "rider", "schedule", "certificate", "agreement"]) or re.search(r"\bform", ht):
        return "Forms & Contracts"
    if any(k in ht for k in ["support", "attachment", "exhibit", "certification", "readability", "statement"]):
        return "Supporting Documents"
    if any(k in ht for k in ["objection", "response", "correspondence", "disposition", "inquiry", "letter", "note", "amendment", "introduction", "conclusion", "comment"]):
        return "Correspondence & Letters"
    return "General Section"


# ================= 4. DOCUMENT EXTRACTION PIPELINE =================

def extract_page_tables_markdown(page: fitz.Page) -> str:
    try:
        tabs = page.find_tables()
        if not tabs or not tabs.tables:
            return ""
        md_tables = []
        for tab in tabs.tables:
            data = tab.extract()
            if not data or len(data) < 2:
                continue
            header = [str(c).replace("\n", " ").strip() if c else "" for c in data[0]]
            if not any(header):
                continue
            lines = []
            lines.append("| " + " | ".join(header) + " |")
            lines.append("| " + " | ".join(["---"] * len(header)) + " |")
            for row in data[1:]:
                row_cells = [str(c).replace("\n", " ").strip() if c else "" for c in row]
                if any(row_cells):
                    lines.append("| " + " | ".join(row_cells) + " |")
            md_tables.append("\n".join(lines))
        return "\n\n".join(md_tables)
    except Exception:
        return ""


def extract_document_structure(pdf_source: Any, filename: str = "document.pdf") -> Dict[str, Any]:
    if isinstance(pdf_source, (bytes, bytearray)):
        doc = fitz.open(stream=pdf_source, filetype="pdf")
    else:
        doc = fitz.open(pdf_source)
        if not filename:
            filename = os.path.basename(pdf_source)

    total_pages = len(doc)
    repeated_signatures = detect_repeated_regions(doc)
    font_stats = compute_font_statistics(doc)

    doc_metadata = {
        "filename": filename,
        "total_pages": total_pages,
        "serff_tracking_number": None,
        "state": None,
        "company_name": None,
        "product_name": None,
        "disposition_status": None,
        "disposition_date": None,
        "effective_date": None,
        "toi": None,
        "sub_toi": None,
        "filing_type": None,
        "submission_date": None
    }

    # Pass 1: Extract Document Identity Metadata from Clean Non-Watermark Blocks
    for page in doc[:10]:
        for b in page.get_text("dict")["blocks"]:
            if "lines" in b:
                merged_l, max_sz, _ = extract_merged_block_lines(b)
                for txt in merged_l:
                    if is_watermark_or_running_line(txt, max_sz, [round(x, 1) for x in b["bbox"]], repeated_signatures):
                        continue
                    if "SERFF Tracking #:" in txt and not doc_metadata["serff_tracking_number"]:
                        m = re.search(r"SERFF\s+Tracking\s*#:\s*([A-Z0-9\-]+)", txt)
                        if m: doc_metadata["serff_tracking_number"] = m.group(1).strip()
                    if "State:" in txt and not doc_metadata["state"]:
                        m = re.search(r"State:\s*([A-Za-z\s]+?)(?:\s+(?:Filing|Company|TOI)|$)", txt)
                        if m:
                            st = m.group(1).strip()
                            if len(st) < 25 and st.lower() not in ["status", "tracking", "fees"]:
                                doc_metadata["state"] = st
                    if "Filing Company:" in txt and not doc_metadata["company_name"]:
                        m = re.search(r"Filing\s+Company:\s*([^\n]+)", txt)
                        if m and len(m.group(1).strip()) < 60: doc_metadata["company_name"] = m.group(1).strip()
                    if "Product Name:" in txt and not doc_metadata["product_name"]:
                        m = re.search(r"Product\s+Name:\s*([^\n]+)", txt)
                        if m and len(m.group(1).strip()) < 80: doc_metadata["product_name"] = m.group(1).strip()

    sections = []
    current_h1 = None
    current_section = None
    sec_counter = 0
    pending_field_key = None

    for page_idx in range(total_pages):
        page_num = page_idx + 1
        page = doc[page_idx]
        blocks = page.get_text("dict")["blocks"]
        if page.rotation in [90, 270]:
            blocks = sorted(blocks, key=lambda b: (b["bbox"][0], -b["bbox"][1]))
        else:
            blocks = sorted(blocks, key=lambda b: (b["bbox"][1], b["bbox"][0]))

        # Pre-detect tables on this page to guard table text from becoming fake headings
        page_tabs = page.find_tables()
        tab_list = page_tabs.tables if hasattr(page_tabs, "tables") else list(page_tabs)
        tab_bboxes = [t.bbox for t in tab_list]

        # Detect landscape schedule table pages
        is_landscape_schedule = False
        first_block_text = ""
        for b in blocks[:3]:
            if "lines" in b:
                for l in b["lines"]:
                    first_block_text += " " + " ".join([s["text"] for s in l["spans"]])
        
        if (page.rect.width > page.rect.height) or page.rotation in [90, 270] or any(h in first_block_text for h in ["Schedule Item Changes", "Schedule Item Name", "Supporting Document Schedules", "Form Schedule", "Correspondence Summary", "Disposition"]):
            is_landscape_schedule = True

        for b in blocks:
            if "lines" not in b:
                continue

            block_lines, max_size, is_bold = extract_merged_block_lines(b, rotation=page.rotation)
            if not block_lines:
                continue

            first_line = block_lines[0].strip()
            full_block_text = "\n".join(block_lines).strip()
            bbox = [round(x, 1) for x in b["bbox"]]

            # Check if block falls inside a detected table bounding box
            b_mid_y = (b["bbox"][1] + b["bbox"][3]) / 2.0
            is_inside_table = any(tb[1] - 6 <= b_mid_y <= tb[3] + 6 for tb in tab_bboxes)

            # If previous block was a standalone field key (e.g. 'Created By:'), assign this block as its value
            if pending_field_key and current_section is not None:
                if not first_line.endswith(":") and len(block_lines) <= 2:
                    current_section["fields"][pending_field_key] = full_block_text
                    pending_field_key = None
                    continue
                else:
                    pending_field_key = None

            block_type, heading_name, level = classify_block(
                first_line, full_block_text, max_size, is_bold, len(block_lines),
                bbox, font_stats, repeated_signatures, is_landscape_schedule,
                is_inside_table=is_inside_table
            )

            if block_type in ["empty", "running_header_footer"]:
                continue

            if block_type == "heading":
                pending_field_key = None
                # If heading is State Fees and previous section is Filing Fees, merge directly into Filing Fees
                if heading_name == "State Fees" and current_section is not None and current_section["heading"] == "Filing Fees":
                    rem_lines = block_lines[1:] if len(block_lines) > 1 else []
                    i = 0
                    while i < len(rem_lines):
                        l = rem_lines[i]
                        fk, fv = parse_field_pair(l)
                        if fk is not None:
                            if not fv and i + 1 < len(rem_lines) and not rem_lines[i+1].endswith(":") and parse_field_pair(rem_lines[i+1])[0] is None:
                                fv = rem_lines[i+1]
                                i += 1
                            current_section["fields"][fk] = fv
                        else:
                            if current_section["text"]:
                                current_section["text"] += "\n" + l
                            else:
                                current_section["text"] = l
                        i += 1
                    continue



                sec_counter += 1
                if level == 1:
                    current_h1 = heading_name
                    parent_h = None
                else:
                    parent_h = current_h1

                has_tbl = bool(is_landscape_schedule or any(k in heading_name.lower() for k in ["schedule", "attachment", "table", "fee"]))

                current_section = {
                    "id": f"sec-{sec_counter}",
                    "heading": heading_name,
                    "level": f"H{level}",
                    "parent_heading": parent_h,
                    "category": classify_section_category(heading_name),
                    "page": page_num,
                    "bbox": bbox,
                    "fields": {},
                    "text": "",
                    "has_table": has_tbl,
                    "has_tables_or_attachments": has_tbl,
                    "tables": [],
                    "attachments": []
                }
                sections.append(current_section)

                # Scan for attachments in block text with bracket support
                ATT_REGEX = r"([A-Za-z0-9_\-\.\s\(\)\[\]]+\.(?:pdf|xlsx|docx|csv|txt))"
                for fa in re.findall(ATT_REGEX, full_block_text, re.IGNORECASE):
                    fa_c = fa.strip()
                    if len(fa_c) > 4 and fa_c not in current_section["attachments"]:
                        current_section["attachments"].append(fa_c)

                rem_lines = block_lines[1:] if len(block_lines) > 1 else []
                i = 0
                while i < len(rem_lines):
                    l = rem_lines[i]
                    if not l.strip() or "ex. supporting" in l.lower() or "attachments" == l.strip().lower():
                        i += 1
                        continue

                    # Check attachment pairing in single line (e.g. 'Revised Statement of Variability P 22550-I [Expanded SOV].pdf')
                    m_att = re.search(r"^(.*?)\s*" + ATT_REGEX + r"\s*$", l.strip(), re.IGNORECASE)
                    if m_att and len(m_att.group(1).strip()) <= 45 and not m_att.group(1).strip().endswith(":"):
                        doc_n = m_att.group(1).strip()
                        file_n = m_att.group(2).strip()
                        if doc_n and file_n:
                            current_section["fields"][doc_n] = file_n
                            if file_n not in current_section["attachments"]:
                                current_section["attachments"].append(file_n)
                            i += 1
                            continue

                    # Check attachment pairing across 2 consecutive lines
                    if i + 1 < len(rem_lines):
                        nxt_l = rem_lines[i+1].strip()
                        m_nxt = re.search(r"^" + ATT_REGEX + r"$", nxt_l, re.IGNORECASE)
                        if m_nxt and len(l.strip()) <= 50 and not l.strip().endswith(":"):
                            file_n = m_nxt.group(1).strip()
                            current_section["fields"][l.strip()] = file_n
                            if file_n not in current_section["attachments"]:
                                current_section["attachments"].append(file_n)
                            i += 2
                            continue

                    fk, fv = parse_field_pair(l)
                    if fk is not None:
                        if not fv and i + 1 < len(rem_lines) and not rem_lines[i+1].endswith(":") and parse_field_pair(rem_lines[i+1])[0] is None:
                            fv = rem_lines[i+1]
                            i += 1
                        current_section["fields"][fk] = fv
                    else:
                        if current_section["text"]:
                            current_section["text"] += "\n" + l
                        else:
                            current_section["text"] = l
                    i += 1

                # If page has structured grid tables (e.g. Correspondence Summary, Disposition), extract them cleanly
                if any(k in heading_name.lower() for k in ["correspondence", "disposition", "amendment"]):
                    tbl_md = extract_page_tables_markdown(page)
                    if tbl_md:
                        current_section["text"] = tbl_md
                        current_section["has_tables_or_attachments"] = True

            elif block_type == "field":
                if current_section is None:
                    sec_counter += 1
                    current_section = {
                        "id": f"sec-{sec_counter}",
                        "heading": "General Information",
                        "level": "H1",
                        "parent_heading": None,
                        "category": "Overview & General",
                        "page": page_num,
                        "bbox": bbox,
                        "fields": {},
                        "text": "",
                        "has_table": False,
                        "has_tables_or_attachments": False,
                        "tables": [],
                        "attachments": []
                    }
                    sections.append(current_section)

                if len(block_lines) == 1 and first_line.endswith(":") and len(first_line) <= 25 and not first_line.lower().startswith("comments"):
                    pending_field_key = first_line[:-1].strip()
                    continue

                i = 0
                while i < len(block_lines):
                    line_str = block_lines[i]
                    fk, fv = parse_field_pair(line_str)
                    if fk is not None:
                        if not fv and i + 1 < len(block_lines) and not block_lines[i+1].endswith(":") and parse_field_pair(block_lines[i+1])[0] is None:
                            fv = block_lines[i+1]
                            i += 1
                        current_section["fields"][fk] = fv
                    else:
                        if current_section["text"]:
                            current_section["text"] += "\n" + line_str
                        else:
                            current_section["text"] = line_str
                    i += 1

            elif block_type in ["body", "table_data"]:
                if current_section is None:
                    sec_counter += 1
                    current_section = {
                        "id": f"sec-{sec_counter}",
                        "heading": "General Information",
                        "level": "H1",
                        "parent_heading": None,
                        "category": "Overview & General",
                        "page": page_num,
                        "bbox": bbox,
                        "fields": {},
                        "text": "",
                        "has_table": is_landscape_schedule,
                        "has_tables_or_attachments": is_landscape_schedule,
                        "tables": [],
                        "attachments": []
                    }
                    sections.append(current_section)

                ATT_REGEX = r"([A-Za-z0-9_\-\.\s\(\)\[\]]+\.(?:pdf|xlsx|docx|csv|txt))"
                # Scan for attachments in block text
                for fa in re.findall(ATT_REGEX, full_block_text, re.IGNORECASE):
                    fa_c = fa.strip()
                    if len(fa_c) > 4 and fa_c not in current_section.setdefault("attachments", []):
                        current_section["attachments"].append(fa_c)
                        current_section["has_tables_or_attachments"] = True

                # If current section is an attachment section, extract doc name -> file pairings
                if any(k in current_section["heading"].lower() for k in ["attachment", "usage agreement"]):
                    i_bl = 0
                    while i_bl < len(block_lines):
                        l_str = block_lines[i_bl].strip()
                        if not l_str or "ex. supporting" in l_str.lower() or l_str.lower() == "attachments":
                            i_bl += 1
                            continue

                        # Single-line pairing
                        m_att = re.search(r"^(.*?)\s*" + ATT_REGEX + r"\s*$", l_str, re.IGNORECASE)
                        if m_att and len(m_att.group(1).strip()) <= 45 and not m_att.group(1).strip().endswith(":"):
                            d_n = m_att.group(1).strip()
                            f_n = m_att.group(2).strip()
                            if d_n and f_n:
                                current_section["fields"][d_n] = f_n
                                if f_n not in current_section["attachments"]:
                                    current_section["attachments"].append(f_n)
                                i_bl += 1
                                continue

                        # Two-line pairing
                        if i_bl + 1 < len(block_lines):
                            nxt_str = block_lines[i_bl + 1].strip()
                            m_nxt = re.search(r"^" + ATT_REGEX + r"$", nxt_str, re.IGNORECASE)
                            if m_nxt and len(l_str) <= 50 and not l_str.endswith(":"):
                                f_n = m_nxt.group(1).strip()
                                current_section["fields"][l_str] = f_n
                                if f_n not in current_section["attachments"]:
                                    current_section["attachments"].append(f_n)
                                i_bl += 2
                                continue

                        i_bl += 1

                if block_type == "table_data":
                    current_section["has_tables_or_attachments"] = True
                    # Skip appending raw scrambled table fragments if structured markdown table is already set
                    if current_section["text"] and current_section["text"].startswith("|"):
                        continue

                # Don't duplicate raw attachment lines in narrative text if already in fields
                if not any(k in current_section["heading"].lower() for k in ["attachment", "usage agreement"]):
                    if current_section["text"]:
                        current_section["text"] += "\n" + full_block_text
                    else:
                        current_section["text"] = full_block_text

    doc.close()

    # Pass 3: Metadata Rollup from Extracted Fields
    for sec in sections:
        f = sec.get("fields", {})
        for k, v in f.items():
            if not v:
                continue
            k_low = k.lower()
            if "company" in k_low and not doc_metadata["company_name"]:
                doc_metadata["company_name"] = v
            elif "product" in k_low and not doc_metadata["product_name"]:
                doc_metadata["product_name"] = v
            elif k_low == "state" and len(v) < 25:
                st_clean = re.sub(r"\s+Filing.*$", "", v).strip()
                if st_clean and st_clean.lower() not in ["status", "tracking", "fees"]:
                    doc_metadata["state"] = st_clean
            elif k_low == "toi" and not doc_metadata["toi"]:
                doc_metadata["toi"] = v
            elif k_low == "sub-toi" and not doc_metadata["sub_toi"]:
                doc_metadata["sub_toi"] = v
            elif "filing type" in k_low and not doc_metadata["filing_type"]:
                doc_metadata["filing_type"] = v
            elif "disposition status" in k_low and not doc_metadata["disposition_status"]:
                doc_metadata["disposition_status"] = v
            elif "disposition date" in k_low and not doc_metadata["disposition_date"]:
                doc_metadata["disposition_date"] = v
            elif "effective date" in k_low and not doc_metadata["effective_date"]:
                doc_metadata["effective_date"] = v
            elif "date submitted" in k_low and not doc_metadata["submission_date"]:
                doc_metadata["submission_date"] = v
            elif "serff tr num" in k_low and not doc_metadata["serff_tracking_number"]:
                doc_metadata["serff_tracking_number"] = v

    # Pass 4: Build Hierarchy & Clean Word Counts
    hierarchical_tree = []
    current_parent_node = None

    for sec in sections:
        sec["text"] = sec["text"].strip()
        sec["word_count"] = len(sec["text"].split()) if sec["text"] else 0

        # Clean attachments list
        clean_atts = []
        for a in sec.get("attachments", []):
            a_clean = a.splitlines()[-1].strip()
            if any(a_clean.lower().endswith(ext) for ext in [".pdf", ".xlsx", ".docx", ".csv", ".txt"]) and a_clean not in clean_atts:
                clean_atts.append(a_clean)
        sec["attachments"] = clean_atts

        if clean_atts or any(ext in sec["text"] for ext in [".pdf", ".xlsx", "$", "Bypassed", "Satisfied", "Item No."]):
            sec["has_tables_or_attachments"] = True

        if sec["level"] == "H1":
            node = {
                "id": sec["id"],
                "heading": sec["heading"],
                "level": sec["level"],
                "category": sec["category"],
                "page": sec["page"],
                "bbox": sec["bbox"],
                "fields": sec["fields"],
                "text": sec["text"],
                "has_tables_or_attachments": sec.get("has_tables_or_attachments", False),
                "attachments": sec["attachments"],
                "children": []
            }
            hierarchical_tree.append(node)
            current_parent_node = node
        else:
            child_node = {
                "id": sec["id"],
                "heading": sec["heading"],
                "level": sec["level"],
                "category": sec["category"],
                "page": sec["page"],
                "bbox": sec["bbox"],
                "fields": sec["fields"],
                "text": sec["text"],
                "has_tables_or_attachments": sec.get("has_tables_or_attachments", False),
                "attachments": sec["attachments"]
            }
            if current_parent_node:
                current_parent_node["children"].append(child_node)
            else:
                hierarchical_tree.append(child_node)

    total_h1 = sum(1 for s in sections if s["level"] == "H1")
    total_h2 = sum(1 for s in sections if s["level"] == "H2")
    total_words = sum(s["word_count"] for s in sections)
    cat_counts = dict(Counter(s["category"] for s in sections))

    return {
        "status": "success",
        "document": {
            "filename": filename,
            "total_pages": total_pages
        },
        "metadata": doc_metadata,
        "statistics": {
            "total_pages": total_pages,
            "total_headings": len(sections),
            "h1_sections": total_h1,
            "h2_subsections": total_h2,
            "total_words": total_words,
            "categories": cat_counts
        },
        "sections": sections,
        "hierarchy": hierarchical_tree
    }


def main():
    parser = argparse.ArgumentParser(description="PDF Heading & Body Text Structured Extraction Tool")
    parser.add_argument("pdf_path", help="Path to the PDF file to extract")
    parser.add_argument("--output", "-o", help="Optional output JSON file path")
    parser.add_argument("--pretty", action="store_true", default=True, help="Pretty-print JSON output")

    args = parser.parse_args()

    if not os.path.exists(args.pdf_path):
        print(f"Error: File not found: {args.pdf_path}", file=sys.stderr)
        sys.exit(1)

    try:
        results = extract_document_structure(args.pdf_path)
        json_output = json.dumps(results, indent=2 if args.pretty else None)

        if args.output:
            with open(args.output, "w", encoding="utf-8") as f:
                f.write(json_output)
            print(f"Successfully extracted {results['statistics']['total_headings']} sections to '{args.output}'")
        else:
            print(json_output)

    except Exception as e:
        print(f"Extraction error: {str(e)}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
