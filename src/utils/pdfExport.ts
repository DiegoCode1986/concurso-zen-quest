import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Question {
  id: string;
  title: string;
  type: string;
  options: string[] | null;
  correct_answer: string | null;
  correct_boolean: boolean | null;
  explanation: string | null;
  created_at: string;
}

export const exportQuestionsToPDF = (questions: Question[], folderName: string) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  
  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(folderName, margin, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const dateStr = new Date().toLocaleDateString('pt-BR', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  doc.text(`Data de exportação: ${dateStr}`, margin, 28);
  doc.text(`Total de questões: ${questions.length}`, margin, 34);
  
  // Line separator
  doc.setDrawColor(200);
  doc.line(margin, 38, pageWidth - margin, 38);
  
  let yPosition = 45;
  
  questions.forEach((question, index) => {
    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    
    // Question number and title
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    const questionHeader = `Questão ${index + 1}`;
    doc.text(questionHeader, margin, yPosition);
    yPosition += 7;
    
    // Question text
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const titleLines = doc.splitTextToSize(question.title, contentWidth);
    doc.text(titleLines, margin, yPosition);
    yPosition += (titleLines.length * 6) + 5;
    
    // Type badge
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100);
    const typeText = question.type === 'multiple_choice' ? 'Múltipla escolha' : 'Verdadeiro/Falso';
    doc.text(`[${typeText}]`, margin, yPosition);
    doc.setTextColor(0);
    yPosition += 8;
    
    // Options/Answers
    if (question.type === 'multiple_choice' && question.options) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      question.options.forEach((option, optIndex) => {
        const letter = String.fromCharCode(65 + optIndex);
        const isCorrect = option === question.correct_answer;
        
        if (isCorrect) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 150, 0);
        }
        
        const optionText = `${letter}) ${option}`;
        const optionLines = doc.splitTextToSize(optionText, contentWidth - 5);
        doc.text(optionLines, margin + 5, yPosition);
        
        if (isCorrect) {
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(0);
        }
        
        yPosition += (optionLines.length * 5) + 3;
        
        // Check if we need a new page
        if (yPosition > 260) {
          doc.addPage();
          yPosition = 20;
        }
      });
    } else {
      // True/False question
      doc.setFontSize(10);
      const correctAnswer = question.correct_boolean ? 'Verdadeiro' : 'Falso';
      
      ['Verdadeiro', 'Falso'].forEach((option) => {
        const isCorrect = option === correctAnswer;
        
        if (isCorrect) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 150, 0);
        }
        
        doc.text(`• ${option}`, margin + 5, yPosition);
        
        if (isCorrect) {
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(0);
        }
        
        yPosition += 6;
      });
    }
    
    yPosition += 3;
    
    // Correct answer indicator
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 150, 0);
    const correctText = question.type === 'multiple_choice' 
      ? `✓ Resposta correta: ${question.correct_answer}`
      : `✓ Resposta correta: ${question.correct_boolean ? 'Verdadeiro' : 'Falso'}`;
    doc.text(correctText, margin, yPosition);
    doc.setTextColor(0);
    yPosition += 8;
    
    // Explanation box
    if (question.explanation) {
      // Check if we need a new page for explanation
      if (yPosition > 240) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFillColor(245, 245, 245);
      const explanationLines = doc.splitTextToSize(question.explanation, contentWidth - 10);
      const boxHeight = (explanationLines.length * 5) + 10;
      
      doc.roundedRect(margin, yPosition, contentWidth, boxHeight, 2, 2, 'F');
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Explicação:', margin + 5, yPosition + 6);
      
      doc.setFont('helvetica', 'normal');
      doc.text(explanationLines, margin + 5, yPosition + 12);
      
      yPosition += boxHeight + 8;
    }
    
    // Separator line between questions
    if (index < questions.length - 1) {
      doc.setDrawColor(220);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;
    }
  });
  
  // Add page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150);
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  // Generate filename
  const sanitizedFolderName = folderName.replace(/[^a-z0-9]/gi, '_');
  const dateForFilename = new Date().toISOString().split('T')[0];
  const filename = `${sanitizedFolderName}_Questoes_${dateForFilename}.pdf`;
  
  // Save the PDF
  doc.save(filename);
};
