const Users = require("../models/UserModel.js");
const UserPDFs = require("../models/UserPDFsModel.js");
const fs = require("fs");
const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");

async function generatePdfForUser(userId) {
    let headerAndUserInfoAdded = false;

    try {
        // Fetch the user data from the database
        const user = await Users.findByPk(userId);

        const pdfFilePath = `pdfs/user_${userId}.pdf`;

        let pdfDoc;
        let page;
        let userPDF;
        const fontSize = 12;
        const tableX = 30;
        let font;
        let fontBold;
        let currentY;
        let updatedAt;
        const { username, account_no, profit_now, Total_assets_today,Net_client_share_in_percent, investment,usdt_account_number } =
            user;
        if (fs.existsSync(pdfFilePath)) {
            
            headerAndUserInfoAdded = true;
            // If the PDF file already exists, open and modify it
            const existingPdfBytes = fs.readFileSync(pdfFilePath);
            pdfDoc = await PDFDocument.load(existingPdfBytes);
            font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            const currentMonth = new Date().toLocaleString('default', { month: 'long' });
            userPDF = await UserPDFs.findOne({ where: { user_id: userId } });
            updatedAt = userPDF.updatedAt.toLocaleString('default', { month: 'long' });
            page = pdfDoc.getPages()[userPDF.pages];
            if (!updatedAt || currentMonth !== 'November') {
                // If updatedAt is not available or if the current month is different, add a new page
                pdfDoc.addPage([595.276, 841.89]);
                userPDF.pages += 1;
                currentY = page.getHeight() - 50;
                userPDF.prev_Y_coordinate = currentY;
                page = pdfDoc.getPages()[userPDF.pages];
                await userPDF.save();

            }
            
            if(userPDF.prev_Y_coordinate === page.getHeight()-50) {
                currentY = page.getHeight()-50;
                page.drawText(`Depotauszug:`, {
                    x: 30,
                    y: currentY,
                    size: fontSize,
                    font: fontBold
                });
                page.drawText(`${username}`, {
                    x: 30 +100,
                    y: currentY,
                    size: fontSize,
                    font: fontBold
                });
                currentY -= 30;
                page.drawText(`Account No:`, {
                    x: 30,
                    y: currentY,
                    size: fontSize,
                    font: fontBold
                });
                page.drawText(`${usdt_account_number}`, {
                    x: 30+100,
                    y: currentY,
                    size: fontSize,
                    font: fontBold
                });
                currentY -= 30;
                const currentDate = new Date();
                const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
                const currentYear = currentDate.getFullYear();
                page.drawText(`Monat: ${currentMonth} ${currentYear}`, {
                    x: 30,
                    y: currentY,
                    size: fontSize,
                    font: fontBold
                });
                currentY -= 30;
                tableHeader(page,font,fontBold,tableX,currentY,fontSize);
                drawFooter(page,font,fontBold);
            }
        } else {
            // If the PDF file doesn't exist, create a new one with A4 size
            pdfDoc = await PDFDocument.create();
            font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            page = pdfDoc.addPage([595.276, 841.89]); // A4 page size
            drawFooter(page,font,fontBold);

        }
        font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        // Define a custom font with a size of 16px
        const { width, height } = page.getSize();
        const blueColor = rgb(173 / 255, 216 / 255, 230 / 255);
        if (!headerAndUserInfoAdded) {
            let currentY = height - 50; // Initialize Y-coordinate
            // Add user information with the custom font
            page.drawText(`Depotauszug:`, {
                x: 30,
                y: currentY,
                size: fontSize,
                font: fontBold
            });
            page.drawText(`${username}`, {
                x: 30 +100,
                y: currentY,
                size: fontSize,
                font: fontBold
            });
            currentY -= 30;
            page.drawText(`Account No:`, {
                x: 30,
                y: currentY,
                size: fontSize,
                font: fontBold
            });
            page.drawText(`${usdt_account_number}`, {
                x: 30+100,
                y: currentY,
                size: fontSize,
                font: fontBold
            });
            currentY -= 30;
            const currentDate = new Date();
            const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
            const currentYear = currentDate.getFullYear();
            page.drawText(`Monat: ${currentMonth} ${currentYear}`, {
                x: 30,
                y: currentY,
                size: fontSize,
                font: fontBold
            });
            currentY -= 30;
            // Create a table structure with headers and corresponding data
            // Header row with the custom font

            tableHeader(page,font,fontBold,tableX,currentY,fontSize);
            
            currentY -= 20;
            const timestamp = new Date().toLocaleDateString();
            drawRowWithReactangle(
                page,
                currentY,
                width,
                blueColor,
                font,
                -1,
                fontSize,
                timestamp,
                profit_now,
                Net_client_share_in_percent,
                Total_assets_today,
                investment
            );

            headerAndUserInfoAdded = true;
            nextY = currentY;
            userPDF = await UserPDFs.create({
                user_id: userId,
                pdf_path: pdfFilePath,
                prev_X_coordinate: 50, // Set initial X-coordinate
                prev_Y_coordinate: currentY, // Set initial Y-coordinate
                pages: 0, // Initialize the page count
            });
        }
        if (fs.existsSync(pdfFilePath)) {
            userPDF = await UserPDFs.findOne({ where: { user_id: userId } });
            // Space for new data
            if(userPDF.prev_Y_coordinate === height - 50) {
                currentY = currentY -18;
            }else {
                currentY = userPDF.prev_Y_coordinate - 18;
            }
            // Add timestamp and data with the custom font
            const timestamp = new Date().toLocaleDateString();
            drawRowWithReactangle(
                page,
                currentY,
                width,
                blueColor,
                font,
                userPDF.count,
                fontSize,
                timestamp,
                profit_now,
                Net_client_share_in_percent,
                Total_assets_today,
                investment
            );
            userPDF.prev_Y_coordinate = currentY;
            if (userPDF.prev_Y_coordinate < 130) {
                userPDF.pages += 1;
                pdfDoc.addPage([595.276, 841.89]);
                userPDF.prev_Y_coordinate = height -50;
            }
            userPDF.count++;
            await userPDF.save();
        }
        // Serialize the PDF to a buffer
        const pdfBytes = await pdfDoc.save();
        

        // Write the PDF to the file
        fs.writeFileSync(pdfFilePath, pdfBytes);

        return pdfFilePath;
    } catch (error) {
        console.error("Error generating PDF:", error);
        throw error;
    }
}

