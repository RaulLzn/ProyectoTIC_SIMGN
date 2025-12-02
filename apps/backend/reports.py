from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from io import BytesIO
from datetime import datetime

class PDFReportGenerator:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.title_style = ParagraphStyle(
            'CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            spaceAfter=30,
            textColor=colors.HexColor('#1e3a8a'), # Blue-900
            alignment=1 # Center
        )
        self.subtitle_style = ParagraphStyle(
            'CustomSubtitle',
            parent=self.styles['Heading2'],
            fontSize=14,
            spaceAfter=20,
            textColor=colors.HexColor('#64748b') # Slate-500
        )
        self.normal_style = self.styles['Normal']
        
    def generate(self, data):
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
        elements = []
        
        # --- Header ---
        elements.append(Paragraph("Informe Estratégico de Gas Natural", self.title_style))
        elements.append(Paragraph(f"Generado el: {datetime.now().strftime('%Y-%m-%d %H:%M')}", self.subtitle_style))
        elements.append(Spacer(1, 0.5 * inch))
        
        # --- Executive Summary (KPIs) ---
        elements.append(Paragraph("Resumen Ejecutivo (2023)", self.styles['Heading2']))
        
        kpi_data = [
            ['Indicador', 'Valor', 'Unidad'],
            ['Producción Promedio', f"{data['kpis']['production_avg_gbtud']:.0f}", 'GBTUD'],
            ['Regalías Totales (Histórico)', f"${data['kpis']['royalties_total_historical_cop']/1e12:.1f}", 'Billones COP'],
            ['Demanda Promedio', f"{data['kpis']['demand_avg_gbtud']:.0f}", 'GBTUD'],
            ['Ratio de Cobertura', f"{data['kpis']['coverage_ratio']:.1f}%", 'Oferta/Demanda']
        ]
        
        t_kpis = Table(kpi_data, colWidths=[3*inch, 1.5*inch, 2*inch])
        t_kpis.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#eff6ff')), # Blue-50
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#1e3a8a')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')])
        ]))
        elements.append(t_kpis)
        elements.append(Spacer(1, 0.5 * inch))
        
        # --- Top Operators ---
        if 'top_operators' in data and data['top_operators']:
            elements.append(Paragraph("Top 5 Operadores (Producción)", self.styles['Heading2']))
            op_data = [['Operadora', 'Participación']]
            for op in data['top_operators']:
                op_data.append([op['name'], f"{op['value']:.1f}%"])
                
            t_ops = Table(op_data, colWidths=[4*inch, 2.5*inch])
            t_ops.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f0fdf4')), # Green-50
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#14532d')),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
            ]))
            elements.append(t_ops)
            elements.append(Spacer(1, 0.5 * inch))

        # --- Regional Balance ---
        if 'regional_balance' in data and data['regional_balance']:
            elements.append(Paragraph("Balance Regional (Top 5 Déficit)", self.styles['Heading2']))
            # Filter for deficit (negative balance)
            deficit_regions = sorted([r for r in data['regional_balance'] if r['balance'] < 0], key=lambda x: x['balance'])[:5]
            
            reg_data = [['Departamento', 'Déficit (GBTUD)']]
            for r in deficit_regions:
                reg_data.append([r['department'], f"{r['balance']:.0f}"])
                
            t_reg = Table(reg_data, colWidths=[4*inch, 2.5*inch])
            t_reg.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#fef2f2')), # Red-50
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#7f1d1d')),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
            ]))
            elements.append(t_reg)
        
        # --- Footer ---
        elements.append(Spacer(1, 1 * inch))
        elements.append(Paragraph("Ministerio de Minas y Energía - SIMGN", ParagraphStyle(
            'Footer',
            parent=self.styles['Normal'],
            fontSize=8,
            textColor=colors.gray,
            alignment=1
        )))
        
        doc.build(elements)
        buffer.seek(0)
        return buffer
