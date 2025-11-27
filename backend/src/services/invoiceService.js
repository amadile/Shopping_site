import PDFDocument from "pdfkit";
import Order from "../models/Order.js";

/**
 * Generate a PDF invoice for an order
 */
export const generateInvoice = async (orderId, userId, isAdmin = false) => {
  // Find the order
  const query = isAdmin ? { _id: orderId } : { _id: orderId, user: userId };
  const order = await Order.findOne(query)
    .populate("user", "name email")
    .populate("items.product", "name price images");

  if (!order) {
    throw new Error("Order not found");
  }

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      // Collect PDF data
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer);
      });
      doc.on("error", reject);

      // Header
      doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .text("INVOICE", { align: "center" })
        .moveDown();

      // Company/Store Info (customize as needed)
      doc
        .fontSize(10)
        .font("Helvetica")
        .text("Your Store Name", { align: "center" })
        .text("123 Store Street, City, Country", { align: "center" })
        .text("Email: contact@yourstore.com | Phone: +123456789", {
          align: "center",
        })
        .moveDown(2);

      // Order Info
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text(`Order #: ${order._id}`, 50, doc.y)
        .font("Helvetica")
        .fontSize(10)
        .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`)
        .text(`Status: ${order.status.toUpperCase()}`)
        .text(
          `Payment Method: ${
            order.paymentMethod ? order.paymentMethod.toUpperCase() : "N/A"
          }`
        )
        .moveDown();

      // Shipping Address
      if (order.shippingAddress) {
        doc
          .fontSize(12)
          .font("Helvetica-Bold")
          .text("Shipping Address:")
          .font("Helvetica")
          .fontSize(10);

        if (order.shippingAddress.fullName)
          doc.text(order.shippingAddress.fullName);
        if (order.shippingAddress.addressLine1)
          doc.text(order.shippingAddress.addressLine1);
        if (order.shippingAddress.addressLine2)
          doc.text(order.shippingAddress.addressLine2);

        const cityStateZip = [
          order.shippingAddress.city,
          order.shippingAddress.state,
          order.shippingAddress.postalCode,
        ]
          .filter(Boolean)
          .join(", ");
        if (cityStateZip) doc.text(cityStateZip);

        if (order.shippingAddress.country)
          doc.text(order.shippingAddress.country);
        if (order.shippingAddress.phone)
          doc.text(`Phone: ${order.shippingAddress.phone}`);

        doc.moveDown();
      }

      // Customer Info
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Bill To:")
        .font("Helvetica")
        .fontSize(10)
        .text(order.user.name || "N/A")
        .text(order.user.email || "N/A")
        .moveDown(2);

      // Items Table Header
      const tableTop = doc.y;
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("Item", 50, tableTop)
        .text("Qty", 300, tableTop)
        .text("Price", 370, tableTop)
        .text("Total", 470, tableTop, { align: "right" });

      doc
        .strokeColor("#aaaaaa")
        .lineWidth(1)
        .moveTo(50, tableTop + 15)
        .lineTo(550, tableTop + 15)
        .stroke();

      // Items
      let yPosition = tableTop + 25;
      doc.font("Helvetica").fontSize(9);

      for (const item of order.items) {
        const productName = item.product?.name || "Product";
        const variant = item.variantDetails
          ? `\n(${item.variantDetails.size || ""} ${
              item.variantDetails.color || ""
            })`.trim()
          : "";

        doc.text(`${productName}${variant}`, 50, yPosition, { width: 230 });
        doc.text(item.quantity.toString(), 300, yPosition);
        doc.text(`$${item.price.toFixed(2)}`, 370, yPosition);
        doc.text(
          `$${(item.price * item.quantity).toFixed(2)}`,
          470,
          yPosition,
          { align: "right" }
        );

        yPosition += 40;

        // Add new page if needed
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
        }
      }

      // Totals section
      yPosition += 20;
      const totalsX = 400;

      doc
        .strokeColor("#aaaaaa")
        .lineWidth(1)
        .moveTo(50, yPosition)
        .lineTo(550, yPosition)
        .stroke();

      yPosition += 15;

      doc.font("Helvetica").fontSize(10);

      // Subtotal
      doc.text("Subtotal:", totalsX, yPosition);
      doc.text(
        `$${(order.subtotal || 0).toFixed(2)}`,
        470,
        yPosition,
        { align: "right" }
      );
      yPosition += 20;

      // Discount
      if (order.appliedCoupon?.discountAmount) {
        doc.text("Discount:", totalsX, yPosition);
        doc.text(
          `-$${order.appliedCoupon.discountAmount.toFixed(2)}`,
          470,
          yPosition,
          { align: "right" }
        );
        yPosition += 20;
      }

      // Tax
      doc.text("Tax:", totalsX, yPosition);
      doc.text(`$${(order.tax || 0).toFixed(2)}`, 470, yPosition, {
        align: "right",
      });
      yPosition += 25;

      // Total
      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .text("TOTAL:", totalsX, yPosition);
      doc.text(
        `$${(order.total || order.totalAmount || 0).toFixed(2)}`,
        470,
        yPosition,
        { align: "right" }
      );

      // Footer
      doc
        .fontSize(8)
        .font("Helvetica")
        .text(
          "Thank you for your business!",
          50,
          doc.page.height - 100,
          { align: "center" }
        )
        .text(
          "For any questions, please contact support@yourstore.com",
          50,
          doc.page.height - 85,
          { align: "center" }
        );

      // Finalize PDF
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

export default { generateInvoice };
