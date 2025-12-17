import { Telegraf, Markup } from 'telegraf';
import { CustomContext } from "@telegram/index";
import { requireAppUser } from '@telegram/middlewares/authMiddleware';
import { CONFIG } from '@config';

export class HelpAssistance {
    public register = (bot: Telegraf<CustomContext>): void => {

        // here i have to insert the "commands" allowed to the
        // users and associate a handler function to each one

        bot.command('help', requireAppUser, this.helpResponse);
        bot.command('contact', requireAppUser, this.contactResponse);
        bot.command('faq', requireAppUser, this.faqResponse);
    }

    private readonly helpResponse = async (ctx: CustomContext) => {
        try {
            return await ctx.reply("🏙️ Welcome to the Participium Bot! 🏛️\n\nHello! I am your direct link to the City of Torino.\nMy goal is to help you keep our beautiful city safe, functional, and clean.\nUse me to report issues in public spaces, from potholes to faulty streetlights.\nBelow you will find a list of all available commands to interact with the service:\n\n"
                +
                "📋 Available Commands\n\n" +
                "🆕 /newreport \nStart the procedure to submit a new issue. You can report potholes 🕳️, broken streetlights 💡, damaged sidewalks 🧱, or any other public maintenance problem.\n\n" +
                "❓ /help \nDisplay this message. Use it whenever you need to remember the commands or understand how the app works.\n\n" +
                "📧 /contact \nGet all the official contact information for the City Council and the technical support team of this app.\n\n" +
                "🤔 /faq \nRead a list of Frequently Asked Questions to quickly find answers about the reporting process and resolution times.\n\n" +
                "🗂️ /myreports \nView a list of all reports you have submitted, along with their current status (e.g., Pending, In Progress, Resolved).\n\n" +
                "🔍 /reportstatus [ID] \nGet detailed information about a specific report. Note: Replace [ID] with your report number (e.g., /reportstatus 123). This only works for reports submitted by you.\n\n" +
                "🛠️ How it works ?\n" +
                "     1. Take a photo of the problem 📸.\n" +
                "     2. Use /newreport and follow the instructions.\n" +
                "     3. Our technical departments will take care of the problem as soon as possible! 👷‍♂️\n" +
                "Thank you for helping us make Torino a better place to live! ✨");
        } catch (error) {
            return ctx.reply('*Error* during initial loading. Please try again later', { parse_mode: 'Markdown' });
        }
    }

    private readonly contactResponse = async (ctx: CustomContext) => {
        try {
            return await ctx.reply(
                "📞 Contact Information\n\n" +
                "Need to reach out? Here is how you can contact the City of Torino and the Participium technical team:\n\n" +
                "City of Torino - Public Works Department 🏛️\n" +
                "• Phone: +39 011 442 1111 \n" +
                "• Email: publicworks@comune.torino.it \n" +
                "• Office Address: Piazza Palazzo di Città, 1, 10122 Torino TO, Italy \n" +
                "• Hours: Monday - Friday, 9:00 AM to 5:00 PM\n\n" +
                "Participium Technical Support 🛠️\n" +
                "• Bot Assistance: @ParticipiumSE05Bot \n" +
                "• Email: support@participiumtorino.it\n" +
                "• Phone: +39 011 123 4567\n"
            );
        } catch (error) {
            return ctx.reply('*Error* during initial loading. Please try again later', { parse_mode: 'Markdown' });
        }
    }

    private readonly faqResponse = async (ctx: CustomContext) => {
        try {
            return await ctx.reply(
                "🤔 FAQ - Frequently Asked Questions\n\n" + 
                "Here are the most common questions regarding the Participium reporting system:\n\n" +
                "1. What kind of problems can I report?\n" + 
                "You can report issues related to public infrastructure such as potholes, broken streetlights, damaged sidewalks, vandalized benches and more.\n" +
                "The list of cateogries that can be assigned to a report is the following :\n" + 
                "Water Supply - Drinking Water, Architectural Barriers, Sewer System, Public Lighting, Waste, Road Signs and Traffic Lights, Roads and Urban Furnishings, Public Green Areas and Playgrounds\n\n" +

                "2. Is my report anonymous?\n" +
                "They can be. When submitting a report, both through Telegram or Website, it will be possible to mark that report as anonymous\n\n" +
            
                "3. Do I need to provide my location?\n" +
                "No, The system doesn't use your current GPS coordinates, in a report you have to associate a position that you choose from the city map\n\n" +

                "4. Can I upload multiple photos for one report?\n" +
                "Currently, the bot and the website allow from one up to three images per report, to better illustrate the issue, but not to overload the system.\n\n" +

                "5. How do I know if my report was received?\n" + 
                "The system has a notification system that will inform you when your report is received and when its status changes.\n" +
                "Other than that, you can track your submitted reports through the command /reports in the telegram bot.\n\n" +

                "6. What do the different \"Status\" labels mean?\n" +
                "The \"Status\" label indicates the current state of your reported issue. Here are the possible statuses:\n" +
                "Pending : Received and waiting for review." +
                "In Progress: Assigned to a technical team." +
                "Resolved: The issue has been fixed!" + 
                "Rejected: The issue was not a public maintenance matter or was a duplicate." +
                "Suspended: The report has been temporarily suspended due to false information or other issues.\n\n" +

                "7. How long does it take to fix an issue?\n" + 
                "Resolution times vary depending on the severity and type of problem, ranging from 48 hours for emergencies to a few weeks for structural repairs.\n\n" +

                "8. Can I edit a report after submitting it?\n" + 
                "No, once submitted, a report cannot be edited. If you made a major mistake, please contact support." +

                "9. What happens if I report something that isn\'t broken or appropriate to report?\n" + 
                "The public relations team will review all reports one by one. If a report is found to be inappropriate or false, it will be rejected.\n\n" +

                "10. Can I see reports made by other citizens?\n" + 
                "Yes, a public map is available on the Participium website where you can view ALL submitted reports by other users that have been accepted.\n\n" +

                "11. Who decides which reports get fixed first?\n" + 
                "Technical staff prioritize reports based on safety risks and the number of citizens affected.\n\n" + 

                "12. How can i communicate further details to the technicians if needed?\n" + 
                "The system has an integrated messaging feature that allows you to send additional information or updates regarding your report directly to the technical team handling it.\n\n" +
                
                "If you have further questions, feel free to reach out through the contacts you can find with /contact for more assistance!"
        );
        } catch (error) {

}
    }
}