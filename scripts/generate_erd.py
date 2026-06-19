import os
from PIL import Image, ImageDraw, ImageFont

def draw_erd():
    # Create a blank image with a dark professional background
    width = 1250
    height = 850
    img = Image.new('RGB', (width, height), color='#0F172A') # Tailwind slate-900
    draw = ImageDraw.Draw(img)

    # Load font
    font_path = "/System/Library/Fonts/Supplemental/Arial.ttf"
    if not os.path.exists(font_path):
        font_path = "/System/Library/Fonts/Helvetica.ttc"
    
    try:
        font_title = ImageFont.truetype(font_path, 22)
        font_header = ImageFont.truetype(font_path, 14)
        font_body = ImageFont.truetype(font_path, 11)
        font_cardinality = ImageFont.truetype(font_path, 12)
    except IOError:
        font_title = ImageFont.load_default()
        font_header = ImageFont.load_default()
        font_body = ImageFont.load_default()
        font_cardinality = ImageFont.load_default()

    # Title
    draw.text((40, 25), "DIAGRAM HUBUNGAN ENTITAS (ERD) — DATABASE FMSP LINTASARTA", fill='#38BDF8', font=font_title)
    draw.line([(40, 60), (1210, 60)], fill='#334155', width=2)

    # Helper function to draw table boxes
    def draw_table(x, y, w, h, title, fields, border_color='#1E40AF', title_bg='#1D4ED8'):
        # Draw table background & border
        draw.rounded_rectangle([x, y, x+w, y+h], radius=8, fill='#1E293B', outline=border_color, width=2)
        # Title background
        draw.rounded_rectangle([x, y, x+w, y+30], radius=8, fill=title_bg)
        # Overwrite bottom corners of title with rectangle to keep header flat
        draw.rectangle([x, y+20, x+w, y+30], fill=title_bg)
        # Title text
        draw.text((x+15, y+7), title, fill='#FFFFFF', font=font_header)
        
        # Draw fields
        curr_y = y + 40
        for field, is_pk, is_fk in fields:
            # bullet point or symbol
            symbol = "🔑 " if is_pk else ("🔗 " if is_fk else "  ")
            color = '#38BDF8' if is_pk else ('#F43F5E' if is_fk else '#94A3B8')
            draw.text((x+10, curr_y), f"{symbol}{field}", fill=color, font=font_body)
            curr_y += 18

    # Tables Definitions
    # 1. users
    draw_table(50, 90, 240, 210, "users (Tabel Pengguna)", [
        ("id (String) [PK]", True, False),
        ("email (String) [Unique]", False, False),
        ("password (String)", False, False),
        ("name (String)", False, False),
        ("role (String)", False, False),
        ("region (String) [Nullable]", False, False),
        ("resetToken (String)", False, False),
        ("createdAt (DateTime)", False, False),
        ("updatedAt (DateTime)", False, False)
    ], border_color='#0284C7', title_bg='#0369A1')

    # 2. AuditLog
    draw_table(50, 380, 240, 170, "AuditLog (Catatan Aktivitas)", [
        ("id (String) [PK]", True, False),
        ("timestamp (DateTime)", False, False),
        ("action (String)", False, False),
        ("ipAddress (String)", False, False),
        ("details (String)", False, False),
        ("userId (String) [FK]", False, True),
        ("createdAt (DateTime)", False, False)
    ], border_color='#4F46E5', title_bg='#4338CA')

    # 3. Asset
    draw_table(480, 90, 260, 230, "Asset (Aset Fisik & Gedung)", [
        ("id (String) [PK]", True, False),
        ("name (String)", False, False),
        ("type (String)", False, False),
        ("location (String)", False, False),
        ("status (String)", False, False),
        ("value (Float)", False, False),
        ("notes (String) [Nullable]", False, False),
        ("photos (String) [Nullable]", False, False),
        ("lastMutated (DateTime)", False, False),
        ("createdAt (DateTime)", False, False),
        ("updatedAt (DateTime)", False, False)
    ], border_color='#059669', title_bg='#047857')

    # 4. LegalDocument
    draw_table(910, 90, 260, 190, "LegalDocument (Berkas Hukum)", [
        ("id (String) [PK]", True, False),
        ("docName (String)", False, False),
        ("docType (String)", False, False),
        ("expiryDate (DateTime)", False, False),
        ("url (String)", False, False),
        ("assetId (String) [FK]", False, True),
        ("reminderSent (Boolean)", False, False),
        ("createdAt (DateTime)", False, False)
    ], border_color='#D97706', title_bg='#B45309')

    # 5. MaintenanceSchedule
    draw_table(910, 310, 260, 220, "MaintenanceSchedule (Jadwal PM)", [
        ("id (String) [PK]", True, False),
        ("title (String)", False, False),
        ("intervalDays (Int)", False, False),
        ("lastPerformed (DateTime)", False, False),
        ("nextDue (DateTime)", False, False),
        ("assignedTo (String)", False, False),
        ("notes (String) [Nullable]", False, False),
        ("status (String)", False, False),
        ("assetId (String) [FK]", False, True),
        ("createdAt (DateTime)", False, False)
    ], border_color='#7C3AED', title_bg='#6D28D9')

    # 6. WorkOrder
    draw_table(910, 560, 260, 240, "WorkOrder (Tiket Kerusakan)", [
        ("id (String) [PK]", True, False),
        ("ticketNumber (String) [Unique]", False, False),
        ("title (String)", False, False),
        ("description (String)", False, False),
        ("priority (String)", False, False),
        ("category (String)", False, False),
        ("status (String)", False, False),
        ("reportedBy (String)", False, False),
        ("assignedTo (String)", False, False),
        ("assetId (String) [FK]", False, True),
        ("createdAt (DateTime)", False, False)
    ], border_color='#DC2626', title_bg='#B91C1C')

    # 7. RabBudget
    draw_table(480, 420, 260, 160, "RabBudget (Anggaran Plafon)", [
        ("id (String) [PK]", True, False),
        ("year (Int)", False, False),
        ("department (String)", False, False),
        ("category (String)", False, False),
        ("allocatedAmount (Float)", False, False),
        ("spentAmount (Float)", False, False),
        ("createdAt (DateTime)", False, False)
    ], border_color='#0891B2', title_bg='#0E7490')

    # 8. AccountingTransaction
    draw_table(480, 640, 260, 170, "AccountingTransaction (Keuangan)", [
        ("id (String) [PK]", True, False),
        ("date (DateTime)", False, False),
        ("description (String)", False, False),
        ("type (String)", False, False),
        ("amount (Float)", False, False),
        ("category (String)", False, False),
        ("rabBudgetId (String) [FK]", False, True),
        ("createdAt (DateTime)", False, False)
    ], border_color='#DB2777', title_bg='#C11F6D')

    # Draw Relation Lines with Labels and arrows
    # Helper to draw relation line
    def draw_relation_horizontal(x1, y1, x2, y2, color='#64748B', label_1="1", label_n="N"):
        # Draw line
        draw.line([(x1, y1), (x2, y2)], fill=color, width=2)
        # Cardinality text
        draw.text((x1+5, y1-15), label_1, fill='#94A3B8', font=font_cardinality)
        draw.text((x2-15, y2-15), label_n, fill='#94A3B8', font=font_cardinality)

    def draw_relation_vertical(x1, y1, x2, y2, color='#64748B', label_1="1", label_n="N"):
        draw.line([(x1, y1), (x2, y2)], fill=color, width=2)
        draw.text((x1+5, y1+5), label_1, fill='#94A3B8', font=font_cardinality)
        draw.text((x2+5, y2-20), label_n, fill='#94A3B8', font=font_cardinality)

    # User -> AuditLog
    draw_relation_vertical(170, 300, 170, 380, color='#818CF8', label_1="1", label_n="N")

    # Asset -> LegalDocument
    draw_relation_horizontal(740, 180, 910, 180, color='#F59E0B', label_1="1", label_n="N")

    # Asset -> MaintenanceSchedule
    # Draw step line
    draw.line([(740, 205), (820, 205), (820, 420), (910, 420)], fill='#A78BFA', width=2)
    draw.text((745, 185), "1", fill='#94A3B8', font=font_cardinality)
    draw.text((895, 400), "N", fill='#94A3B8', font=font_cardinality)

    # Asset -> WorkOrder
    # Draw step line
    draw.line([(740, 230), (800, 230), (800, 680), (910, 680)], fill='#F87171', width=2)
    draw.text((745, 210), "1", fill='#94A3B8', font=font_cardinality)
    draw.text((895, 660), "N", fill='#94A3B8', font=font_cardinality)

    # RabBudget -> AccountingTransaction
    draw_relation_vertical(610, 580, 610, 640, color='#EC4899', label_1="1", label_n="N")

    # Save to public/docs/
    os.makedirs("public/docs", exist_ok=True)
    img.save("public/docs/erd_diagram.png")
    print("ERD Diagram generated successfully at public/docs/erd_diagram.png")

if __name__ == "__main__":
    draw_erd()
