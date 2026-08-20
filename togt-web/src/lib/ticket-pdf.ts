import type { Ticket } from "@/lib/api/types";
import { CONTACT } from "@/lib/contact";

export type TicketPdfData = Pick<Ticket, "ticketNumber" | "airline" | "flightNumber" | "origin" | "destination" | "departureAt" | "passengerName" | "seat" | "cabinClass" | "totalAmount" | "currency"> & { bookingReference?: string };

export async function generateTicketPDF(ticket: TicketPdfData) {
  const [{ jsPDF }, QRCode] = await Promise.all([import("jspdf"), import("qrcode")]);
  const doc = new jsPDF();
  const blue: [number, number, number] = [31, 103, 177];
  const navy: [number, number, number] = [18, 57, 79];
  const orange: [number, number, number] = [255, 147, 0];

  try {
    const image = new Image();
    image.src = "/images/logo/TOGT_Tour_Travel_Final Logo Png.png";
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = reject; });
    const canvas = document.createElement("canvas");
    const width = 240;
    canvas.width = width;
    canvas.height = Math.round((width * image.height) / image.width);
    canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
    const logo = canvas.toDataURL("image/png");
    const logoHeight = 20;
    const logoWidth = logoHeight * (canvas.width / canvas.height);
    doc.addImage(logo, "PNG", (210 - logoWidth) / 2, 8, logoWidth, logoHeight);
  } catch {
    doc.setFontSize(16); doc.setTextColor(...blue); doc.text("TOGT TOUR & TRAVEL", 105, 18, { align: "center" });
  }

  doc.setFontSize(20); doc.setTextColor(...blue); doc.text("TOGT TOUR & TRAVEL", 105, 40, { align: "center" });
  doc.setFontSize(16); doc.setTextColor(...orange); doc.text("E-TICKET", 105, 50, { align: "center" });
  doc.setDrawColor(...blue); doc.setLineWidth(0.6); doc.line(20, 55, 190, 55);
  doc.setFontSize(11); doc.setTextColor(...navy);
  const departure = new Date(ticket.departureAt).toLocaleString();
  const lines = [
    `Booking Ref:  ${ticket.bookingReference ?? ticket.ticketNumber}`,
    `Ticket No:  ${ticket.ticketNumber}`,
    `Flight:  ${ticket.airline}  ${ticket.flightNumber}`,
    `From:  ${ticket.origin}`,
    `To:  ${ticket.destination}`,
    `Departure:  ${departure}`,
    `Passenger:  ${ticket.passengerName}`,
    `Seat:  ${ticket.seat || "Not assigned"} | ${ticket.cabinClass}`,
  ];
  lines.forEach((line, index) => doc.text(line, 20, 68 + index * 10));
  doc.setDrawColor(...blue); doc.line(20, 153, 190, 153);
  doc.setFontSize(15); doc.setTextColor(...orange); doc.text(`Total Paid:  ${ticket.totalAmount.toLocaleString()} ${ticket.currency}`, 20, 165);
  try {
    const qr = await QRCode.toDataURL(`${ticket.ticketNumber}|${ticket.bookingReference ?? ticket.ticketNumber}`, { margin: 1, width: 120 });
    doc.addImage(qr, "PNG", 85, 172, 40, 40);
  } catch {
    // PDF remains usable when QR generation is unavailable.
  }
  doc.setFontSize(9); doc.setTextColor(128, 128, 128);
  doc.text("IATA Accredited Agency | Addis Ababa, Ethiopia", 105, 220, { align: "center" });
  doc.text(`${CONTACT.email} | ${CONTACT.phones[0].display}`, 105, 227, { align: "center" });
  doc.save(`TOGT-E-Ticket-${ticket.ticketNumber}.pdf`);
}
