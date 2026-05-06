import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export const generateDeliveryNotePDF = async (deliveryNote, outputPath) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(outputPath);

      doc.pipe(stream);

      doc.fontSize(20).text('ALBARÁN DE TRABAJO', { align: 'center' });
      doc.moveDown();

      doc.fontSize(12).font('Helvetica-Bold').text('DATOS DE LA EMPRESA');
      doc.font('Helvetica').fontSize(10);
      doc.text(`Nombre: ${deliveryNote.company.name}`);
      doc.text(`CIF: ${deliveryNote.company.cif}`);
      doc.text(`Dirección: ${deliveryNote.company.address.street}, ${deliveryNote.company.address.number}, ${deliveryNote.company.address.city}`);
      doc.moveDown();

      doc.fontSize(12).font('Helvetica-Bold').text('DATOS DEL CLIENTE');
      doc.font('Helvetica').fontSize(10);
      doc.text(`Cliente: ${deliveryNote.client.name}`);
      doc.text(`CIF: ${deliveryNote.client.cif}`);
      doc.text(`Email: ${deliveryNote.client.email}`);
      doc.moveDown();

      doc.fontSize(12).font('Helvetica-Bold').text('DATOS DEL PROYECTO');
      doc.font('Helvetica').fontSize(10);
      doc.text(`Proyecto: ${deliveryNote.project.name} (${deliveryNote.project.projectCode})`);
      doc.text(`Dirección: ${deliveryNote.project.address.street}, ${deliveryNote.project.address.number}, ${deliveryNote.project.address.city}`);
      doc.moveDown();

      doc.rect(doc.x, doc.y, 500, 2).fill('#333');
      doc.moveDown();

      doc.fontSize(12).font('Helvetica-Bold').text('DETALLE DEL TRABAJO');
      doc.font('Helvetica').fontSize(10);
      doc.text(`Fecha: ${deliveryNote.workDate.toLocaleDateString()}`);
      doc.text(`Formato: ${deliveryNote.format.toUpperCase()}`);
      if (deliveryNote.format === 'hours') {
        doc.text(`Horas: ${deliveryNote.hours}`);
      } else {
        doc.text(`Material: ${deliveryNote.material}`);
      }
      doc.moveDown();
      doc.font('Helvetica-Bold').text('Descripción:');
      doc.font('Helvetica').text(deliveryNote.description);
      doc.moveDown(2);

      if (deliveryNote.signatureUrl) {
        doc.fontSize(12).font('Helvetica-Bold').text('FIRMA DEL CLIENTE');
        doc.moveDown();
        try {
          if (deliveryNote.signatureUrl.startsWith('http')) {
            // In a real scenario with Cloudinary, we might need to download the image first
            // but for now, we assume local or we'd use a different approach.
            // For testing/fallback, if it's local we just use the path.
          } else {
            const signaturePath = path.join(process.cwd(), deliveryNote.signatureUrl);
            if (fs.existsSync(signaturePath)) {
              doc.image(signaturePath, { fit: [150, 100] });
            }
          }
        } catch (e) {
          doc.text('[Error al cargar la firma]');
        }
      }

      doc.end();

      stream.on('finish', () => resolve(outputPath));
      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
};
