interface AvailableSlot {
    date: string;
    time: string;
    service: string;
    duration: string;
}

// Simulate available appointment slots - in a real system this would query a database
function simulateAvailabilityLookup(date?: string, timePreference?: string, service?: string): AvailableSlot[] {
    // Mock available slots based on filters
    const allSlots: AvailableSlot[] = [
        { date: "Tomorrow", time: "9:00 AM", service: "Medical consultation", duration: "30 min" },
        { date: "Tomorrow", time: "10:30 AM", service: "Business meeting", duration: "60 min" },
        { date: "Tomorrow", time: "2:00 PM", service: "Personal consultation", duration: "45 min" },
        { date: "Tomorrow", time: "4:30 PM", service: "Technical support", duration: "30 min" },
        
        { date: "Monday", time: "9:00 AM", service: "Medical consultation", duration: "30 min" },
        { date: "Monday", time: "11:00 AM", service: "Business meeting", duration: "60 min" },
        { date: "Monday", time: "1:30 PM", service: "Medical consultation", duration: "30 min" },
        { date: "Monday", time: "3:00 PM", service: "Personal consultation", duration: "45 min" },
        { date: "Monday", time: "6:00 PM", service: "Technical support", duration: "30 min" },
        
        { date: "Tuesday", time: "10:00 AM", service: "Business meeting", duration: "60 min" },
        { date: "Tuesday", time: "2:30 PM", service: "Medical consultation", duration: "30 min" },
        { date: "Tuesday", time: "4:00 PM", service: "Personal consultation", duration: "45 min" },
        
        { date: "Wednesday", time: "9:30 AM", service: "Technical support", duration: "30 min" },
        { date: "Wednesday", time: "11:30 AM", service: "Medical consultation", duration: "30 min" },
        { date: "Wednesday", time: "3:30 PM", service: "Business meeting", duration: "60 min" },
        
        { date: "Friday", time: "10:00 AM", service: "Personal consultation", duration: "45 min" },
        { date: "Friday", time: "1:00 PM", service: "Medical consultation", duration: "30 min" },
        { date: "Friday", time: "5:30 PM", service: "Technical support", duration: "30 min" },
    ];

    let filteredSlots = allSlots;

    // Filter by date if specified
    if (date) {
        const dateKeywords = date.toLowerCase();
        filteredSlots = filteredSlots.filter(slot => {
            const slotDate = slot.date.toLowerCase();
            return slotDate.includes(dateKeywords) || 
                   dateKeywords.includes(slotDate) ||
                   (dateKeywords.includes('week') && ['monday', 'tuesday', 'wednesday', 'friday'].includes(slotDate));
        });
    }

    // Filter by time preference if specified
    if (timePreference) {
        filteredSlots = filteredSlots.filter(slot => {
            const time = slot.time;
            const hour = parseInt(time.split(':')[0]);
            const isPM = time.includes('PM');
            const hour24 = isPM && hour !== 12 ? hour + 12 : (hour === 12 && !isPM ? 0 : hour);
            
            if (timePreference.includes('Morning')) {
                return hour24 >= 9 && hour24 < 12;
            } else if (timePreference.includes('Afternoon')) {
                return hour24 >= 12 && hour24 < 17;
            } else if (timePreference.includes('Evening')) {
                return hour24 >= 17 && hour24 <= 20;
            }
            return true; // "Any time"
        });
    }

    // Filter by service if specified and not "Any service"
    if (service && service !== 'Any service') {
        filteredSlots = filteredSlots.filter(slot => slot.service === service);
    }

    return filteredSlots;
}

function formatAvailabilityResponse(slots: AvailableSlot[], filters: Record<string, any>): string {
    if (slots.length === 0) {
        return `❌ **No Available Slots Found**

📅 We couldn't find any available appointments matching your criteria:
${filters.date ? `• Date: ${filters.date}` : ''}
${filters.time_preference ? `• Time: ${filters.time_preference}` : ''}
${filters.service ? `• Service: ${filters.service}` : ''}

💡 **Suggestions:**
• Try different dates or times
• Consider alternative service types
• Check availability for next week

📞 Need help finding the right slot? Our staff can assist you!`;
    }

    const filterInfo = [];
    if (filters.date) filterInfo.push(`Date: ${filters.date}`);
    if (filters.time_preference) filterInfo.push(`Time: ${filters.time_preference}`);
    if (filters.service) filterInfo.push(`Service: ${filters.service}`);

    let response = `✅ **Available Appointment Slots**\n\n`;
    
    if (filterInfo.length > 0) {
        response += `🔍 **Search Criteria:** ${filterInfo.join(' • ')}\n\n`;
    }

    response += `📅 **${slots.length} slot${slots.length > 1 ? 's' : ''} available:**\n\n`;

    // Group slots by date
    const slotsByDate: { [key: string]: AvailableSlot[] } = {};
    slots.forEach(slot => {
        if (!slotsByDate[slot.date]) {
            slotsByDate[slot.date] = [];
        }
        slotsByDate[slot.date].push(slot);
    });

    // Format each date group
    Object.entries(slotsByDate).forEach(([date, dateSlots]) => {
        response += `**${date}:**\n`;
        dateSlots.forEach(slot => {
            response += `• ${slot.time} - ${slot.service} (${slot.duration})\n`;
        });
        response += '\n';
    });

    response += `🎯 **Next Steps:**\n`;
    response += `• Say "schedule appointment" to book one of these slots\n`;
    response += `• Specify your preferred date and time for booking\n`;
    response += `• All appointments include confirmation via email\n\n`;
    response += `⏰ **Note:** Availability updates in real-time. Book soon to secure your preferred slot!`;

    return response;
}

export async function handleAvailabilityCheck(extractedSlots: Record<string, any> = {}): Promise<string> {
    try {
        console.log('Checking availability with slots:', extractedSlots);
        
        // Extract search criteria
        const date = extractedSlots.date;
        const timePreference = extractedSlots.time_preference;
        const service = extractedSlots.service;
        
        // Get available slots
        const availableSlots = simulateAvailabilityLookup(date, timePreference, service);
        
        // Format and return response
        return formatAvailabilityResponse(availableSlots, extractedSlots);
        
    } catch (error) {
        console.error('Error in availability check:', error);
        return `❌ **System Error**

Sorry, we're having trouble checking availability right now. 

🔄 **Please try:**
• Refreshing and asking again
• Contacting our support team
• Checking back in a few minutes

We apologize for the inconvenience!`;
    }
} 