let drawRowWithReactangle = (
    page,
    currentY,
    width,
    blueColor,
    font,
    count,
    fontSize,
    timestamp,
    profit_now,
    Net_client_share_in_percent,
    Total_assets_today,
    investment
) => {
    let widthText;
    if (count %2 === 0) {
        page.drawRectangle({
            x: 30,
            y: currentY - 3,
            width: width - 60,
            height: 16,
            color: blueColor,
        });
    }

    
    page.drawText(timestamp, { x: 30, y: currentY, size: fontSize });
    widthText = font.widthOfTextAtSize(Number(investment).toFixed(0), fontSize);
    page.drawText(Number(investment).toFixed(0), {
        // x: 500,
        x:page.getWidth() - 30-(133*2)-widthText,

        y: currentY,
        size: fontSize,
    });
    const updatedProfitAfterCommissionCut = () =>{
        return Number(profit_now)*Net_client_share_in_percent/100;
      }

    widthText = font.widthOfTextAtSize(Number(updatedProfitAfterCommissionCut()).toFixed(0), fontSize);
    page.drawText(Number(updatedProfitAfterCommissionCut()).toFixed(0), {
        // x: 200,
        x:page.getWidth() - 32-133-widthText,
        // color: rgb(1, 0, 1),
        y: currentY,
        size: fontSize,
    });
    let clientAssets = Number(investment) + Number(updatedProfitAfterCommissionCut())
    widthText = font.widthOfTextAtSize(Number(clientAssets).toFixed(0), fontSize);
    page.drawText(Number(clientAssets).toFixed(0), {
        // x: 350,
        x:page.getWidth()-32-widthText,

        y: currentY,
        size: fontSize,
    });
    
};
let tableHeader = (page,font,fontBold,tableX,currentY,fontSize) => {

    let widthText;
    page.drawText("Timestamp", { x: tableX, y: currentY, size: fontSize ,font: fontBold});
    
    widthText = font.widthOfTextAtSize("Client Investment", fontSize);
    page.drawText(`Client Investment`, {
        // x: tableX + 150,
        x:page.getWidth()-38-(133*2)-widthText,
        y: currentY,
        size: fontSize,
        font: fontBold
    });

    widthText = font.widthOfTextAtSize("Client Profit", fontSize);
    page.drawText(`Client Profit`, {
        // x: tableX + 300,
        x:page.getWidth()-38-133-widthText,
        y: currentY,
        size: fontSize,
        font: fontBold
    });
    widthText = font.widthOfTextAtSize("Client Assets", fontSize);
    page.drawText(`Client Assets`, {
        // x: tableX + 450,
        x:page.getWidth()-38-widthText,
        y: currentY,
        size: fontSize,
        font:fontBold
    });
}
let drawFooter = (page,font,fontBold) =>{
    const multilineText = [
        'Verein Dualnet.ch',
        'Dualnet is a trade name of Verein Dualnet Switzerland.',
        'Dualnet stellt lediglich die Handelsplattform zur Verfügung. Der Handel selbst wird ausschließlich durch den Klienten durchgeführt. Die Handelsplattform ermöglicht lediglich, als Zuschauer die Daten zu verfolgen. Ein direkter Handel ist ausgeschlossen. Der Plattform-Betreiber lehnt jegliche Verantwortung für Erfolg oder Misserfolg ab.',
        // Add more lines as needed
    ];
    let currentY=100;
    // Loop through each line of text
    multilineText.forEach((line, index) =>{
        // Draw the text on the page
        page.drawText(line, {
            x: 30,
            y: currentY,
            size: 6,
            font: index === 0 ? fontBold : font,
            maxWidth: page.getSize().width-60,
            lineHeight: 12
        });

        // Adjust the y-coordinate for the next line
        currentY -= 15; // Adjust the value as needed for your desired line spacing
    });
}
module.exports = generatePdfForUser;
