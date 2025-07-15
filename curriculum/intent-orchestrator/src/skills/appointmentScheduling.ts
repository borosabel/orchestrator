import { collectSlots } from '../slots/slotCollector';

export async function handleAppointmentScheduling(extractedSlots: Record<string, any> = {}) {
    const slots = await collectSlots('schedule_appointment', extractedSlots);
    
    const date = slots.date;
    const time = slots.time;
    const service = slots.service;
    
    // Generate a simple appointment ID
    const appointmentId = `APT-${Date.now().toString().slice(-6)}`;
    
    // Create a professional confirmation message
    let response = `✅ Appointment Scheduled Successfully!\n\n`;
    response += `📅 **Appointment Details:**\n`;
    response += `• Date: ${date}\n`;
    response += `• Time: ${time}\n`;
    response += `• Service: ${service}\n`;
    response += `• Confirmation ID: ${appointmentId}\n\n`;
    response += `📧 A confirmation email will be sent to you shortly.\n`;
    response += `📞 If you need to reschedule, please call us with your confirmation ID.`;
    
    return response;
} 